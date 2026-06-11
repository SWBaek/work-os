# WorksOS 유료 사용자 워크플로우 평가 보고서

작성일: 2026-06-10  
관점: 소프트웨어 품질 평가자 + 월 $100를 내는 실제 1인 업무 사용자  
검증 범위: Phase 0-4 현재 구현, 로컬 개발 서버, API 실제 호출, UI 코드/문구 확인

## 결론

현재 상태로는 월 $100 결제 유지 불가.

핵심 이유는 단순하다. WorksOS의 약속은 "흩어진 업무를 빠르게 수집하고, Task/Project/회의록/결정/검색으로 다시 찾게 해주는 1인 업무 OS"인데, 지금 구현은 Inbox -> Task -> Project -> Kanban -> Meeting Notes 일부 흐름만 최소 동작한다. 실제 돈을 내는 사용자 입장에서는 "기록은 넣을 수 있는데, 나중에 믿고 찾고 운영하기 어렵다"가 체감이다.

현재 적정 지불 의사는 월 $0-10 수준이다. 내부 베타나 개발 검증용으로는 가치가 있다. 개인 업무를 맡기는 유료 도구로는 아직 부족하다.

## 검증 환경

- Backend: `http://localhost:3080/api/v1`
- Frontend: `http://localhost:5173`
- `http://127.0.0.1:5173` 접속은 실패했고, `http://localhost:5173`만 성공했다.
- 검증 명령:
  - `npm.cmd run lint` 통과
  - `npm.cmd test` 통과, server test 3 files / 8 tests
  - `npm.cmd run build` 통과, 단 Vite chunk warning: JS 808.46 kB / gzip 251.64 kB

## 실제 사용자 시나리오

### 시나리오 1. 오전 업무 수집: Teams 요청을 Quick Inbox에 넣기

상황: 오전에 Teams로 "고객사 데모 전까지 검색 결과에서 회의록도 보이게 점검" 요청을 받았다. 나는 바로 Dashboard에서 Inbox로 수집하고, 나중에 놓치지 않게 Project와 tag를 붙이고 싶다.

실행:

- Project 생성: 성공
- Inbox item 생성: 성공
- Inbox item -> Task 변환: 성공
- 변환 후 Inbox 상태: `Converted`
- 생성 Task 상태: `Open`

체감:

- API 기준 핵심 저장 흐름은 된다.
- Project 연결도 된다.
- 하지만 UI 문구가 곳곳에서 깨져 있으면 수집 순간 신뢰가 크게 떨어진다. "내 중요한 업무 원문이 나중에 깨질 수 있나?"라는 불안이 생긴다.
- Dashboard Quick Inbox는 빠른 입력용인데 폼이 여러 칸으로 나뉘어 있어 실제 "생각 없이 던져넣기"보다 "작은 CRUD 폼 작성"에 가깝다.

평가: 베타로는 OK. 월 $100 제품 첫 화면으로는 미흡.

### 시나리오 2. 오늘 할 일 확인: Today / Overdue / Waiting

상황: 점심 전 오늘 해야 할 일, 이미 지난 일, 남의 답변을 기다리는 일을 한 화면에서 보고 싶다.

실행 결과:

- `GET /dashboard/summary` 정상 동작
- 실제 생성 데이터 반영:
  - today: 2
  - overdue: 1
  - waiting: 1
- Kanban project scope 결과:
  - `Open:2, In Progress:0, Waiting:1, Hold:0, Done:0, Archived:0, Canceled:0`

체감:

- 업무 운영판의 뼈대는 있다.
- Waiting/Overdue가 별도 목록으로 잡히는 것은 좋다.
- 하지만 Task detail 화면이 실질적으로 없다. Task card 클릭 경로는 `/tasks/:id`인데 같은 Tasks 목록 컴포넌트만 렌더링한다. "왜 이 일이 생겼는지, 원문 Inbox, 회의록, 관련 링크"를 한 번에 보는 작업 맥락이 없다.
- 오늘 일을 보고 다음 행동을 정하려면 task 편집, 상태 변경, project context 확인이 자연스러워야 하는데 아직 목록 중심이다.

평가: 개인 TODO 보드 초안 수준. 운영 시스템으로는 부족.

### 시나리오 3. 프로젝트 맥락 확인

상황: 고객사 데모 프로젝트에서 관련 Task, Link, Meeting Note를 보고 회의 준비를 하려 한다.

