
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generate a practical 3-5 item checklist for a task using Gemini 3 Flash
export async function generateTaskChecklist(title: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a practical 3-5 item checklist for a task titled "${title}". Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Checklist item text" }
            },
            required: ["text"]
          }
        }
      }
    });
    
    // Trim and parse JSON from the response text
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Checklist Error:", error);
    return [{ text: "Break down this task into sub-steps" }];
  }
}

// Summarize overall project progress using Gemini 3 Flash
export async function summarizeProjectProgress(tasks: Task[]) {
  try {
    const taskSummary = tasks.map(t => `${t.title} (${t.status})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the overall progress for a client based on these tasks: ${taskSummary}. Keep it professional and encouraging.`,
    });
    return response.text || "Progress summary unavailable at this time.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Project is moving along as planned. Check the board for specific task updates.";
  }
}
