# WorksOS — Grok $100/mo User Experience & Workflow Review

**Reviewer**: Grok 4.3 (xAI)  
**Persona**: Hypothetical power user paying $100/month for a single-user work OS that I rely on daily for all inbound work capture, task execution, project context, meeting records, and later retrieval.  
**Date**: 2026-06 (based on current codebase state)  
**Method**: Static code inspection of implementation vs. `docs/WorksOS-Product-Plan-v2.md`, phase JSONs, `.agents/DESIGN.md`, `ui-design-guide`, `coding-standards`, plus cross-reference with prior reviews. Focused on actual human friction in core flows. No live browser session in this analysis pass; claims grounded in source (App.tsx, routes, editor, i18n, schemas).  
**Scope**: All currently "completed" phases (0-3) + visible stubs/placeholders. P4–P7 gaps called out only where they directly block daily use.

**Karpathy Guideline Application (self-imposed for this report)**:  
- Assumptions stated explicitly.  
- Every friction point traces to specific file:line or plan section.  
- No speculative features or "nice-to-haves" beyond what the product already promises in its own spec.  
- Minimum prose that still allows a reader to act; bullets and tables preferred.  
- Success criteria for fixes are verifiable (e.g., "remove the 5-column grid").

---

## Executive Verdict

**Current state is not a $100/month product for a serious single user.**

I would pay $0–15/month as an interesting local prototype or internal alpha. At $100 I expect the core promise ("Inbox → Task → Project context → Kanban + Meeting Notes + Decisions + Search + I will not lose my data or my mind trying to find something later") to be reliable enough that I stop worrying about the system itself.

Today the system lets me **put work in** and **move cards around**. It does **not** yet let me **trust that I can get work out** (find it, understand why it exists, protect the record). Broken Korean text in critical screens destroys the "professional tool" feeling in the first 30 seconds. Several high-frequency flows have unnecessary steps or fragile matching logic that a paid user will hit daily.

**Willingness to pay at $100/mo today: 0/10.**  
**After the P0/P1 items below are fixed and verified: 6–7/10** (still room for polish and Phase 6/7 trust features).

---

## 1. Methodology & Evidence Base (No Hidden Assumptions)

