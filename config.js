/* ═══════════════════════════════════════════════════════════════════════
   CyberAware AI — config.js
   AI API Configuration (Hugging Face Inference API)
   ───────────────────────────────────────────────────────────────────────
   HOW TO GET A FREE HUGGING FACE TOKEN (2 minutes, no credit card)
   ────────────────────────────────────────────────────────────────
   1. Go to https://huggingface.co/join  and create a free account.
   2. Go to https://huggingface.co/settings/tokens
   3. Click "New token" → give it any name → Role: "Read" → Generate.
   4. Copy the token (starts with "hf_...").
   5. Paste it into HF_API_TOKEN below and save.
   6. Restart proxy.js and refresh the browser.

   MODELS AVAILABLE (set HF_MODEL_ID below)
   ─────────────────────────────────────────
   IBM Granite (same family as IBM Bob):
     "ibm-granite/granite-3.1-8b-instruct"   ← default (recommended)
     "ibm-granite/granite-3.0-8b-instruct"

   Other strong free alternatives:
     "mistralai/Mistral-7B-Instruct-v0.3"
     "microsoft/Phi-3-mini-4k-instruct"
     "HuggingFaceH4/zephyr-7b-beta"

   SECURITY NOTE
   ─────────────
   Never commit a real token to a public Git repository.
   Add config.js to your .gitignore file.
   ═══════════════════════════════════════════════════════════════════════ */

const IBM_CONFIG = {

  /* ── Your Hugging Face API Token (required) ─────────────────────────── */
  HF_API_TOKEN: 'hf_your_actual_token_here',     // ← Paste your hf_... token here

  /* ── Model to use ───────────────────────────────────────────────────── */
  HF_MODEL_ID: 'openai/gpt-oss-20b',

  /* ── Generation Parameters ──────────────────────────────────────────── */
  MAX_NEW_TOKENS: 900,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  REPETITION_PENALTY: 1.1,

};

/* ── Derived URL (auto-computed) ────────────────────────────────────── */
// HF Inference API endpoint — uses the modern v1 router
IBM_CONFIG.HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
