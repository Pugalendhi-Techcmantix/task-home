import { once } from "node:events";
import { createServer, type Server } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { startServer } from "../src/server";

/** The URI of the in-memory MongoDB the test setup already connected to (see tests/setup.ts). */
function currentMongoUri(): string {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) throw new Error("TEST_MONGODB_URI is not set");
  return uri;
}

describe("startServer", () => {
  const opened: { close: () => unknown }[] = [];

  afterEach(() => {
    for (const server of opened.splice(0)) server.close();
  });

  it("rejects when the port is already in use instead of claiming to listen", async () => {
    const blocker: Server = createServer();
    blocker.listen(0);
    await once(blocker, "listening");
    opened.push(blocker);
    const address = blocker.address();
    if (address === null || typeof address === "string") throw new Error("expected a TCP address");

    const result = startServer(currentMongoUri(), address.port);

    await expect(result).rejects.toMatchObject({ code: "EADDRINUSE" });
  });
});
