# WorksOS Docs Management Guide

이 문서는 `docs/` 폴더의 문서 분류, 파일명 규칙, 이동/이름 변경 기준을 정의한다. 기존 문서의 내용은 보존하고, 문서의 성격이 명확히 드러나도록 위치와 이름만 정리한다.

## 1. 기본 원칙

- `docs/WorksOS-Product-Plan-v2.md`는 제품 계획의 단일 원천으로 유지한다.
- 문서 본문을 이동/이름 변경과 동시에 수정하지 않는다. 내용 수정은 별도 작업으로 분리한다.
- 새 문서는 생성 목적에 맞는 하위 폴더에 바로 추가한다.
- 파일명은 영문 소문자 `kebab-case`를 기본으로 한다.
- 날짜가 중요한 문서는 `YYYY-MM-DD-` 접두사를 붙인다.
- 리뷰/피드백 문서는 작성자, 대상, 성격이 파일명만으로 드러나야 한다.
- 이미지/스크린샷은 문서와 가까운 위치에 두되, 여러 문서가 공유하면 `assets/` 또는 `reference/`에 둔다.

## 2. 권장 폴더 구조

```text
docs/
  README.md
  product/
    worksos-product-plan-v2.md
  reviews/
    phase/
    quality/
    user-feedback/
  reference/
    images/
  archive/
```

### `product/`

제품 계획, 요구사항, 큰 의사결정의 기준이 되는 문서를 둔다.

- 예: 제품 계획서, PRD, 장기 로드맵
- 현재 기준: `WorksOS-Product-Plan-v2.md`는 여기에 두는 것을 권장한다.

### `reviews/phase/`

특정 Phase 구현 상태를 검토한 문서를 둔다.

- 파일명 형식: `YYYY-MM-DD-phase-N-review-{reviewer}.md`
- 예: `2026-06-10-phase-1-review-grok.md`

### `reviews/quality/`

전체 품질, 기술 부채, 스택 정합성, 린트/빌드/테스트 검증처럼 특정 Phase 하나에 한정되지 않는 리뷰를 둔다.

- 파일명 형식: `YYYY-MM-DD-quality-review-{scope}.md`
- 예: `2026-06-10-quality-review-total.md`

### `reviews/user-feedback/`

실제 사용자 관점, 유료 사용자 관점, 외부 모델의 UX/워크플로우 평가, 사람의 수동 피드백을 둔다.

- 파일명 형식: `YYYY-MM-DD-user-feedback-{source}.md`
- 유료 사용자 시뮬레이션은 `YYYY-MM-DD-paid-user-workflow-review-{source}.md` 형식을 사용한다.
- 사람 피드백은 `YYYY-MM-DD-human-feedback.md`를 사용한다.

### `reference/images/`

제품 설계, UI 참고, 피드백 첨부 이미지처럼 문서가 참조하는 정적 이미지를 둔다.

- 파일명 형식: `YYYY-MM-DD-{topic}.png` 또는 `{topic}.png`
- 특정 문서에만 쓰이는 이미지는 문서명과 맞춘다.

### `archive/`

현재 의사결정이나 실행에 직접 쓰지 않는 과거 문서를 둔다.

- 보관 목적이 명확할 때만 사용한다.
- 이동 전 원래 위치와 이동 사유를 PR/커밋 메시지에 남긴다.

## 3. 현재 문서 정리 제안

아래는 현재 파일 기준의 이동/이름 변경 제안이다. 본문 내용은 수정하지 않는다.

| 현재 경로 | 권장 경로 |
| --- | --- |
| `docs/WorksOS-Product-Plan-v2.md` | `docs/product/worksos-product-plan-v2.md` |
| `docs/reference/dashboard-ui.png` | `docs/reference/images/dashboard-ui.png` |
| `docs/review/totla-quiality-260610.md` | `docs/reviews/quality/2026-06-10-quality-review-total.md` |
| `docs/review-phase-1/grok-review.md` | `docs/reviews/phase/2026-06-10-phase-1-review-grok.md` |
| `docs/review/user-feedback/2026-06-10-paid-user-workflow-review.md` | `docs/reviews/user-feedback/2026-06-10-paid-user-workflow-review.md` |
| `docs/review/user-feedback/gemini.md` | `docs/reviews/user-feedback/2026-06-10-paid-user-workflow-review-gemini.md` |
| `docs/review/user-feedback/grok.md` | `docs/reviews/user-feedback/2026-06-10-paid-user-workflow-review-grok.md` |
| `docs/review/user-feedback/Human-feedback/2026-06-11-human-feedback.md` | `docs/reviews/user-feedback/2026-06-11-human-feedback.md` |
| `docs/review/user-feedback/Human-feedback/image.png` | `docs/reference/images/2026-06-11-human-feedback-dashboard.png` |

## 4. 파일명 규칙

- 소문자 영문, 숫자, 하이픈만 사용한다.
- 공백, 대문자 폴더명, 임의 약어는 피한다.
- 날짜는 `YYYY-MM-DD`를 사용하고, `260610` 같은 축약형은 사용하지 않는다.
- 오타를 남기지 않는다. 예: `totla-quiality` 대신 `quality-review-total`.
- 작성자가 중요한 리뷰 문서는 마지막에 작성자를 붙인다. 예: `...-grok.md`, `...-gemini.md`.
- 같은 날짜에 같은 성격의 문서가 여러 개 있으면 대상 또는 작성자를 추가한다.

## 5. 새 문서 추가 기준

새 문서를 만들 때는 먼저 다음 중 하나로 분류한다.

- 제품 기준 문서인가? `product/`
- 특정 Phase 리뷰인가? `reviews/phase/`
- 전체 품질/기술 검토인가? `reviews/quality/`
- 사용자 또는 외부 평가 피드백인가? `reviews/user-feedback/`
- 이미지/스크린샷/참고 자료인가? `reference/images/`
- 더 이상 실행 기준으로 쓰지 않는 과거 자료인가? `archive/`

분류가 애매하면 문서의 주 사용 목적을 기준으로 한다. 예를 들어 UX 평가가 Phase 상태도 언급하더라도, 사용자 관점의 워크플로우 평가라면 `reviews/user-feedback/`에 둔다.

## 6. 정리 작업 절차

1. 이동/이름 변경 대상 목록을 먼저 만든다.
2. 본문 수정 없이 `git mv`로 파일과 폴더를 이동한다.
3. 문서 내부의 상대 이미지 링크가 깨지는지 확인한다.
4. 제품 계획서처럼 다른 파일에서 자주 참조되는 문서는 전체 검색으로 링크를 갱신한다.
5. 정리 작업 커밋에는 문서 본문 변경을 포함하지 않는다.

## 7. 유지보수 체크리스트

- `docs/` 루트에 새 단발성 리뷰 문서를 직접 추가하지 않았는가?
- 날짜 접두사가 필요한 문서에 `YYYY-MM-DD`가 붙었는가?
- 파일명만 봐도 목적, 대상, 작성자를 알 수 있는가?
- 이미지 파일명이 `image.png`처럼 일반명으로 남아 있지 않은가?
- 제품 계획서의 단일 원천 역할이 유지되는가?
- 문서 이동과 본문 수정이 같은 작업에 섞이지 않았는가?
