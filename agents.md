# WorksOS — AI Agent Instructions

> 이 문서는 매 실행마다 읽히는 핵심 컨텍스트입니다. 상세 규칙은 Skills를 참조하세요.

---

## 1. 프로젝트 개요

- **제품명**: WorksOS — 1인용 업무 운영 시스템
- **핵심 흐름**: `Inbox(수집) → Task(실행) → Project(맥락) → Kanban(시각화) → Meeting Notes → Decisions → Tags & Search`
- **배포**: 사내망 한정 (Single Host, 외부 인터넷 노출 없음)
- **인증**: 없음 (단일 사용자)
- **계획서**: `docs/WorksOS-Product-Plan-v2.md` — 이것이 **단일 원천(Single Source of Truth)**

---

## 2. 기술 스택 (변경 금지)

| 영역 | 기술 |
|---|---|
| **백엔드** | Node.js 20 + Express 4 + Prisma 5 + SQLite + Zod + Winston |
| **프론트엔드** | React 18 + TypeScript + Vite 5 + shadcn/ui + Tailwind + Zustand + TanStack Query |
| **기타** | dnd-kit (칸반), TipTap (에디터), date-fns, lucide-react |
| **배포** | Docker + Docker Compose 또는 PM2 |

> 기술 스택 변경이 필요하면 반드시 사용자에게 사유를 설명하고 승인을 받으세요.

---

## 3. Phase 관리 (필수)

- **Phase 파일**: `plan/phase_0.json` ~ `plan/phase_7.json`
- **의존성 순서**: Phase 0 → 1 → {2, 3} → 4 → 5 → 6 → 7
- **상태값**: `not_started` | `in_progress` | `completed` | `blocked` | `skipped`
- Task 시작 시 → status를 `in_progress`로 변경
- Task 완료 시 → status를 `completed`로 변경 + `progress_summary` 업데이트
- 의존 Phase가 `completed`되기 전에 다음 Phase를 시작하지 마세요

> 상세 절차는 **phase-workflow** Skill 참조

---

## 4. 절대 하지 말아야 할 것

### MVP 제외 기능 — 구현 금지
- ❌ 다중 사용자, 권한 관리, 댓글, 멘션
- ❌ 외부 API 자동 연동 (Teams/Jira/Email)
- ❌ 간트차트, 리소스/비용 관리
- ❌ 모바일 네이티브 앱, AI 자동 분류/요약
- ❌ 회의록 → Decision 자동 추출
- ❌ 외부 인터넷 접속, 클라우드 동기화

### 기술적 Anti-Patterns
- ❌ 서버 데이터를 Zustand에 캐싱 (TanStack Query 사용)
- ❌ `any` 타입 사용
- ❌ raw SQL 직접 실행 (FTS5 제외)
- ❌ 불필요한 추상화 레이어 추가
- ❌ 기능 범위 임의 확장 (scope creep)

---

## 5. 작업 시작 체크리스트

1. ✅ 해당 Phase JSON을 읽고 Task 목록 확인
2. ✅ 의존 Phase가 `completed` 상태인지 확인
3. ✅ 계획서의 해당 섹션 참조
4. ✅ Task status를 `in_progress`로 변경
5. ✅ 완료 시 status를 `completed`로 변경 + progress_summary 업데이트

---

## 6. 참조 Skills

| Skill | 언제 참조 |
|---|---|
| **coding-standards** | 코드 작성, 리뷰, 리팩토링 시 (아키텍처, API 규칙, 네이밍, 보안, 프로젝트 구조) |
| **phase-workflow** | Phase/Task 상태 관리, 시작/완료 절차, 의존성 확인 |
| **ui-design-guide** | UI 컴포넌트/페이지 구현 시 (레이아웃, NFR, 다크모드, i18n) |
| **karpathy-guidelines** | 코드 작성 시 LLM 실수 방지 (과도한 복잡성, 불필요한 변경 방지) |
