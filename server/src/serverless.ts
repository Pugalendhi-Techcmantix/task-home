import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { loadEnv } from "./config/env";

/** Built once per warm function instance, together with the shared MongoDB connection. */
let instance: { app: ReturnType<typeof createApp>; connection: Promise<typeof mongoose> } | undefined;

function init(): NonNullable<typeof instance> {
  if (!instance) {
    const { MONGODB_URI, CORS_ORIGINS } = loadEnv();
    const connection = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    connection.catch(() => {
      instance = undefined; // let the next request retry instead of caching the failure
    });
    instance = { app: createApp({ corsOrigins: CORS_ORIGINS }), connection };
  }
  return instance;
}

/** Vercel function entry: connects to MongoDB (cached) and hands the request to Express. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { app, connection } = init();
    await connection;
    app(req, res);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Service unavailable" }));
  }
}
