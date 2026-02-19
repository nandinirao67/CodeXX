
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Paper, ChatMessage } from "../types";

// Always use the injected API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Search for papers using Google Search grounding.
 */
export const searchPapersAI = async (query: string): Promise<Partial<Paper>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for high-quality academic research papers related to: "${query}". 
      Provide exactly 5 real papers.
      Return the results strictly as a JSON array of objects. 
      Each object must have: title, authors (array of strings), year (number), abstract (string), journal (string), citations (number), url (string), and tags (array of strings).
      
      Return ONLY the JSON array inside markdown code blocks.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Gemini Search Error:", e);
    return [];
  }
};

/**
 * Generate a detailed structured summary for an uploaded document.
 */
export const summarizeDocument = async (title: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed, professional academic summary for a paper titled: "${title}".
      Use your internal knowledge and search to find real information if it exists.
      
      Return a JSON object with:
      - keyFindings: Array of strings
      - methodology: String
      - limitations: Array of strings
      - futureWork: String
      - significanceScore: Number (1-100)
      - executiveSummary: String (professional abstract)
      
      Return ONLY the JSON.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
  } catch (e) {
    console.error("Gemini Summary Error:", e);
    return null;
  }
};

/**
 * Execute advanced AI Lab tools (Complex synthesis).
 */
export const executeLabTool = async (toolName: string, papers: Paper[]): Promise<string> => {
  try {
    const context = papers.map(p => `Title: ${p.title}\nAbstract: ${p.abstract}`).join("\n\n---\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: `TASK: ${toolName}
      
      RESEARCH CONTEXT:
      ${context || "No papers in workspace."}
      
      Instructions:
      Perform deep-dive analysis. If "Semantic Weaver", identify hidden connections. 
      If "Conflict Resolver", highlight methodology disagreements. 
      If "Synthesis Engine", create a summary of common themes.
      
      Format as professional Markdown.`,
      config: {
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });

    return response.text || "No analysis available.";
  } catch (e) {
    console.error("Gemini Lab Tool Error:", e);
    return "Error executing analysis. Please check system logs.";
  }
};

/**
 * Brainy - The persistent AI Research Assistant.
 */
export const chatWithBrainy = async (query: string, papers: Paper[], history: {role: string, content: string}[]): Promise<string> => {
  try {
    const context = papers.length > 0 
      ? `You have access to the following papers in the user's workspace:\n${papers.map(p => `- ${p.title}`).join('\n')}`
      : "The user has no papers in their workspace yet.";
    
    const messages = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Your name is Brainy. You are an elite AI research assistant.
      
      CONTEXT:
      ${context}
      
      HISTORY:
      ${messages}
      
      USER: ${query}
      
      Answer professionally and helpfully. Keep it concise.`,
    });

    return response.text || "I'm listening.";
  } catch (e) {
    console.error("Brainy Error:", e);
    return "Brainy is currently offline due to a neural link error. (RPC Error)";
  }
};

/**
 * Workspace specific chat.
 */
export const chatWithWorkspace = async (query: string, papers: Paper[], history: {role: string, content: string}[]): Promise<string> => {
  try {
    const context = papers.map(p => `[${p.title}]\n${p.abstract}`).join('\n\n');
    const messages = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Using the provided context, answer the research query.
      
      CONTEXT:
      ${context}
      
      HISTORY:
      ${messages}
      
      QUERY: ${query}`,
    });

    return response.text || "Synthesis failed.";
  } catch (e) {
    console.error("Workspace Chat Error:", e);
    return "Error connecting to the research agent.";
  }
};