확인:

- Project CRUD/API 정상.
- Project Detail은 6개 탭 구조가 있음.
- Tasks/Kanban/Links 일부는 동작.
- Meeting Notes는 Project 하위 route로 진입.
- Decisions 탭은 placeholder 수준.

체감:

- "Project가 업무 맥락의 중심"이라는 제품 의도는 보인다.
- 하지만 Project Overview가 의사결정/회의/작업 흐름을 요약해주는 수준이 약하다.
- Decisions가 아직 비어 있어 "왜 이렇게 하기로 했지?"라는 실제 질문에 답하지 못한다.
- Project 카드/seed 데이터가 `Project 1`, `Task 1` 같은 개발 더미라 실제 사용 감각 검증이 어렵다.

평가: 구조는 맞음. 실제 업무 기억 저장소로는 아직 얕음.

### 시나리오 4. 회의록 작성, HTML Export, Action Item -> Task

상황: 고객사 데모 회의 후 회의록을 남기고, action item을 task로 만들고, HTML로 export해 사내 시스템에 붙여넣고 싶다.

실행:

- MeetingNote 생성: 성공
- Markdown 내용 저장: 성공
- HTML Export: HTTP 200
- Export HTML에 `<h1>` 포함: true
- Export HTML에 `<script>` 포함 여부: false
- Action item -> Task 생성: 성공
- MeetingNote related_tasks count: 1

체감:

- Phase 3 핵심 기능은 API 기준 동작한다.
- HTML export가 inline CSS 포함 파일로 나오는 점은 업무에 쓸 수 있다.
- Action item -> Task 연결도 제품 약속에 맞는다.

큰 문제:

- Export 구현은 `markdown-it` + DOMPurify가 아니라 서버 내 수제 Markdown renderer다. Phase/task 설명과 구현이 다르다.
- 수제 renderer는 표, 링크, nested list, code block 등 회의록에서 자주 쓰는 Markdown을 충분히 처리하지 못한다.
- UI의 Meeting Note placeholder 일부가 깨져 있다.
- 자동 저장 요구가 Phase note에 있지만 실제 구현은 blur/수동 저장 중심으로 보인다.

평가: 유용한 싹은 있음. 회의록을 장기 지식 자산으로 맡기기에는 export/renderer 신뢰 부족.

### 시나리오 5. 과거 자료 찾기: Search

상황: "demo"나 고객사 키워드로 과거 task, inbox, meeting note, decision을 찾고 싶다.

실행:

- `GET /api/v1/search?q=demo&type=all`
- 결과: 404
- Phase 4 상태: `not_started`
- UI `/search`: placeholder

체감:

- 유료 사용 불가를 결정하는 가장 큰 결함이다.
- WorksOS는 "기억 대신 기록"이 핵심인데, 검색이 없으면 기록은 쌓일수록 부채가 된다.
- 회의록과 결정사항이 많아질수록 검색 부재는 치명적이다.

평가: 월 $100 제품으로는 blocking issue.

### 시나리오 6. 결정사항 관리

상황: 회의에서 "이번 데모 범위는 검색 제외" 같은 결정을 남기고 나중에 확인하고 싶다.

확인:

- Server route에 `/decisions` CRUD 없음.
- UI `/decisions`는 placeholder.
- Product plan에는 Decisions가 핵심 흐름에 포함됨.

체감:

- 현재 WorksOS는 "결정 근거 저장소"로 기능하지 못한다.
- Task와 Meeting Note는 있어도 "최종 결정"이 독립 엔티티로 관리되지 않으면 프로젝트 히스토리 추적 가치가 작다.

평가: 개인 업무 OS라기보다 task board + note prototype.

### 시나리오 7. 설정 변경: Dashboard Kanban column 조절

상황: Dashboard에서는 Open/In Progress/Waiting만 보고 싶다.

실행:

- `PATCH /settings`로 `dashboard_visible_statuses` 변경 성공
- 응답: `Open,In Progress,Waiting`

체감:

- 사용자 맞춤 Kanban column은 잘 맞는 방향이다.
- 단 Settings 화면 문구가 심하게 깨져 있다. 설정은 사용자가 제품을 신뢰해야 하는 화면인데, 지금은 내부 테스트 화면처럼 보인다.

