import { apiErrorSchema, memberSchema } from "@tracker/shared";
import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { MemberModel } from "../src/models/member.model";
import { TaskModel } from "../src/models/task.model";
import { app, createMemberViaApi } from "./helpers";

const parseMembers = (body: unknown) => memberSchema.array().parse(body);
const parseError = (body: unknown) => apiErrorSchema.parse(body);

describe("POST /api/members", () => {
  it("creates a member with defaults, a normalized email and no _id", async () => {
    const res = await request(app).post("/api/members").send({ name: "Arun K", email: " Arun@Team.DEV " });

    expect(res.status).toBe(201);
    const body: unknown = res.body;
    expect(memberSchema.parse(body)).toMatchObject({
      name: "Arun K",
      email: "arun@team.dev",
      role: "member",
      status: "active",
      openTaskCount: 0,
    });
    expect(body).not.toHaveProperty("_id");
  });

  it.each([
    [{ name: "A", email: "a@b.dev" }, "name"],
    [{ name: "Arun", email: "nope" }, "email"],
    [{ name: "Arun", email: "a@b.dev", role: "owner" }, "role"],
  ])("returns 400 with a field error for %j", async (payload, field) => {
    const res = await request(app).post("/api/members").send(payload);
    expect(res.status).toBe(400);
    expect(parseError(res.body).errors?.[0]?.field).toBe(field);
  });

  it("returns 409 on the email field for a duplicate email in different case", async () => {
    await createMemberViaApi({ name: "Arun K", email: "arun@team.dev" });

    const res = await request(app).post("/api/members").send({ name: "Arun Again", email: "ARUN@team.dev" });

    expect(res.status).toBe(409);
    expect(parseError(res.body).errors?.[0]?.field).toBe("email");
    expect(await MemberModel.countDocuments()).toBe(1);
  });
});

describe("GET /api/members", () => {
  it("lists members sorted by name and filters by status", async () => {
    await createMemberViaApi({ name: "Zoe", email: "zoe@team.dev" });
    const mia = await createMemberViaApi({ name: "Mia", email: "mia@team.dev" });
    await request(app).patch(`/api/members/${mia.id}`).send({ status: "inactive" });

    const all = await request(app).get("/api/members");
    expect(parseMembers(all.body).map((m) => m.name)).toEqual(["Mia", "Zoe"]);

    const inactive = await request(app).get("/api/members?status=inactive");
    expect(parseMembers(inactive.body).map((m) => m.name)).toEqual(["Mia"]);
  });

  it("returns 400 for an invalid role filter", async () => {
    const res = await request(app).get("/api/members?role=bad");
    expect(res.status).toBe(400);
  });

  it("counts only open (not done) tasks assigned to each member", async () => {
    const arun = await createMemberViaApi({ name: "Arun", email: "arun@team.dev" });
    const assigneeId = new Types.ObjectId(arun.id);
    await TaskModel.create([
      { title: "Open one", status: "todo", assigneeId },
      { title: "Open two", status: "in_progress", assigneeId },
      { title: "Finished", status: "done", assigneeId },
      { title: "Someone else's" },
    ]);

    const res = await request(app).get("/api/members");
    expect(parseMembers(res.body)[0]?.openTaskCount).toBe(2);
  });
});

describe("PATCH /api/members/:id", () => {
  it("updates role and status", async () => {
    const m = await createMemberViaApi({ name: "Arun", email: "arun@team.dev" });

    const res = await request(app).patch(`/api/members/${m.id}`).send({ role: "viewer", status: "inactive" });

    expect(res.status).toBe(200);
    expect(memberSchema.parse(res.body as unknown)).toMatchObject({ role: "viewer", status: "inactive" });
  });

  it.each([["not-an-id"], [new Types.ObjectId().toString()]])("returns 404 for id %s", async (id) => {
    const res = await request(app).patch(`/api/members/${id}`).send({ role: "viewer" });
    expect(res.status).toBe(404);
    expect(parseError(res.body).message).toBe("Member not found");
  });

  it("returns 400 for an empty body", async () => {
    const m = await createMemberViaApi({ name: "Arun", email: "arun@team.dev" });
    const res = await request(app).patch(`/api/members/${m.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("returns 409 when changing email to another member's email", async () => {
    await createMemberViaApi({ name: "Arun", email: "arun@team.dev" });
    const mia = await createMemberViaApi({ name: "Mia", email: "mia@team.dev" });

    const res = await request(app).patch(`/api/members/${mia.id}`).send({ email: "Arun@team.dev" });

    expect(res.status).toBe(409);
  });

  it.each([[{ role: "member" }, "role"], [{ status: "inactive" }, "status"]])(
    "blocks %j on the last active admin with 400 and changes nothing",
    async (change, field) => {
      const admin = await createMemberViaApi({ name: "Admin", email: "admin@team.dev", role: "admin" });

      const res = await request(app).patch(`/api/members/${admin.id}`).send(change);

      expect(res.status).toBe(400);
      expect(parseError(res.body)).toMatchObject({ message: "At least one active admin is required" });
      expect(parseError(res.body).errors?.[0]?.field).toBe(field);
      expect(await MemberModel.findById(admin.id).lean()).toMatchObject({ role: "admin", status: "active" });
    },
  );

  it("allows demoting an admin when another active admin exists", async () => {
    const first = await createMemberViaApi({ name: "First", email: "first@team.dev", role: "admin" });
    await createMemberViaApi({ name: "Second", email: "second@team.dev", role: "admin" });

    const res = await request(app).patch(`/api/members/${first.id}`).send({ role: "member" });

    expect(res.status).toBe(200);
  });

  it("allows edits when the workspace has no admins at all", async () => {
    const m = await createMemberViaApi({ name: "Solo", email: "solo@team.dev" });
    const res = await request(app).patch(`/api/members/${m.id}`).send({ status: "inactive" });
    expect(res.status).toBe(200);
  });
});
