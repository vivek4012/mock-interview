import express from "express";
import {
  createInterview,
  startInterview,
  generateQuestion,
  updateTranscript,
  endInterview,
  analyzeInterview,
  getInterviewList,
  getInterviewAnalysis
} from "../controllers/interviewController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require JWT authentication
router.use(authenticate);

// GET /api/interview/list - Get all interviews for the authenticated user
router.get("/list", getInterviewList);

// POST /api/interview - Create a new interview (status: pending)
router.post("/", createInterview);

// GET /api/interview/:interviewId/analysis - Get full analysis for a specific interview
router.get("/:interviewId/analysis", getInterviewAnalysis);

// POST /api/interview/:interviewId/start - Start an interview (status: in-progress)
router.post("/:interviewId/start", startInterview);

// POST /api/interview/:interviewId/question - Generate next AI question
router.post("/:interviewId/question", generateQuestion);

// POST /api/interview/:interviewId/transcript - Add message to transcript
router.post("/:interviewId/transcript", updateTranscript);

// POST /api/interview/:interviewId/end - End interview (status: completed)
router.post("/:interviewId/end", endInterview);

// POST /api/interview/:interviewId/analyze - Analyze completed interview
router.post("/:interviewId/analyze", analyzeInterview);

export default router;
