import { useCallback, useEffect, type Ref, type RefCallback, type RefObject } from "react";

/** Points an internal ref and a caller's (optional) ref at the same node. */
export function useMergedRef<T>(innerRef: RefObject<T | null>, outerRef: Ref<T> | undefined): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      assignRef(innerRef, node);
      assignRef(outerRef, node);
    },
    [innerRef, outerRef],
  );
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/** Mirrors the CSS tokens in index.css; used only where WAAPI needs a value and the token can't be read. */
const FALLBACK_SPRING = "cubic-bezier(0.2, 0.9, 0.25, 1)";

/** True when the user asked for reduced motion. Safe outside a browser (tests, SSR): returns false. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Reads `--ease-spring` from :root, falling back to the snappy curve where `linear()` is unsupported. */
export function springEasing(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--ease-spring").trim();
  return value && CSS.supports("transition-timing-function", value) ? value : FALLBACK_SPRING;
}

/** Parses a computed `translate` value ("none", "4px", "0px 12px") into x/y pixels. */
function readTranslate(value: string): { x: number; y: number } {
  if (!value || value === "none") return { x: 0, y: 0 };
  const [x = "0", y = "0"] = value.split(" ");
  return { x: Number.parseFloat(x) || 0, y: Number.parseFloat(y) || 0 };
}

interface GlideOptions {
  /** Attribute that marks the active item, e.g. `data-active` or `data-selected`. */
  attribute: string;
  /** The pseudo-element that draws the active marker, e.g. `::before`. */
  pseudo: "::before" | "::after";
  /** Duration in ms. */
  duration: number;
}

/**
 * FLIP for an "active marker" drawn as a pseudo-element of each item (the sidebar's brand bar,
 * the command palette's highlighted row). When the active item changes, the new item's marker
 * starts where the previous one was and springs into place, so the eye sees one marker glide.
 *
 * Each marker still lives inside its own item, so it is always correct after a resize, a sidebar
 * collapse or a scroll; the animation is only a one-off translate. An interrupted glide restarts
 * from the marker's current on-screen position, not from the previous item.
 */
export function useActiveGlide(
  rootRef: RefObject<HTMLElement | null>,
  { attribute, pseudo, duration }: GlideOptions,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new MutationObserver((records) => {
      let from: HTMLElement | null = null;
      let to: HTMLElement | null = null;
      for (const record of records) {
        const target = record.target;
        if (!(target instanceof HTMLElement)) continue;
        const isActive = target.getAttribute(attribute) === "true";
        const wasActive = record.oldValue === "true";
        if (wasActive && !isActive) from = target;
        else if (!wasActive && isActive) to = target;
      }
      if (!from || !to || from === to || prefersReducedMotion()) return;

      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      // Where the outgoing marker actually is right now, including any glide still in flight.
      const inFlight = readTranslate(getComputedStyle(from, pseudo).translate);
      for (const animation of [...from.getAnimations({ subtree: true }), ...to.getAnimations({ subtree: true })]) {
        if (animation.effect instanceof KeyframeEffect && animation.effect.pseudoElement === pseudo) {
          animation.cancel();
        }
      }

      const dx = fromRect.left + inFlight.x - toRect.left;
      const dy = fromRect.top + inFlight.y - toRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      to.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }], {
        duration,
        easing: springEasing(),
        pseudoElement: pseudo,
      });
    });

    observer.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: [attribute],
      attributeOldValue: true,
    });
    return () => observer.disconnect();
  }, [rootRef, attribute, pseudo, duration]);
}
