import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { dashboardRouter } from "./routes/dashboard.routes";
import { memberRouter } from "./routes/member.routes";
import { taskRouter } from "./routes/task.routes";

export interface AppOptions {
  /** Browser origins allowed to call the API. Omitted: open to all (local development). */
  corsOrigins?: string[];
}

/** Builds the Express app without listening, so tests can drive it with Supertest. */
export function createApp({ corsOrigins }: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(corsOrigins ? cors({ origin: corsOrigins }) : cors());
  app.use(express.json({ limit: "10kb" }));

  app.use("/api/tasks", taskRouter);
  app.use("/api/members", memberRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
