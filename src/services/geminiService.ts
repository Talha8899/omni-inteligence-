import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../data/questions";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateNewQuestion(existingQuestions: string[], category?: string, difficulty: string = 'Medium'): Promise<Question> {
  const categoryConstraint = category && category !== 'All' 
    ? `The category MUST be strictly: ${category}. ${
        category === 'Pakistan Special' ? 'Focus on Pakistan\'s rich history, geography, notable personalities, or cultural milestones.' : 
        category === 'Brain Teasers & Logic' ? 'Focus on riddles, pattern recognition, or lateral thinking challenges.' : ''
      }` 
    : `Choose a HIGHLY RELEVANT and RANDOM topic from an extremely broad set of human knowledge: Modern Technology, Islamic Golden Age, Quantum Science, Pakistan\'s Achievements, Deep Space, Medical Discoveries, Ancient Civilizations (Greek, Roman, Indus Valley, Mayan), Cognitive Psychology, Classical Art, Renaissance Philosophy, Environmental Science, Linguistics, Economics, Game Theory, or Music Theory. DO NOT repeat topics. Aim for variety in every request.`;

  const prompt = `You are the Omnia Intelligence Engine, tasked with generating a high-stakes, intellectually stimulating trivia question. ` +
  `The audience consists of polymaths and deep-thinkers. 
  
  DEFINITELY NOT similar to these: ${existingQuestions.slice(-40).join(", ")}. 
  
  ${categoryConstraint}
  
  Requirements:
  1. 4 highly plausible, sophisticated options, 1 clearly correct answer.
  2. The explanation MUST contain a "Deep Insight"—an obscure, high-value fact that provides immediate intellectual ROI.
  3. Tone: Minimalist, professional, and authoritative. 
  4. Accuracy: Verify historical, religious (Islamic), and scientific metrics against academic standards.
  
  Difficulty Level for this specific request: ${difficulty}. 
  - If Hard: Target niche knowledge or complex conceptual intersections.
  - If Medium: Standard college-level general knowledge.
  - If Easy: Foundational knowledge appropriate for a Grade 10 student (High School level). Questions should be accessible yet educational.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: "LOW" as any },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctIndex: { type: Type.INTEGER, description: "0-3 index of the correct option" },
            explanation: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
          },
          required: ["id", "question", "options", "correctIndex", "explanation", "category", "difficulty"]
        }
      }
    });

    const question = JSON.parse(response.text);
    return question as Question;
  } catch (error) {
    console.error("Error generating question:", error);
    // Return a fallback question or re-throw
    throw error;
  }
}
