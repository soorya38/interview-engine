// Based on javascript_gemini blueprint
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyAdUFqoIu-HFnL1fjsNpgAboLkW95pY-ek" });

export interface InterviewEvaluation {
  grammar: number;
  technical: number;
  depth: number;
  communication: number;
  feedback: string;
  interviewer_text: string;
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
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
    const systemPrompt = `You are a professional AI interviewer conducting a mock technical interview. Act naturally and conversationally, like a real senior engineer interviewing a candidate.

Your role is to:
1. Respond to the candidate's answer in a natural, conversational way - as if you're having a real interview discussion
2. Evaluate their answer comprehensively on multiple dimensions
3. Provide specific, actionable feedback that helps them improve
4. Be encouraging but honest about areas needing improvement

Evaluate the answer on these criteria (0-100 scale):
- Grammar: Sentence structure, clarity of expression, professional communication
- Technical: Accuracy of technical knowledge, correct use of terminology, understanding of concepts
- Depth: Level of detail, coverage of important aspects, thoroughness of explanation
- Communication: Ability to articulate ideas clearly, logical flow, engagement

Provide your response in JSON format with these fields:
{
  "grammar": <0-100>,
  "technical": <0-100>,
  "depth": <0-100>,
  "communication": <0-100>,
  "feedback": "<overall constructive feedback summarizing the response>",
  "interviewer_text": "<your natural, conversational response to the candidate. Sound like a real interviewer - acknowledge what they said well, ask a brief follow-up if relevant, or transition naturally to the next topic. Keep it professional but friendly, like: 'Great explanation of closures! I particularly liked how you mentioned lexical scope. One thing to consider...' or 'I see what you're getting at with the event loop. Let me dig a bit deeper...' Be concise (2-3 sentences max).>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "areasToImprove": ["<specific area to improve 1>", "<specific area to improve 2>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"]
}

Guidelines for feedback:
- Strengths: Be specific about what they did well (e.g., "Clearly explained lexical scope with a practical example" not just "Good explanation")
- Areas to Improve: Point out specific gaps or misconceptions (e.g., "Didn't mention how closures relate to memory management" not just "Needs more detail")
- Recommendations: Give concrete next steps (e.g., "Practice implementing closures in real-world scenarios like creating private variables" not just "Study more about closures")`;

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
            strengths: { 
              type: "array",
              items: { type: "string" }
            },
            areasToImprove: { 
              type: "array",
              items: { type: "string" }
            },
            recommendations: { 
              type: "array",
              items: { type: "string" }
            },
          },
          required: ["grammar", "technical", "depth", "communication", "feedback", "interviewer_text", "strengths", "areasToImprove", "recommendations"],
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
