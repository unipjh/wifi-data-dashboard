import React, { useState } from 'react';
import UploadTab from './components/UploadTab';
import DataTab from './components/DataTab';
import MonitoringTab from './components/MonitoringTab';
import AnalysisTab from './components/AnalysisTab';
import FilterPanel from './components/FilterPanel';

export default function WifiAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [filters, setFilters] = useState({
    uploader: 'all',
    location: 'all',
    startDate: '',
    endDate: ''
  });

  const tabs = [
    { id: 'upload', label: '📤 파일 업로드', icon: '📁' },
    { id: 'data', label: '📂 데이터 조회', icon: '📋' },
    { id: 'monitoring', label: '📊 모니터링', icon: '📈' },
    { id: 'analysis', label: '🔬 정밀 분석', icon: '📉' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* 헤더 */}
      <header style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
            📡 WiFi 데이터 아카이브
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
            WiFi 측정 데이터를 관리하고 분석합니다 (v3.0)
          </p>
        </div>
      </header>

      {/* 탭 메뉴 */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 0.5rem',
                  borderBottom: activeTab === tab.id ? '3px solid #1e40af' : '3px solid transparent',
                  color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 필터 (데이터 조회/모니터링/정밀분석 탭에서만 표시) */}
      {(activeTab === 'data' || activeTab === 'monitoring' || activeTab === 'analysis') && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          <FilterPanel filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'data' && <DataTab filters={filters} />}
        {activeTab === 'monitoring' && <MonitoringTab filters={filters} />}
        {activeTab === 'analysis' && <AnalysisTab filters={filters} />}
      </main>
    </div>
  );
}
