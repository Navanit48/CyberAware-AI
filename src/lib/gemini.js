/* ── Gemini API Client & Proxy Handler ─────────────────────────────────── */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Array of models to try in order of preference. If one hits a rate limit or high demand (503), it falls back to the next.
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-pro-latest'
];

const SYSTEM_INSTRUCTION = `You are CyberAware AI, an elite cybersecurity intelligence assistant built with Apple and Linear design philosophies.
Your mission is to keep users safe from cyber threats, phishing, malware, password breaches, and network vulnerabilities.
Guidelines:
1. Provide accurate, clear, and actionable security advice.
2. Structure answers with clean headings, concise bullet points, and key takeaways.
3. Be professional, modern, authoritative, yet approachable.
4. If asked about dangerous hacking attacks against innocent targets, focus on defensive countermeasures and ethical protection.
5. Highlight critical risk warnings clearly using bold text.`;

async function fetchWithRetry(url, options, retries = 1, backoff = 800) {
  const retryableStatuses = [429];
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok || !retryableStatuses.includes(res.status)) {
      return res;
    }
    if (i < retries - 1) {
      console.warn(`[API Error] ${res.status}. Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 1.5;
    } else {
      return res;
    }
  }
}

export async function askCyberAwareAI(question, modelOverride = null) {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'No API key configured.' };
  }

  const modelsToTry = modelOverride ? [modelOverride] : FALLBACK_MODELS;

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
      maxOutputTokens: 4096
    }
  };

  for (const model of modelsToTry) {
    const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    console.log(`[AI] Attempting inference with model: ${model}`);

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
        if (text) return { success: true, text, source: 'gemini-proxy', modelUsed: model };
      }

      // If proxy responded with an API error (404, 429, 503, etc.), proceed to next model immediately
      if (proxyRes && (proxyRes.status === 404 || proxyRes.status === 429 || proxyRes.status === 503 || proxyRes.status === 400)) {
        console.warn(`[AI] Proxy returned ${proxyRes.status} for ${model}. Switching to next model...`);
        continue;
      }
    } catch (err) {
      // Network error hitting the proxy, continue to direct fallback
    }

    // 2. Direct API call fallback (if proxy is offline)
    try {
      const directRes = await fetchWithRetry(`${modelUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (directRes && directRes.ok) {
        const data = await directRes.json();
        const text = extractGeminiText(data);
        if (text) return { success: true, text, source: 'gemini-direct', modelUsed: model };
      } else {
        console.warn(`[AI] Direct call returned ${directRes?.status} for ${model}. Switching to next model...`);
      }
    } catch (err) {
      console.warn(`[AI] Direct API call failed for ${model}:`, err);
    }
  }

  return { success: false, error: 'All AI models are currently overloaded. Please try again in a few minutes.' };
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
