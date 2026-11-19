import type { Task, TaskStatus } from "@tracker/shared";
import { Trash2 } from "lucide-react";
import { formatDate, formatDateTime } from "../lib/labels";
import { PriorityBadge } from "./PriorityBadge";
import { StatusSelect } from "./StatusSelect";

interface TaskTableProps {
  tasks: Task[];
  pendingIds: ReadonlySet<string>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

interface TaskActionsProps {
  task: Task;
  pending: boolean;
  onStatusChange: TaskTableProps["onStatusChange"];
  onDelete: TaskTableProps["onDelete"];
}

function confirmDelete(task: Task): boolean {
  return window.confirm(`Delete "${task.title}"? This can't be undone.`);
}

function DeleteButton({ task, pending, onDelete }: Omit<TaskActionsProps, "onStatusChange">) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirmDelete(task)) onDelete(task.id);
      }}
      aria-label={`Delete "${task.title}"`}
      title="Delete task"
      className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}

function CreatedAt({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="whitespace-nowrap">
      {formatDate(iso)}
    </time>
  );
}

/** Desktop: a table. Below the md breakpoint: a stacked card list with the same controls. */
export function TaskTable({ tasks, pendingIds, onStatusChange, onDelete }: TaskTableProps) {
  return (
    <>
      <table className="hidden w-full table-fixed text-left text-sm md:table">
        <caption className="sr-only">Tasks</caption>
        <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Title
            </th>
            <th scope="col" className="w-40 px-4 py-2.5 font-medium">
              Status
            </th>
            <th scope="col" className="w-32 px-4 py-2.5 font-medium">
              Priority
            </th>
            <th scope="col" className="w-36 px-4 py-2.5 font-medium">
              Created
            </th>
            <th scope="col" className="w-20 px-4 py-2.5 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const pending = pendingIds.has(task.id);
            return (
              <tr
                key={task.id}
                aria-busy={pending}
                className={`align-middle transition-colors hover:bg-slate-50/70 ${pending ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium [overflow-wrap:anywhere] text-slate-900">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 truncate text-slate-500" title={task.description}>
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    value={task.status}
                    disabled={pending}
                    label={`Status for "${task.title}"`}
                    onChange={(status) => onStatusChange(task.id, status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <CreatedAt iso={task.createdAt} />
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton task={task} pending={pending} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-slate-100 md:hidden" aria-label="Tasks">
        {tasks.map((task) => {
          const pending = pendingIds.has(task.id);
          return (
            <li key={task.id} aria-busy={pending} className={`p-4 ${pending ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium [overflow-wrap:anywhere] text-slate-900">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm [overflow-wrap:anywhere] text-slate-500">
                      {task.description}
                    </p>
                  )}
                </div>
                <DeleteButton task={task} pending={pending} onDelete={onDelete} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusSelect
                  value={task.status}
                  disabled={pending}
                  label={`Status for "${task.title}"`}
                  onChange={(status) => onStatusChange(task.id, status)}
                />
                <PriorityBadge priority={task.priority} />
                <span className="ml-auto text-xs text-slate-500">
                  <CreatedAt iso={task.createdAt} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
