
import { GoogleGenAI, Type } from "@google/genai";
import { EssayGradeResult } from '../types';

export const gradeEssay = async (
  questionText: string, 
  studentAnswer: string
): Promise<EssayGradeResult> => {
  try {
    // Initializing directly with process.env.API_KEY as per guidelines.
    // Creating instance inside the function ensures it always uses the current environment key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an expert English teacher. 
      Task: Grade the following student essay based on the question provided.
      
      Question: "${questionText}"
      Student Answer: "${studentAnswer}"
      
      Requirements:
      1. Give a score between 0 and 100 based on grammar, coherence, and relevance.
      2. Provide constructive feedback (max 2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Updated to recommended model for Basic Text Tasks
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText.trim()) as EssayGradeResult;

  } catch (error) {
    console.error("Gemini Grading Error:", error);
    // Fallback in case of API error to prevent app crash
    return {
      score: 0,
      feedback: "Error connecting to grading service. Please try again."
    };
  }
};
