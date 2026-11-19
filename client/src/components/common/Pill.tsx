import type { MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@tracker/shared";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MEMBER_STATUS_LABELS, PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type Tone = "sky" | "warn" | "good" | "bad" | "violet" | "neutral" | "brand";

/** Soft background + matching text + a faint same-hue border. */
export const TONE_CLASSES: Record<Tone, string> = {
  sky: "bg-sky-soft text-sky border-sky/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  good: "bg-good-soft text-good border-good/25",
  bad: "bg-bad-soft text-bad border-bad/25",
  violet: "bg-violet-soft text-violet border-violet/25",
  brand: "bg-brand-soft text-brand border-brand/25",
  neutral: "bg-secondary text-muted-foreground border-border",
};

export const STATUS_TONES: Record<TaskStatus, Tone> = { todo: "sky", in_progress: "warn", done: "good" };

interface PillProps {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

/** Small rounded label: the reference's dotted status pill. */
export function Pill({ tone, children, dot = true, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-[5px] border px-1.5 text-[11px] font-semibold whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: TaskStatus }) {
  return <Pill tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Pill>;
}

const PRIORITY_STYLE: Record<TaskPriority, { className: string; Icon: LucideIcon }> = {
  high: { className: "text-bad", Icon: ArrowUp },
  medium: { className: "text-warn", Icon: Minus },
  low: { className: "text-muted-foreground", Icon: ArrowDown },
};

export function PriorityLabel({ priority, className }: { priority: TaskPriority; className?: string }) {
  const { className: tone, Icon } = PRIORITY_STYLE[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap", tone, className)}>
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

const ROLE_TONES: Record<MemberRole, Tone> = { admin: "violet", member: "sky", viewer: "neutral" };

export function RolePill({ role }: { role: MemberRole }) {
  return (
    <Pill tone={ROLE_TONES[role]} dot={false}>
      {ROLE_LABELS[role]}
    </Pill>
  );
}

export function MemberStatusPill({ status }: { status: MemberStatus }) {
  return <Pill tone={status === "active" ? "good" : "neutral"}>{MEMBER_STATUS_LABELS[status]}</Pill>;
}
