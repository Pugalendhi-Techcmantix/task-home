import { Router } from "express";
import { createMember, listMembers, updateMember } from "../controllers/member.controller";

export const memberRouter = Router();

memberRouter.get("/", listMembers);
memberRouter.post("/", createMember);
memberRouter.patch("/:id", updateMember);
