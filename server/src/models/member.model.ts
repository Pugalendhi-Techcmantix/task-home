import {
  DEFAULT_MEMBER_STATUS,
  DEFAULT_ROLE,
  MEMBER_ROLES,
  MEMBER_STATUSES,
  NAME_MAX,
  NAME_MIN,
  type Member,
  type MemberRole,
  type MemberStatus,
} from "@tracker/shared";
import { Schema, model, type Types } from "mongoose";

/** Shape of a member document in MongoDB. */
export interface MemberDoc {
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MemberRecord = MemberDoc & { _id: Types.ObjectId };

const memberMongooseSchema = new Schema<MemberDoc>(
  {
    name: { type: String, required: true, trim: true, minlength: NAME_MIN, maxlength: NAME_MAX },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    role: { type: String, enum: [...MEMBER_ROLES], default: DEFAULT_ROLE, required: true },
    status: { type: String, enum: [...MEMBER_STATUSES], default: DEFAULT_MEMBER_STATUS, required: true },
  },
  { timestamps: true },
);

export const MemberModel = model<MemberDoc>("Member", memberMongooseSchema);

/** Maps a stored member to the API shape. `openTaskCount` is computed from tasks by the caller. */
export function toMemberDto(record: MemberRecord, openTaskCount: number): Member {
  return {
    id: record._id.toString(),
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.status,
    openTaskCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
