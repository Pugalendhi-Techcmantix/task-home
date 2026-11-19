import type { CreateMemberInput, Member, MemberQuery, UpdateMemberInput } from "@tracker/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMember, fetchMembers, updateMember } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";

export function useMembers(filters: MemberQuery = {}) {
  return useQuery({
    queryKey: queryKeys.members(filters),
    queryFn: ({ signal }) => fetchMembers(filters, signal),
  });
}

/** Members a task can be assigned to: active only, sorted by name (the API already sorts). */
export function useActiveMembers(): Member[] {
  const { data } = useMembers();
  return (data ?? []).filter((member) => member.status === "active");
}

function useInvalidateTeamData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.allMembers }),
      queryClient.invalidateQueries({ queryKey: queryKeys.allTasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

export function useCreateMember() {
  const invalidate = useInvalidateTeamData();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => createMember(input),
    onSettled: invalidate,
  });
}

export function useUpdateMember() {
  const invalidate = useInvalidateTeamData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMemberInput }) => updateMember(id, input),
    onSettled: invalidate,
  });
}
