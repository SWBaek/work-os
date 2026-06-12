# Phase 3.7 Product Decisions

Date: 2026-06-12
Source: `docs/reviews/user-feedback/2026-06-11-human-feedback.md`

## Decisions

1. Top-level Tasks stays in the MVP.
   - Role: direct task creation for work that does not start from Inbox.
   - Guardrail: do not merge it into Inbox during Phase 3.7.

2. Top-level Kanban stays in the MVP.
   - Role: whole-workspace task visualization.
   - Dashboard Kanban remains the daily embedded view.
   - Later follow-up may clarify filtering differences, but Phase 3.7 does not remove the route.

3. `/inbox` is secondary triage/history.
   - Dashboard is the primary fast capture and immediate cleanup surface.
   - `/inbox` focuses on Unprocessed, Converted, and Archived history.

4. Project list remains card-based for this gate.
   - Phase 3.7 improves card entry, status visibility, and link purpose.
   - A larger card/list/table redesign is deferred.

5. Project status presentation uses explicit status filters now.
   - Status coverage must include All, Active, On Hold, Done, and Archived.
   - Sectioned or hybrid status presentation can be revisited later.

6. Meeting Notes remains Markdown-first.
   - Markdown storage and live editor stay core.
   - Form-first meeting note input is deferred as a later exploration.

7. Decisions and Search remain placeholders until their phases.
   - Phase 3.7 does not implement full Decisions or full Search.
   - Placeholder visibility can remain as navigation context, but must not imply feature completion.

## Follow-Up Candidates

- Project detail information architecture redesign.
- Project card/list/table comparison.
- Meeting Notes form-first input experiment.
- Top-level Kanban differentiation from Dashboard Kanban.
- Optional audit-history UI surface if audit evidence remains too hidden after verification.
