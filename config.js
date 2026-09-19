/* ═══════════════════════════════════════════════════════════════════════
   CyberAware AI — config.js
   AI API Configuration (Google Gemini API)
   ───────────────────────────────────────────────────────────────────────
   We are now using the Google Gemini API to power the AI!
   
   HOW TO GET A GEMINI API KEY (Free)
   ──────────────────────────────────
   1. Go to https://aistudio.google.com/app/apikey
   2. Click "Create API Key"
   3. Copy the key and paste it into GEMINI_API_KEY below.

   SECURITY NOTE
   ─────────────
   Never commit your API key to a public Git repository.
   Add config.js to your .gitignore file.
   ═══════════════════════════════════════════════════════════════════════ */

const IBM_CONFIG = {

  /* ── Your Google Gemini API Key (required) ──────────────────────────── */
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',          // ← Paste your Gemini API key here

  /* ── Model ID ───────────────────────────────────────────────────────── */
  GEMINI_MODEL: 'gemini-3.6-flash',

  /* ── Generation Parameters ──────────────────────────────────────────── */
  MAX_NEW_TOKENS: 900,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,

};

/* ── Derived URL ────────────────────────────────────────────────────── */
// Google Gemini API endpoint
IBM_CONFIG.GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${IBM_CONFIG.GEMINI_MODEL}:generateContent`;
