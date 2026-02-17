import { GoogleGenAI, Type } from "@google/genai";
import { DataSource, BRDData } from "../types";

// Helper to clean response text if needed
const cleanText = (text: string) => text.trim();

const MODEL_NAME = "gemini-3-pro-preview"; // Using Pro for complex reasoning

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // API Key must be in process.env.API_KEY
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a full BRD based on the provided data sources.
   */
  async generateBRD(sources: DataSource[], projectTitle: string): Promise<BRDData> {
    if (sources.length === 0) {
      throw new Error("No sources provided");
    }

    const sourceContext = sources.map(s => 
      `[Source ID: ${s.id}] (${s.type} - ${s.title}):\n${s.content}\n---`
    ).join("\n");

    const prompt = `
      You are an expert Business Analyst. 
      Your task is to generate a comprehensive Business Requirements Document (BRD) for a project named "${projectTitle}".
      
      Here is the raw data collected from various communication channels:
      ${sourceContext}

      Instructions:
      1. Analyze the data to extract project objectives, stakeholders, functional and non-functional requirements, assumptions, and timeline.
      2. Filter out irrelevant chit-chat or noise.
      3. Identify any conflicting requirements and list them separately.
      4. Use the [Source ID: ...] format to cite where specific requirements came from within the text.
      5. Return the result in a strict JSON format matching the schema provided.
      
      Structure the BRD with these standard sections:
      - Executive Summary
      - Business Objectives
      - Stakeholder Analysis
      - Functional Requirements
      - Non-Functional Requirements
      - Assumptions & Constraints
      - Risks
      - Success Metrics
      - Timeline
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Enable thinking for better synthesis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING, description: "Markdown content of the section, including citations." }
                },
                required: ["id", "title", "content"]
              }
            },
            conflicts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of conflicting requirements found, if any."
            }
          },
          required: ["title", "sections", "conflicts"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Failed to generate BRD content");
    }

    try {
      return JSON.parse(response.text) as BRDData;
    } catch (e) {
      console.error("Failed to parse JSON", response.text);
      throw new Error("Invalid JSON response from model");
    }
  }

  /**
   * Refines or edits the BRD based on a user prompt.
   */
  async refineBRD(currentBRD: BRDData, instruction: string, sources: DataSource[]): Promise<BRDData> {
     const sourceContext = sources.map(s => 
      `[Source ID: ${s.id}] (${s.type} - ${s.title}):\n${s.content.substring(0, 500)}...\n---`
    ).join("\n"); // Truncate sources for context window efficiency in edit mode, relying mostly on current BRD

    const brdContext = JSON.stringify(currentBRD, null, 2);

    const prompt = `
      You are an expert Business Analyst.
      
      Current BRD (JSON):
      ${brdContext}
      
      Available Source Context (Truncated):
      ${sourceContext}

      User Instruction: "${instruction}"

      Task:
      Update the BRD based strictly on the User Instruction. 
      - If the user asks to add a requirement, add it to the appropriate section.
      - If the user asks to change the tone, rewrite the sections.
      - Maintain the JSON structure.
      - Keep existing citations if valid, or add new ones if information comes from the source context.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["id", "title", "content"]
              }
            },
            conflicts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "sections", "conflicts"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as BRDData;
  }
  
  /**
   * Chat assistant to answer questions about the sources or BRD.
   */
  async chatAboutProject(message: string, projectContext: string): Promise<string> {
    const prompt = `
      Context:
      ${projectContext}
      
      User Question:
      ${message}
      
      Answer the user's question based on the provided context. Be concise and helpful.
    `;
    
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text || "I couldn't generate a response.";
  }
}

export const geminiService = new GeminiService();
