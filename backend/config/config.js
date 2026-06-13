import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  },
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  CLIENT_URL: process.env.CLIENT_URL,

  // External API Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
