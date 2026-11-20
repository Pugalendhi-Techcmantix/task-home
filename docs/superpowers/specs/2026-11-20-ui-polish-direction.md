# UI polish: "Quiet precision" (design direction)

Produced by the design strategist agent. Visual changes only: no business logic, API, server, `shared/`,
query hooks or test changes. Sources read: CLAUDE.md, v2 spec visual system, index.css, all common/layout/feature
pages, ui primitives, awesome-design-md notes (Linear, Raycast, Stripe). The reference sites were NOT opened in a
browser; Plane, Superlist and Attio come from general knowledge.

## Take / reject
- **Linear:** hairline borders, three-step surface ladder, 8/12px radii, tight negative tracking, dense rows with
  hover-revealed actions. Reject lavender accent and pure-black canvas (teal and ink stay).
- **Raycast:** keycap-style `kbd`, command-bar search, inset 1px top highlights on dark surfaces, crisp overlay.
  Reject red stripes and dark-only stance.
- **Stripe:** soft layered shadows, tabular numerals, one restrained gradient (page glow), legends with percentages.
  Reject mesh gradients and 300 weights.
- **Plane:** property chips (filters fill when active), soft status chips. Reject heavy blue.
- **Attio:** table-first calm, sticky sunken header, quiet toolbar.
- **Superlist:** friendly roundness, smooth enter motion. Reject colourful illustration.

## Direction
Keep the ink-and-teal identity; move from "flat white boxes on grey" to a layered, hairline-driven surface system:
sunken canvas with a faint teal glow at the top; raised panels with soft two-layer shadows; 12px panels and 8px
controls; semibold, tightly tracked headings; teal reserved for state (active nav, meters, focus, links);
hover-revealed row actions; staggered 180ms enter motion; keycap hints. Nothing decorative without a function.
Every effect respects reduced motion. AA contrast is fixed at the token level (current `--faint` and pill text
colours fail 4.5:1).

## Token changes (worker A, `client/src/index.css`)
Values marked verify MUST be checked with a contrast script before landing.

**Change**
- `--faint`: light `#66737d`, dark `#7d8d98`
- `--background`: light `#f6f8f9` (dark stays)
- `--radius`: `0.5rem`; add `--radius-panel: 0.75rem`
- `--shadow-card`: `0 1px 0 rgb(16 26 32/.03), 0 1px 2px rgb(16 26 32/.05)`; dark `0 1px 2px rgb(0 0 0/.4)`

**Add (both themes)**
- Surfaces: `--sunken` (light `#eef2f4`, dark `#0a1014`), `--border-strong` (light `#cfd7dc`, dark `#34444e`),
  `--row-hover` (light `#f3f6f7`, dark `#162027`), `--highlight` (light `inset 0 1px 0 #fff`,
  dark `inset 0 1px 0 rgb(255 255 255/.05)`)
- Text-on-soft inks (verify >= 4.5:1 on their `-soft`): `--brand-ink #0a6a5c`, `--good-ink #14703c`,
  `--warn-ink #7d5008`, `--bad-ink #a8330c`; dark reuses base colours unless verify fails
- Shadows: `--shadow-raised: 0 1px 2px rgb(16 26 32/.06), 0 4px 12px -2px rgb(16 26 32/.08)`,
  `--shadow-pop: 0 8px 24px -6px rgb(16 26 32/.18), 0 0 0 1px var(--border)`,
  `--shadow-overlay: 0 24px 64px -12px rgb(16 26 32/.35)`; dark: black at 2x opacity
- Glow and motion: `--canvas-glow: radial-gradient(48rem 18rem at 50% -6rem, color-mix(in oklab, var(--brand) 8%, transparent), transparent)`
  (dark 12%); `--ease-out-quint: cubic-bezier(.22,1,.36,1)`; `--dur-fast: 120ms`; `--dur: 200ms`

**Expose in `@theme inline`:** `--color-sunken`, `--color-border-strong`, `--color-row-hover`,
`--color-{brand,good,warn,bad}-ink`, `--shadow-panel` (= `--shadow-card`), `--shadow-raised`, `--shadow-pop`,
`--shadow-overlay`, `--radius-panel`, `--ease-out-quint`.

**Global base:** `body { letter-spacing: -0.006em; font-size: 14px }`; `h1/h2 { letter-spacing: -0.02em }`;
`:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }`; keep the reduced-motion block.

**Utility classes B-D may rely on (exact names, defined by A)**
- `.surface-panel`: card bg, 1px border, `rounded-panel`, `shadow-panel`, `--highlight`
- `.surface-raised`: same with `shadow-raised`
- `.kbd`: keycap, 18px tall, 1px border, bottom border 2px, `bg-sunken`, 10px font, `rounded-[5px]`
- `.eyebrow`: 10.5px / 600 / 0.08em / uppercase / `text-muted-foreground`
- `.num`: tabular figures, tracking -0.01em
- `.row-interactive`: hover `bg-row-hover`, `focus-visible` inset 2px ring, 120ms transition
- `.reveal-on-hover`: `opacity:0` until `.group:hover`, `:focus-within` or `[data-state=open]`; always visible under
  `@media (hover:none)` and below 768px
