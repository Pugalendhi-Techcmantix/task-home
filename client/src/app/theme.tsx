import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "./motion";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Must match the inline script in index.html that applies the theme before first paint. */
export const THEME_STORAGE_KEY = "tt-theme";

interface ThemeContextValue {
  theme: ThemePreference;
  resolved: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

const systemQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Runs a theme class change with CSS transitions switched off for one frame, so controls with colour
 * transitions don't fade between palettes at different speeds. The theme toggle's own icon
 * (`data-theme-icon`) is exempt so its cross-rotate still plays.
 */
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent =
    "*:not([data-theme-icon]),*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  change();
  // Force the new colours to be computed while transitions are still off.
  void getComputedStyle(document.body).color;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState<boolean>(() => systemQuery().matches);

  // Follow the OS setting while the preference is "system".
  useEffect(() => {
    const query = systemQuery();
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    const dark = resolved === "dark";
    // First render: the inline script in index.html already applied the class before paint.
    if (root.classList.contains("dark") === dark) return;
    const apply = () => withoutTransitions(() => root.classList.toggle("dark", dark));
    // One calm whole-page cross-fade instead of every control re-colouring at its own speed.
    if ("startViewTransition" in document && !prefersReducedMotion()) document.startViewTransition(apply);
    else apply();
  }, [resolved]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode): the choice still applies for this visit.
    }
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
