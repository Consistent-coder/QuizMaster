import dotenv from "dotenv";
dotenv.config();

import {
  GoogleGenAI,
} from '@google/genai';


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const config = {
  responseMimeType: 'application/json',
};
const model = 'gemini-2.0-flash';

export async function getAIGeneratedQuestions({ topic, numberOfQuestions }: { topic: string, numberOfQuestions: number }) {

  const prompt = `You are quiz-master created by QuizMaster generate ${numberOfQuestions} easy to super hard questions on the topic "${topic}"
    Each question must include:
    - "text": The question
    - "options": An array of minimum 2 and ideally 4 options where exactly one has isCorrect:true
    - "review": Explanation about why the correct answer is right.

    Strict JSON format:
[
  {
    "text": "What is ...?",
    "review": "Explanation about why the correct answer is right.",
    "options": [
      { "text": "...", "isCorrect": true },
      { "text": "...", "isCorrect": false },
      { "text": "...", "isCorrect": false },
      { "text": "...", "isCorrect": false }
    ]
  },
  {
    "text": "Another question ...?",
    "review": "Explanation for another question.",
    "options": [
      { "text": "Option A", "isCorrect": false },
      { "text": "Option B", "isCorrect": true },
      { "text": "Option C", "isCorrect": false }
    ]
  }
]
    `;

  const responseStream = await ai.models.generateContentStream({
    model,
    config,
    contents: [{ text: prompt }],
  });

  let fullJsonResponse = '';
  for await (const chunk of responseStream) {
    // Accumulate the text from each chunk
    if (chunk.text) {
      fullJsonResponse += chunk.text;
    }
  }

  try {
    const questions = JSON.parse(fullJsonResponse);
    console.log(questions);
    return questions; 
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    console.error("Raw response:", fullJsonResponse);
    throw new Error("Failed to parse AI-generated questions as JSON.");
  }
}

//for my testing purpose.
(async () => {
  try {
    const generatedQuestions = await getAIGeneratedQuestions({ topic: "Artificial Intelligence", numberOfQuestions: 3 });
    console.log("Successfully generated questions:", generatedQuestions);
  } catch (error) {
    console.error("Failed to generate questions:", error);
  }
})();