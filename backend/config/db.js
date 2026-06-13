import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if already connected (for serverless environments)
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected");
      return;
    }

    // Connect with optimized settings for serverless
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);

    // In serverless, don't exit process - throw error instead
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database connection failed: ${err.message}`);
    } else {
      process.exit(1); // Exit process with failure in development
    }
  }
};

export default connectDB;
