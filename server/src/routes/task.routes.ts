import { Router } from "express";
import { assignTask, createTask, deleteTask, editTask, listTasks, updateTask } from "../controllers/task.controller";

export const taskRouter = Router();

taskRouter.get("/", listTasks);
taskRouter.post("/", createTask);
taskRouter.patch("/:id/assignee", assignTask);
taskRouter.patch("/:id/details", editTask);
taskRouter.patch("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
