# 📡 WiFi 데이터 아카이브 v3.0

WiFi 측정 데이터를 수집, 관리, 분석하는 통합 웹 플랫폼

**🌐 공식 배포 URL:** https://wifi-data-dashboard.vercel.app/

---

## 🎯 주요 기능

### 1️⃣ **파일 업로드** 탭
- CSV 파일 업로드 (드래그앤드롭 지원)
- CSV 데이터 미리보기 (첫 3줄)
- 자동 주요 위치 감지 (floor 컬럼에서 가장 많은 값)
- 작성자 선택 (박준환, 이서연, 김규한, 홍유수, 기타)
- 배치 처리로 대용량 데이터 안정적 저장 (1000개씩)

### 2️⃣ **데이터 조회** 탭
- 필터링된 파일 목록 조회
  - 작성자 필터 (전체/개인)
  - 위치 필터 (학술정보원_4층 등)
  - 날짜 범위 필터
- 파일 삭제 (Cascade: 연관 데이터 자동 삭제)
- 결과 통계 (검색 결과: X개 파일, 총 Y개 데이터)

### 3️⃣ **모니터링** 탭
- 실시간 데이터 모니터링
- 6가지 시계열 차트
  - 📶 RSSI 추이
  - 🌐 Ping 응답 시간
  - ⚡ Link Speed 추이 (V3.0 신규)
  - 📉 Packet Loss Rate
  - ⏱️ Jitter (지터)
  - 🌐 DNS 조회 시간
- 통계 요약 카드 (평균, 최소, 최대값)

### 4️⃣ **정밀 분석** 탭 (신규!)
- **구간별 분포 히스토그램** (7가지 분석)
  - 📊 히스토그램: RSSI, Ping, Link Speed, Loss Rate, Jitter, Channel, 주변 AP
  - 토글식 UI (섹션 열기/닫기)
- **시계열 분석** (준비 중)
- **상관관계 분석** (준비 중)
- **이상치 탐지** (준비 중)

---

## 📊 WiFi 데이터 v3.0 스펙

| 필드 | 설명 | 단위 |
|------|------|------|
| timestamp | 측정 시간 | ms (에포크) |
| rssi | WiFi 신호 강도 | dBm |
| link_speed | 현재 링크 속도 | Mbps |
| ssid | WiFi 네트워크 이름 | - |
| bssid | WiFi AP MAC 주소 | - |
| floor | 측정 층/위치 | - |
| ping_ms | Ping 응답 시간 | ms |
| ping_loss_rate | 패킷 손실률 | % |
| ping_jitter | Ping 지터 | ms |
| wifi_frequency | WiFi 주파수 | MHz |
| channel_number | WiFi 채널 번호 | - |
| neighbor_count | 주변 AP 개수 | 개 |
| dns_time | DNS 조회 시간 | ms |
| latitude | 위도 | ° |
| longitude | 경도 | ° |

---

## 🚀 시작하기

### 로컬 개발 (5분)

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 열기
# http://localhost:5173
```

### Vercel 배포 (10분)

```bash
# 1. GitHub에 푸시
git add .
git commit -m "Deploy to Vercel"
git push

