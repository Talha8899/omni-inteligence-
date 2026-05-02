import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../data/questions";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuestionBatch(existingQuestions: string[], category?: string, difficulty: string = 'Medium', count: number = 30): Promise<Question[]> {
  const isRandomCategory = !category || category === 'All';
  const categoryConstraint = !isRandomCategory
    ? `CRITICAL INSTRUCTION: You MUST generate EXACTLY ${count} questions strictly categorized under exactly "${category}". Do NOT choose any other topic. You must output "${category}" in the category field for all of them.` 
    : `Choose HIGHLY RELEVANT and RANDOM topics from an extremely broad set of human knowledge. DO NOT repeat topics. Aim for variety in every request. Generate EXACTLY ${count} questions.`;

  const prompt = `You are the Omnia Intelligence Engine, tasked with generating a batch of ${count} high-stakes, intellectually stimulating trivia questions. ` +
  `The audience consists of polymaths and deep-thinkers. 
  
  DEFINITELY NOT similar to these: ${existingQuestions.slice(-40).join(", ")}. 
  
  ${categoryConstraint}
  
  Requirements for EACH question:
  1. 4 highly plausible, sophisticated options, 1 clearly correct answer.
  2. The explanation MUST contain a "Deep Insight"—an obscure, high-value fact that provides immediate intellectual ROI.
  3. Tone: Minimalist, professional, and authoritative. 
  4. Accuracy: Verify historical, religious (Islamic), and scientific metrics against academic standards.
  5. The JSON category field MUST be exactly "${!isRandomCategory ? category : 'The chosen random category'}".
  6. The JSON difficulty field MUST be exactly "${difficulty}".
  
  Difficulty Level for this specific request: ${difficulty}. 
  - If Hard: Target niche knowledge or complex conceptual intersections.
  - If Medium: Standard college-level general knowledge.
  - If Easy: Foundational knowledge appropriate for a Grade 10 student (High School level). Questions should be accessible yet educational.
  
  RETURN A JSON ARRAY OF EXACTLY ${count} OBJECTS.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: "LOW" as any },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
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
      }
    });

    const questions = JSON.parse(response.text);
    return questions as Question[];
  } catch (error) {
    console.error("Error generating question batch:", error);
    throw error;
  }
}
