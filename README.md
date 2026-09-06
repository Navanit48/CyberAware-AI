# ⚡ CyberAware AI
### Cybersecurity Awareness Chatbot for Beginners
**IBM SkillsBuild SkillUp Hackathon · AI for Impact Track**

[![Demo Mode](https://img.shields.io/badge/Demo%20Mode-Active-yellow?style=flat-square)](#demo-mode)
[![IBM Granite](https://img.shields.io/badge/IBM%20Granite%20AI-3.1%208B-blue?style=flat-square)](https://huggingface.co/ibm-granite/granite-3.1-8b-instruct)
[![License](https://img.shields.io/badge/License-Educational-green?style=flat-square)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-Required-brightgreen?style=flat-square)](https://nodejs.org/)

---

## 📖 Project Overview

**CyberAware AI** is a free, beginner-friendly cybersecurity awareness chatbot that helps everyday internet users understand and defend against common digital threats. Ask any cybersecurity question in plain English and receive clear, structured, jargon-free answers powered by IBM Granite AI.

---

## 🚨 Problem Statement

Despite cybercrime costing the global economy over **$8 trillion in 2023**, most people lack even basic awareness of common threats like phishing, ransomware, and social engineering. Existing cybersecurity resources are either too technical for beginners, too generic to be actionable, or hidden behind paywalls. 

**The result:** billions of people remain vulnerable to attacks that are entirely preventable with the right knowledge.

---

## 💡 Solution

CyberAware AI bridges the knowledge gap with an intelligent chatbot that:

- Explains cybersecurity threats in **plain, beginner-friendly language**
- Provides **structured, actionable responses** covering explanation, real-world impact, safety steps, and tips
- Works **24/7, completely free**, with no account or signup required
- Functions fully **offline via Demo Mode** when no AI backend is available — ensuring demos always work
- Includes a curated **local knowledge base** covering 14+ cybersecurity topics
- Links to **authoritative external resources** (NCSC, CISA, EFF, etc.) for further learning

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **Interactive Chat** | Modern messaging UI — user bubbles right-aligned (blue), AI responses left-aligned (dark card) with shield icon and timestamps |
| 🎭 **Demo Mode** | When AI is unavailable, shows "Demo Mode Active" and responds from a rich local knowledge base — never displays API errors |
| 📋 **Smart Responses** | Every answer includes: Title · Explanation · Why It Matters · How to Stay Safe · 3 Safety Tips · Warning (when applicable) · Learn More links |
| ⚡ **Quick Questions** | Click a suggested question to instantly send it — no extra steps |
| ⌨️ **Keyboard Shortcuts** | `Enter` to send · `Shift+Enter` for new line |
| 📋 **Copy Response** | One-click copy of any AI response to clipboard |
| ℹ️ **About Modal** | Project info, tech stack, IBM AI usage, and future scope |
| 🏠 **Feature Cards** | Visual section highlighting key capabilities below the hero |
| 🌐 **Responsive** | Works on desktop, tablet, and mobile |
| ♿ **Accessible** | ARIA labels, keyboard navigation, focus management, semantic HTML |
| 🔒 **Privacy Focused** | No accounts, no tracking, no data stored anywhere |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES2022, `'use strict'`) |
| **AI Model** | IBM Granite 3.1 8B Instruct (`ibm-granite/granite-3.1-8b-instruct`) via Hugging Face |
| **AI API** | Hugging Face Inference API (OpenAI-compatible Chat Completions) |
| **Proxy Server** | Node.js HTTP server (no npm dependencies — built-in modules only) |
| **Typography** | Inter + Share Tech Mono (Google Fonts) |
| **Design** | Custom dark cyberpunk UI with neon cyan/green accents |

---

## 📁 Folder Structure

```
cyberaware-ai/
├── index.html      # Main HTML — hero, features, chat, footer, About modal
├── style.css       # All styles — cyberpunk dark theme, chat bubbles, modal, cards
├── script.js       # All client-side logic — API calls, rendering, Demo Mode, events
├── config.js       # IBM/HF API credentials and model settings
├── proxy.js        # Node.js local proxy server (CORS bypass)
└── README.md       # This file
```

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) v14 or later (no npm packages required)
- A free [Hugging Face account](https://huggingface.co/join) (optional — Demo Mode works without it)

### Step 1: Clone / Download

```bash
git clone https://github.com/your-username/cyberaware-ai.git
cd cyberaware-ai
```

### Step 2: Configure (Optional — for Live AI)

Open `config.js` and paste your Hugging Face token:

```js
HF_API_TOKEN: 'hf_your_token_here',   // Get from huggingface.co/settings/tokens
```

> **Security Note:** Never commit a real token to a public repository. Add `config.js` to `.gitignore`.

### Step 3: Start the Server

```bash
node proxy.js
```

### Step 4: Open in Browser

```
http://localhost:3000
```

### Demo Mode (No Setup Needed)

If you do **not** set an API token, the chatbot automatically runs in **Demo Mode** — all 14+ cybersecurity topics are answered from the built-in knowledge base. The status badge shows "🎭 Demo Mode Active".

---

## 🤝 IBM Granite AI Usage

CyberAware AI integrates **IBM Granite 3.1 8B Instruct** (`ibm-granite/granite-3.1-8b-instruct`) — from the same AI family as IBM Bob — via the Hugging Face Inference API.

### How It's Used

1. **Structured Prompting:** The system prompt instructs IBM Granite to return a strict JSON object with fields: `title`, `explanation`, `whyItMatters`, `howToStaySafe`, `tips[]`, and `warning`. This ensures consistent, well-structured responses every time.

2. **OpenAI-Compatible API:** Uses the `/v1/chat/completions` endpoint for reliable, standards-based integration.

3. **CORS-Safe Proxy:** A Node.js proxy (`proxy.js`) forwards browser requests to the HF API server-to-server, avoiding CORS restrictions — no backend framework needed.

4. **Smart Fallback:** When IBM Granite is unavailable (rate limit, network issue, no token), the system silently switches to the curated local knowledge base — the user experience is seamless.

### Why IBM Granite?
- Open-source, enterprise-grade model from IBM Research
- Optimised for instruction-following and structured output
- Free to use via Hugging Face with a standard API token

---

## 🔮 Future Improvements

| Improvement | Impact |
|-------------|--------|
| 🗣️ Voice input/output | Accessibility for users with visual impairments |
| 🌍 Multi-language support | Hindi, Spanish, French, Arabic — wider reach |
| 📊 Quiz mode | Interactive knowledge assessment for learners |
| 📰 Live threat feed | Real-time cybersecurity news integration |
| 🏫 Curriculum module | Structured learning paths for schools/colleges |
| 📱 PWA / offline app | Install as a mobile app, works offline |
| 🔗 Share response | Share AI answers via link or social media |

---

## 📚 Knowledge Base Topics

The built-in Demo Mode knowledge base covers:

1. 🎣 Phishing
2. 🔐 Password Security & Passkeys
3. 📧 Email Scam Detection
4. 🦠 Malware
5. 💰 Ransomware
6. 🔑 Two-Factor Authentication (2FA/MFA)
7. 🌐 VPN Security
8. 🎭 Social Engineering
9. 🧱 Firewalls
10. 🔒 Encryption & HTTPS
11. 🕳️ Dark Web Risks
12. 📶 Public Wi-Fi Security
13. 💾 Data Backup
14. 🪪 Identity Theft

---

## 📄 License

This project is created for **educational purposes** as part of the **IBM SkillsBuild SkillUp Hackathon – AI for Impact Track**.

- Free to use for learning and non-commercial purposes
- Not for commercial deployment
- IBM Granite model usage subject to [Hugging Face Terms of Service](https://huggingface.co/terms-of-service)

---

## 👨‍💻 Author

**Navanit Merla**  
IBM SkillsBuild SkillUp Hackathon · AI for Impact Track  
*CyberAware AI — Making cybersecurity education accessible to everyone.*

---

> *"The best security tool is an informed user."*
