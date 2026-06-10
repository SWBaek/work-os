# WorksOS 제품 개발 계획서 (v2.0 — 외주/AI 개발용 완성본)

> 본 문서는 비개발자 기획자가 외주 개발사 또는 AI 코딩 도구(Cursor, Claude Code, GitHub Copilot 등)에 그대로 전달하여 개발을 의뢰할 수 있도록 작성된 **완성형 제품 개발 계획서**입니다.
>
> v1.0 대비 보강된 영역: 시스템 아키텍처, 기술 스택, 데이터베이스 설계 상세, API 명세, 비기능 요구사항, 보안/인증, 배포/운영, 백업/복구, 테스트 전략, 개발 일정, 외주 의뢰 명세.

---

## 0. 문서 정보

| 항목 | 내용 |
|---|---|
| 문서 버전 | v2.0 |
| 작성 목적 | 외주 개발사 의뢰 및 AI 코딩 도구 활용을 위한 완성형 명세 |
| 대상 독자 | 외주 개발사 PM/개발자, AI 코딩 어시스턴트, 기획자 |
| 제품 단계 | MVP 개발 착수 직전 |
| 배포 모델 | **사내망 한정형 (Single Host on Corporate LAN)** |

---

## 1. 제품 개요

### 1.1 제품명

**WorksOS**

### 1.2 제품 정의

WorksOS는 다양한 경로로 유입되는 개인 업무를 빠르게 수집하고, 이를 실행 가능한 Task로 전환한 뒤, 프로젝트 맥락 안에서 Kanban, 회의록, 결정사항, 태그, 검색 기능과 함께 관리하는 **1인용 업무 운영 시스템**이다.

### 1.3 한 줄 설명

> WorksOS는 흩어진 업무 입력을 Inbox에 모으고, Task와 Project로 정리하여 개인의 실행 업무를 누락 없이 관리하는 1인용 Work Operating System이다.

### 1.4 대상 사용자

- 여러 프로젝트를 동시에 수행하는 실무자
- Teams, Email, Jira, Confluence, 구두 지시, 전화 등 다양한 경로로 업무를 받는 사용자
- 프로젝트별 업무, 회의록, 결정사항, 링크를 한 곳에서 관리하고 싶은 사용자
- 업무 누락을 줄이고 오늘 해야 할 일을 명확히 파악하고 싶은 사용자
- 과거 회의 내용과 결정사항을 근거 기반으로 다시 확인해야 하는 사용자

### 1.5 제품 목표

1. 다양한 경로로 들어오는 업무를 빠르게 수집한다.
2. 수집된 업무를 실행 가능한 Task로 전환한다.
3. Task를 Project에 연결하여 프로젝트 맥락 안에서 관리한다.
4. 전체 또는 프로젝트별 Kanban으로 현재 업무 상태를 파악한다.
5. 회의록과 결정사항을 프로젝트에 종속된 기록으로 관리한다.
6. 태그와 검색을 통해 과거 업무, 회의, 결정사항을 빠르게 찾는다.
7. 기능은 최소화하되 개인 업무 수행 흐름은 끊기지 않도록 한다.

### 1.6 [신규] 비목표 (Non-Goals)

명확히 **하지 않을 일**을 정의하여 범위 확대(scope creep)를 방지한다.

- 다중 사용자 협업, 권한 관리, 댓글, 멘션 기능을 제공하지 않는다.
- 외부 시스템(Teams/Jira/Email) 자동 연동 API는 MVP에서 제공하지 않는다 (원문 붙여넣기 방식만 지원).
- 간트차트, 리소스 관리, 비용/공수 관리 기능을 제공하지 않는다.
- 모바일 네이티브 앱은 MVP에서 제공하지 않는다 (모바일 웹 대응도 후순위).
- 클라우드 동기화, 다중 디바이스 실시간 동기화를 제공하지 않는다.

---

## 2. 제품 철학

- **Inbox First (수집 우선)**: 업무가 발생하는 즉시 완벽히 정리할 필요 없이, 다양한 채널에서 유입되는 정보를 빠르게 캡처하는 것을 최우선으로 한다.
- **Task Conversion (실행 단위 전환)**: Inbox의 원시 데이터를 실행 가능한 Task로 변환하여 관리한다. 흐름: `Inbox → Task → Project → Kanban`.
- **Project Context (맥락 유지)**: 모든 작업, 회의록, 결정사항, 링크를 특정 프로젝트와 연결하여 업무의 맥락을 유지한다.
- **Evidence over Memory (기록 기반)**: 기억에 의존하지 않고 과거 결정과 회의 내용을 근거 기반으로 확인 가능하게 한다.
- **Minimal but Useful**: 엔터프라이즈 도구의 복잡성을 배제하고 개인 실행력에 집중한다.

---

## 3. 핵심 사용자 문제

1. **파편화된 입력 채널**: Teams, 이메일, Jira, 전화 등 업무 요청 경로가 너무 다양하여 업무 누락 발생.
2. **다중 프로젝트 수행의 어려움**: 서로 다른 범주의 프로젝트(기술 개발, 전략 수립, 산학 협력 등)를 동시에 진행할 때 상태 파악 어려움.
3. **회의록과 결정사항의 분산**: 회의록을 작성해도 나중에 찾기 어렵고, "왜, 언제" 결정되었는지 확인 곤란.
4. **실행 상태 파악의 한계**: 오늘 할 일, 대기 중인 일, 보류된 일을 명확히 답하기 어려움.

---

## 4. 핵심 개념 정의

| 개념 | 정의 |
|---|---|
| **Inbox** | 가공되지 않은 데이터의 1차 수집처. 업무 누락 방지와 원문 보존을 위한 공간. |
| **Task** | Inbox에서 변환된 실제 실행 단위. 프로젝트에 연결되고 마감일·우선순위를 가진다. |
| **Project / Sub Project** | 업무 맥락 단위. MVP에서는 1단계 하위 프로젝트까지만 허용. |
| **Kanban** | 업무 상태 시각화. Waiting(외부 대기), Hold(전략적 보류) 등 개인 업무에 특화된 상태 포함. |
| **Meeting Notes** | 프로젝트와 연계된 마크다운 기반 회의록. |
| **Decisions** | 프로젝트 진행 중 주요 결정사항을 시간순으로 추적. |
| **Tags & Search** | 프로젝트 구조를 보완하는 유연한 분류와 전체 검색. |

