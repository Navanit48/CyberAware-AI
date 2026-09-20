/* ── Gemini API Client & Proxy Handler ─────────────────────────────────── */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are CyberAware AI, an elite cybersecurity intelligence assistant built with Apple and Linear design philosophies.
Your mission is to keep users safe from cyber threats, phishing, malware, password breaches, and network vulnerabilities.
Guidelines:
1. Provide accurate, clear, and actionable security advice.
2. Structure answers with clean headings, concise bullet points, and key takeaways.
3. Be professional, modern, authoritative, yet approachable.
4. If asked about dangerous hacking attacks against innocent targets, focus on defensive countermeasures and ethical protection.
5. Highlight critical risk warnings clearly using bold text.`;

async function fetchWithRetry(url, options, retries = 4, backoff = 2000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    // If it's successful, or if it's an error OTHER than 429, return immediately
    if (res.ok || res.status !== 429) {
      return res;
    }
    // If it's a 429, wait and retry
    if (i < retries - 1) {
      console.warn(`[Rate Limit] 429 Too Many Requests. Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 1.5; // Exponential backoff
    } else {
      return res; // Return the 429 if we ran out of retries
    }
  }
}

export async function askCyberAwareAI(question, modelOverride = GEMINI_MODEL) {
  const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelOverride}:generateContent`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${SYSTEM_INSTRUCTION}\n\nUser Question: ${question}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1000
    }
  };

  // 1. Try local proxy first (prevents CORS & keeps API key hidden)
  try {
    const proxyRes = await fetchWithRetry('/api/ibm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: GEMINI_API_KEY,
        targetUrl: modelUrl,
        requestBody: payload
      })
    });

    if (proxyRes && proxyRes.ok) {
      const data = await proxyRes.json();
      const text = extractGeminiText(data);
      if (text) return { success: true, text, source: 'gemini-proxy' };
    }
  } catch (err) {
    console.warn('Proxy fetch failed, falling back to direct API fetch:', err);
  }

  // 2. Direct API call fallback
  try {
    const directRes = await fetchWithRetry(`${modelUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (directRes && directRes.ok) {
      const data = await directRes.json();
      const text = extractGeminiText(data);
      if (text) return { success: true, text, source: 'gemini-direct' };
    }
  } catch (err) {
    console.warn('Direct API call failed:', err);
  }

  return { success: false, error: 'Could not connect to AI services. The servers might be temporarily overloaded.' };
}

function extractGeminiText(data) {
  try {
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    return part?.text?.trim() || null;
  } catch {
    return null;
  }
}
