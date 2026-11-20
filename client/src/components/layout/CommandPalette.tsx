import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  CornerDownLeft,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "@/app/theme";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { StatusPill } from "@/components/common/Pill";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNewTask } from "@/features/tasks/NewTaskProvider";
import { useTasks } from "@/features/tasks/queries";
import { useMembers } from "@/features/team/queries";

const PAGES = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", Icon: CheckSquare },
  { to: "/team", label: "Team members", Icon: Users },
  { to: "/roles", label: "Roles & access", Icon: ShieldCheck },
] as const;

/** Cmd on Apple platforms, Ctrl elsewhere. Both modifiers work; this only labels the hint. */
const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

/**
 * Substring match instead of cmdk's default fuzzy scoring: "meera" should find Meera, not
 * "Remove unused feature flags". Matches at the start of a word rank first.
 */
function filterBySubstring(value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  if (!haystack.includes(query)) return 0;
  return haystack.startsWith(query) || haystack.includes(` ${query}`) ? 1 : 0.5;
}

type StaggerStyle = CSSProperties & Record<`--${string}`, number>;

/** How long the first-open stagger owns the rows; after that, rows remounted by filtering just appear. */
const FIRST_OPEN_STAGGER_MS = 700;

/** ⌘K / Ctrl+K: jump to pages, tasks and people, or run quick actions. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { openNewTask } = useNewTask();
  const { resolved, setTheme } = useTheme();
  const tasks = useTasks();
  const members = useMembers();
  // Rows rise in with a short stagger the first time the palette opens only; later opens are instant.
  const [staggerDone, setStaggerDone] = useState(false);

  useEffect(() => {
    if (!open || staggerDone) return;
    const timer = window.setTimeout(() => setStaggerDone(true), FIRST_OPEN_STAGGER_MS);
    return () => window.clearTimeout(timer);
  }, [open, staggerDone]);

  // Stagger order runs top to bottom across groups; the CSS caps the delay after ten rows.
  const enter = (index: number): { className?: string; style?: StaggerStyle } =>
    staggerDone ? {} : { className: "motion-fade-up", style: { "--i": index } };
  const firstTaskRow = 2 + PAGES.length;
  const firstMemberRow = firstTaskRow + (tasks.data?.length ?? 0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+K Meta+K"
        className="h-8 w-9 justify-start gap-2 border-border bg-sunken px-2.5 font-normal text-muted-foreground shadow-none hover:bg-accent sm:w-48 lg:w-72"
      >
        <Search aria-hidden="true" />
        <span className="hidden sm:inline">Search tasks, people…</span>
        <kbd className="kbd ml-auto hidden bg-card lg:inline-flex" aria-hidden="true">
          {MOD_KEY} K
        </kbd>
        <span className="sr-only sm:hidden">Search</span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a page, task or team member, or run an action."
      >
        <Command filter={filterBySubstring}>
          <CommandInput placeholder="Search tasks, people and pages…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem {...enter(0)} onSelect={() => run(openNewTask)}>
                <Plus aria-hidden="true" />
                New task
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem {...enter(1)} onSelect={() => run(() => setTheme(resolved === "dark" ? "light" : "dark"))}>
                {resolved === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                Switch to {resolved === "dark" ? "light" : "dark"} theme
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {PAGES.map(({ to, label, Icon }, index) => (
                <CommandItem key={to} {...enter(2 + index)} onSelect={() => run(() => void navigate(to))}>
                  <Icon aria-hidden="true" />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            {(tasks.data?.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tasks">
                  {tasks.data?.map((task, index) => (
                    <CommandItem
                      key={task.id}
                      {...enter(firstTaskRow + index)}
                      value={`${task.title} ${task.id}`}
                      onSelect={() => run(() => void navigate(`/tasks?task=${task.id}`))}
                    >
                      <CheckSquare aria-hidden="true" />
                      <span className="truncate">{task.title}</span>
                      <span className="ml-auto">
                        <StatusPill status={task.status} />
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {(members.data?.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Team members">
                  {members.data?.map((member, index) => (
                    <CommandItem
                      key={member.id}
                      {...enter(firstMemberRow + index)}
                      value={`${member.name} ${member.id}`}
                      keywords={[member.email]}
                      onSelect={() => run(() => void navigate(`/tasks?assignee=${member.id}`))}
                    >
                      <MemberAvatar name={member.name} size="md" />
                      {member.name}
                      <span className="ml-auto text-xs text-muted-foreground">{member.openTaskCount} open</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div
            className="hidden items-center gap-4 border-t bg-sunken/60 px-4 py-2 text-xs text-muted-foreground sm:flex"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1.5">
              <kbd className="kbd">
                <ArrowUp className="size-3" />
              </kbd>
              <kbd className="kbd">
                <ArrowDown className="size-3" />
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="kbd">
                <CornerDownLeft className="size-3" />
              </kbd>
              Open
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <kbd className="kbd">Esc</kbd>
              Close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
