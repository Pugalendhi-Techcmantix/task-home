import {
  createMemberSchema,
  memberQuerySchema,
  updateMemberSchema,
  type UpdateMemberInput,
} from "@tracker/shared";
import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { HttpError } from "../lib/httpError";
import { parseObjectIdOr404 } from "../lib/ids";
import { MemberModel, toMemberDto, type MemberRecord } from "../models/member.model";
import { TaskModel } from "../models/task.model";

type MemberIdParams = { id: string };

const MEMBER_NOT_FOUND = "Member not found";

/** Open (not done) task counts per assignee id. */
export async function countOpenTasksByAssignee(ids: Types.ObjectId[]): Promise<Map<string, number>> {
  const rows = await TaskModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { assigneeId: { $in: ids }, status: { $ne: "done" } } },
    { $group: { _id: "$assigneeId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

async function toDtos(records: MemberRecord[]) {
  const counts = await countOpenTasksByAssignee(records.map((record) => record._id));
  return records.map((record) => toMemberDto(record, counts.get(record._id.toString()) ?? 0));
}

/** MongoDB duplicate-key error (unique email). */
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

const duplicateEmail = () =>
  new HttpError(409, "A member with this email already exists", [
    { field: "email", message: "This email is already in use" },
  ]);

/**
 * Refuses a change that would leave the workspace without an active admin. Only applies when the
 * target is currently the last active admin; a workspace with no admins at all is not blocked.
 */
async function assertKeepsAnActiveAdmin(current: MemberRecord, changes: UpdateMemberInput): Promise<void> {
  const isActiveAdmin = current.role === "admin" && current.status === "active";
  const losesAdmin = changes.role !== undefined && changes.role !== "admin";
  const losesActive = changes.status !== undefined && changes.status !== "active";
  if (!isActiveAdmin || (!losesAdmin && !losesActive)) return;

  const otherActiveAdmins = await MemberModel.countDocuments({
    _id: { $ne: current._id },
    role: "admin",
    status: "active",
  });
  if (otherActiveAdmins === 0) {
    throw new HttpError(400, "At least one active admin is required", [
      { field: losesAdmin ? "role" : "status", message: "This is the last active admin" },
    ]);
  }
}

/** GET /api/members?status=&role= */
export async function listMembers(req: Request, res: Response): Promise<void> {
  const filter = memberQuerySchema.parse(req.query);
  const records = await MemberModel.find(filter).sort({ name: 1, _id: 1 }).lean();
  res.json(await toDtos(records));
}

/** POST /api/members */
export async function createMember(req: Request, res: Response): Promise<void> {
  const data = createMemberSchema.parse(req.body);
  try {
    const created = await MemberModel.create(data);
    res.status(201).json(toMemberDto(created.toObject(), 0));
  } catch (error) {
    if (isDuplicateKeyError(error)) throw duplicateEmail();
    throw error;
  }
}

/** PATCH /api/members/:id */
export async function updateMember(req: Request<MemberIdParams>, res: Response): Promise<void> {
  const id = parseObjectIdOr404(req.params.id, MEMBER_NOT_FOUND);
  const changes = updateMemberSchema.parse(req.body);

  const current = await MemberModel.findById(id).lean();
  if (!current) throw new HttpError(404, MEMBER_NOT_FOUND);
  await assertKeepsAnActiveAdmin(current, changes);

  try {
    const updated = await MemberModel.findByIdAndUpdate(id, changes, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!updated) throw new HttpError(404, MEMBER_NOT_FOUND);
    const [dto] = await toDtos([updated]);
    res.json(dto);
  } catch (error) {
    if (isDuplicateKeyError(error)) throw duplicateEmail();
    throw error;
  }
}
