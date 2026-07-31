async function callGroqAPI(body) {
  const GROQ_VITE_KEY = import.meta.env.VITE_GROQ_API_KEY;

  // If local .env has VITE_GROQ_API_KEY set (npm run dev)
  if (GROQ_VITE_KEY) {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_VITE_KEY}`,
      },
      body: JSON.stringify(body),
    });
  }

  // If running locally on localhost without VITE_GROQ_API_KEY in .env
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    throw new Error('VITE_GROQ_API_KEY is missing in your local .env file. Please add VITE_GROQ_API_KEY=gsk_... to .env and restart Vite dev server.');
  }

  // Otherwise, use Vercel Serverless Function in production
  return await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Takes a base64 string (without the data:image/...;base64, prefix) and mime type
// Returns parsed JSON analysis object
export async function analyzeIssuePhoto(base64Data, mimeType = 'image/jpeg') {
  const prompt = `You are a civic infrastructure AI assistant for the cities of India.
Analyze this image and determine if it shows a civic/infrastructure problem.

Return ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:
{
  "isIssue": true,
  "category": "pothole",
  "severity": 4,
  "description": "Large pothole on road surface approximately 30cm wide causing vehicle damage risk",
  "confidence": 0.92,
  "tags": ["road damage", "pothole", "hazard"]
}

Rules:
- "category" must be exactly one of: pothole, water_leak, streetlight, waste, other
- "severity" is an integer 1-5 (1 = minor cosmetic, 5 = critical safety hazard)
- "description" is one clear sentence describing the problem
- "confidence" is 0.0 to 1.0
- "tags" is an array of exactly 3 short keyword strings
- If this image does NOT show a civic issue, set "isIssue" to false and use category "other"`;

  const body = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  };

  const res = await callGroqAPI(body);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  const clean = text.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Groq returned invalid JSON. Raw: ' + text.substring(0, 200));
  }
}

// Generates 3 insight strings from a summary object
export async function generateInsights(summary) {
  const prompt = `You are a civic analytics AI for the cities of India.

Data: ${JSON.stringify(summary)}

Generate exactly 3 insight sentences about civic issue patterns in Indian cities.
Be specific — mention numbers, ward names, or trends.

Return ONLY a JSON object with key "insights" containing an array of 3 strings:
{
  "insights": ["insight 1 here.", "insight 2 here.", "insight 3 here."]
}`;

  const body = {
    model: 'qwen/qwen3.6-27b',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_completion_tokens: 2048,
    top_p: 0.95,
  };

  const res = await callGroqAPI(body);

  if (!res.ok) throw new Error('Groq insights error');

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  const clean = text.replace(/```json|```/gi, '').trim();

  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : (parsed.insights || ['Unable to generate insights at this time.']);
  } catch {
    return ['Unable to generate insights at this time.'];
  }
}