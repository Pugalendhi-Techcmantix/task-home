import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { memberRouter } from "./routes/member.routes";
import { taskRouter } from "./routes/task.routes";

/** Builds the Express app without listening, so tests can drive it with Supertest. */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "10kb" }));

  app.use("/api/tasks", taskRouter);
  app.use("/api/members", memberRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
