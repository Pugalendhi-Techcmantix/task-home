# Motion layer: "Calm, physical, fast" (direction)

Builds on `2026-11-20-ui-polish-direction.md` (branch feature/ui-polish). Visual only: no business logic, API,
`shared/`, server, query hooks, validation or tests change. **No new dependencies**: CSS (transitions, keyframes,
`linear()` spring easings), the Web Animations API and small React hooks only.

## Principles
- Motion explains change: where something came from, what changed, what is now active. Never decoration on loop.
- Fast: 120-180ms for hover/press/toggles, 200-280ms for panels/menus/route changes, max 600ms for one-time
  data reveals (meters, count-up). Exits are ~30% faster than entrances.
- Physical: spring-like easing via CSS `linear()`; small distances (4-8px rises, 0.96-0.98 scale), no bounce
  bigger than a 2-3% overshoot.
- Only `transform`, `opacity`, `filter`, `clip-path` and `background-color`/`color` animate. No layout-thrashing
  properties (width/height/top) except the existing meter width transition.
- Animate on mount / on change only, never on every refetch or re-render. Respect data identity (key by id).
- `prefers-reduced-motion: reduce`: no movement or scale; at most a 120ms opacity fade; count-up shows the final
  number immediately.
- Interruptible: hover/press states use transitions (not keyframes) so they reverse cleanly.

## Tokens (worker A adds to `client/src/index.css`, names are a contract)
- `--ease-spring: linear(0, 0.25 7%, 0.56 14%, 0.82 22%, 0.97 31%, 1.03 40%, 1.02 50%, 1 64%, 1)` (soft spring)
- `--ease-snappy: cubic-bezier(.2,.9,.25,1)`; existing `--ease-out-quint`; `--ease-in: cubic-bezier(.4,0,1,1)`
- `--dur-1: 120ms` (micro), `--dur-2: 180ms` (controls), `--dur-3: 240ms` (panels), `--dur-4: 420ms` (reveals)
- Utility classes (exact names; B and C rely on them):
  - `.motion-press`: `active:scale-[.97]` with `--dur-1` transform transition (buttons, chips, cards that click)
  - `.motion-lift`: hover `translateY(-1px)` + shadow step up, `--dur-2 --ease-snappy` (cards, KPI tiles)
  - `.motion-fade-up` (+ `--i` stagger, 35ms step, cap at 10 items): enter fade + 6px rise, `--dur-3 --ease-spring`
  - `.motion-pop`: enter scale .96 -> 1 + fade, `--dur-2 --ease-spring` (chips, badges, toasts)
  - `.motion-flash`: background pulse in `--brand-soft` that fades out over 1.2s (row changed / highlighted)
  - `.motion-shimmer`: existing skeleton shimmer, slower and softer
  - all gated by `@media (prefers-reduced-motion: no-preference)`; under `reduce` they become no-ops or a fade

## A) Primitives + shell
Owns `client/src/index.css`, `client/src/components/ui/*`, `client/src/components/layout/*`, `client/src/app/*`.
- Buttons: `.motion-press`; icon rotate/translate micro-motion on hover for arrow icons (2px).
- Sheet: slide in with `--ease-spring` 280ms, out 200ms `--ease-in`; overlay fades. Dialog/alert-dialog: scale .96
  + fade in with spring, faster exit. Dropdown/select/popover/tooltip: origin-aware scale .97 + fade 160ms
  (use Radix `--radix-*-transform-origin`).
- Tabs (segmented): the active pill SLIDES between tabs (single indicator element positioned from the active
  trigger, transform transition with `--ease-spring`), not a cross-fade. Must stay correct on resize and keyboard.
- Switch: thumb uses `--ease-spring`; track colour 180ms.
- Sidebar: open/rail collapse animates width with `--ease-snappy` 240ms; labels fade/clip (no text reflow jump);
  active nav indicator bar slides between items (single element, transform), nav hover tint 120ms.
- Route change: content fades + 6px rise (`--dur-3 --ease-spring`) keyed by pathname; previous page does not
  animate out (keep it instant to stay fast). Optionally use `document.startViewTransition` only if supported
  and reduced motion is off; fall back to the CSS enter.
- Command palette: open scale .98 + fade; result rows `.motion-fade-up` stagger on first open only; active row
  background glides (transition) with keyboard movement.
- Toasts (sonner): spring enter from top, quick fade exit.
- Theme toggle: icon cross-rotate 180ms; theme switch itself without a full-page colour flash (disable
  transitions for one frame while toggling the class, standard technique).
- Focus rings animate in (outline-offset 0 -> 2px, 120ms).

## B) Dashboard
Owns `client/src/features/dashboard/*` (new files allowed there, e.g. `useCountUp.ts`).
- KPI tiles: `.motion-fade-up` stagger + `.motion-lift` on hover; numbers count up from 0 to the value on first
  mount (420-600ms, ease-out, `requestAnimationFrame`, tabular numerals so width does not jitter); later value
  changes tween from old to new value; reduced motion = final value instantly. Screen readers get the final value
  only (`aria-live` off; render the real value in an sr-only span or set aria-label).
- Meters (workload): fill grows from 0 on mount with `--dur-4 --ease-spring`, staggered per row.
- Tasks by status bar: segments grow from the left on mount (scaleX with transform-origin left, staggered).
- Needs attention rows: `.motion-fade-up` stagger; hover arrow slides 2px right.

## C) Tasks + Team + Roles + common
Owns `client/src/features/tasks/*.tsx` (not queries.ts/urlFilters.ts), `client/src/features/team/*.tsx`
(not queries.ts), `client/src/features/roles/*`, `client/src/components/common/*`, `client/src/features/NotFoundPage.tsx`,
`client/src/features/RouteError.tsx`.
- Task rows/cards: `.motion-fade-up` stagger on first page load only (not on refetch, filter change uses a quick
  80ms cross-fade of the list instead); a newly created task row enters with `.motion-pop`; deleted rows fade
  and collapse quickly (opacity + scaleY or grid-rows 1fr->0fr, 180ms) without breaking focus management.
- A row whose status/priority/assignee just changed gets `.motion-flash` once (detect by comparing previous
  values per task id in a ref; no data/logic change).
- Status chip: colour transitions 180ms; the dot does a small scale pulse on change.
- Filter property chips: `.motion-press`; set/unset state transitions colour and border 180ms; "Clear filters"
  enters with `.motion-pop`; the "N tasks" count tweens.
- Row "…" button: reveal fades in 120ms (already reveal-on-hover; make it a smooth opacity transition).
- Sheet form: inline errors slide down 4px + fade; the Save button shows the spinner with a cross-fade.
- Team/Roles rows: same `.motion-fade-up` first-load stagger; switch already handled by A; role change flashes
  the row once.
- Common: `KpiCard` gets `.motion-lift`; `EmptyState` icon tile gets a gentle one-time `.motion-pop`; Pills get
  colour transitions; 404 numeral fades up.

## Constraints for everyone
No new deps; TypeScript strict, no any/@ts-ignore/escaping casts; keep focus management, keyboard access and AA
contrast; every animation has a reduced-motion path; never block interaction during an animation (no
pointer-events: none on interactive content after it is visible); no layout shift on load (CLS); run
`npm run typecheck && npm run lint && npm test && npm run build` before handing back (144 tests).
