import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { seedDatabase } from "./seed/seed";
import { startServer } from "./server";

/** Dev only: runs the API against a throwaway in-memory MongoDB filled with sample data. */
dotenv.config({ quiet: true });

try {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const seeded = await seedDatabase({ force: true });
  const port = Number(process.env.PORT ?? 4000);
  await startServer(mongo.getUri(), port, async () => {
    await mongo.stop();
  });
  console.log(`Using in-memory MongoDB with sample data (${seeded.members} members, ${seeded.tasks} tasks). Data resets on restart.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
