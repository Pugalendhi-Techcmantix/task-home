import { once } from "node:events";
import { createServer, type Server } from "node:http";
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

  // Use a plain http.Server: Express 5's app.listen() calls its callback on errors too,
  // which would report "listening" when the port is already taken.
  const server = createServer(createApp());
  server.listen(port);
  await once(server, "listening"); // rejects on 'error' (e.g. EADDRINUSE)
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
