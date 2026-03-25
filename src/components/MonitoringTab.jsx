import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonitoringTab({ filters }) {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [localFilters, setLocalFilters] = useState({ session: 'all', location: 'all', ssid: 'all', floor: 'all', frequency: 'all' });
  const [ssidOptions, setSsidOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setLocalFilters({ session: 'all', location: 'all', ssid: 'all', floor: 'all', frequency: 'all' });
    try {
      let uploadsQuery = supabase
        .from('uploads')
        .select('id, file_name, start_time, end_time, data_count, location')
        .order('start_time', { ascending: true });

      if (filters.uploader !== 'all') uploadsQuery = uploadsQuery.eq('uploader', filters.uploader);
      if (filters.location !== 'all') uploadsQuery = uploadsQuery.eq('location', filters.location);
      if (filters.startDate) uploadsQuery = uploadsQuery.gte('start_time', filters.startDate + 'T00:00:00Z');
      if (filters.endDate) uploadsQuery = uploadsQuery.lte('end_time', filters.endDate + 'T23:59:59Z');

      const { data: uploads, error: uploadsError } = await uploadsQuery;
      if (uploadsError) throw uploadsError;

      const uploadList = uploads || [];
      setSessionOptions(uploadList);

      const uploadIds = uploadList.map(u => u.id);
      if (uploadIds.length === 0) {
        setData([]);
        setStats(null);
        setSsidOptions([]);
        setFloorOptions([]);
        return;
      }

      const ms = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data: page, error: measurementsError } = await supabase
          .from('measurements')
          .select('*')
          .in('upload_id', uploadIds)
          .order('timestamp', { ascending: true })
          .range(from, from + PAGE - 1);
        if (measurementsError) throw measurementsError;
        if (page && page.length > 0) ms.push(...page);
        if (!page || page.length < PAGE) break;
        from += PAGE;
      }
      setData(ms);

      const uniqueSsids = [...new Set(ms.map(m => m.ssid).filter(Boolean))].sort();
      const uniqueFloors = [...new Set(ms.map(m => m.floor).filter(v => v != null))].sort((a, b) => a - b);
      setSsidOptions(uniqueSsids);
      setFloorOptions(uniqueFloors);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('❌ 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadIdToLocation = useMemo(() => {
    const map = new Map();
    sessionOptions.forEach(s => map.set(s.id, s.location || ''));
    return map;
  }, [sessionOptions]);

  const locationOptions = useMemo(() => {
    return [...new Set(sessionOptions.map(s => s.location).filter(Boolean))].sort();
  }, [sessionOptions]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (localFilters.session !== 'all' && d.upload_id !== localFilters.session) return false;
      if (localFilters.location !== 'all' && uploadIdToLocation.get(d.upload_id) !== localFilters.location) return false;
      if (localFilters.ssid !== 'all' && d.ssid !== localFilters.ssid) return false;
      if (localFilters.floor !== 'all' && String(d.floor) !== localFilters.floor) return false;
      if (localFilters.frequency === '2.4GHz' && d.wifi_frequency >= 5000) return false;
      if (localFilters.frequency === '5GHz' && d.wifi_frequency < 5000) return false;
      return true;
    });
  }, [data, localFilters, uploadIdToLocation]);

  useEffect(() => {
    calculateStats(filteredData);
  }, [filteredData]);

  const calculateStats = (measurements) => {
    if (measurements.length === 0) { setStats(null); return; }

    const rssiValues = measurements.map(m => m.rssi).filter(v => v !== null && !isNaN(v));
    const pingValues = measurements.map(m => m.ping_ms).filter(v => v !== null && !isNaN(v) && v !== -1);
    const speedValues = measurements.map(m => m.link_speed).filter(v => v !== null && !isNaN(v));
    const lossValues = measurements.map(m => m.ping_loss_rate).filter(v => v !== null && !isNaN(v));
    const jitterValues = measurements.map(m => m.ping_jitter).filter(v => v !== null && !isNaN(v));
    const dnsValues = measurements.map(m => m.dns_time).filter(v => v !== null && !isNaN(v));
    const calcMean = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 'N/A';

    setStats({
      totalCount: measurements.length,
      rssi:   { mean: calcMean(rssiValues),   min: rssiValues.length   > 0 ? Math.min(...rssiValues)   : 'N/A', max: rssiValues.length   > 0 ? Math.max(...rssiValues)   : 'N/A' },
      ping:   { mean: calcMean(pingValues),   min: pingValues.length   > 0 ? Math.min(...pingValues)   : 'N/A', max: pingValues.length   > 0 ? Math.max(...pingValues)   : 'N/A' },
      speed:  { mean: calcMean(speedValues),  min: speedValues.length  > 0 ? Math.min(...speedValues)  : 'N/A', max: speedValues.length  > 0 ? Math.max(...speedValues)  : 'N/A' },
      loss:   { mean: calcMean(lossValues),   min: lossValues.length   > 0 ? Math.min(...lossValues)   : 'N/A', max: lossValues.length   > 0 ? Math.max(...lossValues)   : 'N/A' },
      jitter: { mean: calcMean(jitterValues), min: jitterValues.length > 0 ? Math.min(...jitterValues) : 'N/A', max: jitterValues.length > 0 ? Math.max(...jitterValues) : 'N/A' },
      dns:    { mean: calcMean(dnsValues),    min: dnsValues.length    > 0 ? Math.min(...dnsValues)    : 'N/A', max: dnsValues.length    > 0 ? Math.max(...dnsValues)    : 'N/A' }
    });
  };

  const formatSessionLabel = (s) => {
    const date = s.start_time ? s.start_time.slice(0, 10) : '?';
    return `${date} · ${s.location || '-'} (${s.data_count ?? '?'}개)`;
  };

  const formatTimestamp = (tsMs) => {
    if (tsMs == null || isNaN(tsMs)) return '';
    const d = new Date(tsMs);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'datetime', 'timestamp', 'location', 'upload_id',
      'ssid', 'bssid', 'rssi', 'link_speed', 'wifi_frequency', 'channel_number',
      'ping_ms', 'ping_loss_rate', 'ping_jitter', 'dns_time',
      'neighbor_count', 'floor', 'latitude', 'longitude'
    ];

    const escape = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = filteredData.map(d => [
      escape(formatTimestamp(d.timestamp)),
      escape(d.timestamp),
      escape(uploadIdToLocation.get(d.upload_id) ?? ''),
      escape(d.upload_id),
      escape(d.ssid),
      escape(d.bssid),
      escape(d.rssi),
      escape(d.link_speed),
      escape(d.wifi_frequency),
      escape(d.channel_number),
      escape(d.ping_ms),
      escape(d.ping_loss_rate),
      escape(d.ping_jitter),
      escape(d.dns_time),
      escape(d.neighbor_count),
      escape(d.floor),
      escape(d.latitude),
      escape(d.longitude),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const locationPart = localFilters.location !== 'all' ? localFilters.location : '전체';
    const sessionPart = localFilters.session !== 'all' ? 'session' : 'all';
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `wifi_export_${datePart}_${locationPart}_${sessionPart}_${filteredData.length}rows.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isFiltered = localFilters.session !== 'all' || localFilters.location !== 'all' || localFilters.ssid !== 'all' || localFilters.floor !== 'all' || localFilters.frequency !== 'all';

  const selectStyle = {
    border: '1px solid #d1d5db', borderRadius: '6px',
    padding: '0.4rem 0.6rem', fontSize: '0.875rem',
    background: 'white', cursor: 'pointer'
  };

  const chartData = filteredData.map((d, idx) => ({
    idx: idx + 1,
    rssi: d.rssi,
    ping: d.ping_ms === -1 ? null : d.ping_ms,
    speed: d.link_speed,
    lossRate: d.ping_loss_rate,
    jitter: d.ping_jitter,
    dns: d.dns_time
  }));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>🔄 데이터 분석 중...</div>
  );

  if (!data.length) return (
    <div style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', color: '#9ca3af' }}>
      분석할 데이터가 없습니다. 필터를 조정해보세요.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 세부 필터 패널 */}
      <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>세부 필터</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>

          {/* 수집 세션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>수집 세션</label>
            <select
              value={localFilters.session}
              onChange={(e) => setLocalFilters(f => ({ ...f, session: e.target.value }))}
              style={{ ...selectStyle, maxWidth: '260px' }}
            >
              <option value="all">전체 ({sessionOptions.length}개 세션)</option>
              {sessionOptions.map(s => (
                <option key={s.id} value={s.id}>{formatSessionLabel(s)}</option>
              ))}
            </select>
          </div>

          {/* 장소 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>장소</label>
            <select
              value={localFilters.location}
              onChange={(e) => setLocalFilters(f => ({ ...f, location: e.target.value }))}
              style={selectStyle}
            >
              <option value="all">전체</option>
              {locationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* SSID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>SSID</label>
            <select
              value={localFilters.ssid}
              onChange={(e) => setLocalFilters(f => ({ ...f, ssid: e.target.value }))}
              style={selectStyle}
            >
              <option value="all">전체</option>
              {ssidOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 층 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>층</label>
            <select
              value={localFilters.floor}
              onChange={(e) => setLocalFilters(f => ({ ...f, floor: e.target.value }))}
              style={selectStyle}
            >
              <option value="all">전체</option>
              {floorOptions.map(f => <option key={f} value={String(f)}>{f}층</option>)}
            </select>
          </div>

          {/* 주파수 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>주파수</label>
            <select
              value={localFilters.frequency}
              onChange={(e) => setLocalFilters(f => ({ ...f, frequency: e.target.value }))}
              style={selectStyle}
            >
              <option value="all">전체</option>
              <option value="2.4GHz">2.4 GHz</option>
              <option value="5GHz">5 GHz</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={() => setLocalFilters({ session: 'all', location: 'all', ssid: 'all', floor: 'all', frequency: 'all' })}
              style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer' }}
            >
              초기화
            </button>
          )}

          <button
            onClick={handleDownloadCSV}
            disabled={filteredData.length === 0}
            style={{
              fontSize: '0.8rem',
              color: filteredData.length === 0 ? '#9ca3af' : '#1d4ed8',
              background: filteredData.length === 0 ? '#f3f4f6' : '#eff6ff',
              border: '1px solid ' + (filteredData.length === 0 ? '#d1d5db' : '#bfdbfe'),
              borderRadius: '6px',
              padding: '0.4rem 0.75rem',
              cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            CSV 다운로드
          </button>

          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>
            전체 <b>{data.length}</b>개 → 표시 <b>{filteredData.length}</b>개
          </span>
        </div>
      </div>

      {/* 통계 요약 */}
      {stats && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>📊 통계 요약</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { label: '총 데이터', value: stats.totalCount },
              { label: '평균 RSSI', value: stats.rssi.mean },
              { label: '평균 Ping', value: stats.ping.mean },
              { label: '평균 Speed', value: stats.speed.mean },
              { label: '평균 Loss', value: `${stats.loss.mean}%` },
              { label: '평균 DNS', value: stats.dns.mean },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredData.length === 0 ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', color: '#9ca3af' }}>
          세부 필터 조건에 맞는 데이터가 없습니다.
        </div>
      ) : (
        <>
          {[
            { key: 'rssi',     label: '📈 RSSI 추이',       color: '#3b82f6', name: 'RSSI' },
            { key: 'ping',     label: '🌐 Ping 응답 시간',   color: '#10b981', name: 'Ping (ms)' },
            { key: 'speed',    label: '⚡ Link Speed 추이',  color: '#f59e0b', name: 'Link Speed (Mbps)' },
            { key: 'lossRate', label: '📉 Ping 손실률',      color: '#ef4444', name: '손실률 (%)' },
            { key: 'jitter',   label: '〰️ 지터 (안정성)',    color: '#8b5cf6', name: '지터 (ms)' },
            { key: 'dns',      label: '🌐 DNS 조회 시간',    color: '#06b6d4', name: 'DNS (ms)' },
          ].map(({ key, label, color, name }) => (
            <div key={key} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>{label}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="idx" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={key} stroke={color} dot={false} name={name} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
