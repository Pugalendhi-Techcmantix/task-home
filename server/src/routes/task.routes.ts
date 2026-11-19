import { Router } from "express";
import { createTask, listTasks } from "../controllers/task.controller";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.post("/", createTask);
