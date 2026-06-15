# banking-app

간단한 은행 계좌 관리 웹 애플리케이션입니다. 회원가입/로그인 후 계좌를 개설하고, 입금·출금·계좌 간 이체를 할 수 있습니다.

## 기술 스택

### Backend
- Node.js, Express
- TypeScript
- Prisma (SQLite)
- JWT 인증, bcrypt 비밀번호 해싱

### Frontend
- React, Vite
- TypeScript
- React Router
- Zustand (상태 관리)
- Axios

## 주요 기능

- 회원가입 / 로그인 (JWT 기반 인증)
- 계좌 목록 조회 / 상세 조회
- 계좌 개설 / 해지
- 입금, 출금
- 계좌 간 이체

## 프로젝트 구조

```
banking-app/
├── backend/        # Express + Prisma API 서버
│   ├── prisma/     # 스키마, 마이그레이션, 시드 데이터
│   └── src/
│       ├── auth/       # 인증 (회원가입, 로그인, 프로필)
│       ├── account/    # 계좌 (조회, 입출금, 이체)
│       ├── middleware/
│       └── utils/
└── frontend/       # React + Vite 클라이언트
    └── src/
        ├── api/
        ├── pages/
        │   ├── auth/
        │   └── accounts/
        └── store/
```

## 시작하기

### 1. 백엔드 실행

```bash
cd backend
npm install
cp .env.example .env   # 필요 시 값 수정
npm run db:generate
npm run db:migrate
npm run dev
```

서버는 기본적으로 `http://localhost:3000` 에서 실행됩니다.

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

클라이언트는 기본적으로 `http://localhost:5173` 에서 실행됩니다.

## API 개요

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/profile` | 내 정보 조회 (인증 필요) |
| GET | `/api/accounts` | 계좌 목록 조회 |
| GET | `/api/accounts/:id` | 계좌 상세 조회 |
| POST | `/api/accounts` | 계좌 개설 |
| DELETE | `/api/accounts/:id` | 계좌 해지 |
| POST | `/api/accounts/:id/deposit` | 입금 |
| POST | `/api/accounts/:id/withdraw` | 출금 |
| POST | `/api/accounts/:id/transfer` | 계좌 이체 |

`/api/accounts` 하위 엔드포인트는 모두 로그인 후 발급받은 JWT가 필요합니다.

## 환경 변수

`backend/.env.example` 참고:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="7d"
PORT=3000
```
