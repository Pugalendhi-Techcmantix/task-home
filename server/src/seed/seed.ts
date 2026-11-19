import { MemberModel } from "../models/member.model";
import { TaskModel } from "../models/task.model";
import { SEED_MEMBERS, SEED_TASKS } from "./data";

export class SeedRefusedError extends Error {
  constructor() {
    super("Database already has data. Re-run with --force to wipe tasks and members.");
    this.name = "SeedRefusedError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Inserts the sample members and tasks. Refuses unless both collections are empty, or `force`
 * is set, in which case **all** tasks and members are deleted first. No other collection is touched.
 */
export async function seedDatabase(options: { force: boolean; now?: Date }): Promise<{ members: number; tasks: number }> {
  const now = options.now ?? new Date();
  const hasData = (await TaskModel.countDocuments()) > 0 || (await MemberModel.countDocuments()) > 0;
  if (hasData && !options.force) throw new SeedRefusedError();
  if (options.force) {
    await TaskModel.deleteMany({});
    await MemberModel.deleteMany({});
  }

  const members = await MemberModel.insertMany(SEED_MEMBERS);

  // Native insert keeps our createdAt/updatedAt/completedAt (Mongoose timestamps would overwrite them).
  const tasks = SEED_TASKS.map((task, index) => {
    const createdAt = new Date(now.getTime() - task.daysAgo * DAY_MS - index * 7 * 60 * 1000);
    // Done tasks created this week finished an hour after creation (or an hour ago); older ones finished a day later.
    const completedAt =
      task.status !== "done"
        ? null
        : task.daysAgo <= 3
          ? new Date(Math.min(createdAt.getTime() + HOUR_MS, now.getTime() - HOUR_MS))
          : new Date(createdAt.getTime() + DAY_MS);
    return {
      title: task.title,
      ...(task.description ? { description: task.description } : {}),
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee === null ? null : (members[task.assignee]?._id ?? null),
      completedAt,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    };
  });
  await TaskModel.collection.insertMany(tasks);

  return { members: members.length, tasks: tasks.length };
}
