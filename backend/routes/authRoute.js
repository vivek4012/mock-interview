import express from "express";
import {
  googleAuth,
  googleCallback,
  getUserInfo,
} from "../controllers/authController.js";

const router = express.Router();

// STEP 1: Redirect user to Google's consent screen
router.get("/google", googleAuth);

// STEP 2: Handle Google redirect callback
router.get("/google/callback", googleCallback);

// STEP 3: Verify JWT and return user info
router.get("/user/me", getUserInfo);

export default router;
