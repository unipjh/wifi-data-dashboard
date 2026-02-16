# WiFi 대시보드 배포 가이드

## 🚀 배포 방법 총정리

---

## 1️⃣ Vercel (가장 쉬움!) ⭐⭐⭐

### 장점
- ✅ 완전 무료
- ✅ 클릭 3번이면 끝
- ✅ 자동 HTTPS
- ✅ 빌드 자동화
- ✅ GitHub 연동

### 배포 절차

#### A. GitHub 업로드 먼저
```bash
# 1. GitHub에서 새 레포지토리 생성
#    이름: wifi-dashboard

# 2. 로컬에서 초기화
cd wifi-dashboard
git init
git add .
git commit -m "Initial commit"

# 3. GitHub에 푸시
git remote add origin https://github.com/your-username/wifi-dashboard.git
git branch -M main
git push -u origin main
```

#### B. Vercel 배포
1. https://vercel.com 접속
2. "Sign up with GitHub" (GitHub 계정 연동)
3. "New Project" 클릭
4. GitHub 레포지토리 선택 (`wifi-dashboard`)
5. "Deploy" 클릭
6. **완료!** 🎉

**결과:**
- URL: `https://wifi-dashboard-xxxxx.vercel.app`
- 코드 푸시하면 자동 재배포!

---

## 2️⃣ Netlify (Vercel 대안)

### 장점
- ✅ 무료
- ✅ 드래그 앤 드롭 배포 가능
- ✅ 커스텀 도메인

### 배포 절차

#### 방법 A: 드래그 앤 드롭 (가장 간단!)
```bash
# 1. 빌드
npm install
npm run build

# 2. dist 폴더 생성됨
```

1. https://netlify.com 접속
2. 로그인
3. "Sites" → 드래그 앤 드롭 영역에 `dist` 폴더 드롭
4. **완료!**

#### 방법 B: GitHub 연동
1. https://netlify.com 접속
2. "New site from Git"
3. GitHub 선택
4. 레포지토리 선택
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Deploy

---

## 3️⃣ GitHub Pages

### 장점
- ✅ 완전 무료
- ✅ GitHub 계정만 있으면 됨

### 배포 절차

#### 1. vite.config.js 수정
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/wifi-dashboard/'  // 레포지토리 이름
})
```

#### 2. package.json에 스크립트 추가
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### 3. gh-pages 설치 및 배포
```bash
npm install --save-dev gh-pages
npm run deploy
```

#### 4. GitHub 설정
1. 레포지토리 → Settings → Pages
2. Source: `gh-pages` 브랜치 선택
3. Save

**결과:**
- URL: `https://your-username.github.io/wifi-dashboard/`

---

## 4️⃣ 로컬에서 실행 (개발용)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저 열기
# http://localhost:5173
```

---

## 🎯 추천 순서

### 빠른 테스트용:
1. **Netlify 드래그 앤 드롭** (5분)
   - 빌드 후 dist 폴더만 업로드

### 장기 운영용:
1. **Vercel + GitHub** (10분)
   - 코드 푸시만 하면 자동 배포
   - 가장 전문적

### 무료 호스팅:
1. **GitHub Pages** (15분)
   - 설정 조금 복잡하지만 완전 무료

---

## 📦 프로젝트 구조

```
wifi-dashboard/
├── src/
│   ├── App.jsx          # 메인 컴포넌트
│   └── main.jsx         # 진입점
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 커스텀 도메인 연결 (선택)

### Vercel
1. 도메인 구매 (GoDaddy, Namecheap 등)
2. Vercel 프로젝트 → Settings → Domains
3. 도메인 입력
4. DNS 설정 (Vercel이 안내)

### Netlify
1. Site settings → Domain management
2. Add custom domain
3. DNS 설정

---

## 🎉 배포 후 확인사항

- [ ] URL 접속 확인
- [ ] CSV 업로드 테스트
- [ ] 차트 렌더링 확인
- [ ] 모바일 반응형 확인

---

## 💡 팁

### 빌드 확인
```bash
npm run build
npm run preview  # 빌드 결과 미리보기
```

### 문제 해결
- **빌드 실패**: `node_modules` 삭제 후 `npm install` 재시도
- **차트 안 보임**: Recharts 설치 확인 `npm install recharts`
- **404 에러**: vite.config.js의 base 경로 확인

---

## 🚀 가장 빠른 방법 요약

```bash
# 1단계: 빌드
npm install
npm run build

# 2단계: Netlify Drop
# → https://app.netlify.com/drop
# → dist 폴더 드래그

# 완료! 🎉
```

또는

```bash
# 1단계: GitHub 푸시
git init
git add .
git commit -m "Deploy"
git push

# 2단계: Vercel 연동
# → https://vercel.com
# → Import Git Repository

# 완료! 🎉
```
