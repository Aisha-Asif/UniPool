import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RideSuggestion {
  points: string[];
  safetyTip: string;
  coordinationMessage: string;
  possibleStops: string[];
}

export async function getRideSuggestions(origin: string, destination: string, type: 'ride' | 'request'): Promise<RideSuggestion | null> {
  try {
    const prompt = `
      As a university campus mobility assistant, provide coordination suggestions for a student ${type === 'ride' ? 'offering' : 'requesting'} a ride.
      Route: From ${origin} to ${destination}.
      
      Requirements:
      1. Coordination Points: 3 specific tips for student needs (safety, pick-up points).
      2. Safety Tip: A one-sentence safety reminder.
      3. Coordination Message: A friendly template for chat.
      4. Possible Stops: 3-4 logical stops or landmarks along the MOST LIKELY route between these two locations that students might find useful.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 specific coordination/pick-up tips"
            },
            safetyTip: {
              type: Type.STRING,
              description: "A one-sentence safety reminder"
            },
            coordinationMessage: {
              type: Type.STRING,
              description: "A friendly message template for the chat"
            },
            possibleStops: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 landmarks along the route"
            }
          },
          required: ["points", "safetyTip", "coordinationMessage", "possibleStops"]
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return null;
  }
}
