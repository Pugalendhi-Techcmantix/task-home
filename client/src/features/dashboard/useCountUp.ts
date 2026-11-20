import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/app/motion";

export { prefersReducedMotion };

/** Ease-out quart: quick start, long gentle settle. Input is clamped to 0..1. */
export function easeOutQuart(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 4;
}

/**
 * The whole number shown `elapsedMs` into a tween from `from` to `to`.
 * Before the start it is `from`; at or after `durationMs` it is exactly `to`.
 */
export function countUpValue(from: number, to: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return to;
  if (elapsedMs <= 0) return from;
  return Math.round(from + (to - from) * easeOutQuart(elapsedMs / durationMs));
}

interface CountUpOptions {
  /** Length of the first count from 0 (ms). */
  mountDuration?: number;
  /** Length of a tween from the old to a new value (ms). */
  changeDuration?: number;
  /** Wait before the first count starts (ms), to line up with an entrance stagger. */
  delay?: number;
}

/**
 * Counts a number up from 0 on first mount, then tweens from the value on screen to each new value.
 * Runs only when `target` changes (a refetch with the same number does nothing), cancels its frame on
 * unmount, and returns `target` straight away under prefers-reduced-motion.
 * The returned value is for display only: give screen readers the real `target`.
 */
export function useCountUp(
  target: number,
  { mountDuration = 560, changeDuration = 420, delay = 0 }: CountUpOptions = {},
): number {
  const [reduced] = useState(prefersReducedMotion);
  const [display, setDisplay] = useState(0);
  /** Value currently painted, so an interrupted tween restarts from where it is. */
  const shownRef = useRef(0);
  /** Set on the first painted frame, so React's dev double-mount still gets the first-count timing. */
  const hasCountedRef = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const from = shownRef.current;
    if (from === target) return;

    const first = !hasCountedRef.current;
    const duration = first ? mountDuration : changeDuration;
    const wait = first ? delay : 0;
    let start: number | undefined;
    let frame = 0;

    const tick = (now: number) => {
      start ??= now;
      hasCountedRef.current = true;
      const elapsed = now - start - wait;
      const value = countUpValue(from, target, elapsed, duration);
      if (value !== shownRef.current) {
        shownRef.current = value;
        setDisplay(value);
      }
      if (elapsed < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, mountDuration, changeDuration, delay]);

  return reduced ? target : display;
}
