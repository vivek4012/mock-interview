import OpenAI from 'openai';
import { createError } from '../utils/errors.js';
import {config}  from '../config/config.js'

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey:config.OPENAI_API_KEY,
    });
  }

  async generateQuestion(context) {
    try {
      const systemPrompt = `You are an expert technical interviewer conducting a mock interview. Your role is to:
1. Generate relevant, insightful questions based on the candidate's profile
2. Consider the entire conversation history to avoid repetition
3. Ask follow-up questions when appropriate
4. Probe deeper into areas where the candidate shows expertise or needs improvement
5. Maintain a professional yet conversational tone
6. Manage time effectively - adjust question depth based on remaining time

Candidate Profile:
- Designation: ${context.designation}
- Experience Level: ${context.experience} years
- Area to Focus: ${context.areaToFocus}
- Job Description: ${context.jobDescription}

Interview Timing:
- Time Remaining: ${context.minutesRemaining} minutes (${context.percentageComplete}% complete)
- Total Duration: 10 minutes

IMPORTANT TIME-BASED STRATEGY:
- If 7+ minutes remaining: Ask foundational questions, explore multiple topics
- If 4-7 minutes remaining: Focus on 1-2 key areas, ask follow-ups to candidate's answers
- If 2-4 minutes remaining: Ask targeted questions on most important topics, wrap up current area
- If less than 2 minutes: Ask final clarifying questions or move to closing

Based on the time remaining, decide whether to:
a) Probe deeper into the candidate's last answer (if it shows expertise or needs clarification)
b) Move to a new topic (if time is limited or current topic is exhausted)

Conversation History:
${context.conversationHistory || "No previous conversation"}

Generate a single, well-crafted interview question that:
- Is relevant to the candidate's experience level and target role
- Focuses on the specified area of interest
- Builds upon or complements previous questions (if any)
- Encourages detailed, thoughtful responses
- Is appropriately scoped for the remaining time

Return ONLY the question text, nothing else.`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the next interview question." },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      throw this._handleOpenAIError(error);
    }
  }

  _handleOpenAIError(error) {
    if (error.status === 401) {
      return createError(500, 'OpenAI API authentication failed');
    } else if (error.status === 429) {
      return createError(503, 'OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.status >= 500) {
      return createError(503, 'OpenAI service is currently unavailable');
    } else {
      return createError(500, `OpenAI API error: ${error.message}`);
    }
  }
}

export default new OpenAIService();