- Primary artifact: `apps/web/src/App.tsx` (≈1009 lines, contains Dashboard, Projects, ProjectDetail + all 6 tabs routing, Inbox, Tasks, KanbanBoard, MeetingNote* pages, Settings, all forms, TaskCard, routing table).
- Backend surface: `apps/server/src/routes/index.ts` (meeting-notes, action-items convert, export, settings, core P1 entities; search/decisions/backup routes absent).
- Editor: `apps/web/src/components/MeetingNoteEditor.tsx` (custom roundtrip + 1s debounce; not full TipTap document model).
- i18n: `apps/web/src/lib/i18n/ko.json` (≈60 keys, many English fallbacks or missing) + direct usage in App.tsx.
- Custom primitives: `apps/web/src/components/ui-lite.tsx` (Button/Input/Select/Badge/StatusBadge/PageHeader; shadcn/ui declared in stack but not used for these).
- Design tokens: `.agents/DESIGN.md` (LG Red #A50034 only for earned attention, 10px radius, Pretendard, flat, neutral-heavy).
- Product contract: `docs/WorksOS-Product-Plan-v2.md` sections 5–6, 8 (scenarios), 15.5–15.6 (shortcuts, i18n), 18 (backup), 23 (non-goals).
- Phase reality: `plan/phase_*.json` (0–3 completed, 4 search + 5 decisions + 6 backup not_started).
- Supporting: prior Grok phase-1 review, total-quality review, paid-user review (2026-06-10) — used only for delta, not as sole source.

**Explicit assumption**: The source we read is the current deployed behavior (no uncommitted "fix i18n" branch). If live app differs, the gap itself is a process/ops issue for a paid tool.

---

## 2. Core Workflow Analysis — Human Friction Points

### 2.1 Daily Capture ("Quick" Inbox)

**Product promise** (plan 6.4, 8.1, P2-T2): Dashboard top has a one-line "Quick Inbox Input" — raw content + minimal project, Enter to capture without thinking.

**Reality** (`apps/web/src/App.tsx:261` (Dashboard), `75–104` (QuickInbox component)):
- Implemented as 5-column CSS grid: `[140px source select] [1fr content] [180px project] [180px tags] [auto button]`.
- Every capture requires choosing source_type (even if default Other), optional project/tags.
- No "raw throw it in and classify later" one-field path visible on first use.
- On success it clears only some fields; no visible confirmation beyond query invalidation.

**Human experience**: This is a small CRUD form, not capture. A $100 user who receives 20–30 inbound items/day will feel the micro-friction every time. The "Quick" label in the plan is aspirational; the code delivers "Inbox create with extra fields."

**Related**: Full Inbox page (`680–707`) has almost identical 4–5 field form again. Duplication of capture UI.

### 2.2 Convert (Inbox → Task, 1:N)

**Promise** (plan 5.1, 5.2, P1-CC2, scenario 8.2): Fast, deliberate conversion preserving raw content; one Inbox can spawn multiple Tasks; clear link back.

**Reality** (`App.tsx:710–744` ConvertInboxForm, `657–678` InboxList):
- Every Inbox item shows a full 6-column conversion grid (title optional, project, priority, due, tags, convert button) inline.
- Suggested title is just `raw_content.slice(0,64)` — no smart extraction.
- After convert, the display of "converted" uses title equality in one place (`670`) and count in another.
- 1:N is technically supported (you can convert again from the same item); the link `source_inbox` is shown truncated in TaskCard (`70`).

**Friction**:
- Conversion is not a "promote this raw item" action — it is another form-filling step.
- No one-click "convert with same project/priority as last" or "convert as-is".
- In meeting notes Action Items (`604–617`): conversion decides "already converted" by exact `title === actionItem` string match (`605`). If the resulting Task title is edited later, the UI will offer the convert button again (or duplicate risk). Fragile.

### 2.3 Task Visibility & Context Loss

**Promise** (plan 4, 5.6, 8.3–8.4): Task lives inside Project context; you should be able to answer "why does this exist, what was the meeting, what decision led here?"

**Reality**:
- `/tasks/:id` route (`996`) renders the exact same `<Tasks />` list component as `/tasks`. No detail pane, no side panel, no source + related notes + decisions view.
- TaskCard shows truncated source_inbox raw_content and project name (`68–70`), but clicking goes to the flat list.
- Project Overview tab (`405–416`): only metric counts + sub-project form. No "recent Meeting Notes", no "recent Decisions", no "open Waiting blockers". The 6-tab skeleton exists (`338–345`), but content for context is absent or placeholder.
- Decisions tab in project: hard-coded empty state (`420`): `{t.empty}`.

**Human cost**: Every time I look at a task I have to manually navigate to its project, switch tabs, and still don't see the meeting or decision that created context. "Evidence over Memory" (plan section 2) is not delivered.

### 2.4 Kanban & Status

**Good**: dnd-kit + optimistic update (`786–862`) is present and uses TanStack Query correctly (no server state in Zustand). Compact mode on Dashboard respects `dashboard_visible_statuses` from settings.

**Awkward**:
- Dashboard Kanban scope selector (`219–246`) lives under "Projects & Tasks" panel and duplicates some of the full Kanban page.
- Visible columns on compact default to Open/In Progress/Waiting/Done in one place (`811`) while plan and prior reviews discuss different defaults. User can change in Settings, but the first experience is not the "personal command center" described.
- No visual "this task is linked to an open decision" or "this is Waiting because of X" affordance.

### 2.5 Meeting Notes + Action Items (Phase 3)

**Implemented surface** (`425–624` ProjectMeeting* pages, `MeetingNoteEditor.tsx`, server routes `656+`):
- Correct project-scoped routing (no global Meeting Notes menu — follows plan 6.2 and ui-guide).
- TipTap + task list extension present.
- HTML Export exists and calls custom renderer.
- Action item → Task convert button per checkbox line.

**Problems**:
- Editor roundtrip (`MeetingNoteEditor:28–99`): home-grown `markdownToHtml` / `htmlToMarkdown` that handles headings, simple lists, checkboxes, bold/italic/code. Tables, nested lists beyond basic, blockquotes, links with titles, code fences with language, horizontal rules — all lost or mangled. Plan 5.8 and P3-T2 explicitly call for `markdown-it + DOMPurify`. Server export (`renderMarkdown:96` and `renderMeetingNoteExport:143`) uses the same custom code.
- Title input in detail page has literal mojibake placeholder (`574`): `placeholder="?뚯쓽濡??쒕ぉ"`.
- Auto-save is 1s debounce on content change + blur handlers on title/date/attendees. Easy to have partial state if you navigate away quickly.
- "Converted" state for action items is only a string title match (see 2.2).
- Export file name sanitization exists, but the HTML itself carries whatever the weak renderer produced.

**Human experience**: I can write a note. I cannot confidently export it to Confluence/SharePoint without manual cleanup. I cannot trust that "the action items I marked done in the note" stay linked if I rename the task.

### 2.6 Search, Decisions, Backup — The "I Trust This With My Job" Layer

**Search (P4, plan 5.10, scenario 8.7)**:  
- Route `/search` → `<Placeholder>` (`999`).  
- No API route in index.ts.  
- Sidebar nav item exists and is clickable → dead end.  
- FTS5 tables were set up in Phase 0 seed, but no sync triggers or query endpoint visible in the inspected routes.  
**Impact**: The entire "Evidence over Memory" value prop is unavailable. As data grows this becomes a blocker faster than any other missing feature.

**Decisions (P5, plan 5.9, 8.6)**:  
- Sidebar item present.  
- Project tab renders empty (`420`).  
- Server has `decisions: true` include in one meeting note query and a recent-3 in project detail, but zero CRUD, zero timeline, zero form, zero /decisions routes.  
**Impact**: Meetings can record "we decided X", but there is no first-class artifact to later answer "when and why did we decide X?" — exactly the use case the product plan sells.

**Backup / Data Trust (P6, plan 18, 22, 23)**:  
- No `/backup/*` or `/export/json` routes in the inspected server code.  
- Settings page has Kanban, theme (mojibake), meeting template — no backup section, no "last backup", no "export everything".  
- Product plan is explicit that local SQLite means the user must have visible, operable backup/restore or they will not put real work here.  
**Impact for $100 user**: Highest trust tax. "If this PC dies tonight, is my entire operating history gone?" — answer today is "I have no UI to know."

---

## 3. Systemic Polish & Trust Killers

### 3.1 Korean Text & Encoding (i18n Debt)

- `ko.json` is skeletal. Large sections of Settings (`917`, `935`, `951`) and the meeting title input render mojibake or raw keys.
- Mixed English/Korean in the same screen (e.g. "My Work Overview", "Converted", status values in English while plan is Korean-first).
- Browser tab / app name may still say "web" per prior reviews.
- Per ui-design-guide 7 and plan 15.6: "모든 UI 텍스트는 사전(dictionary) 파일로 분리" was required even for MVP Korean. Not done at the volume needed.

**Effect**: In the first minute a Korean user sees garbage characters in Settings and forms. Instant loss of confidence. "If the UI text is corrupted, will my raw_content also corrupt?"

### 3.2 Navigation & Information Architecture

- Sidebar advertises Tasks, Kanban, Decisions, Search as top-level even when they are either flat lists or placeholders.
- Project is the only real "context" holder, but users are encouraged to also use global /tasks and /kanban (which lose project filter quickly).
- Meeting Notes correctly hidden from global nav (good), but then the Meeting Notes list page itself repeats the ProjectHeaderCard + TabBar — slight duplication of context.
- TopBar has a fake global search box with ⌘K hint and a notification bell with permanent red dot. Neither does anything.

### 3.3 Component & Consistency Debt (UX symptom)

- Every form is hand-rolled grid + state + mutation. No React Hook Form + Zod visible in the inspected forms despite declared stack.
- Custom ui-lite instead of shadcn/ui primitives (increases visual drift risk and future theming cost).
- TaskCard is used everywhere (good reuse), but the only "detail" affordance is a plain Link that goes nowhere special.
- No empty states that teach the next action (many just say "No items yet" or the t.empty key).

### 3.4 Error & Feedback Visibility

- From prior total-quality review (still visible in code patterns): mutations mostly rely on TanStack invalidation; little inline error or toast on failure.
- Kanban optimistic has rollback on error, but the user may not notice why their drag "snapped back."
- No visible "last sync" or "offline" state (single-host LAN product, but still).

---

## 4. Good Aspects (Credit Where Due)

- Core data model and 1:N Inbox→Task + source linking, status transition guards (extracted to `task-status.ts`), AuditLog, and optimistic Kanban are present and match the plan.
- Project-scoped Meeting Notes routing and separate page (not modal) follows the spec exactly.
- Action Item → Task conversion path exists end-to-end (even if matching is fragile).
- Dashboard surface (Quick + unprocessed + today/overdue/waiting + compact Kanban) is the right shape even if the "quick" part isn't quick enough.
- DESIGN tokens (LG Red only for primary/In Progress/active, neutral surfaces,  rounded-lg, spacing scale) are attempted in the custom components.
- No forbidden scope creep into multi-user or external sync.

These prove the direction is correct. The gaps are execution and completeness, not vision.

---

## 5. Prioritized Recommendations (Verifiable)

**P0 — Blocking for any paid user (do these before asking for money)**

1. Full-text Search (P4) end-to-end: API + FTS5 sync + `/search` UI with entity tabs + result click-through. At minimum support Task + Inbox + MeetingNote body.
2. Decisions CRUD + timeline + Project tab + MeetingNote link + follow-up Task connection (P5 minimal).
3. Backup/Restore + JSON Export visible in Settings + last-backup warning (P6). Even a manual "Backup now" + file list + "Restore" with confirmation is table stakes for local SQLite at $100.
4. Fix all mojibake and complete the i18n dictionary so that Settings, Meeting title inputs, headers, and forms are clean Korean (or at least consistent). Verify no raw keys or garbage appear in any screen.
5. Real Task detail view at `/tasks/:id` (or slide-over) that shows source Inbox, related MeetingNotes, linked Decisions, full description, history. Remove the route alias that renders the list.

**P1 — Daily driver friction (high frequency pain)**

6. Make Dashboard Quick Inbox actually quick: single prominent text field + optional tiny project pill + Enter. Move full source/project/tags to the regular Inbox form or an "expand" affordance. (Measure: capture should feel like one thought, not five inputs.)
7. Replace title-string matching for Action Item converted state with a proper relation (store action_item id or a stable mapping on the Task/MeetingNote side).
8. Replace custom `renderMarkdown` / roundtrip in editor + export with the declared `markdown-it + DOMPurify` (or equivalent that handles tables, fenced code, nested lists, links). Add a test that roundtrip or export of a realistic meeting note with those constructs does not lose content.
9. TaskCard and Inbox item should surface enough context to answer "why does this matter?" without leaving the list (mini project + last meeting snippet + due + priority is minimum).
10. Remove or disable non-functional chrome (fake search box, notification bell with dot, "Classify"/"Snooze" buttons that do nothing). Dead UI is trust poison.

**P2 — Polish & future-proof**

11. Extract pages/features out of the 1000-line App.tsx (surgical split only; behavior unchanged) so that future Meeting/Decision/Search work doesn't touch the same file.
12. Adopt shadcn/ui primitives for new or touched form controls (or document why ui-lite is permanent).
13. Add at least the three keyboard shortcuts from the plan (N, T, /) with proper input-field guard.
14. Project Overview should show the three most recent Meeting Notes + Decisions + any open Waiting items as links (even if the full entities are thin).
15. Consistent empty states that point to the next concrete action ("Create your first Project to see it here").

---

## 6. Final Score (as $100/mo user)

| Dimension                  | Score | Rationale |
|---------------------------|-------|-----------|
| Core capture → execute    | 6/10  | Works but every step has extra fields and no "I got it" feeling |
| Context & retrieval       | 2/10  | Search missing, Decisions missing, Task has almost no context, Overview is counts only |
| Meeting notes as asset    | 4/10  | Editor + convert path exist; renderer & linking too weak for real export/reuse |
| Trust (data durability)   | 1/10  | No visible backup anything |
| Polish / Korean / text    | 2/10  | Mojibake in Settings and forms is immediate credibility killer |
| Navigation & mental model | 5/10  | Correct project scoping in some places, dead top-level items in others |
| Overall "I would pay $100"| 1/10  | Today |

**One-sentence summary**:

WorksOS has the right skeleton and some working muscle (Inbox→Task 1:N, optimistic Kanban, project-scoped notes), but as a daily driver that I would entrust with every inbound request and later need to defend in a project review, it is still a prototype that leaks trust at every important seam: capture is not fast, context evaporates, search and decisions do not exist, backup is invisible, and the UI text is sometimes literally unreadable.

Fix the five P0 items above with tests that a non-developer can watch pass, and the product moves from "interesting local experiment" to "the thing I actually use and would pay to keep running on my LAN."

---

**End of report**

All claims above are traceable to the files and plan sections cited. No features were invented; only the gap between the product's own stated contract and the current implementation was measured from the perspective of someone who would actually write the check every month.