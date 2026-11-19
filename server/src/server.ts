import type { Server } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app";

/**
 * Connects to MongoDB, starts the HTTP server and wires graceful shutdown.
 * `onShutdown` runs after the database disconnects (used by the in-memory dev mode).
 */
export async function startServer(
  mongoUri: string,
  port: number,
  onShutdown?: () => Promise<void>,
): Promise<Server> {
  await mongoose.connect(mongoUri);

  const app = createApp();
  const server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(port, () => resolve(listening));
    listening.once("error", reject);
  });
  console.log(`API listening on http://localhost:${port}`);

  const shutdown = (): void => {
    server.close(() => {
      void mongoose
        .disconnect()
        .then(() => onShutdown?.())
        .finally(() => process.exit(0));
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}
