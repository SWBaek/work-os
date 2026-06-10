---
name: ui-design-guide
description: WorksOS UI 설계 가이드, 비기능 요구사항(NFR), 국제화(i18n) 규칙. UI 컴포넌트나 페이지를 구현할 때 참조하세요.
---

# WorksOS UI 설계 & NFR 가이드

UI 컴포넌트, 페이지, 레이아웃을 구현할 때 이 문서를 참조하세요.

---

## 1. 기본 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────────────────────────┐  │
│  │Navigation│  │                                     │  │
│  │   Bar    │  │          Main Content               │  │
│  │ (240px)  │  │          (가변 너비)                 │  │
│  │          │  │                                     │  │
│  │ Dashboard│  │                                     │  │
│  │ Inbox    │  │                                     │  │
│  │ Projects │  │                                     │  │
│  │ Decisions│  │                                     │  │
│  │ Search   │  │                                     │  │
│  │ Settings │  │                                     │  │
│  └──────────┘  └─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- 좌측 Navigation Bar: **고정 240px**
- 우측 Main Content: **가변 너비**

---

## 2. 8개 주요 화면

| # | 화면 | 핵심 역할 |
|---|---|---|
| 1 | **Dashboard** | Quick Inbox + 미처리 Inbox + Today/Overdue/Waiting + Kanban |
| 2 | **Inbox** | 미처리 항목 리스트, Task 전환 |
| 3 | **Projects** | 프로젝트 카드 리스트 (상태, 태그, Task 수) |
| 4 | **Project Detail** | 6개 탭 (Overview/Tasks/Kanban/MeetingNotes/Decisions/Links) |
| 5 | **Meeting Notes** | Markdown 에디터, 템플릿, HTML Export |
| 6 | **Decisions** | 결정사항 타임라인 |
| 7 | **Search** | 통합 검색 + 엔티티별 결과 분류 |
| 8 | **Settings** | Kanban 표시, 템플릿, 태그 관리, 백업 |

---

## 3. Dashboard 레이아웃 상세

```
┌─────────────────────────────────────────────────────────┐
│ [Quick Inbox Input] (한 줄 텍스트 + 프로젝트 선택)       │
├──────────────────────────┬──────────────────────────────┤
│ Unprocessed Inbox        │ Today / Overdue / Waiting    │
│ (좌측 50%)               │ (우측 50%, 카운트+리스트)     │
├──────────────────────────┴──────────────────────────────┤
│ Kanban Board (사용자가 선택한 Status 컬럼만 표시)        │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Project Detail 구조

- **Header**: 프로젝트 이름, 개요, 상태, 태그, 관련 링크
- **6개 탭**:
  - **Overview**: 진행/대기 Task 카운트, 최근 회의록 3건, 최근 결정사항 3건, Sub Project 목록
  - **Tasks**: 리스트형
  - **Kanban**: 보드형
  - **Meeting Notes**: 회의록 목록 → 별도 페이지로 이동 (모달 X)
  - **Decisions**: 결정사항 타임라인
  - **Links**: ProjectLink CRUD

---

## 5. 디자인 가이드

- **다크모드**: 필수 (Light/Dark/System, Settings에서 토글)
- **컬러 톤**: 중성적 회색 베이스 + 단일 액센트 컬러
- **회의록 UI**: 별도 페이지 방식 (모달 X)
- **우선순위 뱃지 색상**:
  - Critical: 빨강, High: 주황, Medium: 파랑, Low: 회색
- **마감일 강조**: 오늘/과기한 → 빨간색

---

## 6. 비기능 요구사항 (NFR)

| 항목 | 기준 |
|---|---|
| API 응답 시간 | p95 < 200ms (사내망 기준) |
| 검색 API | p95 < 500ms (회의록 500건, Task 1만건) |
| 페이지 로딩 | 2초 이내 (캐시 후 1초) |
| Kanban 드래그 | < 100ms (Optimistic UI 사용) |
| 브라우저 지원 | Chrome, Edge 최신 2버전, Firefox 최신 |
| 해상도 | 1280×720 이상 |
| 반응형 | 1280px 최적화, 1024px 사용 가능 |

---

## 7. 국제화 (i18n) 대비

- MVP는 한국어 단일이지만, **모든 UI 텍스트는 사전(dictionary) 파일로 분리**
- 하드코딩된 한국어 문자열을 컴포넌트에 직접 넣지 마세요
- 날짜/숫자 포맷도 locale 설정으로 분리
- 사전 파일 경로: `apps/web/src/lib/i18n/ko.json`

---

## 8. 데이터 저장 경로 (운영 환경)

```
C:\WorksOS\
├── app\                    # 실행 파일
├── data\
│   └── worksos.db          # SQLite 메인 DB
├── backups\                # 자동/수동 백업
└── logs\
    └── app.log             # Winston 로그
```

---

## 9. 키보드 단축키

| 키 | 동작 |
|---|---|
| `N` | 새 Inbox Item 생성 모달 |
| `T` | 새 Task 생성 모달 |
| `/` | 글로벌 검색 모달 (Command Palette 스타일) |
| `?` | 단축키 안내 표시 |

> 입력 필드/모달 활성 시 단축키는 자동 비활성화
