import dotenv from "dotenv";
import mongoose from "mongoose";
import { loadEnv } from "../config/env";
import { SeedRefusedError, seedDatabase } from "./seed";

/** `npm run seed [-- --force]`: fills the MONGODB_URI database with sample members and tasks. */
dotenv.config({ quiet: true });
const force = process.argv.includes("--force");

try {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  const { name, host } = mongoose.connection;
  console.log(`Seeding database "${name}" on ${host}${force ? " (force: deleting all tasks and members first)" : ""}`);
  const result = await seedDatabase({ force });
  console.log(`Inserted ${result.members} members and ${result.tasks} tasks.`);
  await mongoose.disconnect();
} catch (error) {
  console.error(error instanceof SeedRefusedError || error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
}
