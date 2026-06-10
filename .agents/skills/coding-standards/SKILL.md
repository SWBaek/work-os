---
name: coding-standards
description: WorksOS 프로젝트의 코딩 표준, 아키텍처 패턴, API 규칙, 보안 규칙. 코드를 작성하거나 리뷰할 때 참조하세요.
---

# WorksOS 코딩 표준 & 아키텍처

코드를 작성, 리뷰, 리팩토링할 때 이 문서를 참조하세요.

---

## 1. 백엔드 아키텍처 패턴

**Controller → Service → Prisma** 3계층 분리를 준수합니다.

| 계층 | 역할 | 예시 |
|---|---|---|
| **Controller** | HTTP 요청/응답 처리, Zod 검증 호출 | `inbox.controller.ts` |
| **Service** | 비즈니스 로직 (상태 전이, 관계 연결) | `inbox.service.ts` |
| **Prisma** | DB 접근 (별도 Repository 추상화 불필요) | Service에서 직접 사용 |

```
// 예시 흐름
Route → Controller (Zod 검증) → Service (비즈니스 로직) → Prisma (DB) → Response
```

---

## 2. API 규칙

- **Base URL**: `/api/v1/`
- **기본 포트**: `3080` (환경변수로 변경 가능)
- **응답 포맷**:
  - 성공 (단일): `{ "data": {...} }`
  - 성공 (목록): `{ "data": [...], "total": N, "page": 1 }`
  - 에러: `{ "error": { "code": "...", "message": "..." } }`
- **타임스탬프**: ISO 8601 (UTC)
- **페이지네이션**: `?page=1&limit=50`
- **삭제**: Soft Delete 권장 (status → Archived 또는 deleted_at)
- **경로 네이밍**: `kebab-case` (예: `/meeting-notes`, `/project-links`)

---

## 3. 프론트엔드 규칙

- **서버 상태**: TanStack Query로만 관리 (Zustand에 서버 데이터 저장 금지)
- **전역 UI 상태**: Zustand (테마, 사이드바 등)
- **UI 컴포넌트**: shadcn/ui 기반, 커스텀 CSS 최소화
- **라우팅**: React Router 6
- **폼**: React Hook Form + Zod
- **Kanban D&D**: dnd-kit + Optimistic UI (드래그 즉시 반영, 서버 동기화 비동기)

---

## 4. 네이밍 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일명 | `kebab-case` | `inbox-item.ts`, `project-detail.tsx` |
| 컴포넌트 | `PascalCase` | `KanbanBoard`, `InboxList` |
| 변수/함수 | `camelCase` | `handleSubmit`, `projectId` |
| DB 필드 | `snake_case` | `created_at`, `source_type` (Prisma @map) |
| API 경로 | `kebab-case` | `/meeting-notes`, `/project-links` |
| ENUM 값 | `PascalCase` | `InProgress`, `OnHold` |

---

## 5. TypeScript 규칙

- **strict 모드** 필수
- `any` 사용 **절대 금지**
- 모든 API 요청/응답에 **Zod 스키마** 적용
- 공유 타입은 `packages/shared`에서 관리

---

## 6. 에러 처리

- 모든 API는 **글로벌 에러 핸들러**를 통해 일관된 에러 응답 반환
- 예상 가능한 에러(404, 400): 명확한 에러 코드 + 메시지
- 예상치 못한 에러(500): Winston 로그 기록, 사용자에게는 일반 메시지

---

## 7. AuditLog

- 모든 엔티티(Project, Task, InboxItem, MeetingNote, Decision)의 **생성/수정/삭제** 시 AuditLog에 자동 기록
- Prisma middleware 또는 서비스 레이어에서 처리
- 기록 필드: `entity_type`, `entity_id`, `action`, `changed_fields`, `timestamp`

---

## 8. 보안 규칙

| 위협 | 방어 |
|---|---|
| **XSS** | React 기본 이스케이프 + DOMPurify (마크다운 렌더링 시) |
| **SQL Injection** | Prisma ORM 사용 (raw SQL 직접 작성 금지, FTS5 제외) |
| **CSRF** | SameSite=Strict 쿠키 |
| **입력 검증** | 모든 API 입력은 Zod로 서버 사이드 검증 |

---

## 9. Git 커밋 규칙

- 1 Task 단위 또는 의미 있는 기능 단위로 커밋
- 커밋 메시지 형식: `[Phase-Task] 설명`
- 예시: `[P1-T3] Inbox CRUD API 구현`

---

## 10. 데이터 모델 핵심

- **9개 엔티티**: Project, ProjectLink, InboxItem, Task, MeetingNote, Decision, Tag, UserSetting, AuditLog
- **Tag는 M:N 관계**: 모든 엔티티에 부여 가능
- **Sub Project**: 1단계만 허용 (parent_project_id self-ref)
- **Task 상태 8단계**: Inbox, Open, In Progress, Waiting, Hold, Done, Archived, Canceled
- **Inbox → Task 전환**: 1:N 가능
- **FTS5 가상 테이블**: task_fts, meeting_note_fts, inbox_fts, decision_fts
- 상세 스키마: `docs/WorksOS-Product-Plan-v2.md` 7장 참조

---

## 11. 프로젝트 디렉토리 구조

```
work-os/
├── apps/
│   ├── server/          # Backend (Express + Prisma)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   ├── utils/
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── web/             # Frontend (React + Vite)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── stores/
│       │   ├── lib/
│       │   └── App.tsx
│       └── package.json
├── packages/
│   └── shared/          # 공유 타입 & Zod 스키마
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   └── utils/
│       └── package.json
├── docs/                # 문서
├── plan/                # Phase별 개발 계획 (phase_0~7.json)
└── package.json         # 루트 (workspace 설정)
```
