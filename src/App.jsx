import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function WifiAnalysisDashboard() {
  const [csvData, setCsvData] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileName, setFileName] = useState('');

  // CSV 파싱 함수 - v3.0 기준
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // v3.0: 신규 필드 추가 (ping_loss_rate, ping_jitter, wifi_frequency, channel_number, neighbor_count, dns_time)
        if (['timestamp', 'rssi', 'link_speed', 'ping_ms', 'ping_loss_rate', 'ping_jitter', 
              'wifi_frequency', 'channel_number', 'neighbor_count', 'dns_time', 'latitude', 'longitude'].includes(header)) {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });
      return obj;
    });
    
    return data;
  };

  // 통계량 계산 - v3.0 기준
  const calculateStats = (data) => {
    const numericColumns = ['rssi', 'link_speed', 'ping_ms', 'ping_loss_rate', 'ping_jitter', 
                           'wifi_frequency', 'channel_number', 'neighbor_count', 'dns_time', 'latitude', 'longitude'];
    const statistics = {};

    numericColumns.forEach(col => {
      const values = data.map(d => d[col]).filter(v => !isNaN(v) && v !== null && v !== -1);
      if (values.length === 0) return;
      
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
    
    // v3.0: 주파수 대역 분석
    const dataWith2_4GHz = data.filter(d => d.wifi_frequency && d.wifi_frequency < 3000).length;
    const dataWith5GHz = data.filter(d => d.wifi_frequency && d.wifi_frequency >= 3000).length;

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
        floors: floors,
        frequency: {
          band2_4GHz: dataWith2_4GHz,
          band5GHz: dataWith5GHz
        }
      }
    };
  };

  // 파일 업로드
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    processFile(file);
  };

  // 파일 처리 함수
  const processFile = (file) => {
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

  // 드래그 오버 이벤트
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드래그 리브 이벤트
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드롭 이벤트
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        alert('CSV 파일만 업로드 가능합니다.');
      }
    }
  };

  // 히스토그램 데이터
  const createHistogramData = (data, field, binSize) => {
    if (!data) return [];
    
    const values = data.map(d => d[field]).filter(v => !isNaN(v) && v !== null && v !== -1);
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

  // 채널 분포
  const createChannelData = (data) => {
    if (!data) return [];
    
    const channelCounts = {};
    data.forEach(d => {
      if (d.channel_number) {
        channelCounts[d.channel_number] = (channelCounts[d.channel_number] || 0) + 1;
      }
    });
    
    return Object.entries(channelCounts).map(([channel, count]) => ({
      name: `Ch ${channel}`,
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
      lossRate: d.ping_loss_rate || null,
      jitter: d.ping_jitter || null,
      speed: d.link_speed,
      dns: d.dns_time || null,
      neighbors: d.neighbor_count || null
    }));
  };

  const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#8BC34A'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1a237e', marginBottom: '0.5rem' }}>
            📡 WiFi 데이터 분석 대시보드 v3.0
          </h1>
          <p style={{ color: '#5c6bc0' }}>CSV 파일을 업로드하여 WiFi 측정 데이터를 분석하세요</p>
        </div>

        {/* 파일 업로드 */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '2rem' }}>
          <div 
            style={{ border: '2px dashed #2196F3', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'background-color 0.3s' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#424242', marginBottom: '0.5rem' }}>
              CSV 파일 업로드
            </div>
            <div style={{ color: '#757575', marginBottom: '1rem' }}>
              파일을 선택하거나 드래그 앤 드롭하세요
            </div>
            <button 
              style={{ 
                background: '#2196F3', 
                color: 'white', 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              파일 선택
            </button>
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
              
              {/* 카드 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#1565c0' }}>📦 총 데이터</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{csvData.length}</div>
                </div>
                <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#2e7d32' }}>⏱️ 측정 시간</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>{stats.quality.duration}</div>
                  <div style={{ fontSize: '0.75rem', color: '#558b2f' }}>분</div>
                </div>
                <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#e65100' }}>⏳ 평균 주기</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{stats.quality.avgInterval}</div>
                  <div style={{ fontSize: '0.75rem', color: '#e65100' }}>초</div>
                </div>
                <div style={{ background: '#fce4ec', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#c2185b' }}>❌ Ping 실패율</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e91e63' }}>{stats.quality.pingFailRate}</div>
                  <div style={{ fontSize: '0.75rem', color: '#c2185b' }}>%</div>
                </div>
                <div style={{ background: '#f3e5f5', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6a1b9a' }}>📉 평균 Loss</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8e24aa' }}>
                    {stats.basic.ping_loss_rate ? stats.basic.ping_loss_rate.mean : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6a1b9a' }}>%</div>
                </div>
                <div style={{ background: '#e0f2f1', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#00695c' }}>📊 평균 Jitter</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00897b' }}>
                    {stats.basic.ping_jitter ? stats.basic.ping_jitter.mean : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#00695c' }}>ms</div>
                </div>
                {stats.network.frequency && (
                  <>
                    <div style={{ background: '#fff8e1', padding: '1.5rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#f57f17' }}>📶 2.4GHz</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbc02d' }}>{stats.network.frequency.band2_4GHz}</div>
                    </div>
                    <div style={{ background: '#e8eaf6', padding: '1.5rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#3949ab' }}>📶 5GHz</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#5c6bc0' }}>{stats.network.frequency.band5GHz}</div>
                    </div>
                  </>
                )}
                <div style={{ background: '#ede7f6', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#512da8' }}>🌐 평균 DNS</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7e57c2' }}>
                    {stats.basic.dns_time ? stats.basic.dns_time.mean : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#512da8' }}>ms</div>
                </div>
                <div style={{ background: '#ffebee', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#b71c1c' }}>📡 평균 혼잡도</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>
                    {stats.basic.neighbor_count ? Math.round(stats.basic.neighbor_count.mean) : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b71c1c' }}>AP</div>
                </div>
              </div>

              {/* 통계 테이블 - 기본 정보 */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#424242', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #2196F3' }}>기본 정보 (RSSI, Speed, 위치)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ddd' }}>지표</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>RSSI (dBm)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>Speed (Mbps)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>위도</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>경도</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['count', 'mean', 'std', 'min', 'max', 'median'].map((stat, idx) => (
                        <tr key={stat} style={{ borderBottom: '1px solid #e0e0e0', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                            {stat === 'count' ? '개수' : stat === 'mean' ? '평균' : stat === 'std' ? '표준편차' : stat === 'min' ? '최솟값' : stat === 'max' ? '최댓값' : '중앙값'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.rssi?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.link_speed?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.latitude?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.longitude?.[stat]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 통계 테이블 - Ping 통계 */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#424242', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #4CAF50' }}>Ping 통계 (응답시간 / 손실률 / 지터)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ddd' }}>지표</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>응답시간 (ms)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>손실률 (%)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>지터 (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['count', 'mean', 'std', 'min', 'max', 'median'].map((stat, idx) => (
                        <tr key={stat} style={{ borderBottom: '1px solid #e0e0e0', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                            {stat === 'count' ? '개수' : stat === 'mean' ? '평균' : stat === 'std' ? '표준편차' : stat === 'min' ? '최솟값' : stat === 'max' ? '최댓값' : '중앙값'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.ping_ms?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.ping_loss_rate?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.ping_jitter?.[stat]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 통계 테이블 - RF 환경 및 네트워크 */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#424242', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #FF9800' }}>RF 환경 & 네트워크 (주파수 / 채널 / 혼잡도 / DNS)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ddd' }}>지표</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>주파수 (MHz)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>채널</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>혼잡도 (AP)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd' }}>DNS (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['count', 'mean', 'std', 'min', 'max', 'median'].map((stat, idx) => (
                        <tr key={stat} style={{ borderBottom: '1px solid #e0e0e0', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                            {stat === 'count' ? '개수' : stat === 'mean' ? '평균' : stat === 'std' ? '표준편차' : stat === 'min' ? '최솟값' : stat === 'max' ? '최댓값' : '중앙값'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.wifi_frequency?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.channel_number?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.neighbor_count?.[stat]}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{stats.basic.dns_time?.[stat]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 네트워크 정보 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', borderTop: '2px solid #e0e0e0', paddingTop: '1.5rem' }}>
                <div style={{ borderLeft: '4px solid #2196F3', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#757575', fontWeight: '600' }}>📍 측정 위치</div>
                  <div style={{ fontWeight: '600', color: '#424242', marginTop: '0.5rem' }}>{stats.network.floors.join(', ')}</div>
                </div>
                <div style={{ borderLeft: '4px solid #4CAF50', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#757575', fontWeight: '600' }}>🏢 SSID</div>
                  <div style={{ fontWeight: '600', color: '#424242', marginTop: '0.5rem' }}>{stats.network.ssids.join(', ')}</div>
                </div>
                <div style={{ borderLeft: '4px solid #FF9800', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#757575', fontWeight: '600' }}>🔗 BSSID</div>
                  <div style={{ fontWeight: '600', color: '#424242', marginTop: '0.5rem', fontSize: '0.85rem', wordBreak: 'break-all' }}>{stats.network.bssids.join(', ')}</div>
                </div>
              </div>
            </div>

            {/* 시각화 */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1a237e', marginBottom: '1.5rem' }}>📈 시각화</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 시계열 - RSSI */}
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

                {/* 시계열 - Ping 및 손실율 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
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

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 Ping 손실률</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareTimeSeriesData(csvData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: '손실률 (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="lossRate" stroke="#F44336" strokeWidth={2} dot={false} name="손실률" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 시계열 - Jitter 및 DNS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📈 Ping 지터 (안정성)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareTimeSeriesData(csvData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: '지터 (ms)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="jitter" stroke="#9C27B0" strokeWidth={2} dot={false} name="지터" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>🌐 DNS 조회 시간</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareTimeSeriesData(csvData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'DNS (ms)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="dns" stroke="#00BCD4" strokeWidth={2} dot={false} name="DNS" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 시계열 - Speed 및 혼잡도 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
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

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📡 WiFi 혼잡도</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareTimeSeriesData(csvData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="idx" label={{ value: '데이터 포인트', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: '주변 AP 개수', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="neighbors" stroke="#8BC34A" strokeWidth={2} dot={false} name="혼잡도" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 손실률 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'ping_loss_rate', 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: '손실률 (%)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F44336" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 지터 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'ping_jitter', 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: '지터 (ms)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#9C27B0" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 DNS 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'dns_time', 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: 'DNS (ms)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#00BCD4" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📊 Speed 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={createHistogramData(csvData, 'link_speed', 50)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" label={{ value: 'Speed (Mbps)', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#FF9800" name="빈도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 파이 차트 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
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

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#424242', marginBottom: '1rem' }}>📶 채널 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={createChannelData(csvData)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {createChannelData(csvData).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
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
            <p style={{ color: '#757575', marginBottom: '1rem' }}>
              WiFi 측정 데이터를 분석하여 통계와 시각화를 제공합니다 (v3.0)
            </p>
            <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '1.5rem', textAlign: 'left', display: 'inline-block' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>✔ 지원하는 CSV 형식:</div>
              <code style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', display: 'block', overflow: 'auto' }}>
                timestamp,rssi,link_speed,ssid,bssid,{'\n'}ping_ms,ping_loss_rate,ping_jitter,{'\n'}wifi_frequency,channel_number,neighbor_count,{'\n'}dns_time,latitude,longitude,floor
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
