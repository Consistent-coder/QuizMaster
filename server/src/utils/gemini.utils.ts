import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.0-flash';

export async function askGemini(prompt: string): Promise<string> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ parts: [{ text: prompt }] }],
  });
  return res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}
