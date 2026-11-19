import { Check } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <span
          className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white"
          aria-hidden="true"
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">Task Tracker</span>
        <span className="hidden text-sm text-slate-300 sm:inline" aria-hidden="true">
          /
        </span>
        <span className="hidden text-sm text-slate-500 sm:inline">Team workspace</span>
      </div>
    </header>
  );
}
