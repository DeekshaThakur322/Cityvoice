import express from "express";
import {
  createIssue,
  getAllIssues,
  getNearbyIssues,
  toggleUpvote,
  updateIssueStatus,
  checkDuplicate,
  getMyIssues,
  getIssueById,
  verifyIssue,
  classifyIssueAI,
  deleteIssue,
} from "../controller/issueController.js";
import { protect } from "../../utils/protect.js";
import { authorize } from "../../utils/authorize.js";
import { upload } from "../../middleware/upload.js";

const router = express.Router();

// 1. Public Routes
router.get("/", getAllIssues);
router.get("/nearby", getNearbyIssues);
router.post("/check-duplicate", checkDuplicate); 
router.post("/ai-classify", classifyIssueAI);
router.post("/", protect, upload.single("image"), createIssue);


// 2. Protected Routes (Must be logged in with Bearer Token)
router.post("/", protect, createIssue);
router.get("/my", protect, getMyIssues);
router.patch("/:id/upvote", protect, toggleUpvote);
router.patch("/:id/verify", protect, verifyIssue);
router.patch("/:id/status", protect, upload.single("image"), updateIssueStatus);
// Single issue
router.get("/:id", getIssueById);
router.delete("/:id", protect, deleteIssue);
export default router;