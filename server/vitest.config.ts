import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "server",
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 120_000,
  },
});
