import { CheckSquare, LayoutDashboard, Moon, Plus, Search, ShieldCheck, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
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

/** ⌘K / Ctrl+K: jump to pages, tasks and people, or run quick actions. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { openNewTask } = useNewTask();
  const { resolved, setTheme } = useTheme();
  const tasks = useTasks();
  const members = useMembers();

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
        className="h-8 w-9 justify-start gap-2 px-2.5 text-muted-foreground sm:w-56"
      >
        <Search aria-hidden="true" />
        <span className="hidden sm:inline">Search tasks, people…</span>
        <kbd className="ml-auto hidden rounded border px-1.5 font-sans text-[10px] sm:inline" aria-hidden="true">
          Ctrl K
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
              <CommandItem onSelect={() => run(openNewTask)}>
                <Plus aria-hidden="true" />
                New task
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => setTheme(resolved === "dark" ? "light" : "dark"))}>
                {resolved === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                Switch to {resolved === "dark" ? "light" : "dark"} theme
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {PAGES.map(({ to, label, Icon }) => (
                <CommandItem key={to} onSelect={() => run(() => void navigate(to))}>
                  <Icon aria-hidden="true" />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            {(tasks.data?.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tasks">
                  {tasks.data?.map((task) => (
                    <CommandItem
                      key={task.id}
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
                  {members.data?.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.name} ${member.id}`}
                      keywords={[member.email]}
                      onSelect={() => run(() => void navigate(`/tasks?assignee=${member.id}`))}
                    >
                      <MemberAvatar name={member.name} className="size-5 text-[9px]" />
                      {member.name}
                      <span className="ml-auto text-xs text-muted-foreground">{member.openTaskCount} open</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
