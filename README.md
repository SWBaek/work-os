# WorksOS

WorksOS는 다양한 경로로 유입되는 개인 업무를 빠르게 수집하고, 이를 실행 가능한 Task로 전환한 뒤, 프로젝트 맥락 안에서 관리하는 1인용 업무 운영 시스템입니다.

## 개발 환경 셋업 (Phase 0)

이 프로젝트는 `npm workspaces`를 사용하는 모노레포 구조로 되어 있습니다.

### 요구 사항
- Node.js 20 LTS 이상

### 1. 프로젝트 초기 설정
```bash
# 의존성 설치
npm install
```

### 2. 데이터베이스 초기화 및 시드 데이터 삽입
```bash
# 환경 변수 설정 (.env가 없을 시 복제)
cp apps/server/.env.example apps/server/.env

# DB 마이그레이션 실행 (SQLite DB 생성 및 스키마 적용)
npm run migrate

# 시드 데이터 및 FTS5 가상 테이블/트리거 자동 구축
npm run seed
```

### 3. 개발 서버 실행
```bash
# 루트 디렉토리에서 실행하면 백엔드와 프론트엔드가 동시에 실행됩니다.
npm run dev
```

- **프론트엔드**: [http://localhost:5173](http://localhost:5173)
- **백엔드**: [http://localhost:3080](http://localhost:3080) (Vite의 `/api` 프록시를 통해 접근 가능)

### 모노레포 구조
- `apps/server`: Express + Prisma 백엔드 서버
- `apps/web`: React + Vite 프론트엔드 어플리케이션
- `packages/shared`: 공통 사용되는 타입 및 Zod 스키마
