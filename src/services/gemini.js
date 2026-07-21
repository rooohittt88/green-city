const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent`;

// Takes a base64 string (without the data:image/...;base64, prefix) and mime type
// Returns parsed JSON analysis object
export async function analyzeIssuePhoto(base64Data, mimeType = 'image/jpeg') {
  const prompt = `You are a civic infrastructure AI assistant for the city of Surat, India.
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
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 300,
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json','x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip any markdown code fences if Gemini adds them despite instructions
  const clean = text.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Gemini returned invalid JSON. Raw: ' + text.substring(0, 200));
  }
}

// Generates 3 insight strings from a summary object
export async function generateInsights(summary) {
  const prompt = `You are a civic analytics AI for the city of Surat, India.

Data: ${JSON.stringify(summary)}

Generate exactly 3 insight sentences about civic issue patterns in Surat.
Be specific — mention numbers, ward names, or trends.

Return ONLY a JSON array of exactly 3 strings. No markdown, no explanation:
["insight 1 here.", "insight 2 here.", "insight 3 here."]`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json','x-goog-api-key': GEMINI_KEY},
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Gemini insights error');

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const clean = text.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    return ['Unable to generate insights at this time.'];
  }
}