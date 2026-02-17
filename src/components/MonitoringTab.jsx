import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MonitoringTab({ filters }) {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 필터에 맞는 upload_id 조회
      let uploadsQuery = supabase.from('uploads').select('id');

      if (filters.uploader !== 'all') {
        uploadsQuery = uploadsQuery.eq('uploader', filters.uploader);
      }
      if (filters.location !== 'all') {
        uploadsQuery = uploadsQuery.eq('location', filters.location);
      }
      if (filters.startDate) {
        uploadsQuery = uploadsQuery.gte('start_time', filters.startDate + 'T00:00:00Z');
      }
      if (filters.endDate) {
        uploadsQuery = uploadsQuery.lte('end_time', filters.endDate + 'T23:59:59Z');
      }

      const { data: uploads, error: uploadsError } = await uploadsQuery;

      if (uploadsError) throw uploadsError;

      const uploadIds = uploads?.map(u => u.id) || [];

      if (uploadIds.length === 0) {
        setData([]);
        setStats(null);
        return;
      }

      // measurements 조회
      const { data: measurements, error: measurementsError } = await supabase
        .from('measurements')
        .select('*')
        .in('upload_id', uploadIds)
        .order('timestamp', { ascending: true });

      if (measurementsError) throw measurementsError;

      setData(measurements || []);
      calculateStats(measurements || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('❌ 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (measurements) => {
    if (measurements.length === 0) {
      setStats(null);
      return;
    }

    const rssiValues = measurements.map(m => m.rssi).filter(v => v !== null && !isNaN(v));
    const pingValues = measurements.map(m => m.ping_ms).filter(v => v !== null && !isNaN(v) && v !== -1);
    const speedValues = measurements.map(m => m.link_speed).filter(v => v !== null && !isNaN(v));
    const lossValues = measurements.map(m => m.ping_loss_rate).filter(v => v !== null && !isNaN(v));
    const jitterValues = measurements.map(m => m.ping_jitter).filter(v => v !== null && !isNaN(v));
    const dnsValues = measurements.map(m => m.dns_time).filter(v => v !== null && !isNaN(v));

    const calcMean = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 'N/A';

    const stats = {
      totalCount: measurements.length,
      rssi: {
        mean: calcMean(rssiValues),
        min: rssiValues.length > 0 ? Math.min(...rssiValues) : 'N/A',
        max: rssiValues.length > 0 ? Math.max(...rssiValues) : 'N/A'
      },
      ping: {
        mean: calcMean(pingValues),
        min: pingValues.length > 0 ? Math.min(...pingValues) : 'N/A',
        max: pingValues.length > 0 ? Math.max(...pingValues) : 'N/A'
      },
      speed: {
        mean: calcMean(speedValues),
        min: speedValues.length > 0 ? Math.min(...speedValues) : 'N/A',
        max: speedValues.length > 0 ? Math.max(...speedValues) : 'N/A'
      },
      loss: {
        mean: calcMean(lossValues),
        min: lossValues.length > 0 ? Math.min(...lossValues) : 'N/A',
        max: lossValues.length > 0 ? Math.max(...lossValues) : 'N/A'
      },
      jitter: {
        mean: calcMean(jitterValues),
        min: jitterValues.length > 0 ? Math.min(...jitterValues) : 'N/A',
        max: jitterValues.length > 0 ? Math.max(...jitterValues) : 'N/A'
      },
      dns: {
        mean: calcMean(dnsValues),
        min: dnsValues.length > 0 ? Math.min(...dnsValues) : 'N/A',
        max: dnsValues.length > 0 ? Math.max(...dnsValues) : 'N/A'
      }
    };

    setStats(stats);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

  const chartData = data.map((d, idx) => ({
    idx: idx + 1,
    rssi: d.rssi,
    ping: d.ping_ms === -1 ? null : d.ping_ms,
    speed: d.link_speed,
    lossRate: d.ping_loss_rate,
    jitter: d.ping_jitter,
    dns: d.dns_time
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 통계 요약 */}
      {stats && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>📊 통계 요약</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>총 데이터</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.totalCount}</div>
            </div>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>평균 RSSI</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.rssi.mean}</div>
            </div>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>평균 Ping</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.ping.mean}</div>
            </div>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>평균 Speed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.speed.mean}</div>
            </div>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>평균 Loss</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.loss.mean}%</div>
            </div>
            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>평균 DNS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e40af' }}>{stats.dns.mean}</div>
            </div>
          </div>
        </div>
      )}

      {/* 차트들 */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>📈 RSSI 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rssi" stroke="#3b82f6" dot={false} name="RSSI" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>🌐 Ping 응답 시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ping" stroke="#10b981" dot={false} name="Ping (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>⚡ Link Speed 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="speed" stroke="#f59e0b" dot={false} name="Link Speed (Mbps)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>📉 Ping 손실률</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="lossRate" stroke="#ef4444" dot={false} name="손실률 (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>⚡ 지터 (안정성)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="jitter" stroke="#8b5cf6" dot={false} name="지터 (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>🌐 DNS 조회 시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.slice(0, 500)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="dns" stroke="#06b6d4" dot={false} name="DNS (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
