import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DataTab({ filters }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, [filters]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('uploads')
        .select('*')
        .order('upload_timestamp', { ascending: false });

      // 필터 적용
      if (filters.uploader !== 'all') {
        query = query.eq('uploader', filters.uploader);
      }
      if (filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate + 'T00:00:00Z');
      }
      if (filters.endDate) {
        query = query.lte('end_time', filters.endDate + 'T23:59:59Z');
      }

      const { data, error } = await query;

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('조회 실패:', error);
      alert('❌ 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uploadId, fileName) => {
    if (!window.confirm(`"${fileName}" 파일을 삭제하시겠습니까?\n연결된 모든 측정 데이터도 삭제됩니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      alert('✅ 삭제 완료');
      fetchUploads();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('❌ 삭제 실패: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        🔄 로딩 중...
      </div>
    );
  }

  const totalData = uploads.reduce((sum, u) => sum + u.data_count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 요약 */}
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          검색 결과: <span style={{ fontWeight: '600', color: '#374151' }}>{uploads.length}</span>개 파일, 총 <span style={{ fontWeight: '600', color: '#374151' }}>{totalData}</span>개 데이터
        </p>
      </div>

      {/* 파일 목록 */}
      {uploads.length > 0 ? (
        uploads.map(upload => (
          <div key={upload.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  📄 {upload.file_name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>작성자:</span> {upload.uploader}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>위치:</span> {upload.location}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>데이터:</span> {upload.data_count}개
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>측정 시간:</span><br/>
                    {new Date(upload.start_time).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                <button
                  onClick={() => handleDelete(upload.id, upload.file_name)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', color: '#9ca3af' }}>
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
