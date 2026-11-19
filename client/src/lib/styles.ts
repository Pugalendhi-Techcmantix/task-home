/** Shared Tailwind class strings, so every button and field looks and behaves the same. */

const focusRing =
  "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none";

export const buttonPrimary = `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const buttonSecondary = `inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const buttonGhost =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none";

export const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none";

const fieldBase =
  "w-full rounded-lg border bg-white text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 hover:border-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60";

/** Text input / textarea. Pass `invalid` to switch to the error colors. */
export function inputClass(invalid = false): string {
  return `${fieldBase} px-3 ${
    invalid
      ? "border-red-500 focus-visible:border-red-600 focus-visible:ring-red-600/25"
      : "border-slate-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/30"
  }`;
}

/** Native select with room for the chevron icon drawn on top of it. */
export const selectClass = `${fieldBase} h-9 cursor-pointer appearance-none border-slate-300 py-0 pr-8 pl-3 focus-visible:border-brand-600 focus-visible:ring-brand-600/30`;