# 2. Vercel 대시보드에서:
# - New Project → GitHub 레포 선택
# - Environment Variables 추가:
#   VITE_SUPABASE_URL = https://ouotvvgutfpvqwicimcy.supabase.co
#   VITE_SUPABASE_ANON_KEY = [your-anon-key]
# - Deploy!
```

---

## 🛠️ 기술 스택

| 항목 | 기술 |
|------|------|
| **프론트엔드** | React 18.2.0 + Vite 5.0.8 |
| **차트** | Recharts 2.10.3 |
| **데이터베이스** | Supabase (PostgreSQL) |
| **배포** | Vercel |
| **스타일링** | Inline CSS (반응형) |

---

## 📁 프로젝트 구조

```
wifi-dashboard/
├── src/
│   ├── components/
│   │   ├── UploadTab.jsx      # 파일 업로드
│   │   ├── DataTab.jsx         # 데이터 조회/삭제
│   │   ├── MonitoringTab.jsx   # 실시간 모니터링
│   │   ├── AnalysisTab.jsx     # 정밀 분석
│   │   └── FilterPanel.jsx     # 공용 필터
│   ├── supabaseClient.js       # Supabase 설정
│   ├── App.jsx                 # 메인 4개 탭
│   └── main.jsx                # 진입점
├── index.html
├── package.json
├── vite.config.js
├── .env.local                  # 환경 변수 (Git 무시)
└── README.md
```

---

## ⚙️ 환경 설정

### `.env.local` (로컬만 사용)

```env
VITE_SUPABASE_URL=https://ouotvvgutfpvqwicimcy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (Supabase Anon Key)
```

**중요:** `.env.local`은 절대 Git에 커밋하지 마세요! (`.gitignore`에 이미 포함됨)

### Vercel 환경 변수 설정

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 두 변수 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deployments 탭에서 최근 배포 Redeploy 클릭

---

## 🔧 빌드 및 배포

```bash
# 개발 서버 (핫 리로드)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# GitHub에 푸시 (자동으로 Vercel 배포)
git push
```

---

## 📝 CSV 파일 포맷

### 예시 헤더

```csv
timestamp,rssi,link_speed,ssid,bssid,floor,ping_ms,ping_loss_rate,ping_jitter,wifi_frequency,channel_number,neighbor_count,dns_time,latitude,longitude
```

### 예시 데이터

```csv
1710000000000,-50,867.0,MyWifi,AA:BB:CC:DD:EE:FF,학술정보원_4층,15.2,0.5,3.1,2400,6,8,22.5,37.2654,127.0849
1710000005000,-52,720.0,MyWifi,AA:BB:CC:DD:EE:FF,학술정보원_4층,16.1,1.0,3.5,2400,6,9,23.1,37.2654,127.0849
```

---

## 🎯 사용 시나리오

### 시나리오 1: 캠퍼스 WiFi 품질 평가
1. **파일 업로드**: 각 위치별 CSV 데이터 업로드
2. **모니터링**: 실시간 RSSI 및 Ping 추이 확인
3. **정밀 분석**: 신호 강도 분포로 커버리지 평가

### 시나리오 2: 네트워크 문제 진단
1. **데이터 조회**: 문제 발생 시간대 필터링
2. **모니터링**: 손실률(Loss), 지터(Jitter) 차트 분석
3. **정밀 분석**: 히스토그램으로 이상치 패턴 파악

### 시나리오 3: 멀티 사용자 협업
1. **각자 업로드**: 서로 다른 위치에서 데이터 수집
2. **공동 분석**: 필터로 특정 작성자/위치 데이터만 선택
3. **비교 분석**: 위치별 네트워크 성능 비교

---

## 🌟 핵심 특징

✅ **다중 사용자 지원** - 작성자별 데이터 관리  
✅ **강력한 필터링** - 작성자, 위치, 날짜 조합 쿼리  
✅ **대용량 데이터** - 배치 처리로 안정적 저장 (1000개씩)  
✅ **실시간 분석** - 필터 변경 시 자동 업데이트  
✅ **캐스케이드 삭제** - 파일 삭제 시 관련 데이터 자동 정리  
✅ **Vercel 자동 배포** - Git push로 즉시 반영  
✅ **드래그앤 드롭** - 편리한 파일 업로드  
✅ **반응형 디자인** - 모바일/태블릿 지원  

---

## 🐛 문제 해결

### "파일이 업로드되지 않음"
- 파일이 CSV 형식인지 확인
- 필터가 '전체'로 설정되어 있는지 확인
- 브라우저 개발자 도구(F12) Console에서 에러 메시지 확인

### "Vercel에 배포되지 않음"
- `.env.local` 변수가 Vercel에 설정되었는지 확인
- Deployments 탭에서 빌드 로그 확인
- `npm run build`로 로컬 빌드 성공 확인

### "차트가 안 보임"
- Supabase 연결 확인 (개발자 도구 Network 탭)
- 필터 조건과 일치하는 데이터 있는지 확인
- 브라우저 캐시 삭제 후 새로고침

---

## 📚 관련 문서

- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [API 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)

---

## 📧 피드백

문제가 발생하거나 기능 제안이 있으면 GitHub Issues에서 보고해주세요!

---

**Last Updated:** 2026-02-17  
**Version:** 3.0.0 (Supabase Backend)
