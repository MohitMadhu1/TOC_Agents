import { VercelRequest, VercelResponse } from '@vercel/node';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// Shared Schema for DFA/NFA
const AutomataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      isInitial: z.boolean(),
      isFinal: z.boolean(),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      label: z.string(),
    })
  ),
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, type } = request.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey,
      modelName: "gemini-1.5-pro",
      maxOutputTokens: 2048,
    });

    const structuredModel = model.withStructuredOutput(AutomataSchema);

    const aiResponse = await structuredModel.invoke([
      ["system", `You are an expert in the Theory of Computation. 
Your task is to design a formal ${type === 'nfa' ? 'Non-deterministic Finite Automaton (NFA)' : 'Deterministic Finite Automaton (DFA)'} based on the user's natural language description.

Rules:
1. Alphabet: Assume the alphabet is {0, 1} unless otherwise specified.
2. ${type === 'nfa' ? 'Non-determinism: You MAY use epsilon transitions (ε) and multiple transitions for the same symbol.' : 'Determinism: Every state MUST have exactly one transition for every symbol in the alphabet. Use dead states if needed.'}
3. Minimal: Try to keep the number of states minimal.
4. Layout: Ensure ids are short (q0, q1, etc.).

Output the result as a structured JSON object.`],
      ["human", `Create a ${type} for: ${prompt}`],
    ]);

    return response.status(200).json(aiResponse);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
