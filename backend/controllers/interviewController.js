import Interview from "../models/interview.js";
import { createError } from "../utils/errors.js";
import assemblyaiService from "../services/assemblyaiService.js";
import openaiService from "../services/openaiService.js";

// 1. Create Interview - Creates interview with pending status
export const createInterview = async (req, res, next) => {
  try {
    const { designation, experience, areaToFocus, jobDescription } = req.body;

    // Validate required fields
    if (!designation || !experience || !areaToFocus || !jobDescription) {
      return next(
        createError(
          400,
          "All fields are required: designation, experience, areaToFocus, jobDescription"
        )
      );
    }

    // Create new interview with pending status
    const interview = new Interview({
      userId: req.userId,
      status: "pending",
      options: {
        designation,
        experience,
        areaToFocus,
        jobDescription,
      },
      transcript: [],
    });

    await interview.save();

    res.status(201).json({
      status: "success",
      message: "Interview created successfully",
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          options: interview.options,
          createdAt: interview.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Start Interview - Changes status to in-progress and returns AssemblyAI token
export const startInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    // Find the interview
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    // Check if interview belongs to the authenticated user
    if (interview.userId.toString() !== req.userId.toString()) {
      return next(createError(403, "You are not authorized to start this interview"));
    }

    // Check if interview is in pending status
    if (interview.status !== "pending") {
      return next(
        createError(400, `Interview cannot be started. Current status: ${interview.status}`)
      );
    }

    // Update status to in-progress using the model method
    interview.startInterview();
    await interview.save();

    // Generate AssemblyAI token for real-time transcription
    const tokenData = await assemblyaiService.createRealtimeSession({
      expiresInSeconds: 600,
      maxSessionDurationSeconds: 3600,
    });

    // Generate first question using OpenAI
    const context = {
      designation: interview.options.designation,
      experience: interview.options.experience,
      areaToFocus: interview.options.areaToFocus,
      jobDescription: interview.options.jobDescription,
      conversationHistory: "", // Empty for first question
      minutesRemaining: 30, // Full 30 minutes remaining
      percentageComplete: 0,
    };

    const firstQuestion = await openaiService.generateQuestion(context);

    // Add first question to transcript
    interview.transcript.push({
      sender: "AI",
      text: firstQuestion,
    });

    await interview.save();

    res.status(200).json({
      status: "success",
      message: "Interview started successfully",
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          startedAt: interview.startedAt,
        },
        assemblyaiToken: {
          token: tokenData.token,
          expiresAt: tokenData.expires_at,
        },
        firstQuestion: {
          text: firstQuestion,
          timeRemaining: 30,
          percentageComplete: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Generate Question - AI generates next interview question based on context
export const generateQuestion = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    // Find the interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    if (interview.status !== "in-progress") {
      return next(createError(400, "Interview is not in progress"));
    }

    // Build conversation history from transcript (direct array of messages)
    const conversationHistory = interview.transcript
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join("\n");

    // Calculate time elapsed and remaining (30 min total interview)
    const INTERVIEW_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    const timeElapsed = Date.now() - new Date(interview.startedAt).getTime();
    const timeRemaining = Math.max(0, INTERVIEW_DURATION_MS - timeElapsed);
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const percentageComplete = Math.min(
      100,
      Math.round((timeElapsed / INTERVIEW_DURATION_MS) * 100)
    );

    // Prepare context for question generation
    const context = {
      designation: interview.options.designation,
      experience: interview.options.experience,
      areaToFocus: interview.options.areaToFocus,
      jobDescription: interview.options.jobDescription,
      conversationHistory,
      minutesRemaining,
      percentageComplete,
    };

    // Call OpenAI to generate question
    const question = await openaiService.generateQuestion(context);

    // Add AI's question to transcript (direct push to array)
    interview.transcript.push({
      sender: "AI",
      text: question,
    });

    await interview.save();

    // Determine if this is the last question (less than 2 minutes remaining)
    const isLastQuestion = minutesRemaining <= 2;

    res.json({
      status: "success",
      data: {
        question,
        timeRemaining: minutesRemaining,
        percentageComplete,
        isLastQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Transcript - Add candidate's answer or AI message to transcript
export const updateTranscript = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { message, sender } = req.body;

    // Validate required fields
    if (!message || !sender) {
      return next(createError(400, "Message and sender are required"));
    }

    if (!["AI", "Candidate"].includes(sender)) {
      return next(createError(400, "Sender must be either 'AI' or 'Candidate'"));
    }

    // Find the interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    if (interview.status !== "in-progress") {
      return next(createError(400, "Interview is not in progress"));
    }

    // Add message to transcript (direct push to array)
    interview.transcript.push({
      sender,
      text: message,
    });

    await interview.save();

    res.json({
      status: "success",
      message: "Transcript updated successfully",
      data: {
        messageCount: interview.transcript.length,
        lastMessage: {
          sender,
          text: message,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 5. Analyze Interview - Generate AI analysis of completed interview
export const analyzeInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    // Find the interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    if (interview.status !== "completed") {
      return next(createError(400, "Interview must be completed before analysis"));
    }

    if (!interview.transcript || interview.transcript.length === 0) {
      return next(createError(400, "No interview transcript found for analysis"));
    }

    // Build conversation history from transcript (direct array of messages)
    const conversationHistory = interview.transcript
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join("\n\n");

    // Prepare context for analysis
    const systemPrompt = `You are an expert interview analyst. Analyze this mock interview transcript and provide detailed, actionable feedback.

Interview Context:
- Designation: ${interview.options.designation}
- Experience Level: ${interview.options.experience} years
- Focus Area: ${interview.options.areaToFocus}
- Job Description: ${interview.options.jobDescription}

Transcript:
${conversationHistory}

Analyze the candidate's performance and provide a comprehensive analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths with examples>],
  "areasToImprove": [<array of 3-5 specific areas with actionable recommendations>],
  "detailedFeedback": "<comprehensive paragraph analyzing the interview performance>",
  "keyInsights": [<array of 3-5 key insights or observations>],
  "recommendedResources": [<array of learning resources or topics to study>],
  "behavioralTraits": {
    "confidence": <number 0-100>,
    "clarity": <number 0-100>,
    "technicalDepth": <number 0-100>,
    "problemSolving": <number 0-100>
  }
}

Provide specific examples from the transcript to support your analysis. Be constructive and actionable in your feedback.`;

    const response = await openaiService.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please analyze this interview transcript." },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisData = JSON.parse(response.choices[0].message.content);

    // Save analysis to interview document
    interview.analysis = {
      ...analysisData,
      analyzedAt: new Date(),
    };

    await interview.save();

    res.json({
      status: "success",
      message: "Interview analysis completed successfully",
      data: {
        analysis: interview.analysis,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return next(createError(500, "Failed to parse interview analysis"));
    }
    next(error);
  }
};

// 6. End Interview - Changes status from in-progress to completed
export const endInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    // Find the interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    if (interview.status !== "in-progress") {
      return next(
        createError(400, `Interview cannot be ended. Current status: ${interview.status}`)
      );
    }

    // Update status to completed using the model method
    interview.endInterview();
    await interview.save();

    res.status(200).json({
      status: "success",
      message: "Interview ended successfully",
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          startedAt: interview.startedAt,
          completedAt: interview.completedAt,
          duration: Math.round((new Date(interview.completedAt) - new Date(interview.startedAt)) / 1000 / 60), // in minutes
          messageCount: interview.transcript.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get Interview List - Returns list of interviews for dashboard
export const getInterviewList = async (req, res, next) => {
  try {
    // Find all interviews for the authenticated user
    const interviews = await Interview.find({
      userId: req.userId,
    })
      .select('_id options.designation status createdAt completedAt analysis.overallScore')
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // Transform the data for dashboard display
    const interviewList = interviews.map((interview) => ({
      id: interview._id,
      role: interview.options?.designation || "N/A",
      date: interview.completedAt || interview.createdAt,
      status: interview.status,
      score: interview.analysis?.overallScore || null,
    }));

    res.status(200).json({
      status: "success",
      message: "Interview list retrieved successfully",
      data: {
        interviews: interviewList,
        total: interviewList.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Interview Analysis - Returns full analysis for a specific interview
export const getInterviewAnalysis = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    // Find the interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    })
      .select('_id options status createdAt startedAt completedAt analysis transcript')
      .lean();

    if (!interview) {
      return next(createError(404, "Interview not found"));
    }

    // Check if interview has been analyzed
    if (!interview.analysis) {
      return next(createError(400, "Interview has not been analyzed yet"));
    }

    // Calculate duration if completed
    let duration = null;
    if (interview.startedAt && interview.completedAt) {
      duration = Math.round(
        (new Date(interview.completedAt) - new Date(interview.startedAt)) / 1000 / 60
      ); // in minutes
    }

    // Return detailed analysis
    res.status(200).json({
      status: "success",
      message: "Interview analysis retrieved successfully",
      data: {
        interview: {
          id: interview._id,
          role: interview.options.designation,
          experience: interview.options.experience,
          areaToFocus: interview.options.areaToFocus,
          jobDescription: interview.options.jobDescription,
          status: interview.status,
          createdAt: interview.createdAt,
          startedAt: interview.startedAt,
          completedAt: interview.completedAt,
          duration: duration,
          transcriptLength: interview.transcript?.length || 0,
        },
        analysis: {
          overallScore: interview.analysis.overallScore,
          technicalScore: interview.analysis.technicalScore,
          communicationScore: interview.analysis.communicationScore,
          strengths: interview.analysis.strengths,
          areasToImprove: interview.analysis.areasToImprove,
          detailedFeedback: interview.analysis.detailedFeedback,
          keyInsights: interview.analysis.keyInsights,
          recommendedResources: interview.analysis.recommendedResources,
          behavioralTraits: interview.analysis.behavioralTraits,
          analyzedAt: interview.analysis.analyzedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


