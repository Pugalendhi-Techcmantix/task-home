import { z } from "zod";

export const MEMBER_ROLES = ["admin", "member", "viewer"] as const;
export const MEMBER_STATUSES = ["active", "inactive"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const DEFAULT_ROLE: MemberRole = "member";
export const DEFAULT_MEMBER_STATUS: MemberStatus = "active";

export const NAME_MIN = 2;
export const NAME_MAX = 60;

const roleSchema = z.enum(MEMBER_ROLES, { error: `Role must be one of: ${MEMBER_ROLES.join(", ")}` });
const memberStatusSchema = z.enum(MEMBER_STATUSES, {
  error: `Status must be one of: ${MEMBER_STATUSES.join(", ")}`,
});

const nameSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "Name is required" : "Name must be text") })
  .trim()
  .min(NAME_MIN, { error: `Name must be at least ${NAME_MIN} characters` })
  .max(NAME_MAX, { error: `Name must be at most ${NAME_MAX} characters` });

/** Trimmed and lower-cased before validation, so " Arun@Team.dev " and "arun@team.dev" are the same member. */
const emailSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "Email is required" : "Email must be text") })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

/** Body of POST /api/members. */
export const createMemberSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema.optional(),
});

/** Body of PATCH /api/members/:id. */
export const updateMemberSchema = z
  .strictObject({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional(),
    status: memberStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "Provide at least one field to update",
  });

/** Query string of GET /api/members. */
export const memberQuerySchema = z.object({
  status: memberStatusSchema.optional(),
  role: roleSchema.optional(),
});

/** A member as returned by the API. */
export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  status: memberStatusSchema,
  openTaskCount: z.number().int().min(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Member = z.infer<typeof memberSchema>;
export type CreateMemberInput = z.input<typeof createMemberSchema>;
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;
export type MemberQuery = z.infer<typeof memberQuerySchema>;
