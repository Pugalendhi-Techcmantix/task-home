import dotenv from "dotenv";
import { loadEnv } from "./config/env";
import { startServer } from "./server";

dotenv.config({ quiet: true });

try {
  const env = loadEnv();
  await startServer(env.MONGODB_URI, env.PORT);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
