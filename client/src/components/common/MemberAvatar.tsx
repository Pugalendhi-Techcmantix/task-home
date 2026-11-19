import { initials } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Solid backgrounds that keep white initials above 4.5:1 contrast in both themes. */
const AVATAR_COLORS = ["#2c6a99", "#6d4bb0", "#0d7a6b", "#9a5b0c", "#b03a10", "#3d5a80", "#1b7a45"] as const;

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

interface MemberAvatarProps {
  name: string;
  size?: "sm" | "md";
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
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white",
        size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        muted && "bg-faint",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
