import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskQuery } from "@tracker/shared";
import { X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveMembers } from "@/features/team/queries";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { TaskSort } from "./urlFilters";

const ALL = "all";

interface TaskFiltersProps {
  filters: TaskQuery;
  sort: TaskSort;
  /** Every task (unfiltered), used for the status tab counts. */
  allTasks: Task[] | undefined;
  onChange: (key: "status" | "priority" | "assignee" | "sort", value: string | undefined) => void;
  onClear: () => void;
}

export function TaskFilters({ filters, sort, allTasks, onChange, onClear }: TaskFiltersProps) {
  const members = useActiveMembers();
  const priorityId = useId();
  const assigneeId = useId();
  const hasFilters = filters.status !== undefined || filters.priority !== undefined || filters.assigneeId !== undefined;
  const count = (status?: string) =>
    allTasks === undefined ? "" : String(allTasks.filter((t) => status === undefined || t.status === status).length);

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <Tabs value={filters.status ?? ALL} onValueChange={(value) => onChange("status", value === ALL ? undefined : value)}>
        <TabsList aria-label="Filter by status" className="h-9 w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value={ALL} className="px-2.5">
            All <span className="tabular text-faint">{count()}</span>
          </TabsTrigger>
          {TASK_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="px-2.5">
              {STATUS_LABELS[status]} <span className="tabular text-faint">{count(status)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={priorityId} className="sr-only">
          Priority
        </Label>
        <Select value={filters.priority ?? ALL} onValueChange={(value) => onChange("priority", value === ALL ? undefined : value)}>
          <SelectTrigger id={priorityId} size="sm" className="w-[9.5rem]">
            <span className="text-muted-foreground">Priority:</span>
            <SelectValue />
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
          <SelectTrigger id={assigneeId} size="sm" className="w-[12rem]">
            <span className="text-muted-foreground">Assignee:</span>
            <SelectValue />
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

        <Tabs value={sort} onValueChange={(value) => onChange("sort", value === "priority" ? "priority" : undefined)}>
          <TabsList aria-label="Sort" className="h-8">
            <TabsTrigger value="newest" className="px-2.5 text-xs">
              Newest
            </TabsTrigger>
            <TabsTrigger value="priority" className="px-2.5 text-xs">
              Priority
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
