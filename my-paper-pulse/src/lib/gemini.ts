import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { PaperAnalysis, ComparisonResult } from "../types";

const getApiKey = () => {
  // Check multiple possible locations for the API key
  const key = process.env.GEMINI_API_KEY || 
              (import.meta as any).env?.VITE_GEMINI_API_KEY || 
              (import.meta as any).env?.GEMINI_API_KEY;
  return key || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Helper to call Gemini with exponential backoff for 429 (Quota) and 503 (Overloaded) errors.
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota');
      const isOverloadedError = errorMessage.includes('503') || errorMessage.toLowerCase().includes('high demand') || errorMessage.toLowerCase().includes('overloaded');
      
      if (isQuotaError || isOverloadedError) {
        const errorType = isQuotaError ? "Quota Exceeded" : "Server Overload";
        const waitTime = Math.round(Math.pow(2, i) * 1000 / 1000);
        console.warn(`[Gemini] ${errorType} hit. Retrying in ${waitTime}s... (Attempt ${i + 1}/${maxRetries})`);
        
        if (i === maxRetries - 1) {
          if (isQuotaError) {
            throw new Error("API Quota Exceeded. \n\nGoogle's free tier has a limit on how many requests you can make per minute. \n\nFIX: Please wait 60 seconds and try again, or use a different API key for your presentation.");
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000 + Math.random() * 1000));
        continue;
      }
      
      if (isOverloadedError) {
        throw new Error("Google's AI servers are currently under extremely high demand. \n\nThis is a temporary issue on Google's side. Please wait a few minutes and try again. Your API key is working, but the model is busy.");
      }
      
      throw error;
    }
  }
  throw lastError;
}

/**
 * Simple client-side vector store for RAG.
 */
interface VectorNode {
  text: string;
  embedding: number[];
}

let vectorDatabase: VectorNode[] = [];

/**
 * Splits text into chunks of approximately 2000 characters with 300 character overlap.
 */
function chunkText(text: string, size: number = 2000, overlap: number = 300): string[] {
  const chunks: string[] = [];
  let start = 0;
  // Limit total text processed for embeddings to save quota (approx 50k chars)
  const maxText = 50000;
  const truncatedText = text.substring(0, maxText);
  
  while (start < truncatedText.length) {
    const end = Math.min(start + size, truncatedText.length);
    chunks.push(truncatedText.substring(start, end));
    start += size - overlap;
  }
  return chunks;
}

/**
 * Generates embeddings for a list of text chunks.
 */
async function generateEmbeddings(chunks: string[]): Promise<VectorNode[]> {
  const model = "gemini-embedding-2-preview";
  const result = await callGeminiWithRetry(() => ai.models.embedContent({
    model,
    contents: chunks,
  }));

  const embeddings = result.embeddings;
  if (!embeddings || !Array.isArray(embeddings)) {
    throw new Error("Failed to generate embeddings: Invalid response structure");
  }

  return chunks.map((text, i) => {
    const embeddingObj = embeddings[i];
    return {
      text,
      embedding: embeddingObj?.values || [],
    };
  });
}

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Retrieves the most relevant chunks for a given query.
 */
