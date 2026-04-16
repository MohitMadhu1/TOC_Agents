import type { AutomataDefinition } from "./aiSchemas";
import { AutomataSchema } from "./aiSchemas";

export class AIService {
  /**
   * Generates a machine. 
   * Uses local direct call in DEV mode (for npm run dev)
   * Uses secure Vercel Proxy in PROD mode.
   */
  async generateMachine(prompt: string, type: 'dfa' | 'nfa'): Promise<AutomataDefinition> {
    // ── DEVELOPMENT FALLBACK ──
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      
      if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.length < 10) {
        throw new Error("Invalid or Missing Gemini API Key in .env.local.");
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `Return ONLY a JSON object for a ${type.toUpperCase()} that: "${prompt}". 
Alphabet: {0, 1}.
JSON structure EXACTLY:
{
  "nodes": [{"id": "q0", "label": "Q0", "isInitial": true, "isFinal": false}],
  "edges": [{"source": "q0", "target": "q1", "label": "0"}]
}
No Markdown, No code blocks, No text before or after.`
          }]
        }]
      };

      const aiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!aiRes.ok) {
        const errorData = await aiRes.json();
        console.error("FULL GOOGLE ERROR:", errorData);
        throw new Error(errorData.error?.message || "Gemini API rejected the request.");
      }

      const data = await aiRes.json();
      let textResponse = data.candidates[0].content.parts[0].text;
      
      // Safety: Strip markdown code blocks if the AI included them
      textResponse = textResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      
      return JSON.parse(textResponse) as AutomataDefinition;
    }

    // ── PRODUCTION SECURE PROXY ──
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to connect to the Logic Oracle');
    }

    return await response.json();
  }

  async optimizeRegex(prompt: string, currentRegex: string): Promise<string> {
    // ── DEVELOPMENT FALLBACK ──
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("API Key missing.");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `You are an expert in Regular Expressions (Theory of Computation).
Analyze this request: "${prompt}".
Existing Regex: "${currentRegex}".

Goal: Create the most minimal, formal, and mathematically correct Regular Expression for the request.
Output ONLY the regex string. No quotes, No code blocks, No text.`
          }]
        }]
      };

      const aiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await aiRes.json();
      let text = data.candidates[0].content.parts[0].text;
      return text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    // ── PRODUCTION SECURE PROXY ──
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, currentRegex, type: 'regex' })
    });

    const data = await response.json();
    return data.regex;
  }

  async generateTM(prompt: string): Promise<any> {
    // ── DEVELOPMENT FALLBACK ──
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("API Key missing.");

      const payload = {
        contents: [{
          parts: [{
            text: `Generate a formal Turing Machine (7-tuple) for: "${prompt}".
Output JSON: {
  "nodes": [{"id": "q0", "label": "Q0", "isInitial": true, "isFinal": false, "isHalt": false}],
  "edges": [{"source": "q0", "target": "q1", "read": "0", "write": "1", "move": "R"}]
}
Move can be L, R, or N. 
ONLY JSON. No text.`
          }]
        }]
      };

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await aiRes.json();
      const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    }

    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type: 'tm' })
    });
    return await response.json();
  }

  async chat(prompt: string, history: any[], context?: any): Promise<string> {
    // ── DEVELOPMENT FALLBACK ──
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("API Key missing.");

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `You are a friendly, expert AI Lab Assistant. 
Current Workspace Context: ${JSON.stringify(context || "None")}. 
Talk like a regular, helpful person. Stay concise.
Use Markdown to make your responses look premium:
- Use **bold text** for key terms.
- Use # or ## headers for sections.
- Use bulleted lists for steps or differences.
If the user says "hello", just say hi back and ask how you can help.` }]
          },
          ...history.slice(-6), // Optimization: Keep history short
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await aiRes.json();
      return data.candidates[0].content.parts[0].text;
    }

    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, context, type: 'chat' })
    });
    const data = await response.json();
    return data.response;
  }
}
