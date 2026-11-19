import {
  memberSchema,
  type CreateMemberInput,
  type Member,
  type MemberQuery,
  type UpdateMemberInput,
} from "@tracker/shared";
import { request, toSearch } from "./http";

export function fetchMembers(query: MemberQuery, signal?: AbortSignal): Promise<Member[]> {
  const search = toSearch({ status: query.status, role: query.role });
  return request(`/members${search}`, { signal: signal ?? null }, memberSchema.array());
}

export function createMember(input: CreateMemberInput): Promise<Member> {
  return request("/members", { method: "POST", body: JSON.stringify(input) }, memberSchema);
}

export function updateMember(id: string, input: UpdateMemberInput): Promise<Member> {
  return request(
    `/members/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    memberSchema,
  );
}