---

## 5. 주요 기능 요구사항

### 5.1 Inbox 기능
- **목적**: 다양한 경로로 유입된 업무를 빠르게 기록하고 나중에 Task로 전환할 수 있도록 수집.
- **핵심 요건**:
  - Inbox Item 생성/수정/삭제
  - 입력 창구 선택 (Teams, Email, Jira, 구두, 전화, 기타)
  - 원문(raw_content) 저장
  - 프로젝트 선택(선택 사항)
  - 마감일·태그 지정
  - **Task로의 전환 기능** (1:N 가능 — 하나의 Inbox에서 여러 Task 생성 가능)

### 5.2 Task 기능
- **목적**: Inbox에서 정리된 실제 실행 업무 단위 관리.
- **핵심 요건**:
  - Task 생성/수정/삭제
  - **Inbox Item으로부터의 전환** + Inbox 거치지 않은 **직접 생성도 허용**
  - 프로젝트/하위 프로젝트 연결
  - Kanban 상태 관리
  - 우선순위(Critical, High, Medium, Low)·마감일 설정
  - 관련 링크 연결

### 5.3 Task 상태값 (Status) — 8단계
| Status | 의미 |
|---|---|
| `Inbox` | 아직 Task로 정의되지 않은 임시 상태 |
| `Open` | 실행 대기 |
| `In Progress` | 진행 중 |
| `Waiting` | 외부 요인 대기 (피드백, 응답 대기) |
| `Hold` | 의도적 보류 (전략적 일시정지) |
| `Done` | 완료 |
| `Archived` | 보관 |
| `Canceled` | 취소 |

> **Waiting vs Hold 구분**은 개인 업무 흐름의 핵심 차별점이다. Waiting은 "내 책임이 아님", Hold는 "내가 미뤘음"을 의미한다.

### 5.4 Kanban 기능
- 전체/프로젝트별/하위 프로젝트별 Kanban 뷰
- 드래그 앤 드롭 상태 변경
- **사용자 정의 상태 컬럼 표시 설정** (Settings에서 보여줄 컬럼 선택)
- 필터(태그, 우선순위, 마감일)·정렬

### 5.5 Project 관리
- 프로젝트 및 1단계 하위 프로젝트(Sub Project) 생성
- 프로젝트 개요·상태(Active/On Hold/Done/Archived) 설정
- 관련 링크 추가
- 프로젝트별 Task/회의록/결정사항 조회

### 5.6 Project 상세 View
6개 탭으로 구성:
1. **Overview** — 진행/대기 Task 현황, 최근 회의록·결정사항, Sub Project 목록
2. **Tasks** — 리스트형
3. **Kanban** — 보드형
4. **Meeting Notes**
5. **Decisions**
6. **Links**

### 5.7 Project Link 관리
- 링크 제목·URL/경로 저장
- 링크 타입 분류 (GitLab, Jira, SharePoint, Confluence, Teams, 로컬 파일, 기타)
- 프로젝트·태그 연결

### 5.8 Meeting Notes
- Markdown 기반 작성·저장
- 템플릿 기반 입력
- **HTML Export** 지원 (회사 시스템 업로드용)
- 결정사항 후보·액션 아이템 기록
- 회의록 내 액션 아이템의 **Task 전환** 지원

### 5.9 Decisions
- 프로젝트·회의록 연결
- 결정사항 타임라인 조회
- 결정 근거·결정자·결정일 기록
- 검색·태그 부여
- MVP에서는 **수동 등록** 방식 (회의록 자동 추출은 v2 이후)

### 5.10 검색 (Search)
- 전체 통합 검색 + 엔티티별(Task/회의록/Decision 등) 검색
- 회의록 본문(Markdown) 전문 검색
- 태그·상태 기반 필터링
- **검색 엔진**: SQLite FTS5 사용 (별도 검색 서버 불필요)

### 5.11 태그 (Tags)
- 자유 태그 생성, 모든 엔티티(Inbox, Task, Project, MeetingNote, Decision, Link)에 부여
- 태그 기반 검색·필터링
- 기존 태그 자동완성 추천

---

## 6. UI 설계

### 6.1 기본 방향
- **Minimal but Useful**
- 빠른 입력, 적은 클릭 수, 한눈에 보이는 상태, 맥락 유지, 불필요한 통계 제거

### 6.2 기본 레이아웃
2단 구조:
- **좌측 Navigation Bar (고정, 240px)**: Dashboard / Inbox / Projects / Decisions / Search / Settings
- **우측 Main Content (가변)**: 페이지별 콘텐츠

### 6.3 주요 화면 (8개)

| # | 화면 | 핵심 역할 |
|---|---|---|
| 1 | Dashboard | 일일 커맨드 센터: Quick Inbox + 미처리 Inbox + Today/Overdue/Waiting + 사용자 정의 Kanban |
| 2 | Inbox | 미처리 항목 리스트, Task 전환 |
| 3 | Projects | 프로젝트 카드 리스트 (상태, 태그, 진행 Task 수) |
| 4 | Project Detail | 6개 탭(Overview/Tasks/Kanban/MeetingNotes/Decisions/Links) |
| 5 | Meeting Notes | Markdown 에디터, 템플릿, HTML Export |
| 6 | Decisions | 결정사항 타임라인 |
| 7 | Search | 통합 검색 + 엔티티별 결과 분류 |
| 8 | Settings | Kanban 컬럼 표시, 회의록 템플릿, 태그 관리, 백업 |

### 6.4 Dashboard 레이아웃 상세
```
┌─────────────────────────────────────────────────────────┐
│ [Quick Inbox Input] (한 줄 텍스트박스 + 프로젝트 선택)   │
├──────────────────────────┬──────────────────────────────┤
│ Unprocessed Inbox        │ Today  / Overdue / Waiting   │
│ (좌측 50%)               │ (우측 50%, 카운트+리스트)    │
├──────────────────────────┴──────────────────────────────┤
│ Kanban Board (사용자가 선택한 Status 컬럼만 표시)        │
└─────────────────────────────────────────────────────────┘
```

### 6.5 Project Detail 레이아웃
- **Header**: 프로젝트 이름, 개요, 상태, 주요 태그, 관련 링크
- **Tab 영역**: 6개 탭 전환
- **Overview 구성**: 진행/대기 Task 카운트, 최근 회의록 3건, 최근 결정사항 3건, Sub Project 목록

