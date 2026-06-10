---
name: WorksOS
description: A 1-person work operating system for capturing, converting, and tracking personal work across multiple projects. Inspired by LG Electronics corporate identity — restrained, professional, and quietly confident.
colors:
  primary: "#A50034"          # LG Red — the only brand accent
  primary-hover: "#8A002B"
  primary-soft: "#FDF2F4"     # tinted surface for active states
  on-primary: "#FFFFFF"
  bg: "#FFFFFF"
  surface: "#FAFAFA"          # column backgrounds, sidebar
  surface-2: "#F5F5F5"        # hover state for list items
  border: "#E5E5E5"
  border-strong: "#D4D4D4"
  text: "#262626"             # headings
  text-body: "#404040"        # body
  text-muted: "#6B6B6B"       # LG Gray — captions, metadata
  text-disabled: "#A3A3A3"
  status-open: "#0EA5E9"      # sky — Open
  status-progress: "#A50034"  # LG Red — In Progress (brand-aligned)
  status-waiting: "#F59E0B"   # amber — Waiting (external)
  status-hold: "#8B5CF6"      # violet — Hold (intentional)
  status-done: "#16A34A"      # green — Done
  status-archived: "#737373"  # gray — Archived
  status-canceled: "#A3A3A3"  # light gray — Canceled
  danger: "#DC2626"           # Critical priority, destructive actions
  success: "#16A34A"
typography:
  display:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.3
  h1:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.4
  h2:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  body-strong:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
  caption:
    fontFamily: "Pretendard, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 13px
rounded:
  sm: 6px       # chips, tags
  md: 8px       # inputs, buttons
  lg: 10px      # cards
  xl: 12px      # panels, modals
  full: 9999px  # pills, avatars
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body-strong}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-body}"
  card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  task-card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "12px"
  task-card-in-progress:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "12px"
    # Left 4px border in {colors.primary}
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  tab-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  badge:
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.caption}"
---

## Overview

WorksOS is a single-user work OS that lives quietly on a corporate LAN. The interface is **calm productivity software** — close in spirit to Linear's restraint, but warmed by LG's heritage of approachable professionalism. Every pixel is in service of the user's flow: capture fast, convert deliberately, never lose context.

**Mood**: Restrained, confident, slightly serious. The opposite of playful SaaS dashboards covered in gradients and emoji.

