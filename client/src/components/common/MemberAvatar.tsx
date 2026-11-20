import { initials } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Solid backgrounds that keep white initials above 4.5:1 contrast in both themes. */
const AVATAR_COLORS = ["#2c6a99", "#6d4bb0", "#0d7a6b", "#9a5b0c", "#b03a10", "#3d5a80", "#1b7a45"] as const;

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

const SIZE_CLASSES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
} as const;

interface MemberAvatarProps {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  muted?: boolean;
  className?: string;
}

/** Initials avatar with a stable color derived from the name. Decorative: the name is always shown beside it. */
export function MemberAvatar({ name, size = "sm", muted = false, className }: MemberAvatarProps) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: muted ? undefined : colorFor(name) }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white ring-1 ring-black/10 ring-inset transition-[color,background-color,border-color] duration-(--dur-2) dark:ring-white/12",
        SIZE_CLASSES[size],
        muted && "border border-dashed border-border-strong bg-sunken text-muted-foreground ring-0",
        className,
      )}
    >
      {/* Subtle top-to-bottom sheen */}
      {!muted && <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/18 to-black/10" />}
      <span className="relative">{initials(name)}</span>
    </span>
  );
}
