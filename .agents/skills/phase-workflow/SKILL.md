---
name: phase-workflow
description: WorksOS Phase 개발 관리 워크플로우. 새 Task 시작, 상태 업데이트, Phase 진행 관리 시 참조하세요.
---

# WorksOS Phase 워크플로우

Phase별 개발 작업을 시작하거나 상태를 관리할 때 이 문서를 참조하세요.

---

## 1. Phase 파일 위치 및 구조

- **경로**: `plan/phase_0.json` ~ `plan/phase_7.json`
- **구조**: 각 파일에는 `status`, `progress_summary`, `tasks[]`, `completion_criteria[]`, `risks[]`, `notes[]` 포함

```json
{
  "phase": 1,
  "status": "not_started",
  "progress_summary": { "total_tasks": 12, "completed": 0, ... },
  "tasks": [
    { "id": "P1-T1", "title": "...", "status": "not_started", ... }
  ],
  "completion_criteria": [
    { "id": "P1-CC1", "criterion": "...", "verification": "..." }
  ]
}
```

---

## 2. 상태값 정의

| 상태 | 의미 |
|---|---|
| `not_started` | 시작 전 |
| `in_progress` | 진행 중 |
| `completed` | 완료 |
| `blocked` | 차단됨 (선행 작업 또는 외부 요인) |
| `skipped` | 건너뜀 (불필요하거나 다른 방식으로 해결) |

---

## 3. Task 작업 시작 절차

1. Phase JSON 파일을 읽고 Task 목록 확인
2. 의존 Phase들이 `completed` 상태인지 확인
3. 해당 Task의 `status`를 `"in_progress"`로 변경
4. 계획서(`docs/WorksOS-Product-Plan-v2.md`)의 관련 섹션 참조
5. 코드 구현

---

## 4. Task 완료 절차

1. 해당 Task의 `status`를 `"completed"`로 변경
2. `progress_summary` 업데이트:
   - `completed` 카운트 +1
   - `in_progress` 카운트 -1
3. Phase 내 모든 Task가 `completed`이면:
   - Phase의 `status`를 `"completed"`로 변경
4. Git 커밋: `[P{N}-T{M}] 설명`

---

## 5. Phase 의존성 테이블

| Phase | 제목 | 의존성 |
|:---:|---|---|
| 0 | 프로젝트 기반 셋업 | — |
| 1 | Core Workflow | Phase 0 |
| 2 | Dashboard & Status | Phase 1 |
| 3 | Meeting Notes | Phase 1 |
| 4 | Tags & Search | Phase 1, Phase 3 |
| 5 | Decisions | Phase 1, Phase 3, Phase 4 |
| 6 | Backup & Settings | Phase 0, Phase 2 |
| 7 | QA & Deployment | 전체 |

**반드시 의존 Phase가 `completed`된 후에 다음 Phase를 시작하세요.**

---

## 6. 완료 검증 절차

각 Phase의 `completion_criteria`에 명시된 기준으로 검증합니다:

1. Phase JSON의 `completion_criteria[]` 배열을 읽음
2. 각 criterion의 `verification` 방법에 따라 검증 실행
3. 모든 기준 통과 → Phase `completed`
4. 실패 항목 → 해당 Task 재작업 또는 `blocked` 표시

---

## 7. progress_summary 업데이트 예시

```json
// Task 1개 시작 시
"progress_summary": {
  "total_tasks": 7,
  "not_started": 6,
  "in_progress": 1,
  "completed": 0,
  "blocked": 0,
  "skipped": 0
}

// Task 1개 완료 시
"progress_summary": {
  "total_tasks": 7,
  "not_started": 6,
  "in_progress": 0,
  "completed": 1,
  "blocked": 0,
  "skipped": 0
}
```
