import type { CreateTaskInput } from "@tracker/shared";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { buttonPrimary, buttonSecondary, iconButton } from "../lib/styles";
import { TASK_FORM_ID, TaskForm } from "./TaskForm";

interface NewTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Resolves when the task is created. Rejects with ApiError to show field errors in the form. */
  onCreate: (input: CreateTaskInput) => Promise<void>;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Right-side panel (full screen on phones) holding the create form. Unmounts when closed, so the form resets. */
export function NewTaskDrawer({ open, onClose, onCreate }: NewTaskDrawerProps) {
  if (!open) return null;
  return <DrawerPanel onClose={onClose} onCreate={onCreate} />;
}

function DrawerPanel({ onClose, onCreate }: Omit<NewTaskDrawerProps, "open">) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // On open: remember what had focus, focus the first field, and lock page scroll.
  // On close: restore both.
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    // Keep keyboard focus inside the dialog.
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-40" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="absolute inset-y-0 right-0 flex w-full animate-drawer-in flex-col bg-white shadow-2xl shadow-slate-900/20 sm:max-w-md"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
              New task
            </h2>
            <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">
              Log a task or bug for your team.
            </p>
          </div>
          <button type="button" onClick={onClose} className={`${iconButton} -mr-2`} aria-label="Close">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <TaskForm onSubmit={onCreate} onSubmittingChange={setSubmitting} />
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Cancel
          </button>
          <button type="submit" form={TASK_FORM_ID} disabled={submitting} className={buttonPrimary}>
            {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {submitting ? "Creating…" : "Create task"}
          </button>
        </footer>
      </div>
    </div>
  );
}
