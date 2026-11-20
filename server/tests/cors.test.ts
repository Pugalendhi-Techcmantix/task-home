import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";

const ALLOWED = "https://tracker.example.app";

describe("CORS allow-list", () => {
  const app = createApp({ corsOrigins: [ALLOWED] });

  it("echoes an allowed origin", async () => {
    const res = await request(app).get("/api/nope").set("Origin", ALLOWED);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED);
  });

  it("sends no CORS header to any other origin", async () => {
    const res = await request(app).get("/api/nope").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("stays open when no allow-list is configured (local dev default)", async () => {
    const res = await request(createApp()).get("/api/nope").set("Origin", "https://anything.example");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});

describe("loadEnv CORS_ORIGINS", () => {
  it("splits a comma-separated list and trims it", () => {
    const env = loadEnv({ MONGODB_URI: "mongodb://x", CORS_ORIGINS: " https://a.app , https://b.app " });
    expect(env.CORS_ORIGINS).toEqual(["https://a.app", "https://b.app"]);
  });

  it("is undefined when unset", () => {
    expect(loadEnv({ MONGODB_URI: "mongodb://x" }).CORS_ORIGINS).toBeUndefined();
  });
});
