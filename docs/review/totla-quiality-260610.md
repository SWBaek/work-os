# WorksOS Total Quality Review - 2026-06-10

## Executive Summary

**Verdict: 조건부 통과.** 현재 구현은 빌드, 린트, 서버 테스트가 모두 통과하며 Phase 1 핵심 흐름(Inbox -> Task -> Project -> Kanban)은 동작 가능한 상태다. 다만 품질 관점에서는 **기술 스택 drift**, **API 검증 누락**, **프론트 단일 파일 집중**, **Phase 2 계획/구현 불일치**가 다음 단계 전에 정리되어야 한다.

이번 평가는 코드베이스 정적 검사, 주요 파일 리뷰, Phase JSON 확인, 실제 검증 명령 실행 기준이다. 브라우저 시각 검증은 수행하지 않았다.

## Verification

| Check | Result | Note |
| --- | --- | --- |
| `npm.cmd run lint -w web` | Pass | ESLint 오류 없음 |
| `npm.cmd run test -w server` | Pass | 2 files, 5 tests passed |
| `npm.cmd run build` | Pass | shared/server/web 전체 빌드 성공 |
| `any` / `as any` search | Pass | 앱/패키지 코드에서 `any` 미검출 |
| Zustand server cache check | Pass | `apps/web/src/store/index.ts`는 theme UI state만 보관 |

## Top Findings

### P0 - 없음

현재 즉시 빌드/테스트를 깨는 P0 결함은 발견하지 못했다.

### P1 - 승인 없는 기술 스택 drift

`AGENTS.md`는 프론트엔드 스택을 **React 18 + Vite 5 + React Router 6**로 고정한다. 하지만 현재 `apps/web/package.json`은 `react-router-dom@^7.17.0`, `vite@^8.0.12`, `@vitejs/plugin-react@^6.0.1`, `typescript@~6.0.2`, `@types/react@^19.2.14`를 사용한다.

Evidence:
- `apps/web/package.json:22-24`
- `apps/web/package.json:33-45`
- root는 `typescript@^5.6.3`인데 web은 `~6.0.2`라 workspace 내부 TypeScript 버전도 갈라져 있다. `package.json:23`, `apps/web/package.json:43`

Impact:
- 현재는 빌드가 통과하지만, 프로젝트 고정 스택과 다르다.
- React 18 런타임에 React 19 type package를 쓰는 조합은 추후 타입/라이브러리 호환성 리스크가 있다.
- 승인 없는 스택 변경은 이후 문제 원인 추적을 어렵게 만든다.

Recommendation:
- 사용자가 명시 승인한 것이 아니라면 Vite 5, React Router 6, React 18 type package로 되돌리는 작업을 별도 태스크로 잡는다.
- 스택 변경을 유지하려면 `AGENTS.md`와 제품 계획서에 승인 근거를 남긴다.

### P1 - Project update가 sub-project 1단계 규칙을 우회할 수 있음

Project 생성에서는 parent 존재 여부와 1단계 제한을 검증한다. 하지만 수정 API는 `parent_project_id`를 그대로 update에 넣고 동일 검증을 하지 않는다.

Evidence:
- create 검증 있음: `apps/server/src/routes/index.ts:83-93`
- patch 검증 없음: `apps/server/src/routes/index.ts:126-139`

Impact:
- 기존 Project를 update로 다른 sub-project 밑에 붙이면 2단계 이상 구조가 만들어질 수 있다.
- 자기 자신 또는 descendant를 parent로 지정하는 cycle도 방어하지 않는다.
- 제품 규칙 “Sub Project: 1단계만 허용”과 Phase 1 completion intent를 훼손한다.

Recommendation:
- `validateProjectParent(projectId, parentProjectId)` 서비스 함수를 만들고 create/patch에서 같이 사용한다.
- 테스트 추가: parent 미존재, parent가 이미 sub-project인 경우, 자기 자신 parent 지정, descendant cycle.

### P1 - Query parameter 검증이 Zod 경계를 통과하지 않음

body는 Zod로 검증하지만 list API의 `status`, `priority`, `scope`, `project_id`, `sub_project_id` query는 문자열만 확인하고 enum/uuid 검증 없이 Prisma where에 들어간다.

Evidence:
- projects status: `apps/server/src/routes/index.ts:58-67`
- inbox status/project_id: `apps/server/src/routes/index.ts:204-214`
- tasks status/priority/dashboard: `apps/server/src/routes/index.ts:316-330`
- kanban scope/project_id/sub_project_id: `apps/server/src/routes/index.ts:428-432`

Impact:
- 잘못된 enum은 400이 아니라 빈 목록으로 응답한다.
- 잘못된 UUID도 schema가 String이라 대부분 통과한다.
- API 계약과 클라이언트 버그가 조용히 숨는다.

