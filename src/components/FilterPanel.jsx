import React from 'react';

export default function FilterPanel({ filters, setFilters }) {
  const uploaders = ['전체', '박준환', '이서연', '김규한', '홍유수', '기타'];
  const locations = ['전체', '학술정보원_4층', 'AI센터_지하1층', '학생회관_5층', '기타'];

  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* 작성자 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            작성자
          </label>
          <select
            value={filters.uploader}
            onChange={(e) => setFilters({ ...filters, uploader: e.target.value })}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
          >
            {uploaders.map(u => (
              <option key={u} value={u === '전체' ? 'all' : u}>{u}</option>
            ))}
          </select>
        </div>

        {/* 장소 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            장소
          </label>
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
          >
            {locations.map(l => (
              <option key={l} value={l === '전체' ? 'all' : l}>{l}</option>
            ))}
          </select>
        </div>

        {/* 시작일 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            시작일
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
          />
        </div>

        {/* 종료일 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            종료일
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>
    </div>
  );
}
