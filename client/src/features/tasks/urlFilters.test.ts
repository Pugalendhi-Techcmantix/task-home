import { describe, expect, it } from "vitest";
import { readSort, readTaskFilters, withParam } from "./urlFilters";

const id = "6aff321532ed457326852fdd";

describe("readTaskFilters", () => {
  it("maps URL params to the API filter (assignee → assigneeId)", () => {
    const params = new URLSearchParams(`status=todo&priority=high&assignee=${id}`);
    expect(readTaskFilters(params)).toEqual({ status: "todo", priority: "high", assigneeId: id });
  });

  it("accepts assignee=unassigned", () => {
    expect(readTaskFilters(new URLSearchParams("assignee=unassigned"))).toEqual({ assigneeId: "unassigned" });
  });

  it("ignores invalid values instead of failing", () => {
    expect(readTaskFilters(new URLSearchParams("status=closed&priority=urgent&assignee=bob"))).toEqual({});
  });
});

describe("readSort", () => {
  it("defaults to newest and only recognises 'priority'", () => {
    expect(readSort(new URLSearchParams(""))).toBe("newest");
    expect(readSort(new URLSearchParams("sort=priority"))).toBe("priority");
    expect(readSort(new URLSearchParams("sort=random"))).toBe("newest");
  });
});

describe("withParam", () => {
  it("sets, removes, and always clears the ?task= highlight", () => {
    const params = new URLSearchParams("status=todo&task=abc");
    expect(withParam(params, "priority", "high").toString()).toBe("status=todo&priority=high");
    expect(withParam(params, "status", undefined).toString()).toBe("");
  });
});
