import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function UploadTab() {
  const [file, setFile] = useState(null);
  const [uploader, setUploader] = useState('박준환');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const uploaders = ['박준환', '이서연', '김규한', '홍유수', '기타'];

  const processFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.name.endsWith('.csv')) {
      alert('CSV 파일만 선택 가능합니다');
      return;
    }

    setFile(selectedFile);

    // CSV 미리보기
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, i) => {
          obj[header] = values[i];
          return obj;
        }, {});
      });
      setPreview({ headers, data, totalRows: lines.length - 1 });
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload').click();
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (['timestamp', 'rssi', 'link_speed', 'ping_ms', 'ping_loss_rate', 'ping_jitter',
              'wifi_frequency', 'channel_number', 'neighbor_count', 'dns_time', 'latitude', 'longitude'].includes(header)) {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });
      return obj;
    });
  };

  const handleUpload = async () => {
    if (!file || !uploader) {
      alert('파일과 작성자를 선택해주세요');
      return;
    }

    setUploading(true);

    try {
      // CSV 파싱
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert('빈 CSV 파일입니다');
        setUploading(false);
        return;
      }

      // 주요 장소 파악 (floor 컬럼에서 가장 많이 나온 것)
      const floorCounts = {};
      rows.forEach(row => {
        if (row.floor) {
          floorCounts[row.floor] = (floorCounts[row.floor] || 0) + 1;
        }
      });
      const mainLocation = Object.keys(floorCounts).length > 0
        ? Object.entries(floorCounts).sort((a, b) => b[1] - a[1])[0][0]
        : '기타';

      // 시작/종료 시간
      const timestamps = rows.map(r => r.timestamp).filter(t => !isNaN(t));
      const startTime = new Date(Math.min(...timestamps));
      const endTime = new Date(Math.max(...timestamps));

      // 1. uploads 테이블에 메타데이터 저장
      const { data: upload, error: uploadError } = await supabase
        .from('uploads')
        .insert([{
          file_name: file.name,
          uploader: uploader,
          data_count: rows.length,
          location: mainLocation,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        }])
        .select()
        .single();

      if (uploadError) throw uploadError;

      // 2. measurements 테이블에 데이터 저장
      const measurements = rows.map(row => ({
        upload_id: upload.id,
        ...row
      }));

      // 배치로 나누어 삽입 (API 제한 회피)
      const batchSize = 1000;
      for (let i = 0; i < measurements.length; i += batchSize) {
        const batch = measurements.slice(i, i + batchSize);
        const { error: measurementsError } = await supabase
          .from('measurements')
          .insert(batch);

        if (measurementsError) throw measurementsError;
      }

      alert(`✅ 업로드 완료!\n${rows.length}개 데이터가 저장되었습니다.`);
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('❌ 업로드 실패:\n' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 파일 선택 */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div
          style={{ border: '2px dashed #3b82f6', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'background-color 0.2s' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            CSV 파일 선택
          </div>
          <div style={{ color: '#6b7280', marginBottom: '1rem' }}>
            파일을 선택하거나 드래그하세요
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
            style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            파일 선택
          </button>
        </div>
        {file && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
            📄 {file.name}
          </div>
        )}
      </div>

      {/* 미리보기 */}
      {preview && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>📋 미리보기</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            총 <span style={{ fontWeight: '600' }}>{preview.totalRows}</span>개 데이터
          </p>

          {/* 테이블 */}
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr>
                  {preview.headers.slice(0, 8).map(h => (
                    <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    {preview.headers.slice(0, 8).map(h => (
                      <td key={h} style={{ padding: '0.75rem' }}>
                        {typeof row[h] === 'number' ? row[h].toFixed(2) : row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 작성자 선택 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              작성자 선택
            </label>
            <select
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              style={{ width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
            >
              {uploaders.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 업로드 버튼 */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              background: uploading ? '#d1d5db' : '#10b981',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? '🔄 업로드 중...' : '✅ DB에 저장'}
          </button>
        </div>
      )}
    </div>
  );
}
