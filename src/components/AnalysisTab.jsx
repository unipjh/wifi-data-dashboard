import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalysisTab({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState('histogram');
  const [sessionOptions, setSessionOptions] = useState([]);
  const [localFilters, setLocalFilters] = useState({ session: 'all', ssid: 'all', floor: 'all', frequency: 'all' });
  const [ssidOptions, setSsidOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setLocalFilters({ session: 'all', ssid: 'all', floor: 'all', frequency: 'all' });
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

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (localFilters.session !== 'all' && d.upload_id !== localFilters.session) return false;
      if (localFilters.ssid !== 'all' && d.ssid !== localFilters.ssid) return false;
      if (localFilters.floor !== 'all' && String(d.floor) !== localFilters.floor) return false;
      if (localFilters.frequency === '2.4GHz' && d.wifi_frequency >= 5000) return false;
      if (localFilters.frequency === '5GHz' && d.wifi_frequency < 5000) return false;
      return true;
    });
  }, [data, localFilters]);

  const createHistogram = (field, binSize) => {
    const values = filteredData.map(d => d[field]).filter(v => v !== null && v !== -1 && !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    const bins = {};
    for (let i = Math.floor(min / binSize) * binSize; i <= max; i += binSize) {
      bins[i] = 0;
    }

    values.forEach(v => {
      const bin = Math.floor(v / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    });

    return Object.entries(bins).map(([bin, count]) => ({
      range: `${bin}`,
      count: count
    }));
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const selectStyle = {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.4rem 0.6rem',
    fontSize: '0.875rem',
    background: 'white',
    cursor: 'pointer'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        🔄 데이터 분석 중...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', color: '#9ca3af' }}>
        분석할 데이터가 없습니다. 필터를 조정해보세요.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 헤더 */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>🔬 정밀 분석</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>
          전체 <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{data.length}</span>개 →
          필터 후 <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{filteredData.length}</span>개
        </p>
      </div>

      {/* 세부 필터 패널 */}
      <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>세부 필터</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>수집 세션</label>
            <select
              value={localFilters.session}
              onChange={(e) => setLocalFilters(f => ({ ...f, session: e.target.value }))}
              style={{ ...selectStyle, maxWidth: '260px' }}
            >
              <option value="all">전체 ({sessionOptions.length}개 세션)</option>
              {sessionOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {(s.start_time ? s.start_time.slice(0, 10) : '?')} · {s.location || '-'} ({s.data_count ?? '?'}개)
                </option>
              ))}
            </select>
          </div>

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

          {(localFilters.session !== 'all' || localFilters.ssid !== 'all' || localFilters.floor !== 'all' || localFilters.frequency !== 'all') && (
            <button
              onClick={() => setLocalFilters({ session: 'all', ssid: 'all', floor: 'all', frequency: 'all' })}
              style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer' }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', color: '#9ca3af' }}>
          세부 필터 조건에 맞는 데이터가 없습니다.
        </div>
      ) : (
        <>
          {/* 분포 히스토그램 섹션 */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => toggleSection('histogram')}
              style={{
                width: '100%',
                padding: '1.5rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#374151'
              }}
              onMouseEnter={(e) => e.target.closest('button').style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.closest('button').style.background = 'none'}
            >
              <span>📊 분포 히스토그램</span>
              <span style={{ fontSize: '1.25rem' }}>{expandedSection === 'histogram' ? '▼' : '▶'}</span>
            </button>

            {expandedSection === 'histogram' && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>📶 RSSI 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('rssi', 2)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'RSSI (dBm)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196F3" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>🌐 Ping 응답 시간 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('ping_ms', 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Ping (ms)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4CAF50" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>⚡ Link Speed 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('link_speed', 50)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Link Speed (Mbps)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF9800" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>📉 Packet Loss Rate 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('ping_loss_rate', 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Loss Rate (%)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F44336" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>📊 Jitter 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('ping_jitter', 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Jitter (ms)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#9C27B0" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>📡 WiFi Channel 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('channel_number', 1)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Channel', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00BCD4" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>📶 주변 AP 개수 분포</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={createHistogram('neighbor_count', 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: 'Neighbor Count', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: '빈도', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#607D8B" name="빈도" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* 시계열 분석 섹션 */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => toggleSection('timeseries')}
              style={{
                width: '100%',
                padding: '1.5rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#374151'
              }}
              onMouseEnter={(e) => e.target.closest('button').style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.closest('button').style.background = 'none'}
            >
              <span>📈 시계열 분석 <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>(준비 중)</span></span>
              <span style={{ fontSize: '1.25rem' }}>{expandedSection === 'timeseries' ? '▼' : '▶'}</span>
            </button>

            {expandedSection === 'timeseries' && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                시계열 분석 기능 준비 중입니다
              </div>
            )}
          </div>

          {/* 상관관계 분석 섹션 */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => toggleSection('correlation')}
              style={{
                width: '100%',
                padding: '1.5rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#374151'
              }}
              onMouseEnter={(e) => e.target.closest('button').style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.closest('button').style.background = 'none'}
            >
              <span>🔗 상관관계 분석 <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>(준비 중)</span></span>
              <span style={{ fontSize: '1.25rem' }}>{expandedSection === 'correlation' ? '▼' : '▶'}</span>
            </button>

            {expandedSection === 'correlation' && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                상관관계 분석 기능 준비 중입니다
              </div>
            )}
          </div>

          {/* 이상치 탐지 섹션 */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => toggleSection('anomaly')}
              style={{
                width: '100%',
                padding: '1.5rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#374151'
              }}
              onMouseEnter={(e) => e.target.closest('button').style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.closest('button').style.background = 'none'}
            >
              <span>⚠️ 이상치 탐지 <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>(준비 중)</span></span>
              <span style={{ fontSize: '1.25rem' }}>{expandedSection === 'anomaly' ? '▼' : '▶'}</span>
            </button>

            {expandedSection === 'anomaly' && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                이상치 탐지 기능 준비 중입니다
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