async function retrieveContext(query: string, k: number = 4): Promise<string> {
  if (vectorDatabase.length === 0) return "";

  console.log(`[RAG] Searching vector database for: "${query}"`);

  const queryEmbeddingResult = await callGeminiWithRetry(() => ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: [query],
  }));
  
  const queryEmbeddings = queryEmbeddingResult.embeddings;
  const queryEmbedding = queryEmbeddings?.[0]?.values;
  
  if (!queryEmbedding) {
    console.error("[RAG] Failed to get query embedding");
    return "";
  }

  const scoredChunks = vectorDatabase.map(chunk => ({
    text: chunk.text,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  const relevant = scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  console.log(`[RAG] Retrieved ${relevant.length} relevant chunks.`);

  return relevant
    .map(c => c.text)
    .join("\n\n---\n\n");
}

/**
 * Analyzes research paper content using Gemini 3.1 Pro.
 * Extracts summary, insights, methodology, chart data, and concept map.
 */
export async function analyzePaper(content: string | { data: string; mimeType: string }): Promise<PaperAnalysis> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "undefined" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API key is missing. \n\nLocal Fix: Ensure your .env file has GEMINI_API_KEY=your_key and RESTART your terminal/server.");
  }
  
  // Primary model is Flash 3 for speed and higher quota, fallback is Pro 3.1
  const models = ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
  let lastError: any;

  if (typeof content === 'string' && content.trim().length < 50) {
    throw new Error("The extracted text is too short to analyze. Please ensure the PDF contains readable text.");
  }

  for (const model of models) {
    try {
      // If it's a string, we can chunk it for RAG
      if (typeof content === 'string') {
        console.log("[RAG] Initializing vector database...");
        const chunks = chunkText(content);
        vectorDatabase = await generateEmbeddings(chunks);
        console.log(`[RAG] Vector database ready with ${vectorDatabase.length} chunks.`);
      }

      const prompt = `
        Analyze the following research paper content. 
        Extract and generate:
        1. A concise summary (max 200 words).
        2. Key insights (max 5 bullet points).
        3. Methodology and Results (concise).
        4. Data for a representative chart (max 5 data points).
        5. A step-by-step process flow (max 5 steps).
        6. A simple graph/diagram structure (max 5 nodes).

        Return the data in the specified JSON format. Be extremely concise to fit within token limits.
      `;

      console.log(`[Analysis] Sending request to Gemini (${model})...`);
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model,
        contents: typeof content === 'string' 
          ? [{ parts: [{ text: prompt }, { text: content.substring(0, 100000) }] }] // Increased limit for Pro model
          : { parts: [{ text: prompt }, { inlineData: content }] },
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
      }));

      console.log("[Analysis] Response received from Gemini.");
      const text = response.text;
      if (!text) {
        console.error("[Analysis] Empty response from Gemini");
        throw new Error("Empty response from Gemini");
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("[Analysis] Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from AI");
      }
    } catch (error: any) {
      lastError = error;
      const isOverloaded = error?.message?.includes('503') || error?.message?.toLowerCase().includes('demand');
      if (isOverloaded && model !== models[models.length - 1]) {
        console.warn(`[Gemini] ${model} is overloaded, trying fallback model...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function chatWithPaper(history: { role: 'user' | 'model'; parts: { text: string }[] }[], message: string, paperContent?: string) {
  const models = ["gemini-3-flash-preview", "gemini-2.5-flash-preview"];
  let lastError: any;

  for (const model of models) {
    try {
      // If vector database is empty but we have paper content, re-initialize it
      if (vectorDatabase.length === 0 && paperContent) {
        console.log("[RAG] Vector database empty, re-initializing from provided content...");
        const chunks = chunkText(paperContent);
        vectorDatabase = await generateEmbeddings(chunks);
      }

      // Use RAG to get relevant context
      const context = await retrieveContext(message);
      
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: `You are a research assistant. You have analyzed a paper. Use the following retrieved context to answer the user's question accurately. If the answer isn't in the context, say you don't know based on the paper. 
          
          CONTEXT:
          ${context || paperContent?.substring(0, 5000)}
          
          Use a helpful, slightly informal Gen Z tone (use emojis, be concise).`
        },
        history: history,
      });

      console.log(`[Chat] Sending message to Gemini (${model})...`);
      const response = await callGeminiWithRetry(() => chat.sendMessage({ message }));
      return response.text;
    } catch (error: any) {
      lastError = error;
      const isOverloaded = error?.message?.includes('503') || error?.message?.toLowerCase().includes('demand');
      if (isOverloaded && model !== models[models.length - 1]) {
        console.warn(`[Gemini] ${model} is overloaded, trying fallback model...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Compares multiple research papers.
 */
export async function comparePapers(papers: { id: string; title: string; content: string }[]): Promise<ComparisonResult> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "undefined" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API key is missing.");
  }

  const models = ["gemini-3-flash-preview", "gemini-2.5-flash-preview"];
  let lastError: any;

  for (const model of models) {
    try {
      const prompt = `
        Compare the following research papers. 
        Identify:
        1. Key similarities in their findings or methodology.
        2. Main differences or unique contributions of each.
        3. Any contradictions or conflicting results between them.
        4. A synthesis of the collective knowledge from these papers.
        5. A comparison table comparing specific features (e.g., Methodology, Sample Size, Key Result, Limitations).

        Return the data in the specified JSON format.
      `;

      const paperContents = papers.map((p, i) => `PAPER ${i+1} (ID: ${p.id}, Title: ${p.title}):\n${p.content.substring(0, 10000)}`).join("\n\n---\n\n");

      console.log(`[Comparison] Sending request to Gemini (${model})...`);
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }, { text: paperContents }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              similarities: { type: Type.ARRAY, items: { type: Type.STRING } },
              differences: { type: Type.ARRAY, items: { type: Type.STRING } },
              contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
              synthesis: { type: Type.STRING },
              comparisonTable: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    feature: { type: Type.STRING },
                    values: {
                      type: Type.OBJECT,
                      additionalProperties: { type: Type.STRING }
                    }
                  },
                  required: ["feature", "values"]
                }
              }
            },
            required: ["similarities", "differences", "contradictions", "synthesis", "comparisonTable"]
          }
        }
      }));

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini during comparison");
      }

      const result = JSON.parse(text);
      return {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        paperIds: papers.map(p => p.id)
      };
    } catch (error: any) {
      lastError = error;
      const isOverloaded = error?.message?.includes('503') || error?.message?.toLowerCase().includes('demand');
      if (isOverloaded && model !== models[models.length - 1]) {
        console.warn(`[Gemini] ${model} is overloaded, trying fallback model...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
