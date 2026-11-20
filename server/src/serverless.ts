import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { loadEnv } from "./config/env";

const app = createApp();

/** One shared connection promise per warm function instance, so requests never reconnect. */
let connection: Promise<typeof mongoose> | undefined;

function connect(): Promise<typeof mongoose> {
  if (!connection) {
    const { MONGODB_URI } = loadEnv();
    connection = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).catch((error: unknown) => {
      connection = undefined; // let the next request retry instead of caching the failure
      throw error;
    });
  }
  return connection;
}

/** Vercel function entry: connects to MongoDB (cached) and hands the request to Express. */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connect();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Database unavailable" }));
    return;
  }
  app(req, res);
}
