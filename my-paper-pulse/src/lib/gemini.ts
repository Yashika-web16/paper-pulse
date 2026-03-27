import { GoogleGenAI, Type } from "@google/genai";
import { PaperAnalysis } from "../types";

// src/lib/gemini.ts
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Analyzes research paper content using Gemini 3.1 Pro.
 * Extracts summary, insights, methodology, chart data, and concept map.
 */
export async function analyzePaper(content: string | { data: string; mimeType: string }): Promise<PaperAnalysis> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Analyze the following research paper content. 
    Extract and generate:
    1. A concise summary.
    2. Key insights (bullet points).
    3. Methodology and Results.
    4. Data for a representative chart (e.g., performance metrics, distribution, etc.).
    5. A step-by-step process flow of the research methodology.
    6. A simple graph/diagram structure (nodes and edges) representing the core concepts and their relationships.

    Return the data in the specified JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: typeof content === 'string' 
      ? [{ parts: [{ text: prompt }, { text: content }] }]
      : { parts: [{ text: prompt }, { inlineData: content }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          authors: { type: Type.ARRAY, items: { type: Type.STRING } },
          abstract: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodology: { type: Type.STRING },
          results: { type: Type.STRING },
          conclusion: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                category: { type: Type.STRING },
              },
              required: ["name", "value"]
            }
          },
          processSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["step", "description"]
            }
          },
          diagramData: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                  },
                  required: ["id", "label", "type"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    label: { type: Type.STRING },
                  },
                  required: ["source", "target"]
                }
              }
            },
            required: ["nodes", "edges"]
          }
        },
        required: ["title", "authors", "abstract", "summary", "keyInsights", "methodology", "results", "conclusion", "chartData", "processSteps", "diagramData"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithPaper(history: { role: 'user' | 'model'; parts: { text: string }[] }[], message: string, paperContent?: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are a research assistant. You have analyzed a paper with the following content: ${paperContent?.substring(0, 20000)}. Answer questions based on this paper. Use a helpful, slightly informal Gen Z tone (use emojis, be concise).`
    },
    history: history.slice(0, -1), // Exclude the latest user message which is sent via sendMessage
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
