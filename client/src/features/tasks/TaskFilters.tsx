import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskQuery } from "@tracker/shared";
import { Plus, X } from "lucide-react";
import { useId } from "react";
import { useTweenedNumber } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveMembers } from "@/features/team/queries";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { TaskSort } from "./urlFilters";

const ALL = "all";

interface TaskFiltersProps {
  filters: TaskQuery;
  sort: TaskSort;
  /** Every task (unfiltered), used for the status tab counts. */
  allTasks: Task[] | undefined;
  /** Number of tasks currently shown (after filters); the count is hidden while it is unknown. */
  resultCount?: number;
  onChange: (key: "status" | "priority" | "assignee" | "sort", value: string | undefined) => void;
  onClear: () => void;
}

/** `motion-press` also carries the colour/border transition between the unset and set looks. */
const CHIP_BASE = "motion-press h-8 w-auto gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-none";
/** Property chip with no value picked: dashed and ghost. */
const CHIP_UNSET =
  "border-dashed border-border-strong bg-transparent text-muted-foreground hover:bg-row-hover hover:text-foreground dark:bg-transparent dark:hover:bg-row-hover";
/** Property chip with a value picked: filled with the brand tint. */
const CHIP_SET = "border-solid border-brand/30 bg-brand-soft text-brand-ink dark:bg-brand-soft";

function CountChip({ value }: { value: string }) {
  if (value === "") return null;
  return (
    <span className="num rounded-full bg-foreground/[0.07] px-1.5 text-[11px] leading-4 font-medium text-foreground/80">
      {value}
    </span>
  );
}

interface PropertyChipLabelProps {
  label: string;
  /** Whether a value is picked: shows the value next to the label, otherwise a plus. A SelectValue is always
   *  rendered so the open menu can anchor to the trigger. */
  active: boolean;
}

function PropertyChipLabel({ label, active }: PropertyChipLabelProps) {
  if (!active) {
    return (
      <>
        <Plus className="size-3" aria-hidden="true" />
        <SelectValue>{label}</SelectValue>
      </>
    );
  }
  return (
    <>
      <span className="opacity-80">{label}</span>
      <span className="h-3 w-px bg-current opacity-25" aria-hidden="true" />
      <SelectValue />
    </>
  );
}

export function TaskFilters({ filters, sort, allTasks, resultCount, onChange, onClear }: TaskFiltersProps) {
  const members = useActiveMembers();
  const priorityId = useId();
  const assigneeId = useId();
  const hasFilters = filters.status !== undefined || filters.priority !== undefined || filters.assigneeId !== undefined;
  const shownCount = useTweenedNumber(resultCount);
  const count = (status?: string) =>
    allTasks === undefined ? "" : String(allTasks.filter((t) => status === undefined || t.status === status).length);

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3">
      <Tabs value={filters.status ?? ALL} onValueChange={(value) => onChange("status", value === ALL ? undefined : value)}>
        <TabsList aria-label="Filter by status" className="h-9 w-full justify-start overflow-x-auto overflow-y-hidden bg-sunken [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value={ALL} className="flex-none px-2.5">
            All <CountChip value={count()} />
          </TabsTrigger>
          {TASK_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="flex-none px-2.5">
              {STATUS_LABELS[status]} <CountChip value={count(status)} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={priorityId} className="sr-only">
          Priority
        </Label>
        <Select value={filters.priority ?? ALL} onValueChange={(value) => onChange("priority", value === ALL ? undefined : value)}>
          <SelectTrigger
            id={priorityId}
            size="sm"
            className={cn(CHIP_BASE, filters.priority === undefined ? CHIP_UNSET : CHIP_SET)}
          >
            <PropertyChipLabel label="Priority" active={filters.priority !== undefined} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label htmlFor={assigneeId} className="sr-only">
          Assignee
        </Label>
        <Select value={filters.assigneeId ?? ALL} onValueChange={(value) => onChange("assignee", value === ALL ? undefined : value)}>
          <SelectTrigger
            id={assigneeId}
            size="sm"
            className={cn(CHIP_BASE, "max-w-60", filters.assigneeId === undefined ? CHIP_UNSET : CHIP_SET)}
          >
            <PropertyChipLabel label="Assignee" active={filters.assigneeId !== undefined} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <span className="motion-pop inline-flex">
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X aria-hidden="true" />
              Clear filters
            </Button>
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {resultCount !== undefined && (
            <span className="num text-xs text-muted-foreground">
              {/* The count tweens visually; screen readers get the final number once. */}
              <span aria-hidden="true">
                {shownCount ?? resultCount} {(shownCount ?? resultCount) === 1 ? "task" : "tasks"}
              </span>
              <span className="sr-only" aria-live="polite">
                {resultCount} {resultCount === 1 ? "task" : "tasks"}
              </span>
            </span>
          )}
          <Tabs value={sort} onValueChange={(value) => onChange("sort", value === "priority" ? "priority" : undefined)}>
            <TabsList aria-label="Sort" className="h-8 bg-sunken">
              <TabsTrigger value="newest" className="px-2.5 text-xs">
                Newest
              </TabsTrigger>
              <TabsTrigger value="priority" className="px-2.5 text-xs">
                Priority
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
