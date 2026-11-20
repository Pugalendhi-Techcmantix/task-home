import { cn } from "cn";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/app/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function isThemePreference(value: string): value is ThemePreference {
  return OPTIONS.some((option) => option.value === value);
}

/** Both icons stay mounted so the swap can cross-rotate: the outgoing one turns away as the new one turns in. */
const ICON_MOTION =
  "absolute transition-[rotate,scale,opacity] duration-(--dur-2) ease-snappy motion-reduce:transition-opacity";

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const dark = resolved === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${theme}. Change theme`}
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="relative grid size-4 place-items-center" aria-hidden="true">
            <Sun data-theme-icon="" className={cn(ICON_MOTION, dark && "rotate-90 scale-50 opacity-0")} />
            <Moon data-theme-icon="" className={cn(ICON_MOTION, !dark && "-rotate-90 scale-50 opacity-0")} />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isThemePreference(value)) setTheme(value);
          }}
        >
          {OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
