# 📈 주식 가계부 (Stock Portfolio Copilot SPA)

React + TypeScript + Vite + Tailwind CSS v4 기반으로 동작하는 개인 주식 자산 관리 가계부 단일 페이지 애플리케이션(SPA)입니다. 별도의 백엔드 없이 브라우저 LocalStorage에만 데이터를 보관하여 개인 보안성을 높였으며, 실시간 주가 갱신 및 Gemini API 기반 AI 상담 비서 서비스를 제공합니다.

---

## ⚡ 주요 기능
- **자산 대시보드 (Bento Grid)**: 총 투자 원금, 실시간 평가 자산 가치, 누적 평가 손익 및 수익률을 한눈에 조회합니다.
- **포트폴리오 자산 비중 차트**: Recharts를 활용하여 보유 종목의 평가액 비중을 미래형 네온 컬러 원형 차트로 표현합니다.
- **매수 기록 관리 (CRUD)**: 거래 일자, 종목 정보(티커, 시장 구분), 매수가, 수량, 메모 등을 기록하고 삭제/수정합니다.
- **실시간/수동 시세 갱신**: Finnhub API를 연동하여 실시간 주가를 수집하거나, API 키가 없을 때 직접 주가를 클릭하여 임의 시세를 입력 및 관리합니다.
- **AI 투자 상담사 (Gemini AI)**: `gemini-3-flash-preview` 모델을 탑재하여 현재 사용자의 주식 분산도와 수익률 리스크를 심층 분석하고 피드백을 나눕니다.
- **CSV 데이터 백업 및 복원**: 브라우저 캐시 삭제 시 데이터가 소실되는 LocalStorage의 한계를 보완하기 위해 엑셀 호환 CSV 내보내기/가져오기 기능을 완비했습니다.
- **다크/라이트 모드 (Sleek Glassmorphism)**: 화면 우측 상단 토글로 실시간 전환되는 사이버 핀테크 모드를 제공합니다.

---

## 🎨 디자인 진화 및 프롬프트 히스토리 (AI Prompt History)
나중에 프로젝트의 디자인 및 UI 변경 내역과 의사결정을 트래킹할 수 있도록 기록한 히스토리입니다.

### 1단계: 초기 앱 제작
- **사용자 요구사항**: "React + TS 기반의 주식 가계부 SPA 제작 (LocalStorage, 실시간 시세, Gemini AI 연동)"
- **디자인 적용**: 보편적이고 실용적인 차콜-민트 컬러 톤의 기본 대시보드 레이아웃 구축.

### 2단계: 미니멀 테마 도입 시도
- **사용자 요구사항**: "전체 색상이 너무 촌스러워 심플하고 최신 트랜드로 바꿔"
- **디자인 적용**: 웜 미니멀(Warm Minimal/크림-에보니) 테마 및 톤다운된 노션 파스텔 컬러 차트셋 적용. 

### 3단계: 사이버 핀테크 테마로의 최종 대개편 (현재 적용)
- **사용자 요구사항**: `"아니 디자인을 유행하는 색상과 UI로 변경해 달라고~"`
- **디자인 적용 (Cyber-Fintech Sleek Theme)**:
  - **다크 모드 디폴트 적용**: 깊고 시크한 **리치 다크 스페이스 (#070913)**를 메인 배경색으로 지정하고, 카드 컴포넌트에 **글래스모피즘 아크릴(Glassmorphism) 효과** 및 `border-white/6`의 미세 보더를 주어 고급 하이테크 감성을 부여했습니다.
  - **네온 액센트 컬러 차트**: 원색이나 웜톤 대신 Cyber Indigo, Electric Purple, Neon Emerald, Cyber Rose, Neon Cyan 등 핀테크 차트 특유의 눈에 띄는 네온 8도 컬러로 자산 비중 그래프를 개선했습니다.
  - **고급 타이포그래피**: 숫자 표기의 세련미를 위해 구글 폰트 `Plus Jakarta Sans` 및 `Outfit`을 접목했습니다.
  - **Tailwind v4 버그 대응**: Tailwind v4에서 다크 모드 전환 시 배경색이 풀리는 현상을 해결하기 위해 `index.css` 상단에 `@variant dark (&:where(.dark, .dark *));` 커스텀 Variant 빌드 설정을 주입했습니다.
  - **헤더 테마 퀵스위치**: 설정 페이지까지 진입하지 않아도 바로 다크/라이트 모드를 토글할 수 있게 상단 헤더에 Sun/Moon 스위치를 통합했습니다.

---

## 🛠️ 기술 스택 및 구동 환경
- **Framework**: React 18 / TypeScript 5.x
- **Build Tool**: Vite 6 / Rolldown
- **Styling**: Tailwind CSS v4.0 (Vanilla CSS 기반 테마 커스텀)
- **Database**: Browser LocalStorage
- **Unit Test**: Vitest
