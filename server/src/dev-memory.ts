import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer } from "./server";

/** Dev only: runs the API against a throwaway in-memory MongoDB, so no database setup is needed. */
dotenv.config({ quiet: true });

try {
  const mongo = await MongoMemoryServer.create();
  const port = Number(process.env.PORT ?? 4000);
  await startServer(mongo.getUri(), port, async () => {
    await mongo.stop();
  });
  console.log("Using in-memory MongoDB, data resets on restart");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