- `.kpi-edge`: `::before` 2px bar coloured by `--edge` (via `style` or `[data-edge=good|warn|bad|brand]`) plus a 6%
  tint wash fading down
- `.meter` / `.meter-fill`: track `bg-sunken`, 6px, rounded; fill is a brand gradient with a 600ms `ease-out-quint`
  width transition
- `.enter` / `.enter-stagger > *`: fade plus 6px rise, `--dur`, delay `calc(var(--i,0)*40ms)`; only under
  `prefers-reduced-motion: no-preference`
- `.glass-bar`: `bg-card/80`, `backdrop-blur-md saturate-150`, bottom hairline
- `.canvas-glow`: applies `--canvas-glow` as a no-repeat background-image

## Worker specs (disjoint file ownership)

**Only worker A edits `index.css`, `client/src/components/ui/*` and `components/layout/*`.** B, C and D must not
touch them; they use only the tokens and classes above plus existing Tailwind. Anything new goes in their own
className and is reported to A.

### A) Tokens + shell
Owns: `client/src/index.css`, `components/ui/*`, `components/layout/{AppLayout,AppSidebar,CommandPalette,ThemeToggle}.tsx`.
- **Primitives:** Button default ink with `--highlight` inset and soft `shadow-panel`, hover/active states; outline
  buttons get a `border-strong` hairline plus `shadow-panel`; radius 8px; height 32px (`lg` 36px); press
  `translate-y-px`. Input/select/textarea 36px, `border-input`, hover `border-strong`, focus `ring-ring/40` plus
  `border-ring`. Tabs: segmented track `bg-sunken`, active tab `bg-card` + `shadow-panel`, 150ms slide. Table:
  sticky header `bg-sunken/60` with `.eyebrow` styling, rows `.row-interactive`, cells `py-3`. Dialog/sheet/
  alert-dialog: overlay `bg-black/40 backdrop-blur-[2px]`, `shadow-overlay`, 12px radius, `ease-out-quint` enter.
  Dropdown/select/popover/tooltip: `shadow-pop`, 10px radius, 4px padding, 32px items. Command palette: 48px input
  with bottom hairline, `bg-accent` active row with icon chip, keycap footer. Switch teal when on. Skeleton
  shimmer under no-preference, static under reduced motion.
- **Sidebar:** width 15rem, `bg-sidebar`, single right hairline. Header: gradient-ink logo tile plus "Task Tracker"
  and an 11px "Team workspace" caption. Directly under it a full-width "New task" button with `.kbd` "N" calling
  the existing `useNewTask().openNewTask` (icon-only in the rail). Nav items 32px, 8px radius, 16px icons stroke
  1.75; active = `bg-card`, `shadow-panel`, 1px border, `text-brand` icon, `font-medium`, 2px brand bar on the
  left; hover `bg-row-hover`. Counts as small `.num` chips in `bg-sunken`. Footer: shortcut hints (⌘K, N, Ctrl B)
  as `.kbd` rows, hidden in the rail.
- **Top bar:** 48px, `.glass-bar`; breadcrumb "Team workspace / Page" 13px; search as an 18rem command bar
  (`bg-sunken`, hairline, `.kbd` ⌘K); theme toggle and avatar with a hairline ring.
- **Main:** `SidebarInset` gets `.canvas-glow`; `main` is `max-w-[1200px] px-6 py-8`; `key={pathname}` plus
  `.enter` for the route fade; `PageFallback` skeleton matches PageHeader.

### B) Dashboard
Owns: `features/dashboard/DashboardPage.tsx` (plus new files inside `features/dashboard/`).
- KPI row: pass `icon` (CircleDot, Activity, Flame, CheckCheck) to `KpiCard`; values 30px semibold `.num`; edges
  via `.kpi-edge`; first card `brand`.
- Layout: second row is a 12-col grid: Needs attention 7 cols; right 5 cols stacks Workload and Tasks-by-status;
  the full-width status bar goes away.
- Needs attention: rows `.row-interactive group` with a 3px left priority bar (`bg-bad` / `bg-warn` /
  `bg-muted-foreground`), title, meta, `StatusPill`, assignee; trailing ArrowRight `.reveal-on-hover`. Empty state:
  `CheckCheck` chip on `bg-good-soft` plus the existing copy.
