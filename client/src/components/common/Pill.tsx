import type { MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@tracker/shared";
import { SignalHigh, SignalLow, SignalMedium, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MEMBER_STATUS_LABELS, PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type Tone = "sky" | "warn" | "good" | "bad" | "violet" | "neutral" | "brand";

/** Soft background + AA-contrast ink text + a hairline border drawn from the text colour. */
export const TONE_CLASSES: Record<Tone, string> = {
  sky: "bg-sky-soft text-sky-ink border-current/20",
  warn: "bg-warn-soft text-warn-ink border-current/20",
  good: "bg-good-soft text-good-ink border-current/20",
  bad: "bg-bad-soft text-bad-ink border-current/20",
  violet: "bg-violet-soft text-violet-ink border-current/20",
  brand: "bg-brand-soft text-brand-ink border-current/20",
  neutral: "bg-secondary text-muted-foreground border-border",
};

/** Tone changes (a status or role switching) ease between colours instead of snapping. */
const PILL_TRANSITION = "transition-[color,background-color,border-color] duration-(--dur-2) ease-(--ease-snappy)";

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
        "inline-flex h-5 items-center gap-1.5 rounded-[6px] border px-2 text-[11px] leading-none font-medium whitespace-nowrap",
        PILL_TRANSITION,
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className="size-1.5 shrink-0 rounded-full bg-current shadow-[0_0_0_3px_color-mix(in_oklab,currentColor_15%,transparent)]"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: TaskStatus }) {
  return <Pill tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Pill>;
}

const PRIORITY_STYLE: Record<TaskPriority, { className: string; Icon: LucideIcon }> = {
  high: { className: "text-bad-ink", Icon: SignalHigh },
  medium: { className: "text-warn-ink", Icon: SignalMedium },
  low: { className: "text-muted-foreground", Icon: SignalLow },
};

export function PriorityLabel({ priority, className }: { priority: TaskPriority; className?: string }) {
  const { className: tone, Icon } = PRIORITY_STYLE[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap", PILL_TRANSITION, tone, className)}>
      <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
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