### 6.6 디자인 가이드 (확정)
- **다크모드 지원**: 필수 (Settings에서 토글)
- **회의록 UI**: 별도 페이지 방식 (모달 X)
- **컬러 톤**: 중성적 회색 베이스 + 단일 액센트 컬러 1종 (브랜드 컬러 추후 적용 가능)
- **반응형**: 데스크톱 1280px 이상 우선 최적화, 1024px 이상 사용 가능, 모바일 대응은 후순위

---

## 7. 데이터 모델

### 7.1 엔티티 일람 (8개 + 신규 1개)

#### 7.1.1 Project
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| parent_project_id | UUID (FK → Project.id) | NULL 가능 (1단계 Sub만 허용) |
| status | ENUM | Active / On Hold / Done / Archived |
| tags | (Tag 관계) | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.2 ProjectLink
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| project_id | UUID (FK) | NOT NULL |
| title | VARCHAR(200) | |
| url_or_path | TEXT | URL 또는 로컬 파일 경로 |
| type | ENUM | GitLab / Jira / SharePoint / Confluence / Teams / LocalFile / Other |
| description | TEXT | |
| tags | (Tag 관계) | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.3 InboxItem
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| source_type | ENUM | Teams / Email / Jira / Verbal / Phone / Other |
| source_detail | VARCHAR(500) | 보낸 사람, 회의명 등 자유 기술 |
| raw_content | TEXT | 원문 |
| project_id | UUID (FK) | NULL 가능 |
| due_date | DATE | NULL 가능 |
| captured_at | TIMESTAMP | 기본값 = now() |
| status | ENUM | Unprocessed / Converted / Archived / Canceled |
| tags | (Tag 관계) | |
| converted_task_ids | (Task 관계, 1:N) | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.4 Task
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| title | VARCHAR(300) | NOT NULL |
| description | TEXT | |
| project_id | UUID (FK) | NULL 허용(추후 연결) |
| sub_project_id | UUID (FK → Project.id) | NULL 가능 |
| source_inbox_id | UUID (FK) | NULL 가능(직접 생성 시) |
| status | ENUM | 8단계 (5.3 참조) |
| priority | ENUM | Critical / High / Medium / Low |
| due_date | DATE | |
| tags | (Tag 관계) | |
| related_links | (ProjectLink 관계, M:N) | |
| created_at, updated_at, completed_at, archived_at, canceled_at | TIMESTAMP | |

