# 🚀 WiFi 대시보드 배포 가이드

현재 프로젝트는 **Vercel + Supabase** 기반으로 배포되어 있습니다.

---

## 🎯 빠른 배포 (추천!)

### 1. Vercel로 배포하기 (가장 쉬움!) ⭐⭐⭐

#### ✅ 장점
- 완전 무료 (무제한 배포)
- Node.js 서버 자동 제공
- GitHub 연동으로 자동 배포
- HTTPS 자동 지원
- 빌드 로그 및 분석 제공
- 프로덕션 환경 최적화

#### 📋 사전 요구사항
- GitHub 계정
- Vercel 계정 (github.com으로 로그인 가능)
- Supabase 프로젝트 생성됨

#### 🔧 배포 절차

**Step 1: GitHub에 코드 업로드**

```bash
# (이미 git 저장소라면 이 단계 생략)
cd wifi-dashboard
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/wifi-dashboard.git
git branch -M main
git push -u origin main
```

**Step 2: Vercel 연동**

1. https://vercel.com 접속
2. "Sign up with GitHub" 클릭하여 GitHub 계정 연동
3. "New Project" 클릭
4. GitHub 레포지토리 검색 후 선택 (`wifi-dashboard`)
5. 나머지는 기본값으로 진행
6. "Deploy" 클릭

**Step 3: 환경 변수 설정**

배포 후 다음을 설정해야 합니다:

1. Vercel 대시보드 → 프로젝트 선택
2. Settings 탭 클릭
3. Environment Variables 섹션 찾기
4. 다음 두 변수 추가:

```
이름: VITE_SUPABASE_URL
값: https://ouotvvgutfpvqwicimcy.supabase.co

이름: VITE_SUPABASE_ANON_KEY
값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91b3R2dmd1dGZwdnF3aWNpbWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTA3OTIsImV4cCI6MjA4Njg2Njc5Mn0.eEjU3nRRTjB-yucT7SNI2q2aArjpMw_gf8HKpde-3wY
```

5. "Save" 버튼 클릭
6. Deployments 탭 → 최근 배포 → "Redeploy" 클릭

**완료!** 🎉  
배포 URL: `https://wifi-dashboard-xxxxx.vercel.app`

#### 💡 코드 변경 후 자동 배포

이제부터는 코드를 변경하고 GitHub에 푸시하면 자동으로 Vercel에 배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "Add new feature"
git push

# Vercel에서 자동으로 감지하고 배포!
```

---

## 🔄 Vercel 배포 상태 확인

### Vercel 대시보드에서 확인

1. 프로젝트 선택
2. Deployments 탭 클릭
3. 각 배포의 상태 확인:
   - ✅ **Ready**: 배포 완료
   - 🔨 **Building**: 빌드 중
   - ❌ **Failed**: 빌드 실패 → 로그 확인

### 구조

```
wifi-dashboard (프로젝트)
└── Deployments
    ├── [최신] Ready - 2 minutes ago
    ├── [이전] Ready - 1 hour ago
    └── [이전] Failed - 2 hours ago
```

---

## 🌐 다른 배포 옵션

### 2. Netlify로 배포

#### 🎯 장점
- 무료
- 클라이언트 사이드 렌더링 최적화
- 드래그 앤 드롭 배포 가능

#### 📋 배포 절차 (GitHub 연동)

1. https://netlify.com 접속
2. GitHub 계정으로 로그인
3. "New site from Git" 클릭
4. GitHub 선택 → 레포지토리 선택
5. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Environment variables 추가:
   ```
   VITE_SUPABASE_URL = https://ouotvvgutfpvqwicimcy.supabase.co
   VITE_SUPABASE_ANON_KEY = [anon key]
   ```
7. "Deploy site" 클릭

#### 또는 드래그 앤 드롭 배포 (가장 빠름!)

```bash
# 1. 로컬에서 빌드
npm run build

# 2. dist 폴더가 생성됨
```

1. https://app.netlify.com/drop 접속
2. `dist` 폴더를 드래그 앤 드롭
3. **완료!** (이 방법은 환경 변수 불필요)

---

### 3. GitHub Pages로 배포

#### 🎯 장점
- 완전 무료
- GitHub만으로 관리

#### ⚠️ 제한사항
- 정적 페이지만 가능
- Supabase가 서버리스 API를 제공하므로 문제 없음
- 커스텀 도메인 설정 필요

#### 📋 배포 절차

**1. vite.config.js 수정**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/wifi-dashboard/'  // 레포 이름 입력
})
```

**2. package.json 업데이트**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**3. gh-pages 설치**

```bash
npm install --save-dev gh-pages
```

