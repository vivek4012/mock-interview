import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoute.js";
import interviewRoutes from "./routes/interviewRoute.js";
import connectDB from "./config/db.js";
import {config} from "./config/config.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// MongoDB connection - ensure it's connected before handling requests
let isConnected = false;

const ensureDbConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Middleware to ensure DB connection for all requests
app.use(async (_req, _res, next) => {
  await ensureDbConnection();
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(config.PORT, async () => {
    await ensureDbConnection();
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  });
}

// Export for Vercel serverless
export default app;