#### 7.1.5 MeetingNote
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| project_id | UUID (FK) | NOT NULL |
| title | VARCHAR(300) | |
| meeting_date | DATE | |
| attendees | TEXT | 자유 입력 (콤마 구분) |
| markdown_content | TEXT | 원본 마크다운 |
| html_content | TEXT | Export 캐시 (선택) |
| tags | (Tag 관계) | |
| related_task_ids | (Task 관계, M:N) | |
| related_decision_ids | (Decision 관계, M:N) | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.6 Decision
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| project_id | UUID (FK) | NOT NULL |
| meeting_note_id | UUID (FK) | NULL 가능 |
| title | VARCHAR(300) | |
| content | TEXT | |
| reason | TEXT | 결정 근거 |
| decided_by | VARCHAR(100) | |
| decision_date | DATE | |
| source_type | ENUM | Meeting / Email / Verbal / Other |
| source_link | TEXT | |
| impact | TEXT | |
| follow_up_task_ids | (Task 관계, M:N) | |
| tags | (Tag 관계) | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.7 Tag
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(50) | UNIQUE |
| color | VARCHAR(7) | HEX (예: #3B82F6) |
| description | TEXT | |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.8 UserSetting
| 필드 | 타입 | 비고 |
|---|---|---|
| id | INT (PK) | 단일 행 (id=1) |
| dashboard_visible_statuses | JSON | 표시할 Status 배열 |
| default_kanban_view | ENUM | All / Project |
| default_project_filter | UUID | |
| theme | ENUM | Light / Dark / System |
| meeting_note_template | TEXT | 기본 템플릿 마크다운 |
| created_at, updated_at | TIMESTAMP | |

#### 7.1.9 [신규] AuditLog (감사 로그)
사내 환경에서의 데이터 변경 추적을 위해 추가.
| 필드 | 타입 | 비고 |
|---|---|---|
| id | UUID (PK) | |
| entity_type | VARCHAR(50) | Task / Project / Decision 등 |
| entity_id | UUID | |
| action | ENUM | Create / Update / Delete |
| changed_fields | JSON | |
| timestamp | TIMESTAMP | |

### 7.2 엔티티 관계도 (ERD 요약)

```
Project ──┬── ProjectLink (1:N)
          ├── Task (1:N) ──── InboxItem (N:1, 선택)
          ├── MeetingNote (1:N) ──── Decision (1:N)
          └── (parent_project_id) self-ref (1:1단계)

Tag ── (M:N) ── Project / Task / InboxItem / MeetingNote / Decision / ProjectLink
```

### 7.3 인덱스 권장
- `Task(project_id, status)` — Kanban 조회용
- `Task(due_date)` — Today/Overdue 조회
- `InboxItem(status, captured_at)` — Unprocessed 정렬
- `MeetingNote(project_id, meeting_date DESC)` — 최근 회의록
- `Decision(project_id, decision_date DESC)` — 타임라인
- **FTS5 가상 테이블**: `task_fts`, `meeting_note_fts`, `inbox_fts`, `decision_fts`

---

## 8. 주요 사용자 시나리오

### 8.1 Teams로 업무가 들어온 경우
1. Teams에서 받은 업무 요청 확인
2. Dashboard의 Quick Inbox Input에 내용 입력
3. 입력 창구를 Teams로 선택, 원문 붙여넣기
4. 관련 Project 선택, 마감일·태그 입력
5. Inbox Item 저장
6. 이후 Task로 전환
7. Task는 해당 Project의 Kanban에 Open 상태로 표시

### 8.2 Inbox Item을 Task로 전환하는 경우
1. Inbox 화면에서 미처리 항목 확인
2. 특정 Inbox Item 선택
3. 원문을 바탕으로 실행 가능한 Task 제목 작성
4. Project 또는 Sub Project 지정
5. 마감일, 우선순위, 태그 설정
6. Task로 전환 → 원본 Inbox Item과 연결
7. Task는 Kanban에 표시

### 8.3 오늘 할 일 확인
1. Dashboard 접속
2. 미처리 Inbox 확인
3. Today/Overdue/Waiting 영역 확인
4. Kanban에서 Open/In Progress/Done 확인
5. 필요 시 표시 Status 변경
6. In Progress 업무 이어서 수행

### 8.4 프로젝트별 업무 확인
1. Projects 메뉴 진입
2. 전체 Project 목록 확인
3. 특정 Project 선택
4. Overview에서 진행 상황 확인
5. Tasks 또는 Kanban 탭에서 업무 확인
6. Meeting Notes/Decisions로 맥락 확인

### 8.5 회의록 작성
1. Project 상세 화면 이동
2. Meeting Notes 탭 선택
3. + 버튼으로 새 회의록 작성
4. Template에 따라 회의 정보 입력
5. 안건·결정사항·Action Items 작성
6. Markdown 원본 저장
7. 필요 시 HTML Export
8. Action Item을 Task로 전환

### 8.6 과거 결정사항 찾기
1. Decisions 메뉴 또는 Project 상세 Decisions 탭 이동
2. Project/태그/검색어로 필터링
3. 시간순 결정사항 확인
4. 원본 Meeting Note로 이동
5. 결정 배경과 후속 Task 확인

### 8.7 검색으로 과거 자료 찾기
1. Search 메뉴 진입
2. 검색어 입력
3. Inbox/Task/Project/MeetingNotes/Decisions/Links로 구분된 결과 확인
4. 클릭하여 원문 이동

---

## 9. MVP 범위

핵심 흐름 **Inbox → Task → Project → Kanban** 검증에 필요한 최소 기능:

- **Inbox**: 생성, 입력 창구/원문/일시 기록, 프로젝트 연결, 마감일/태그, Task 전환
- **Task**: 생성, 수정, 삭제, 프로젝트 연결, 상태 변경, 마감일/우선순위/태그
- **Project**: 생성, 수정, 삭제, 개요 작성, 1단계 Sub Project, 관련 링크
- **Kanban**: 전체 및 프로젝트별 Kanban, Status 컬럼 표시 설정, 카드 표시, 상태 변경
- **Meeting Notes**: 회의록 생성, Markdown 저장, 템플릿 작성, HTML Export
- **Search**: 전체 검색, 엔티티별 결과, 태그 검색, 회의록 본문 검색
- **Tags**: 생성, 엔티티별 부여 및 필터
- **Settings**: Dashboard Kanban 표시 Status 설정, 회의록 템플릿 설정, 태그 관리
- **Decisions**: 수동 등록 + 목록 표시 (단순화)

### 9.1 MVP 제외 기능
- 외부 API 자동 연동 (Teams/Jira/Email 자동 수집)
- 사용자 권한 관리, 다중 사용자 워크스페이스
- 간트차트, 리소스/비용 관리
- 모바일 네이티브 앱
- AI 자동 분류·요약
- 회의록에서 Decision 자동 추출

---

## 10. 개발 우선순위 (Phase 1 ~ 5)

| Phase | 목표 | 주요 기능 | 예상 기간 |
|---|---|---|---|
| **Phase 1: Core Workflow** | Inbox→Task→Project→Kanban 기본 흐름 완성 | 프로젝트/Inbox/Task CRUD, Inbox→Task 전환, Kanban 상태 관리, 프로젝트별 Task 조회 | 3주 |
| **Phase 2: Dashboard & Status** | 대시보드에서 현재 상태 한눈 파악 | Dashboard 구성, Quick Inbox Input, Today/Overdue/Waiting, 전체/프로젝트 Kanban 토글, 상태 표시 설정 | 2주 |
| **Phase 3: Meeting Notes** | 프로젝트별 회의록 기록 및 저장 | 회의록 목록/작성, Markdown 저장, 템플릿, HTML Export, 프로젝트·태그 연결 | 2주 |
| **Phase 4: Tags & Search** | 빠른 검색·필터링 | 태그 관리, 엔티티별 적용, 전체/프로젝트 내 검색, 태그 필터, 회의록 본문 검색 | 2주 |
| **Phase 5: Decisions Basic** | 결정사항 기록·타임라인 | 결정사항 수동 등록, 프로젝트/회의록 연결, 타임라인, 검색·태그 | 1주 |

**총 MVP 예상 기간: 약 10주 (2.5개월)** — 1인 풀타임 개발 기준. 외주 시 인력 규모에 따라 단축 가능.

---

## 11. MVP 백로그 (Epic 기준)

| Epic | 세부 항목 |
|---|---|
| **E1. Project Management** | Project CRUD, Sub Project 생성, Project Link 추가 |
| **E2. Inbox** | Inbox Item CRUD, 입력 창구·태그·프로젝트 연결, Task 전환 |
| **E3. Task** | Task CRUD, 상태 변경, 프로젝트 연결, 태그·마감일·우선순위 설정 |
| **E4. Kanban** | 전체/프로젝트별 Kanban, Drag & Drop, Status 컬럼 표시 설정, 카드 표시 |
| **E5. Dashboard** | Quick Inbox Input, 미처리 Inbox / Today / Overdue / Waiting, Kanban 표시 |
| **E6. Meeting Notes** | 회의록 CRUD, Markdown Editor, 템플릿, HTML Export, 프로젝트·태그 연결 |
| **E7. Tags** | Tag CRUD, 엔티티별 적용, Filter |
| **E8. Search** | 전체 검색 + 개별 엔티티 검색 |
| **E9. Decisions Basic** | Decision CRUD, 프로젝트·회의록 연결, 타임라인, 검색·태그 |
| **E10. Settings** | Kanban 표시 Status, Dashboard 표시 항목, 회의록 템플릿, 태그 관리 |
| **[신규] E11. Backup & Restore** | DB 백업/복구, 데이터 Export(JSON), 자동 백업 스케줄 |
| **[신규] E12. Auth (간소화)** | 단일 사용자 로그인, 비밀번호 설정 |

## 12. 시스템 아키텍처

### 12.1 배포 모델: 사내망 한정형 단일 호스트

**채택 배경**:
- 회사 내부에서만 사용 → 외부에서 서버로의 인바운드(Inbound) 접속 불필요
- HTTPS 인증서, 도메인, 외부 방화벽 설정 불필요
- 데이터가 회사 PC를 벗어나지 않음 → 보안 우려 최소화
- 비개발자가 운영하기에 가장 단순한 구조

### 12.2 아키텍처 개요도

```
┌─────────────────────────── 회사 LAN (사내망) ──────────────────────────┐
│                                                                        │
│   ┌──────────────────────────────────┐                                 │
│   │  Host PC (회사 본인 데스크톱)    │                                 │
│   │  ─────────────────────────────   │                                 │
│   │   ┌─────────────────────────┐    │       ┌──────────────────┐     │
│   │   │  WorksOS Server         │◄───┼──────►│  내 노트북 (회사)│     │
│   │   │  - Backend API (Node)   │    │  HTTP │  Chrome/Edge     │     │
│   │   │  - Frontend (정적파일)  │    │       └──────────────────┘     │
│   │   │  - SQLite DB (file)     │    │                                 │
│   │   │  - Port BASE_PORT (LAN only) │    │       ┌──────────────────┐     │
│   │   └─────────────────────────┘    │◄─────►│  회의실 공용 PC  │     │
│   │   Data: C:\WorksOS\data\         │       │  (브라우저 접속) │     │
│   └──────────────────────────────────┘       └──────────────────┘     │
│                                                                        │
│   ※ 외부 인터넷에서는 접근 불가 (회사 방화벽이 차단)                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 12.3 접속 방식
- 호스트 PC IP 확인 (예: `192.168.1.50`)
- 같은 사내망의 다른 PC에서 브라우저로 `http://192.168.1.50:BASE_PORT` 접속
- 호스트 PC 본인은 `http://localhost:BASE_PORT` 접속
- **외부 인터넷에서 서버로 접근 불가능** (이는 의도된 보안 특성이나, Host PC 자체의 외부 CDN, API 호출 등 아웃바운드 통신은 가능)

### 12.4 컴포넌트 구성

| 컴포넌트 | 역할 | 기술 |
|---|---|---|
| **Frontend SPA** | 사용자 UI (브라우저에서 실행) | React + Vite (정적 빌드 결과물) |
| **Backend API** | REST API, 비즈니스 로직 | Node.js + Express(or NestJS) |
| **Database** | 데이터 영속 저장 | SQLite (단일 파일) |
| **Static File Server** | 빌드된 프론트엔드 서빙 | Express의 static 미들웨어 |
| **검색 엔진** | 전문 검색 | SQLite FTS5 (DB에 내장) |
| **백업 스크립트** | DB 파일 복사 + JSON Export | Node.js 스케줄러 (node-cron) |

> **단일 프로세스 권장**: Backend가 Frontend 정적 파일까지 서빙하면 운영 단순화. 포트는 BASE_PORT 하나만 사용.

### 12.5 데이터 저장 위치 (호스트 PC)
```
C:\WorksOS\
├── app\                      # 실행 파일
│   ├── server.js
│   ├── public\ (Frontend 빌드)
│   └── node_modules\
├── data\
│   ├── worksos.db            # SQLite 메인 DB
│   ├── worksos.db-shm
│   └── worksos.db-wal
├── backups\                  # 자동 백업 폴더
│   ├── worksos-2026-06-10.db
│   └── worksos-2026-06-09.db
└── logs\
    └── app.log
```

---

## 13. 기술 스택 (확정 권장안)

> AI 코딩 도구(Cursor, Claude Code 등)가 가장 잘 다루는 조합으로 선정. 비개발자도 외주 의뢰 시 그대로 명시 가능.

### 13.1 백엔드
| 항목 | 선택 | 이유 |
|---|---|---|
| 런타임 | **Node.js 20 LTS** | AI 도구 호환성 최고, 단일 언어로 풀스택 가능 |
| 프레임워크 | **Express.js 4.x** (또는 NestJS 10) | Express는 단순, NestJS는 구조적. 외주사 권장에 맡김 |
| ORM | **Prisma 5.x** | TypeScript 타입 자동 생성, AI가 매우 잘 다룸 |
| 검증 | **Zod** | API 입력 검증 |
| 마크다운 | **markdown-it** + **DOMPurify** | HTML Export 시 사용 |
| 스케줄러 | **node-cron** | 자동 백업 |

### 13.2 프론트엔드
| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **React 18 + TypeScript** | 생태계, AI 도구 친화도 최고 |
| 빌드 | **Vite 5** | 빠른 개발, 단순 빌드 |
| 라우팅 | **React Router 6** | |
| 상태관리 | **Zustand** (전역) + **TanStack Query** (서버 상태) | Redux 대비 단순 |
| UI 컴포넌트 | **shadcn/ui** + **Tailwind CSS** | AI가 가장 잘 생성하는 조합 |
| 폼 | **React Hook Form** + Zod | |
| 칸반 D&D | **dnd-kit** | 접근성·성능 우수 |
| 마크다운 에디터 | **TipTap** (또는 Milkdown) | 위지윅 + Markdown 동시 지원 |
| 아이콘 | **lucide-react** | shadcn 기본 매칭 |
| 날짜 | **date-fns** | |

### 13.3 데이터베이스
| 항목 | 선택 | 이유 |
|---|---|---|
| RDBMS | **SQLite 3.45+** | 단일 사용자, 무설치, 단일 파일 백업 가능 |
| 전문 검색 | **SQLite FTS5** | 별도 검색엔진 불필요 |
| Migration | **Prisma Migrate** | |

### 13.4 인증 (간소화)
별도의 인증 과정 없음.

### 13.5 배포·운영
| 항목 | 선택 | 이유 |
|---|---|---|
| 컨테이너 | **Docker + Docker Compose** | 호스트 환경 영향 최소화, 1줄 실행 |
| 대안 | **PM2 (Node 직접 실행)** | Docker 설치 어려울 시 |
| 자동 시작 | Windows 작업 스케줄러 / 서비스 등록 | PC 부팅 시 자동 실행 |
| 로깅 | Winston (파일 로깅) | |

### 13.6 개발 도구
- **Git + GitHub/GitLab** (소스 관리)
- **VS Coder** (AI 코딩 IDE)
- **Postman/Insomnia** (API 테스트)

### 13.7 [중요] 기술 스택 선정 원칙
1. **단일 언어 풀스택** (TypeScript) → 외주 인력 단순화
2. **AI 친화적** → Cursor/Claude Code가 잘 생성하는 조합
3. **무료/오픈소스** → 라이선스 비용 0원
4. **단일 호스트 최적화** → 분산 시스템 복잡성 배제

---

## 14. API 명세 (REST) — 개요

> 전체 엔드포인트의 표준 패턴. 상세 명세는 OpenAPI 3.0(Swagger) 문서로 외주사가 생성하도록 요청.

### 14.1 공통 규칙
- Base PORT(BASE_PORT): 3080 (사용자가 포트번호는 설정에서 변경 가능하도록 구현)
- Base URL: `http://{host}:BASE_PORT/api/v1`
- 인증: `Authorization: Bearer {jwt}` 또는 HttpOnly Cookie
- 응답 포맷: JSON, 표준 에러 `{ "error": { "code": "...", "message": "..." } }`
- Timestamps: ISO 8601 (UTC)
- Pagination: `?page=1&limit=50` → `{ "data": [...], "total": N, "page": 1 }`

### 14.2 핵심 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| **Project** | | |
| GET | /projects | 프로젝트 목록 (필터: status, tag) |
| POST | /projects | 생성 |
| GET | /projects/:id | 상세 (포함: tasks 카운트, 최근 회의록·결정사항) |
| PATCH | /projects/:id | 수정 |
| DELETE | /projects/:id | 삭제 (soft delete 권장) |
| GET | /projects/:id/links | 프로젝트 링크 목록 |
| POST | /projects/:id/links | 링크 추가 |
| **Inbox** | | |
| GET | /inbox | 목록 (filter: status, project_id, tag) |
| POST | /inbox | 생성 (Quick Input 포함) |
| PATCH | /inbox/:id | 수정 |
| DELETE | /inbox/:id | 삭제 |
| POST | /inbox/:id/convert | Task로 전환 (body: task 필드들) |
| **Task** | | |
| GET | /tasks | 목록 (filter: project_id, status, due_date, tag, priority) |
| POST | /tasks | 직접 생성 |
| GET | /tasks/:id | 상세 |
| PATCH | /tasks/:id | 수정 (status 변경 포함) |
| DELETE | /tasks/:id | 삭제 |
| **Kanban** | | |
| GET | /kanban?scope=all | 전체 Kanban (status별 그룹 결과) |
| GET | /kanban?scope=project&project_id=:id | 프로젝트별 |
| **Meeting Notes** | | |
| GET | /projects/:id/meeting-notes | 목록 |
| POST | /projects/:id/meeting-notes | 생성 |
| GET | /meeting-notes/:id | 상세 |
| PATCH | /meeting-notes/:id | 수정 |
| DELETE | /meeting-notes/:id | 삭제 |
| GET | /meeting-notes/:id/export.html | HTML Export |
| **Decisions** | | |
| GET | /decisions | 목록 (filter: project_id, tag, date_range) |
| POST | /decisions | 생성 |
| GET | /decisions/:id | 상세 |
| PATCH | /decisions/:id | 수정 |
| DELETE | /decisions/:id | 삭제 |
| **Tags** | | |
| GET | /tags | 목록 |
| POST | /tags | 생성 |
| PATCH | /tags/:id | 수정 |
| DELETE | /tags/:id | 삭제 |
| **Search** | | |
| GET | /search?q={keyword}&type=all\|task\|... | 통합 검색 |
| **Settings** | | |
| GET | /settings | 조회 |
| PATCH | /settings | 수정 |
| **Backup** | | |
| POST | /backup/now | 즉시 백업 |
| GET | /backup/list | 백업 파일 목록 |
| POST | /backup/restore | 백업 복원 |
| GET | /export/json | 전체 데이터 JSON Export |

### 14.3 응답 예시 (Task 생성)
```json
POST /api/v1/tasks
Request:
{
  "title": "보고서 초안 작성",
  "project_id": "uuid-...",
  "priority": "High",
  "due_date": "2026-06-20",
  "tags": ["보고", "긴급"]
}

Response 201:
{
  "data": {
    "id": "task-uuid-...",
    "title": "보고서 초안 작성",
    "status": "Open",
    "priority": "High",
    "project": { "id": "...", "name": "Q2 전략 보고서" },
    "tags": [...],
    "created_at": "2026-06-10T12:34:56Z"
  }
}
```

---

## 15. 비기능 요구사항 (NFR)

### 15.1 성능
- 일반 API 응답: **p95 < 200ms** (사내망 LAN 기준)
- 검색 API: **p95 < 500ms** (회의록 500건, Task 1만 건 기준)
- 페이지 초기 로딩: **2초 이내** (캐시 후 1초 이내)
- Kanban 드래그 반응: **즉각적 (<100ms)**, 서버 동기화는 비동기

### 15.2 데이터 규모 (1인 1년 사용 추정)
- Project: ~50건
- Task: ~3,000건
- InboxItem: ~5,000건
- MeetingNote: ~500건 (각 5KB ≈ 2.5MB)
- Decision: ~300건
- **총 DB 크기: ~50MB 이하 예상** (5년 누적해도 SQLite로 충분)

### 15.3 가용성
- 호스트 PC 가동 시 100% 사용 가능
- 호스트 PC 꺼짐 시 사용 불가 (의도된 제약)
- 자동 재시작: 호스트 PC 부팅 시 서버 자동 실행

### 15.4 호환성
- 브라우저: Chrome/Edge 최신 2개 버전, Firefox 최신
- 운영체제(호스트): Windows 10/11 (회사 표준 PC)
- 해상도: 1280×720 이상

### 15.5 접근성(MVP 제외)
- 키보드 단축키 지원 (`N`: 새 Inbox, `T`: 새 Task, `/`: 검색)
- WCAG 2.1 AA 색 대비 준수 (필수는 아님, 권장)

### 15.6 국제화 (i18n)
- MVP: 한국어 단일
- 향후 확장 고려하여 모든 UI 텍스트는 사전(dictionary) 파일로 분리 권장

---

## 16. 보안 및 인증

### 16.1 위협 모델 (사내망 한정 환경)
- **외부 해킹 위험**: 매우 낮음 (외부 노출 없음)
- **사내 동료의 무단 접근**: 중간 (같은 LAN에서 URL을 알면 접근 가능)
- **호스트 PC 도난·분실**: 중간 (회사 자산 관리 정책 의존)

### 16.2 보안 요구사항
1. **세션 관리**: JWT(또는 세션 쿠키), HttpOnly + SameSite=Strict
2. **HTTPS는 선택**: 사내망이라면 HTTP 허용. 단, 회사 정책상 필요 시 자체 서명 인증서 사용
3. **CSRF 방지**: SameSite=Strict 쿠키로 기본 방어
4. **XSS 방지**: 모든 사용자 입력은 React가 기본 이스케이프, 마크다운 렌더링 시 DOMPurify 사용
5. **SQL Injection 방지**: Prisma ORM 사용으로 자동 방어
6. **백업 파일 보호**: 백업 폴더는 호스트 PC의 사용자 폴더 하위에 저장 (다른 계정 접근 차단)

---

## 17. 배포 및 운영

### 17.1 배포 절차 (외주 개발사 산출물 기준)

**산출물 패키지**:
```
WorksOS-Release-v1.0.0\
├── docker-compose.yml
├── .env.example
├── README.md (설치 가이드)
├── install.bat (Windows 원클릭 설치 스크립트)
└── worksos-app\
    ├── Dockerfile
    └── (소스코드)
```

### 17.2 설치 시나리오 (비개발자 기준)

**Option A — Docker 사용 (권장)**:
1. Docker Desktop 설치 (1회)
2. `install.bat` 더블클릭 → 자동으로 빌드·실행
3. 첫 실행 시 비밀번호 설정 화면
4. 브라우저에서 `http://localhost:BASE_PORT` 접속

**Option B — Node.js 직접 실행 (Docker 어려울 시)**:
1. Node.js 20 LTS 설치
2. `npm install --production`
3. `npm run start` → PM2가 백그라운드 실행

### 17.3 자동 시작 (PC 부팅 시)
- Windows 작업 스케줄러에 "PC 시작 시" 트리거로 `docker-compose up -d` 등록
- 외주 개발사가 이 설정 스크립트도 제공해야 함

### 17.4 모니터링
- **로그 파일**: `C:\WorksOS\logs\app.log` (Winston 일자별 로테이션)
- **헬스체크 엔드포인트**: `GET /api/v1/health` → `{ "status": "ok", "db": "ok" }`
- **운영 대시보드는 MVP 제외** (로그 파일만 확인)

### 17.5 업데이트 절차
1. 새 버전 zip 다운로드
2. 백업 자동 실행
3. `install.bat` 재실행 → Docker 이미지 교체
4. Prisma migrate 자동 실행

---

## 18. 백업 및 복구

### 18.1 백업 전략 (3중 안전망)

| 종류 | 주기 | 보관 위치 | 보관 기간 |
|---|---|---|---|
| **자동 DB 백업** | 매일 03:00 | `C:\WorksOS\backups\` | 30일 |
| **수동 즉시 백업** | 사용자 요청 | 동일 | 30일 |
| **JSON Export** | 사용자 요청 | 다운로드 | 사용자 보관 |

### 18.2 백업 파일 형식
- DB 백업: SQLite 파일 복사 (`worksos-YYYY-MM-DD-HHmmss.db`)
- JSON Export: 모든 엔티티를 JSON 배열로 (이식성·재사용성)
- 회의록 별도 백업: `meeting-notes-export\{project_name}\YYYY-MM-DD-title.md` (마크다운 원본 디스크 저장 옵션)

### 18.3 복구 절차
1. Settings → Backup 메뉴에서 백업 파일 선택
2. "복원" 클릭 → 확인 모달
3. 현재 DB가 `worksos.db.before-restore` 로 백업됨
4. 선택한 백업 파일이 활성화됨
5. 서버 자동 재시작

### 18.4 재해 복구 (호스트 PC 고장 시)
1. 새 PC에 WorksOS 설치
2. 외장 저장소(USB/네트워크 드라이브)에 보관한 백업 파일 복사
3. Settings → Backup → 복원
4. → 데이터 복구 완료

> **권장**: 사용자가 주 1회 백업 파일을 별도 외장 저장소에 복사하는 운영 규칙을 마련.

---

## 19. 테스트 전략

### 19.1 테스트 종류와 범위

| 종류 | 도구 | 범위 | 커버리지 목표 |
|---|---|---|---|
| **단위 테스트** | Vitest / Jest | 비즈니스 로직(서비스 레이어) | 70% |
| **API 통합 테스트** | Supertest | 주요 엔드포인트 | 핵심 흐름 100% |
| **E2E 테스트** | Playwright | 핵심 시나리오 (8.1~8.7) | 시나리오 100% |
| **수동 QA** | 기획자(본인) | 전체 UI/UX | 모든 화면 |

### 19.2 필수 E2E 시나리오
8장의 7개 사용자 시나리오를 자동화 테스트로 작성. 외주 개발사가 산출물로 제공해야 함.

### 19.3 테스트 데이터
- 시드 스크립트 제공 (Project 5개, Task 50개, MeetingNote 10개, Decision 5개)
- 개발/QA 환경에서 1초 만에 초기화 가능

### 19.4 인수 기준 (Acceptance Criteria) 예시
- ✅ Inbox에서 Task 전환 시 원본 Inbox는 `Converted` 상태로 변경됨
- ✅ 하나의 Inbox에서 2개 이상의 Task 생성 가능
- ✅ Kanban에서 Task 카드 드래그 시 1초 이내 상태 변경 반영
- ✅ 회의록 본문 검색 시 한글·영문 모두 동작 (FTS5 한글 토크나이저 확인)
- ✅ 자동 백업이 매일 03:00 실행되어 새 파일이 생성됨

---

## 20. 개발 일정 및 마일스톤

### 20.1 전체 일정 (1인 풀타임 기준)

```
 W1  W2  W3  W4  W5  W6  W7  W8  W9  W10  W11  W12
[ Phase 1: Core   ][ P2: Dashboard][P3: MTG ][P4: Tag/Search][P5: Dec][QA/배포]
```

| 주차 | 마일스톤 |
|---|---|
| W1 | 기술 셋업, DB 스키마, 인증, Project CRUD |
| W2 | Inbox CRUD, Task CRUD |
| W3 | Inbox → Task 전환, Kanban 기본, Project 상세 |
| W4 | Dashboard 레이아웃, Quick Inbox, Today/Overdue/Waiting |
| W5 | Kanban 표시 설정, 사용자 정의 컬럼 |
| W6 | Meeting Notes CRUD, Markdown 에디터 |
| W7 | 회의록 템플릿, HTML Export, 회의록↔Task 연결 |
| W8 | Tags 전체 적용, 태그 필터 |
| W9 | Search (FTS5 적용), 통합 검색 UI |
| W10 | Decisions CRUD, 타임라인 UI |
| W11 | 백업/복구, 자동 백업, 설정 화면 마무리 |
| W12 | 전체 QA, 버그 수정, 배포 패키지, 사용자 매뉴얼 |

---

## 21. 외주 의뢰 명세 / AI 도구 활용 가이드

### 21.1 외주 개발사에 전달할 자료
1. **본 문서 v2.0** (제품 개발 계획서)
2. **요구 산출물 목록** (아래 21.2)
3. **인수 기준** (19.4 항목 + 시나리오별 체크리스트)
4. **선호 기술 스택** (13장 그대로 명시)
5. **배포 환경 정보** (호스트 PC 사양, 네트워크 구성)

### 21.2 요구 산출물 (외주 종료 시 받을 것)
- [ ] 소스코드 전체 (Git 저장소)
- [ ] OpenAPI 3.0 API 명세 (Swagger UI 접근 가능)
- [ ] 데이터베이스 ERD 다이어그램
- [ ] 사용자 매뉴얼 (PDF, 스크린샷 포함)
- [ ] 설치 가이드 (`install.bat` 포함)
- [ ] 운영 매뉴얼 (백업·복구·재시작 절차)
- [ ] 단위 테스트 + E2E 테스트 코드
- [ ] Docker 이미지 또는 빌드 산출물
- [ ] 6개월 하자 보수 계약

### 21.3 AI 코딩 도구로 직접 개발 시 권장 절차

> Cursor, Claude Code, GitHub Copilot, Cline 등 활용 시

**Step 1 — 프로젝트 초기 셋업** (AI에게 그대로 요청)
```
다음 요구사항으로 Node.js + React + TypeScript 풀스택 프로젝트를 초기화해줘:
- Backend: Express + Prisma + SQLite + Zod
- Frontend: Vite + React + shadcn/ui + Tailwind + Zustand + TanStack Query
- 모노레포 구조 (apps/server, apps/web, packages/shared)
- ESLint + Prettier + Vitest 셋업
```

**Step 2 — DB 스키마 작성**
- 본 문서 7.1 ~ 7.3을 그대로 AI에 붙여넣고 Prisma 스키마 생성 요청

**Step 3 — Phase 1부터 차례대로 구현**
- 각 Phase 시작 시 본 문서의 해당 섹션 + API 명세(14장)를 컨텍스트로 제공
- 한 Epic 단위(예: E1 Project Management)로 끊어서 작업

**Step 4 — 테스트 자동 생성**
- 각 API/페이지 완성 후 "이 코드의 테스트를 작성해줘" 요청

**Step 5 — 배포 패키지**
- Dockerfile, docker-compose.yml, install.bat 작성 요청
- 본 문서 17장 그대로 컨텍스트로 제공

### 21.4 AI 활용 시 주의사항
- 한 번에 너무 많은 기능을 요청하지 말 것 (1 Epic 단위)
- 생성된 코드를 반드시 실행·테스트하고 다음 단계로 진행
- DB 스키마는 한 번 결정되면 변경이 어려우므로 시작 전 충분히 검토
- 매 작업마다 Git 커밋

---

## 22. 위험 요소 및 대응 방안 (Risk Management)

| 위험 | 가능성 | 영향 | 대응 |
|---|---|---|---|
| 호스트 PC 고장으로 데이터 손실 | 중 | 높음 | 매일 자동 백업 + 주 1회 외장 저장 운영 규칙 |
| 사내 IT 정책으로 사용 포트 차단 | 중 | 중 | IT부서와 사전 협의, 포트 변경 가능하게 설계 |
| Docker 설치 불가 환경 | 중 | 낮음 | Node.js 직접 실행 옵션도 함께 제공 |
| 회의록 데이터 증가로 검색 느려짐 | 낮음 | 중 | FTS5 인덱스 자동 최적화, 페이지네이션 |
| 외주 개발사 일정 지연 | 중 | 중 | Phase별 산출물 확인 + 단계별 검수 |
| AI 생성 코드의 품질 문제 | 중 | 중 | 단계별 동작 검증, 테스트 코드 강제 |
| 사용자가 백업을 잊고 외장 저장 안 함 | 높음 | 높음 | UI에 "마지막 외부 백업: N일 전" 경고 표시 |

---

## 23. 미결정 사항 (Open Questions)

> v1.0 대비 다수 항목이 본 문서에서 **확정**되었으며, 아래는 남은 검토 사항.

### 23.1 v1.0에서 확정된 항목 (본 문서 v2.0)
- ✅ 배포 형태: **사내망 한정형 단일 호스트 웹앱**
- ✅ 저장 방식: **로컬 SQLite + 호스트 PC 파일 시스템**
- ✅ 회의록 저장: **DB(Markdown 본문) + 옵션으로 파일 Export**
- ✅ Inbox 1:N Task: **허용**
- ✅ Inbox 거치지 않은 직접 Task: **허용**
- ✅ Sub Project 깊이: **1단계만 (MVP)**
- ✅ Kanban 상태값: **8개 고정 (사용자는 표시 여부만 선택)**
- ✅ Decision 자동 추출: **MVP 제외, v2 검토**
- ✅ 모바일 대응: **MVP 제외, 데스크톱 웹 우선**

### 23.2 v2 이후 검토 사항
- 다크모드 색상 톤 (LG전자 브랜드 색감 반영 여부)
- 회의록 자동 결정사항 추출 (LLM API 활용)
- Sub Project 2단계 이상 허용 여부
- 모바일 웹 반응형 대응 시점
- 외부 시스템(Teams/Jira) 자동 연동 (v3 이후)
- AI 자동 분류·요약 기능
- 다중 사용자 모드 (가족·소규모 팀)

---

## 24. 부록

### 24.1 용어집

| 용어 | 정의 |
|---|---|
| Host PC | WorksOS 서버가 실행되는 본인의 회사 데스크톱 |
| 사내망 (Corporate LAN) | 회사 내부 네트워크. 외부에서 이 시스템으로 들어오는 접속만 차단됨 (아웃바운드 통신은 자유로움) |
| Inbox Item | Inbox에 수집된 미가공 업무 입력 항목 |
| Status | Task의 8단계 진행 상태 |
| FTS5 | SQLite의 전문(Full-Text Search) 인덱스 기능 |
| MVP | Minimum Viable Product, 최소기능제품 |
| Epic | 여러 기능 요구사항을 묶은 큰 단위의 개발 단위 |

**문서 끝.**