Recommendation:
- shared에 list query schemas를 추가한다.
- `parseQuery(schema, req.query)` 유틸을 추가하고 모든 GET list API에 적용한다.

### P1 - 프론트 구현이 `App.tsx` god file로 집중됨

`apps/web/src/App.tsx`가 901줄이며 Layout, 공통 UI primitive, Dashboard, Projects, ProjectDetail, Inbox, Task, Kanban, DnD 로직이 한 파일에 있다.

Evidence:
- file length: `apps/web/src/App.tsx` = 901 lines
- component concentration: `apps/web/src/App.tsx:119-225`, `263-416`, `418-867`

Impact:
- Phase 2/3/4 변경이 계속 같은 파일을 건드려 merge conflict와 regression 위험이 커진다.
- 컴포넌트 단위 테스트, Storybook/시각 검증, lazy loading이 어려워진다.
- shadcn/ui 기반 원칙과 달리 Button/Input/Select/Badge도 로컬 재구현되어 있다. `apps/web/src/App.tsx:126-161`

Recommendation:
- 기능 변경 없이 파일만 분리하는 후속 리팩터를 작게 진행한다.
- 우선순위: `components/ui-lite`, `layout/AppLayout.tsx`, `pages/dashboard`, `pages/inbox`, `features/kanban`.
- 동작 변경은 금지하고 build/lint로만 검증한다.

### P2 - Dashboard 구현과 Phase 2 계획서가 불일치

사용자는 Dashboard multi-column 금지, Project 진행률/Today/Waiting 카드 제거를 요구했다. 실제 `Dashboard`는 단일 세로 흐름에 가깝게 정리되었지만 `phase_2.json`은 아직 P2-T1에 3열 레이아웃을 완료 기준으로 들고 있다.

Evidence:
- 실제 Dashboard: `apps/web/src/App.tsx:380-416`
- Phase 2 P2-T1은 3열 레이아웃 기준: `plan/phase_2.json:29-38`
- Phase 2 progress summary는 `status: in_progress`인데 `in_progress: 0`, `completed: 2`, `not_started: 7` 상태다. `plan/phase_2.json:6-20`

Impact:
- 앞으로 평가자가 계획서 기준으로 보면 현재 Dashboard가 실패처럼 보일 수 있다.
- 사용자 요구사항이 계획 문서에 반영되지 않아 Phase 관리 신뢰도가 떨어진다.

Recommendation:
- P2-T1 subtasks를 최신 사용자 결정 기준으로 갱신한다.
- `progress_summary`는 실제 task status와 자동/수동으로 일치시킨다.

### P2 - Dashboard data API가 계획과 다르게 클라이언트 조합 방식

Phase 2는 `GET /api/v1/dashboard/summary`, `/dashboard/inbox`, `/dashboard/today`, `/dashboard/overdue`, `/dashboard/waiting`을 계획한다. 현재 Dashboard는 `/inbox?status=Unprocessed&limit=6`, `/tasks?limit=100`, `/kanban`을 클라이언트에서 조합한다.

Evidence:
- Dashboard query: `apps/web/src/App.tsx:380-382`
- dashboard API 검색 결과 없음
- Phase 2 P2-T8는 dashboard API를 not_started로 유지

Impact:
- 데이터가 적을 때는 충분하지만, Task가 늘면 Dashboard가 과다 데이터를 가져온다.
- Today/Waiting 제거 결정 후에도 `WorkOverview`는 `tasks?limit=100` 전체를 받아 카운트한다.

Recommendation:
- 사용자 요구대로 얇은 Overview만 유지할지 확정한다.
- 유지한다면 `/dashboard/summary` 하나만 구현해서 필요한 count만 반환한다.

### P2 - Kanban compact status가 계획/사용자 의도와 다름

Dashboard compact Kanban은 `Open, In Progress, Hold, Done`을 보여준다. Phase 2 기본값은 `Open, In Progress, Waiting`이었고, 최근 사용자 요청은 Dashboard에서 Today/Waiting 카드 제거이지 Waiting 상태 자체 제거는 아니었다.

Evidence:
- compact statuses: `apps/web/src/App.tsx:817-821`
- Phase 2 default visible status: `plan/phase_2.json` P2-T5

Impact:
- 사용자 업무 흐름에서 “Waiting” 컬럼이 사라지고 “Hold/Done”이 Dashboard 공간을 차지한다.
- Dashboard가 현재 진행/대기 중심이 아니라 완료/보류까지 섞인다.

Recommendation:
- Dashboard Kanban을 유지한다면 default compact statuses를 사용자 요구에 맞춰 재결정한다.
- Settings 기반 status 선택(P2-T6)을 하기 전까지는 상수 하나로 명확히 고정한다.

### P2 - API 404/Prisma 에러 정규화가 불완전

