# 스팀다리미 — Frontend

> Steam 게임 가격 추적 & 할인 알림 서비스 (프론트엔드)

## 기술 스택

- React

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
