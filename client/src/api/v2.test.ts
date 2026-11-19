import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDashboardSummary } from "./dashboard";
import { fetchMembers } from "./members";
import { assignTask } from "./tasks";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stubs fetch and returns the mock so tests can inspect the request. */
function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn((_input: string, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const task = {
  id: "6aff321532ed457326852fdd",
  title: "Smoke",
  status: "todo",
  priority: "medium",
  createdAt: "2026-11-19T17:29:57.088Z",
  updatedAt: "2026-11-19T17:29:57.088Z",
};

describe("fetchMembers", () => {
  it("builds the query string from the filters", async () => {
    const fetchMock = stubFetch([]);

    await fetchMembers({ status: "active", role: "admin" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/members?status=active&role=admin");
  });

  it("omits the query string when there are no filters", async () => {
    const fetchMock = stubFetch([]);
    await fetchMembers({});
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/members");
  });
});

describe("assignTask", () => {
  it("sends PATCH /api/tasks/:id/assignee with the assignee id (null unassigns)", async () => {
    const fetchMock = stubFetch(task);

    await assignTask(task.id, { assigneeId: null });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`/api/tasks/${task.id}/assignee`);
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ assigneeId: null }));
  });
});

describe("fetchDashboardSummary", () => {
  it("rejects an unexpected body with a readable message", async () => {
    stubFetch({ totals: "nope" });
    await expect(fetchDashboardSummary()).rejects.toMatchObject({ message: "Unexpected response from the server" });
  });
});
