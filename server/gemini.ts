// Based on javascript_gemini blueprint
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface InterviewEvaluation {
  grammar: number;
  technical: number;
  depth: number;
  communication: number;
  feedback: string;
  interviewer_text: string;
}

export async function conductInterview(
  questionText: string,
  userAnswer: string,
  userProfile?: {
    username: string;
    pastScores?: number[];
  }
): Promise<InterviewEvaluation> {
  try {
    const systemPrompt = `You are an AI interviewer conducting a mock interview. Your role is to:
1. Evaluate the candidate's answer comprehensively
2. Provide constructive feedback
3. Ask relevant follow-up questions or provide encouraging responses

Evaluate the answer on these criteria (0-100 scale):
- Grammar: Proper sentence structure, spelling, punctuation
- Technical: Accuracy and depth of technical knowledge
- Depth: Thoroughness and detail in the response
- Communication: Clarity, organization, and articulation

Provide your response in JSON format with these fields:
{
  "grammar": <0-100>,
  "technical": <0-100>,
  "depth": <0-100>,
  "communication": <0-100>,
  "feedback": "<specific, actionable feedback>",
  "interviewer_text": "<your response to the candidate - encouraging, professional, and helpful>"
}`;

    const userContext = userProfile 
      ? `Candidate: ${userProfile.username}. Previous average scores: ${userProfile.pastScores?.join(", ") || "No history"}`
      : "New candidate";

    const prompt = `${userContext}

Interview Question: ${questionText}

Candidate's Answer: ${userAnswer}

Please evaluate this answer and provide your feedback.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            grammar: { type: "number" },
            technical: { type: "number" },
            depth: { type: "number" },
            communication: { type: "number" },
            feedback: { type: "string" },
            interviewer_text: { type: "string" },
          },
          required: ["grammar", "technical", "depth", "communication", "feedback", "interviewer_text"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from AI");
    }

    const evaluation: InterviewEvaluation = JSON.parse(rawJson);
    
    // Ensure scores are within 0-100 range
    evaluation.grammar = Math.max(0, Math.min(100, evaluation.grammar));
    evaluation.technical = Math.max(0, Math.min(100, evaluation.technical));
    evaluation.depth = Math.max(0, Math.min(100, evaluation.depth));
    evaluation.communication = Math.max(0, Math.min(100, evaluation.communication));

    return evaluation;
  } catch (error) {
    console.error("Gemini AI error:", error);
    throw new Error(`Failed to conduct interview: ${error}`);
  }
}

export function calculateTotalScore(scores: {
  grammar: number;
  technical: number;
  depth: number;
  communication: number;
}): number {
  // Formula: 0.5*technical + 0.2*communication + 0.15*depth + 0.15*grammar
  return Math.round(
    scores.technical * 0.5 +
    scores.communication * 0.2 +
    scores.depth * 0.15 +
    scores.grammar * 0.15
  );
}

export function getGrade(totalScore: number): string {
  if (totalScore >= 90) return "A";
  if (totalScore >= 80) return "B";
  if (totalScore >= 70) return "C";
  if (totalScore >= 60) return "D";
  return "F";
}
