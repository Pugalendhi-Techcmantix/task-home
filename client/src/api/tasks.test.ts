import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchTasks, isAbortError } from "./tasks";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response): void {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));
}

describe("fetchTasks", () => {
  it("rethrows an abort that happens while the body is being read", async () => {
    const response = new Response("[]", { status: 200 });
    vi.spyOn(response, "json").mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));
    stubFetch(response);

    const error: unknown = await fetchTasks({}).catch((caught: unknown) => caught);

    expect(isAbortError(error)).toBe(true);
  });

  it("reports an unexpected success body as an ApiError with a readable message", async () => {
    stubFetch(new Response(JSON.stringify({ unexpected: true }), { status: 200 }));

    const error: unknown = await fetchTasks({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Unexpected response from the server" });
  });

  it("returns parsed tasks for a valid response", async () => {
    const task = {
      id: "6aff321532ed457326852fdd",
      title: "Smoke",
      status: "todo",
      priority: "medium",
      createdAt: "2026-11-19T17:29:57.088Z",
      updatedAt: "2026-11-19T17:29:57.088Z",
    };
    stubFetch(new Response(JSON.stringify([task]), { status: 200 }));

    await expect(fetchTasks({})).resolves.toEqual([task]);
  });
});