평가: API는 OK. UI 품질은 낮음.

### 시나리오 8. 장애/백업/복구 신뢰

상황: 월 $100를 내고 내 업무 DB를 맡긴다. PC 고장, DB 손상, 실수 삭제가 걱정된다.

확인:

- Product plan에는 Backup/Restore/JSON Export가 있음.
- 현재 server route에 `/backup/now`, `/backup/list`, `/backup/restore`, `/export/json` 없음.
- UI에도 실질적인 Backup/Restore 화면 없음.

체감:

- 로컬-first 제품에서 백업은 부가 기능이 아니라 신뢰의 핵심이다.
- 지금 상태로는 중요한 업무를 장기간 넣기 어렵다.

평가: 유료 전환 blocking issue.

## 주요 발견 사항

### P0. Search 없음

근거:

- `/api/v1/search?q=demo&type=all` 404
- Phase 4 `not_started`
- UI Search placeholder

영향:

- 과거 업무, 회의록, 결정사항 회수 불가.
- 제품 핵심 가치인 "Evidence over Memory"가 무너짐.

월 $100 관점:

- 이 상태면 결제 안 함.

### P0. Decisions 없음

근거:

- Server route에 Decisions CRUD 없음.
- UI Decisions는 placeholder.

영향:

- 회의록은 남겨도 결정의 타임라인과 근거를 독립적으로 관리할 수 없음.
- 프로젝트 리뷰 때 "언제 누가 왜 결정했나" 답 불가.

월 $100 관점:

- 업무 OS 핵심 축 하나가 비어 있음.

### P0. Backup/Restore 없음

근거:

- Backup API route 없음.
- JSON Export route 없음.
- Settings에 백업 운영 화면 없음.

영향:

- 로컬 SQLite 제품에서 데이터 손실 리스크 큼.
- 장기 사용 신뢰 형성 불가.

월 $100 관점:

- 개인 업무 DB를 맡기기 어렵다.

### P1. UI 한글 문구 깨짐

근거:

- `apps/web/src/lib/i18n/ko.json`에 mojibake 다수.
- Settings, Dashboard, Meeting Note 관련 문구도 깨짐.
- Product plan/phase json도 터미널 출력상 깨짐이 심함. 파일 인코딩 자체 검증 필요.

영향:

- 사용자는 "내 데이터도 깨질 수 있다"고 느낀다.
- 한국어 MVP 요구와 정면 충돌.

월 $100 관점:

- 첫 3분 안에 이탈.

### P1. Task 상세/편집 UX 부족

근거:

- `/tasks/:id` route가 별도 detail이 아니라 `<Tasks />`를 렌더링.
- TaskCard는 detail link를 제공하지만 실제 상세 맥락 화면 없음.

영향:

- Task의 원문 Inbox, 관련 회의록, 링크, 이력 확인이 어렵다.
- 목록에서 "운영"은 가능해도 "맥락 회수"는 약하다.

월 $100 관점:

- Todo 앱보다 비싼 값을 설명하기 어렵다.

### P1. Meeting HTML Export 구현 신뢰 부족

근거:

- Phase/task는 `markdown-it` + `DOMPurify`를 요구하지만 route는 수제 renderer + escaping 사용.
- 기본 heading/list/checkbox 정도만 처리.

영향:

- 실제 회의록에서 table, link, nested list, code block, quote 손실 가능.
- Export 결과가 사내 시스템 업로드용으로 충분히 예측 가능하지 않다.

월 $100 관점:

- "중요 회의록 export" 용도로 불안.

### P1. 127.0.0.1 접속 불안정

근거:

- `http://localhost:5173`는 200.
- `http://127.0.0.1:5173`는 접속 실패.
- Vite는 `Local: http://localhost:5173/`로만 노출.

영향:

- AGENTS 지시의 고정 포트 운영과 사용자 안내가 흔들림.
- 회사 PC/브라우저/보안 정책에 따라 접속 안내가 혼란스러울 수 있음.

월 $100 관점:

- 설치/운영 신뢰를 깎음.

### P2. Dashboard 정보 구조는 좋지만 아직 업무 지휘실 아님

좋은 점:

- Quick Inbox, Unprocessed Inbox, Today/Overdue/Waiting, Kanban이 한 화면에 있음.
- Dashboard visible statuses 설정이 동작.

부족:

- Quick Inbox는 빠른 capture라기보다 작은 form.
- Today/Overdue/Waiting task에서 바로 상태 변경/우선순위 변경/프로젝트 이동이 제한적.
- "오늘 무엇부터 해야 하나" 추천은 MVP 범위 밖이라도, 정렬/필터/집중 view는 필요.

### P2. Design 기준 일부 준수, 일부 불안

좋은 점:

- neutral surface, LG Red active/primary 중심 사용 방향은 맞음.
- Sidebar와 card 스타일은 대체로 차분함.

부족:

- 깨진 한글 때문에 visual quality가 크게 낮아짐.
- 일부 layout은 고정 grid라 좁은 desktop에서 overflow 가능성이 높음.
- Product title이 browser title에서 `web`으로 남아 있음.

## 월 $100 가치 판단

내가 실제 사용자라면 지금은 다음처럼 판단한다.

- 무료 내부 alpha: 써볼 수 있음.
- 월 $10 개인 실험 도구: 조건부 가능.
- 월 $30 업무 보조 도구: 검색/결정/백업 전까지 보류.
- 월 $100 업무 운영 시스템: 불가.

월 $100을 받으려면 최소 조건:

1. Search/Tags 완료. 회의록 본문 검색 필수.
2. Decisions CRUD + Project/MeetingNote 연결 완료.
3. Backup/Restore/JSON Export 완료.
4. 한국어 문구/인코딩 전면 복구.
5. Task detail/edit 화면 완성.
6. Meeting export를 실제 Markdown parser + sanitizer로 교체.
7. E2E 시나리오 8.1-8.7 자동화.

## 좋은 점

- 데이터 모델 방향은 제품계획과 대체로 일치한다.
- Inbox -> Task -> Project -> Kanban API 흐름은 살아 있다.
- Dashboard의 Today/Overdue/Waiting 분리는 실제 업무에 맞다.
- Meeting Note -> Action Item -> Task 연결은 제품 차별점이 될 수 있다.
- `lint`, `test`, `build`가 통과한다. 현재 개발 품질 baseline은 회복됨.

## 나쁜 점

- 완성된 제품처럼 보이지만 핵심 module 3개(Search, Decisions, Backup)가 없다.
- 한국어 UI가 깨져 신뢰가 크게 무너진다.
- Phase 3 완료 표시와 실제 구현 품질 사이 gap이 있다. 기능이 "있다"와 "돈 받고 쓸 수 있다"는 다르다.
- Product plan은 완성형을 말하지만 현재 seed/UI는 prototype 냄새가 강하다.
- 실제 사용자의 장기 데이터 보호 시나리오가 아직 없다.

## 우선순위 제안

### 1순위: 신뢰 복구

- 모든 한글 i18n/phase/product docs 인코딩 점검.
- UI에서 깨진 문구 0개 만들기.
- Browser title `WorksOS`로 변경.
- Backup/JSON Export 먼저 제공.

### 2순위: 회수 가치 완성

- `/api/v1/search` 구현.
- `/search` 화면 구현.
- MeetingNote markdown_content FTS 동기화 검증.
- 검색 결과에서 task/inbox/note/decision/project/link 타입별 이동 제공.

### 3순위: 결정/맥락 완성

- Decisions CRUD API/UI 구현.
- Project Detail Overview에 최근 decision, open action item, waiting blocker 노출.
- Task detail 화면에서 source inbox, project, meeting notes, decisions, links를 한 화면에 표시.

### 4순위: 회의록 품질 강화

- `markdown-it` + 서버 sanitizer로 export 교체.
- table/link/code block/blockquote/nested list export test 추가.
- Action item 변환 시 중복 task 감지.
- 변환 완료 표시가 title 문자열 비교에 의존하지 않게 action item id 또는 mapping 저장.

## 최종 점수

- 제품 방향: 8/10
- 현재 구현 완성도: 4/10
- 실제 업무 적합성: 4/10
- 데이터 신뢰성: 3/10
- UI 신뢰감: 3/10
- 월 $100 지불 의사: 1/10

한 줄 평가:

> WorksOS는 방향이 좋은 개인 업무 OS prototype이다. 하지만 지금 돈을 받고 쓰게 하면 사용자는 "기록은 넣었는데 찾을 수 없고, 백업도 없고, 화면 글자도 깨지는 도구"로 기억할 가능성이 크다.