일부 PATCH/DELETE는 먼저 existence check를 하지만, Project/Inbox/ProjectLink delete/update 등은 Prisma update/delete 실패가 그대로 errorHandler로 간다.

Evidence:
- project patch/delete: `apps/server/src/routes/index.ts:126-151`
- inbox patch/delete: `apps/server/src/routes/index.ts:252-279`
- error handler는 `err.status || 500`만 본다. `apps/server/src/middleware/errorHandler.ts:4-15`

Impact:
- 존재하지 않는 id에 대해 기대한 404 대신 500/P2025 형태가 나올 수 있다.
- 클라이언트 에러 처리가 route마다 일관되지 않다.

Recommendation:
- `findOrThrow` 또는 Prisma `P2025` -> 404 매핑을 errorHandler에 추가한다.
- route별 수동 existence check 중복을 줄인다.

### P2 - UI 오류 처리가 콘솔 중심

API interceptor는 console.error만 수행하고 화면에는 실패 상태를 표시하지 않는다. Mutation도 대부분 `isError`/toast/inline error 없이 invalidate만 한다.

Evidence:
- `apps/web/src/lib/api.ts:28-44`
- QuickInbox/Convert form mutations: `apps/web/src/App.tsx:263-287`, `718-747`

Impact:
- 저장 실패, convert 실패, status 이동 실패가 사용자에게 조용히 실패처럼 보일 수 있다.
- 단일 사용자 앱이어도 데이터 입력 도구에서 error visibility는 필수다.

Recommendation:
- 최소 inline error 영역 또는 toast를 공통 mutation wrapper에 붙인다.
- Kanban optimistic rollback 시 사용자 피드백을 추가한다.

### P3 - Repo hygiene 문제

루트에 의도치 않은 임시 파일명으로 보이는 `.tmp-web.err.log && echo started`가 있다.

Evidence:
- `git status --short`
- file length 0, name includes shell operator text

Impact:
- 기능 영향은 없지만 잘못된 shell command 흔적으로 보인다.

Recommendation:
- 사용자 변경이 아니라면 별도 cleanup commit에서 제거한다.

## Strengths

- 핵심 서버 검증은 초록이다: test/build/lint 모두 통과.
- Phase 1 핵심 워크플로우는 Supertest 통합 테스트로 실제 DB 경유 검증이 있다.
- `task-status.ts`로 상태 전이 규칙을 분리했고 단위 테스트도 있다.
- 서버 데이터는 TanStack Query가 관리하고 Zustand는 theme UI state에만 사용한다.
- `any` 타입 사용은 발견되지 않았다.
- FTS5 raw SQL은 seed의 FTS setup에 한정되어 있어 프로젝트 예외 규칙 범위 안이다.
- 디자인 토큰은 Tailwind에 꽤 잘 반영되어 있다: Pretendard, LG Red, neutral palette, 10px 계열 radius.

## Recommended Next Actions

1. **Stack drift 결정**
   - Vite 5/React Router 6으로 되돌릴지, 현재 버전을 공식 승인할지 먼저 결정.

2. **P1 correctness fix**
   - Project parent update 검증 추가.
   - GET query Zod 검증 추가.
   - Prisma P2025 -> 404 정규화.

3. **Phase 문서 정렬**
   - `plan/phase_2.json` Dashboard 레이아웃 기준을 최신 사용자 요구로 수정.
   - Phase 2 progress summary와 task status 일치.

4. **Frontend 구조 분리**
   - 동작 변경 없이 `App.tsx`를 페이지/feature/component 단위로 나눈다.
   - 이 리팩터 후 `npm.cmd run lint -w web`, `npm.cmd run build`로만 검증.

5. **UX failure visibility**
   - mutation 실패 시 inline error 또는 toast 추가.
   - 특히 Inbox create/convert, Kanban drag rollback.

## Overall Score

| Area | Score | Rationale |
| --- | ---: | --- |
| Build/Test Health | 8/10 | 모든 기본 검증 통과. 테스트 수는 아직 적음 |
| Backend Correctness | 6/10 | 핵심 흐름 작동. query 검증과 update invariant 누락 |
| Frontend Maintainability | 5/10 | 기능은 있으나 `App.tsx` 집중도가 큼 |
| Product/Phase Alignment | 5/10 | Phase 1 완료, Phase 2 계획/실제 Dashboard 요구 불일치 |
| Standards Compliance | 5/10 | no-any/TanStack는 좋음. stack drift와 layering 위반 있음 |
| UI System Fit | 7/10 | 토큰/톤은 대체로 맞음. shadcn 미사용과 시각 검증 미실시 |

**Final Quality Rating: 6.0 / 10**

현재 상태는 “동작하는 MVP 초안”으로는 충분하다. 다음 Phase를 크게 진행하기 전에 P1 correctness와 stack drift를 먼저 정리해야 이후 변경 비용이 급격히 늘지 않는다.
