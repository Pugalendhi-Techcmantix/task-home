import { Plus } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { ToastProvider } from "./components/toast/ToastProvider";

export function App() {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
              <p className="mt-1 text-sm text-slate-500">Track your team&apos;s tasks and bugs.</p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="size-4" aria-hidden="true" />
              New task
            </button>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
