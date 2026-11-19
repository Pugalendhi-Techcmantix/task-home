import { Router } from "express";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/task.controller";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.post("/", createTask);
taskRouter.patch("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
