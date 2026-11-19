import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";

describe("loadEnv", () => {
  it("defaults PORT to 4000", () => {
    expect(loadEnv({ MONGODB_URI: "mongodb://x/db" })).toEqual({ PORT: 4000, MONGODB_URI: "mongodb://x/db" });
  });

  it("parses PORT as a number", () => {
    expect(loadEnv({ PORT: "5000", MONGODB_URI: "mongodb://x" }).PORT).toBe(5000);
  });

  it("accepts an Atlas mongodb+srv URI", () => {
    expect(loadEnv({ MONGODB_URI: "mongodb+srv://u:p@cluster0.example.net/tasks" }).MONGODB_URI).toMatch(/^mongodb\+srv/);
  });

  it("throws a message naming MONGODB_URI when it is missing", () => {
    expect(() => loadEnv({})).toThrow(/MONGODB_URI/);
  });

  it("throws when PORT is not a number", () => {
    expect(() => loadEnv({ PORT: "abc", MONGODB_URI: "mongodb://x" })).toThrow(/PORT/);
  });
});