**4. 배포**

```bash
npm run deploy
```

**5. GitHub 설정**

1. 레포지토리 → Settings
2. Pages 섹션
3. Source: `gh-pages` 브랜치 선택
4. Save

**URL:** `https://your-username.github.io/wifi-dashboard/`

---

## 🔧 로컬 개발 환경

### 개발 서버 실행

```bash
# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 열기
# http://localhost:5173
```

### 프로덕션 빌드 테스트

```bash
# 빌드
npm run build

# 빌드된 결과 미리보기
npm run preview
```

---

## 📦 프로젝트 구조 및 배포 파일

```
wifi-dashboard/
├── src/                    # 소스 코드
├── dist/                   # 빌드 결과 (배포 시 이 폴더 업로드)
├── package.json            # 의존성 정보
├── vite.config.js          # Vite 설정
├── index.html              # 진입점 HTML
├── .env.local              # 로컬 환경 변수 (Git 무시)
└── .gitignore              # Git 무시 파일
```

### Vercel에서 배포할 때

```
Vercel 자동 감지:
1. package.json 읽음
2. npm install 자동 실행
3. npm run build 자동 실행
4. dist 폴더 배포
```

---

## 🔐 환경 변수 관리

### ✅ 올바른 방법

```
로컬: .env.local 파일 사용 (Git 무시)
배포: Vercel/Netlify 대시보드에서 설정
```

### ❌ 위험한 방법

```
Git에 .env.local 커밋 (보안 취약!)
코드에 하드코딩 (배포 후 노출!))
```

### .env.local 예시

```env
VITE_SUPABASE_URL=https://ouotvvgutfpvqwicimcy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Vercel에서 설정 방법

1. Project Settings → Environment Variables
2. 변수 추가
3. Development, Preview, Production 분리 가능

---

## 🎯 배포 후 체크리스트

- [ ] URL 접속 가능한지 확인
- [ ] Supabase 연결 확인 (데이터 조회 탭에서 데이터 보임)
- [ ] 파일 업로드 테스트
- [ ] 차트 렌더링 확인
- [ ] 필터 기능 테스트
- [ ] 모바일 반응형 확인

### 문제 해결

**화면이 보이지만 데이터 없음**
```
→ Vercel 환경 변수 확인
→ Deployment Redeploy 클릭
```

**빌드 실패**
```
→ Deployments 탭에서 로그 확인
→ 로컬에서 npm run build 테스트
→ package.json 의존성 확인
```

**차트가 안 나타남**
```
→ 브라우저 개발자 도구 Console 탭 확인
→ Supabase 연결 상태 확인
→ 네트워크 탭에서 요청 확인
```

---

## 💡 팁

### Vercel에서 빌드 속도 최적화

```
Settings → Build & Development
- Ignored Build Step으로 필요 없는 빌드 스킵
```

### 커스텀 도메인 연결

**Vercel:**
1. Settings → Domains
2. 도메인 추가
3. DNS 레코드 설정 (Vercel이 안내)

**Netlify:**
1. Site settings → Domain management
2. Add custom domain
3. DNS 설정

---

## 📊 배포 상태 모니터링

### Vercel Analytics

```
프로젝트 → Analytics 탭
- 방문자 수
- 빌드 시간
- 성능 메트릭
```

### Vercel 속도 최적화

```
Settings → Performance
- Image Optimization
- Web Vitals 모니터링
```

---

## 🔄 롤백 (이전 버전으로 되돌리기)

### Vercel에서

1. Deployments 탭
2. 이전 배포 선택
3. "Promote to Production" 클릭

### Git에서

```bash
# 최근 커밋 취소
git reset --soft HEAD~1

# 또는 특정 커밋으로 돌아가기
git reset --hard <commit-hash>
git push --force
```

---

## 🚀 자동 배포 파이프라인

```
로컬 개발 → Git Push → Vercel 자동 감지 →
빌드 (npm run build) → 테스트 → 배포
```

**결과:** 클릭 한 번 없이 자동 배포! 🎉

---

## 📝 배포 히스토리 확인

### Vercel

```
Deployments 탭에서 모든 배포 이력 확인:
- 시간
- 커밋 메시지
- 빌드 로그
- 배포 상태
```

### GitHub

```
Commits에서 코드 변경 이력 확인:
- 커밋 메시지
- 변경된 파일
- 작성자 및 시간
```

---

## 🎓 추가 학습 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [Supabase 문서](https://supabase.com/docs)
- [React 배포 가이드](https://react.dev/learn/deployment)

---

**Last Updated:** 2026-02-17  
**Recommended Deployment:** Vercel + GitHub