- Workload: avatar, name, count, percentage of max as `.meter`; Unassigned uses a muted fill.
- Tasks by status: 10px stacked bar, 2px gaps, rounded segments; legend 3 columns (dot, label, count, percentage);
  keep the links.
- Motion: page gets `.enter-stagger` (`--i` per block). PageHeader gets an `.eyebrow` date line from
  `new Date()` (e.g. "Friday, 20 November"). Skeleton mirrors the new grid.

### C) Tasks
Owns: `features/tasks/{TasksPage,TaskList,TaskFilters,TaskRowControls,TaskForm,EditTaskSheet,NewTaskProvider}.tsx`.
Markup and classNames only: no hooks, queries or prop contracts change.
- `Panel` becomes a `.surface-panel` with toolbar and table inside.
- Toolbar, two tiers: (1) status segmented tabs with `.num` count chips (`bg-sunken`, `rounded-full`, 11px);
  (2) Priority and Assignee as property chips: dashed `border-strong` and ghost when unset; `bg-brand-soft`,
  `text-brand-ink`, solid border with the value when set. Sort at the right as a small segmented control, then a
  "12 tasks" `.num` count and "Clear filters" when active.
- Desktop row: `.row-interactive group`, 52px; title 13.5px medium; description 12px muted one-liner;
  `StatusSelect` soft dotted chip with `-ink` text and hairline; `PriorityLabel` API unchanged; assignee ghost
  select with avatar and hover border; created 12px `.num` muted; `RowMenu` button `.reveal-on-hover`; highlight
  flash uses `--brand-soft` plus a fading ring.
- Phones: each task its own `surface-panel` card in a `space-y-2` list; actions stay visible.
- Sheets (New and Edit): `sm:max-w-lg`; header `.eyebrow` ("New task" / "Edit task"), 16px title and description;
  sticky footer `bg-sunken/60` with Cancel and Save; no keyboard-shortcut hint unless already wired; labels 12px
  medium, controls 36px, inline errors `text-bad-ink` with an icon.
- Skeleton matches 52px rows; empty states use D's `EmptyState`.

### D) Team, Roles, shared components, states
Owns: `components/common/{Page,Pill,MemberAvatar}.tsx`, `features/team/{TeamPage,MemberDialog}.tsx`,
`features/roles/RolesPage.tsx`, `features/NotFoundPage.tsx`, `features/RouteError.tsx`.

**Contract for B and C:** every existing export and prop signature in `Page.tsx` and `Pill.tsx` stays
(`PageHeader`, `Panel`, `PanelHeader`, `eyebrow`, `KpiCard`, `EmptyState`, `ErrorState`, `Tone`, `TONE_CLASSES`,
`STATUS_TONES`, `Pill`, `StatusPill`, `PriorityLabel`, `RolePill`, `MemberStatusPill`, `MemberAvatar`). Additions
are additive only. The one agreed addition: `KpiCard` optional `icon?: LucideIcon` (B uses it).
- PageHeader: title 22px semibold -0.02em; description 13.5px muted; 24px bottom spacing; actions right.
- Panel: `.surface-panel`; `PanelHeader` 44px with `.eyebrow`-style title, hint at the right.
- KpiCard: icon chip top-right (28px, `bg-sunken`, 8px radius), `.kpi-edge`, 30px `.num` value, muted caption.
- Pill: `-ink` text on `-soft` background, hairline `border-current/20`; radius 6px, 20px high, 6px dot with a
  3px 15% halo; `PriorityLabel` uses `SignalHigh`/`SignalMedium`/`SignalLow`; role pills have no dot.
- MemberAvatar: 1px inner ring (`ring-1 ring-inset ring-black/10`, white at 12% in dark), subtle top-to-bottom
  gradient; sizes `sm` 24px, `md` 32px; optional `xs` 20px.
- EmptyState/ErrorState: icon in a 40px `bg-sunken` rounded-xl tile with a hairline; title 14px semibold; body
  13px muted max-w-sm; ErrorState tile `bg-bad-soft`.
- Team page: rows `.row-interactive group`, menu `.reveal-on-hover`; inactive row 60% opacity with dotted avatar;
  email 12px muted; open-task counts `.num` teal links.
- Roles page: info banner as a quiet `.surface-panel` with Info icon and a left 2px accent bar; three role cards
  with icon tile, `.num` active count, one-line description; table controls 32px; keep the guard tooltip.
- 404 and RouteError: centred tile, large muted "404" `.num` (96px, `text-faint` at 30%), title, body, "Go to the
  dashboard" button; RouteError uses the same tile/card styling with a monospace detail box in `bg-sunken`.

## Constraints for everyone
No emoji, no brand wording, no new dead UI; every interactive element keeps a visible focus ring; animations only
under `no-preference`; run `npm run typecheck && npm run lint && npm test` before handing back; verify at 375, 768
and 1440 px in light and dark.