**Philosophy**:
- White canvas, neutral grays, **one red**. LG Red (#A50034) is treated as a precious resource — used only where attention is earned (active nav, primary CTA, In Progress signal).
- Information density is high but never crowded. Generous vertical rhythm, tight horizontal grouping.
- No decorative gradients, no glassmorphism, no shadows beyond the faintest card lift on hover.

## Colors

The palette is built on three convictions:

- **Primary (#A50034 — LG Red)**: The only branded color. Reserve it for *interaction* (primary button, active nav item, focused input ring) and for the single status that needs urgency: `In Progress`. Never use it for body text, borders, or decoration.
- **Neutrals (#FFFFFF → #262626)**: Carry 95% of the UI. Pure white surfaces, warm-leaning grays. Borders are nearly invisible (#E5E5E5) — structure comes from spacing, not lines.
- **Status colors**: A 7-step semantic scale mapping to Task `Status`. They appear only as 6px colored dots and column headers in the Kanban board — never as backgrounds or borders.

**Critical rule**: If a screen contains more than three instances of LG Red, something is wrong. Demote the lower-priority instances to neutral.

## Typography

One typeface across the entire product: **Pretendard** (Korean + Latin, free for commercial use, system font fallback included). Monospace is reserved for IDs, code snippets, and the FTS5 search query echo.

| Token | Use case |
| --- | --- |
| `display` (28/700) | Dashboard greeting, empty-state headings |
| `h1` (22/700) | Page titles ("Dashboard", "Q2 전략 보고서") |
| `h2` (18/600) | Section headings within a page ("미처리 Inbox") |
| `body-strong` (14/600) | Task titles, primary button text, table headers |
| `body` (14/400) | Default body, descriptions, list items |
| `caption` (12/400) | Metadata, timestamps, badge text, helper text |
| `mono` (13) | UUIDs in dev tools, Markdown source mode |

Korean and English share the same hierarchy — no font-size adjustment per language. Letter-spacing is the Pretendard default (no overrides).

## Layout

**Grid**: 2-column app shell.
- Sidebar: fixed 240px on the left, `surface` background
- Main: fluid, max content width 1280px, centered when viewport > 1440px
- Page padding: `xl` (24px) horizontal, `lg` (16px) top

**Spacing scale** (used everywhere — never use arbitrary pixels):
`4 / 8 / 12 / 16 / 24 / 32 / 48`

**Density rules**:
- Stack items: 8px between siblings, 16px between sub-groups, 24px between sections
- Within a card: 12px padding, 8px between rows
- Kanban column gap: 12px, card stack gap: 8px

**Breakpoints** (desktop-first — mobile is post-MVP):
- `lg`: 1280px (target)
- `md`: 1024px (degraded: sidebar collapses to icon rail)
- Below 1024px: show "데스크톱 브라우저에서 이용해 주세요" notice

## Elevation & Depth

WorksOS is deliberately flat. Depth is communicated by **spacing and color**, not shadows.

| Level | Used by | Treatment |
| --- | --- | --- |
| 0 | Page background | `{colors.bg}` — no shadow |
| 1 | Cards, sidebar, kanban columns | `{colors.surface}` or 1px `{colors.border}` |
| 2 | Hover state on task card | `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` |
| 3 | Modal, popover, dropdown menu | `box-shadow: 0 8px 24px rgba(0,0,0,0.08)` |
| 4 | Toast notification | `box-shadow: 0 12px 32px rgba(0,0,0,0.12)` |

No blur, no inner shadows, no glow effects.

## Shapes

Corner radius is restrained and consistent.

- Inputs, buttons, tabs → `md` (8px)
- Cards, kanban columns, panels → `lg` (10px)
- Modals → `xl` (12px)
- Status pills, tag chips, avatars → `full`
- Tags (#태그) use `sm` (6px) to differentiate from status pills

Sharp corners (0px) are reserved for full-bleed dividers only.

## Components

### Sidebar Navigation
- 240px wide, full height, `surface` background, no border
- Logo block at top: LG mark in `primary` + "WorksOS" wordmark in `text`, 64px tall
- Nav item: 40px tall, 12px horizontal padding, icon + label, `body` weight
- Active state: `primary-soft` background, `primary` text, 3px left bar in `primary`
- Hover state (inactive): `surface-2` background

### Top Bar
- 56px tall, white, 1px bottom border in `border`
- Left: page title in `h1`
- Right: search icon (⌘K shortcut), theme toggle, settings (small, ghost buttons)

### Quick Inbox Input
- The signature component of the Dashboard
- Full-width, 48px tall, `lg` rounded, 1px `border`
- Left: `+` icon in `text-muted`
- Placeholder: "빠른 입력 ─ 무엇이 들어왔나요?" in `text-muted`
- Right: small project selector pill + Enter hint "↵"
- Focus state: 2px ring in `primary` (use `box-shadow: 0 0 0 2px {primary}33`)

### Task Card
- White, `lg` rounded, 1px `border`, 12px padding
- Row 1: status dot (6px) + title (`body-strong`) + optional priority icon on right
- Row 2: tag chips, max 3 visible, "+N" overflow
- Row 3: due date in `caption` + project name in `caption text-muted`
- **In Progress variant**: 4px left border in `primary`, status dot also in `primary`
- **Critical priority variant**: 4px left border in `danger` — supersedes In Progress border
- Hover: elevation 2, cursor pointer
- Drag state: 0.5 opacity, slight scale (0.98)

### Kanban Column
- `surface` background, `lg` rounded, 12px padding
- Header: status dot + status name (`body-strong`) + count badge in `text-muted`
- Min width 280px, fixed gap between columns 12px
- Drop indicator: 2px horizontal line in `primary` between cards

### Tab Bar (Project Detail)
- Pill tabs, `full` rounded, no underline
- Inactive: `body` weight, `text-body`, transparent background
- Active: `primary-soft` background, `primary` text, `body-strong` weight
- 8px gap between tabs

### Tag Chip
- `sm` rounded, 4px/8px padding, `caption` typography
- Color: `text-body` text on `surface-2` background by default
- Per-tag color (set in Settings) tints the background to 15% opacity, text to the full color

### Status Badge
- `full` rounded, 2px/8px padding, `caption` typography
- Dot (6px) + label in matching status color
- Background: status color at 10% opacity

### Modal
- Center-anchored, max-width 560px (forms) / 800px (meeting notes)
- White, `xl` rounded, elevation 3
- Backdrop: black at 40% opacity
- Header (48px) + body + footer with right-aligned actions
- Primary action right, cancel/ghost left

### Markdown Editor (Meeting Notes)
- TipTap-based, two modes: WYSIWYG and source
- Toolbar: minimal — bold, italic, list, link, heading, code, divider
- Editor area: max-width 720px (optimal reading width), 16px body size
- Headings use the typography scale, not arbitrary sizes

### Empty State
- Centered, icon (32px) in `text-muted`
- Headline in `h2`, supporting text in `body text-muted`
- Single CTA in `button-primary` style

## Do's and Don'ts

**Do**
- Reserve LG Red for moments that earn attention. Three uses per screen, maximum.
- Trust whitespace. If a layout feels tight, add space before adding dividers.
- Use status colors as 6px dots — never as card backgrounds or borders (except the In Progress left bar).
- Keep Korean and English at the same size and weight. The product is bilingual by default.
- Animate sparingly: 150ms ease for hover, 200ms ease-out for state changes. Nothing longer.

**Don't**
- Don't use red for destructive confirmations — that's what `danger` (#DC2626) is for. Red for "delete" should never be confused with red for "LG brand".
- Don't introduce a second brand color. No teal accents, no purple secondaries.
- Don't use gradients anywhere. The product is matte, not glossy.
- Don't add drop shadows to cards at rest. Elevation is reserved for hover and overlays.
- Don't use emoji as functional UI (status icons, priority markers). Use them only inside user content (task titles, note bodies).
- Don't shrink touch targets below 32px even on desktop — the product will eventually go to tablets.
- Don't use the LG corporate logo lockup. WorksOS uses an LG-Red "LG" mark + "WorksOS" wordmark as a derivative — never the full corporate signature.

---

## Agent Prompt Guide

When asking an AI agent to build a WorksOS screen, prepend:

> Use the DESIGN.md tokens. LG Red (`#A50034`) is the only accent — apply it only to: active nav item, primary CTA, In Progress status, and focus rings. Everything else is neutral (`#FFFFFF` background, `#262626` headings, `#404040` body, `#6B6B6B` muted, `#E5E5E5` borders). Typography is Pretendard at 14px body, 22px h1. Cards use 10px radius and a 1px border — no shadows at rest. Status dots are 6px and use the `status-*` color tokens. Keep the layout calm: 16px between sections, 8px between siblings.

**Mockup references** (generated for the v1.0 spec):
- Dashboard: https://www.genspark.ai/api/files/s/jdV0jPWq
- Project Detail (Kanban): https://www.genspark.ai/api/files/s/WFknhQmH
