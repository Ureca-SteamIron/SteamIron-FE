# 스팀다리미 — Frontend

> Steam 게임 가격 추적 & 할인 알림 서비스 (프론트엔드)

## 기술 스택

- **React** 18 (JavaScript / JSX)
- **Vite** 6 — 개발 서버 & 번들러
- Node.js 18+ 권장

## 폴더 구조

백엔드의 도메인 기반 구조(`domain/*`, `global/*`)와 대응되도록 **feature 기반**으로 구성한다.

```
src/
├─ app/         앱 조립 — 라우터, 전역 프로바이더
├─ pages/       라우트 단위 화면 (로그인·메인·상세·내정보)
├─ features/    도메인 기능 (BE domain/* 과 매핑)
│  ├─ auth/         로그인·회원가입
│  ├─ game/         게임 목록·검색·상세·가격
│  ├─ wishlist/     찜
│  ├─ alert/        가격 알림 설정
│  ├─ notification/ 알림 내역
│  ├─ comment/      댓글
│  └─ user/         내 정보
├─ shared/      공용 (BE global/* 과 매핑)
│  ├─ api/          axios 인스턴스·인터셉터
│  ├─ components/   공용 UI 컴포넌트
│  ├─ hooks/        공용 훅
│  ├─ utils/        유틸 함수
│  ├─ constants/    상수
│  └─ styles/       전역 스타일
└─ assets/      이미지·폰트 등 정적 리소스
```

- **features**: BE의 각 도메인(`auth`, `game`, `wishlist`, `alert`, `notification`, `comment`, `user`)과 1:1로 맞춘다. 한 기능 폴더 안에 그 기능의 컴포넌트·API·훅을 모아둔다.
- **pages**: 라우트에 직접 연결되는 화면. 여러 feature를 조합만 하고 로직은 feature에 위임한다.
- **shared**: 특정 도메인에 속하지 않는 공용 코드. BE의 `global/*`에 대응.
- 관리자(`admin`)·배치(`batch`)·크롤러(`crawler`)·디스코드(`discord`)는 백엔드 전용이라 FE에는 없다.

## 시작하기

```bash
# 1. 예시 환경변수 복사
cp .env.example .env
# 2. 의존성 설치 후 실행
npm install
npm run dev
```

> ⚠️ `.env`는 커밋되지 않음. Vite 기준 `VITE_` 접두사 변수는 빌드 결과물에 노출되므로 비밀 값을 넣지 말 것.

## 주요 화면

- 로그인/회원가입 → 메인(Top100 + 나의 찜, 검색/필터) → 상세(가격 차트·히스토리·찜·알림 설정) → 내 정보

## 브랜치 전략

```
main         배포/시연 가능한 안정 버전 (직접 push 금지)
 └ develop   개발 통합 브랜치 ← feat/* 브랜치는 여기서 분기, 여기로 PR
```

자세한 규칙은 [CONVENTIONS.md](CONVENTIONS.md) 참고.

## 커밋 컨벤션

```
feat: 로그인 페이지 UI 구현
fix: 검색 결과 무한스크롤 중복 로드 수정
```
