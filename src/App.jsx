import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function WifiAnalysisDashboard() {
  const [csvData, setCsvData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileName, setFileName] = useState('');

  // CSV 파싱 함수
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (['timestamp', 'rssi', 'link_speed', 'ping_ms', 'latitude', 'longitude'].includes(header)) {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });
      return obj;
    });
    
    return data;
  };

  // 통계량 계산
  const calculateStats = (data) => {
    const numericColumns = ['rssi', 'link_speed', 'ping_ms', 'latitude', 'longitude'];
    const statistics = {};

    numericColumns.forEach(col => {
      const values = data.map(d => d[col]).filter(v => !isNaN(v) && v !== null);
      values.sort((a, b) => a - b);
      
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
      const std = Math.sqrt(variance);
      
      statistics[col] = {
        count: count,
        mean: mean.toFixed(2),
        std: std.toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        median: values[Math.floor(count / 2)].toFixed(2),
        q1: values[Math.floor(count * 0.25)].toFixed(2),
        q3: values[Math.floor(count * 0.75)].toFixed(2)
      };
    });

    // 측정 주기
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push((data[i].timestamp - data[i-1].timestamp) / 1000);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // 품질 지표
    const pingFailures = data.filter(d => d.ping_ms === -1).length;
    const pingFailRate = ((pingFailures / data.length) * 100).toFixed(1);
    const validGPS = data.filter(d => d.latitude !== 0 && d.longitude !== 0).length;
    const gpsValidRate = ((validGPS / data.length) * 100).toFixed(1);

    const startTime = new Date(data[0].timestamp);
    const endTime = new Date(data[data.length - 1].timestamp);
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);

    const uniqueSSIDs = [...new Set(data.map(d => d.ssid))];
    const uniqueBSSIDs = [...new Set(data.map(d => d.bssid))];
    const floors = [...new Set(data.map(d => d.floor))];

    return {
      basic: statistics,
      quality: {
        avgInterval: avgInterval.toFixed(2),
        pingFailRate: pingFailRate,
        gpsValidRate: gpsValidRate,
        duration: duration,
        startTime: startTime.toLocaleString('ko-KR'),
        endTime: endTime.toLocaleString('ko-KR')
      },
      network: {
        ssids: uniqueSSIDs,
        bssids: uniqueBSSIDs,
        floors: floors
      }
    };
  };

  // 파일 업로드
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      const calculated = calculateStats(parsed);
      setStats(calculated);
    };
    
    reader.readAsText(file);
  };

  // 히스토그램 데이터
  const createHistogramData = (data, field, binSize) => {
    if (!data) return [];
    
    const values = data.map(d => d[field]).filter(v => !isNaN(v) && v !== null && v !== -1);
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

  // Floor 분포
  const createFloorData = (data) => {
    if (!data) return [];
    
    const floorCounts = {};
    data.forEach(d => {
      floorCounts[d.floor] = (floorCounts[d.floor] || 0) + 1;
    });
    
    return Object.entries(floorCounts).map(([floor, count]) => ({
      name: floor,
      value: count
    }));
  };

  // 시계열 데이터
  const prepareTimeSeriesData = (data) => {
    if (!data) return [];
    
    return data.map((d, idx) => ({
      idx: idx + 1,
      rssi: d.rssi,
      ping: d.ping_ms === -1 ? null : d.ping_ms,
      speed: d.link_speed
    }));
  };

  const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1a237e', marginBottom: '0.5rem' }}>
            📡 WiFi 데이터 분석 대시보드
          </h1>
          <p style={{ color: '#5c6bc0' }}>CSV 파일을 업로드하여 WiFi 측정 데이터를 분석하세요</p>
        </div>

        {/* 파일 업로드 */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ border: '2px dashed #2196F3', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#424242', marginBottom: '0.5rem' }}>
                CSV 파일 업로드
              </div>
              <div style={{ color: '#757575', marginBottom: '1rem' }}>
                파일을 선택하거나 드래그 앤 드롭하세요
              </div>
              <button style={{ 
                background: '#2196F3', 
                color: 'white', 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                파일 선택
              </button>
            </label>
          </div>
          {fileName && (
            <div style={{ marginTop: '1rem', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>
              📄 {fileName}
            </div>
          )}
        </div>

        {csvData && stats && (
          <>
            {/* 통계 요약 */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1a237e', marginBottom: '1.5rem' }}>📊 통계 요약</h2>
              
              {/* 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#1565c0' }}>총 데이터</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{csvData.length}개</div>
                </div>
                <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#2e7d32' }}>측정 시간</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>{stats.quality.duration}분</div>
                </div>
                <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#e65100' }}>평균 주기</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{stats.quality.avgInterval}초</div>
                </div>
                <div style={{ background: '#fce4ec', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#c2185b' }}>Ping 실패율</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e91e63' }}>{stats.quality.pingFailRate}%</div>
                </div>
              </div>

              {/* 통계 테이블 */}
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f5f5f5' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>지표</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>RSSI</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Speed</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Ping</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>위도</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>경도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['count', 'mean', 'std', 'min', 'max'].map((stat, idx) => (
                      <tr key={stat} style={{ borderBottom: '1px solid #e0e0e0', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                          {stat === 'count' ? '개수' : stat === 'mean' ? '평균' : stat === 'std' ? '표준편차' : stat === 'min' ? '최솟값' : '최댓값'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.rssi[stat]}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.link_speed[stat]}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.ping_ms[stat]}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.latitude[stat]}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.longitude[stat]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 네트워크 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #2196F3', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#757575' }}>측정 위치</div>
                  <div style={{ fontWeight: '600', color: '#424242' }}>{stats.network.floors.join(', ')}</div>
                </div>
                <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#757575' }}>SSID</div>
                  <div style={{ fontWeight: '600', color: '#424242' }}>{stats.network.ssids.join(', ')}</div>
                </div>
              </div>
            </div>

            {/* 시각화 */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1a237e', marginBottom: '1.5rem' }}>📈 시각화</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* RSSI */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📶 RSSI 추이</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareTimeSeriesData(csvData)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'RSSI (dBm)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="rssi" stroke="#2196F3" strokeWidth={2} dot={false} name="RSSI" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Ping */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>🌐 Ping 응답 시간</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareTimeSeriesData(csvData)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Ping (ms)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ping" stroke="#4CAF50" strokeWidth={2} dot={false} name="Ping" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Speed */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>⚡ Link Speed 추이</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareTimeSeriesData(csvData)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Speed (Mbps)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="speed" stroke="#FF9800" strokeWidth={2} dot={false} name="Link Speed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 히스토그램 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 RSSI 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'rssi', 2)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: 'RSSI (dBm)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2196F3" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 Ping 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'ping_ms', 50)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: 'Ping (ms)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4CAF50" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Floor 파이차트 */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📍 측정 위치 분포</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={createFloorData(csvData)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {createFloorData(csvData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {!csvData && (
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#424242', marginBottom: '0.5rem' }}>
              CSV 파일을 업로드하세요
            </h3>
            <p style={{ color: '#757575' }}>
              WiFi 측정 데이터를 분석하여 통계와 시각화를 제공합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}