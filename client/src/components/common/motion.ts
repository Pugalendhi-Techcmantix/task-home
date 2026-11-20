import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { prefersReducedMotion } from "@/app/motion";

/**
 * Small motion helpers for lists (see docs/superpowers/specs/2026-11-20-motion-direction.md).
 * CSS classes from index.css do the declarative work; the Web Animations API is used only where an
 * animation has to be interruptible or driven by measured values (row reflow, row exit).
 */

/** Inline style that may also carry CSS custom properties such as `--i`. */
export type MotionStyle = CSSProperties & { [key: `--${string}`]: string | number };

export interface MotionProps {
  className?: string;
  style?: MotionStyle;
}

const NONE: MotionProps = {};
const POP: MotionProps = { className: "motion-pop" };
const EMPTY_IDS: ReadonlySet<string> = new Set();

/** The `--i` stagger cap in `.motion-fade-up` (index.css). */
const STAGGER_CAP = 10;
/** A little longer than `.motion-flash` (1.2s) so the class never comes off mid-animation. */
const FLASH_MS = 1300;

/** WAAPI cannot read CSS variables, so these mirror `--ease-snappy` and `--ease-in`. */
const EASE_SNAPPY = "cubic-bezier(0.2, 0.9, 0.25, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

/**
 * For buttons that use `.reveal-on-hover` (row "…" menus): keeps its 120ms opacity fade, which the
 * button's own `transition-[…]` list would otherwise replace.
 */
export const REVEAL_TRANSITION =
  "transition-[opacity,background-color,border-color,box-shadow,color,transform] duration-(--dur-1) ease-(--ease-out-quint)";

export function staggerStyle(index: number): MotionStyle {
  return { "--i": Math.min(index, STAGGER_CAP) };
}

/**
 * Entrance classes for the rows of a list, fixed when the list mounts. Rows present on mount rise in
 * with a short stagger (`"stagger"`) or arrive with their container (`"none"`); rows that appear later,
 * such as a task just created, pop in. CSS animations only run when an element is inserted, so
 * re-renders and refetches never replay them.
 */
export function useRowEntrance(ids: readonly string[], mode: "stagger" | "none" = "stagger") {
  const [initial] = useState(() => new Set(ids));
  return (id: string, index: number): MotionProps => {
    if (!initial.has(id)) return POP;
    return mode === "stagger" ? { className: "motion-fade-up", style: staggerStyle(index) } : NONE;
  };
}

/**
 * Ids of items whose `signature` changed since the previous list, kept for one flash. Compared during
 * render against the previous list (React's "store information from previous renders" pattern), so a
 * first render or a remount never flashes.
 */
export function useChangedIds<T extends { id: string }>(
  items: readonly T[],
  signature: (item: T) => string,
): ReadonlySet<string> {
  const [previous, setPrevious] = useState(items);
  const [changed, setChanged] = useState(EMPTY_IDS);

  if (items !== previous) {
    setPrevious(items);
    const before = new Map(previous.map((item) => [item.id, signature(item)]));
    const ids = items
      .filter((item) => {
        const old = before.get(item.id);
        return old !== undefined && old !== signature(item);
      })
      .map((item) => item.id);
    if (ids.length > 0) setChanged((current) => new Set([...current, ...ids]));
  }

  useEffect(() => {
    if (changed.size === 0) return;
    const timer = window.setTimeout(() => setChanged(EMPTY_IDS), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [changed]);

  return changed;
}

function rowsIn(root: HTMLElement, attr: string): { id: string; el: HTMLElement }[] {
  return [...root.querySelectorAll<HTMLElement>(`[${attr}]`)].flatMap((el) => {
    const id = el.getAttribute(attr);
    // Skip the layout that is hidden at this breakpoint (table vs cards).
    return id !== null && el.offsetParent !== null ? [{ id, el }] : [];
  });
}

/**
 * FLIP for rows that move because a sibling was added or removed: each row starts at its old offset
 * and glides to the new one with a transform, so the list never jumps. `layoutKey` should change
 * only when the set or order of rows changes. Skipped under reduced motion.
 */
export function useRowReflow(rootRef: RefObject<HTMLElement | null>, attr: string, layoutKey: string): void {
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    const next = new Map<string, number>();
    for (const { id, el } of rowsIn(root, attr)) {
      const top = el.offsetTop; // layout position: ignores transforms and page scroll
      next.set(id, top);
      const before = tops.current.get(id);
      if (reduce || before === undefined || before === top) continue;
      el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], {
        duration: 240,
        easing: EASE_SNAPPY,
      });
    }
    tops.current = next;
  }, [rootRef, attr, layoutKey]);
}

/**
 * Fades rows out while their delete is in flight (they leave the DOM once the list refetches). If an id
 * leaves `leavingIds` while its row is still there (the delete failed), the fade plays back.
 * Reduced motion: an opacity fade only.
 */
export function useRowExit(rootRef: RefObject<HTMLElement | null>, attr: string, leavingIds: ReadonlySet<string>): void {
  const running = useRef(new Map<string, Animation[]>());
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const [id, animations] of running.current) {
      if (leavingIds.has(id)) continue;
      for (const animation of animations) {
        animation.onfinish = () => animation.cancel();
        animation.reverse();
      }
      running.current.delete(id);
    }
    const reduce = prefersReducedMotion();
    for (const id of leavingIds) {
      if (running.current.has(id)) continue;
      const animations = rowsIn(root, attr)
        .filter((row) => row.id === id)
        .map(({ el }) =>
          el.animate(
            reduce
              ? [{ opacity: 1 }, { opacity: 0 }]
              : [
                  { opacity: 1, transform: "none", transformOrigin: "50% 0" },
                  { opacity: 0, transform: "scaleY(0.9)", transformOrigin: "50% 0" },
                ],
            { duration: reduce ? 120 : 180, easing: EASE_IN, fill: "forwards" },
          ),
        );
      running.current.set(id, animations);
    }
  }, [rootRef, attr, leavingIds]);
}

/**
 * A number that tweens from its last shown value to `target` (ease-out, 320ms), interruptible mid-way.
 * `undefined` (unknown) holds the last value. Reduced motion or the first known value: no tween.
 * Render the result `aria-hidden` and give screen readers the real value.
 */
export function useTweenedNumber(target: number | undefined, duration = 320): number | undefined {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    if (target === undefined) return;
    const from = shownRef.current ?? target;
    if (shownRef.current === target) return;
    const instant = from === target || prefersReducedMotion();
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start) / duration);
      const value = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}
