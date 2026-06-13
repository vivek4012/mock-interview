import mongoose from "mongoose";
const { Schema } = mongoose;
// Message schema for conversation between AI and Candidate
const MessageSchema = new Schema(
  {
    sender: { type: String, enum: ["AI", "Candidate"], required: true },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Options = new Schema({
  designation: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  areaToFocus: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
});

// Analysis schema for interview feedback
const AnalysisSchema = new Schema({
  overallScore: { type: Number, min: 0, max: 100 },
  technicalScore: { type: Number, min: 0, max: 100 },
  communicationScore: { type: Number, min: 0, max: 100 },
  strengths: [{ type: String }],
  areasToImprove: [{ type: String }],
  detailedFeedback: { type: String },
  keyInsights: [{ type: String }],
  recommendedResources: [{ type: String }],
  behavioralTraits: {
    confidence: { type: Number, min: 0, max: 100 },
    clarity: { type: Number, min: 0, max: 100 },
    technicalDepth: { type: Number, min: 0, max: 100 },
    problemSolving: { type: Number, min: 0, max: 100 },
  },
  analyzedAt: { type: Date, default: Date.now },
});

const interviewSession = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    options: { type: Options, required: true },
    transcript: { type: [MessageSchema], default: [] },
    analysis: { type: AnalysisSchema, default: null },
    startedAt: { type: Date },
    completedAt: { type: Date },

    status: {
      type: String,
      enum: ["pending", "completed", "in-progress"],
      default: "pending",
    },
  },
  { timestamps: true }
);
interviewSession.methods.startInterview = function () {
  this.status = "in-progress";
  this.startedAt = new Date();
};

interviewSession.methods.endInterview = function () {
  this.status = "completed";
  this.completedAt = new Date();
};

const Interview = mongoose.model("interviewSession", interviewSession);
export default Interview;
