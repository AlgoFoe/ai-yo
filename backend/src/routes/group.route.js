import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  addMemberToGroup,
  addMembers,
  removeMemberFromGroup,
  getGroupById,
  getAllGroups,
  sendGroupMessage,
  getChatSummary,
  deleteGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAllGroups);

router.post("/", protectRoute, createGroup);

router.get("/generate", getChatSummary);

router.get("/:groupId", protectRoute, getGroupById);

router.delete("/:groupId", deleteGroup);

router.post("/:groupId/members", protectRoute, addMemberToGroup);

router.post("/:groupId/addMembers", protectRoute, addMembers);

router.delete("/:groupId/members/:userId", removeMemberFromGroup);

router.post("/:groupId/messages", protectRoute, sendGroupMessage);


export default router;
