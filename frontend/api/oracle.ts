import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, type, currentRegex, history, context } = request.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    let systemText = "";
    let userText = prompt;

    // ── CONSTRUCT PROMPT BASED ON TYPE ──
    if (type === 'dfa' || type === 'nfa') {
      systemText = `Return ONLY a JSON object for a ${type.toUpperCase()} that: "${prompt}". 
Alphabet: {0, 1}.
JSON structure EXACTLY:
{
  "nodes": [{"id": "q0", "label": "Q0", "isInitial": true, "isFinal": false}],
  "edges": [{"source": "q0", "target": "q1", "label": "0"}]
}
No Markdown, No code blocks, No text.`;
    } else if (type === 'regex') {
      systemText = `You are a friendly, expert AI Lab Assistant. 
Analyze this request: "${prompt}".
Existing Regex: "${currentRegex}".
Goal: Create the most minimal, formal, and mathematically correct Regular Expression.
Output ONLY the regex string. No quotes, No code blocks, No text.`;
    } else if (type === 'tm') {
      systemText = `Generate a formal Turing Machine (7-tuple) for: "${prompt}".
Output JSON: {
  "nodes": [{"id": "q0", "label": "Q0", "isInitial": true, "isFinal": false, "isHalt": false}],
  "edges": [{"source": "q0", "target": "q1", "read": "0", "write": "1", "move": "R"}]
}
Move can be L, R, or N. 
ONLY JSON. No text.`;
    } else if (type === 'chat') {
      systemText = `You are a friendly, expert AI Lab Assistant. 
Current Workspace Context: ${JSON.stringify(context || "None")}. 
Talk like a regular, helpful person. Stay concise.
Use Markdown to make your responses look premium (**bold**, ## headers, lists).`;
    }

    const payload = {
      contents: [
        { role: 'user', parts: [{ text: systemText }] },
        ...(history || []),
        { role: 'user', parts: [{ text: userText }] }
      ]
    };

    const aiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await aiRes.json();
    const resultText = data.candidates[0].content.parts[0].text;

    // Processing based on type
    if (type === 'dfa' || type === 'nfa' || type === 'tm') {
      const cleanJson = resultText.replace(/```json|```/g, "").trim();
      return response.status(200).json(JSON.parse(cleanJson));
    } else if (type === 'regex') {
      const cleanRegex = resultText.replace(/```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      return response.status(200).json({ regex: cleanRegex });
    } else {
      return response.status(200).json({ response: resultText });
    }

  } catch (error: any) {
    console.error("Vercel Proxy Error:", error);
    return response.status(500).json({ error: error.message || 'Logic Oracle failure.' });
  }
}
