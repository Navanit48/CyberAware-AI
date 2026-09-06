/* ═══════════════════════════════════════════════════════════════════════
   CyberAware AI – script.js
   Cybersecurity Awareness Chatbot for Beginners
   IBM SkillsBuild SkillUp Hackathon · AI for Impact Track

   MODULES (all in this file, load-order safe):
     1. HF API Layer      — buildHFMessages, parseModelResponse, askIBMBob
     2. Dynamic Title     — TITLE_MAP, buildDynamicTitle
     3. Knowledge Base    — KNOWLEDGE_BASE, getLocalResponse, buildFallbackResponse
     4. Learn-More Links  — LEARN_MORE_MAP, getLearnMoreLinks
     5. Utilities         — escapeHtml, getTimestamp
     6. Chat Rendering    — renderUserBubble, renderTypingIndicator, replaceTypingWithResponse
     7. Copy Response     — copyResponse
     8. Validation        — setValidationMessage
     9. API Status Badge  — updateApiStatus
    10. Main Ask Flow     — handleAsk, setLoading, hideEmptyState
    11. About Modal       — openModal, closeModal
    12. Event Listeners
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════════════
   1. HUGGING FACE INFERENCE API LAYER
   ════════════════════════════════════════════════════════════════════════
   Uses the Hugging Face Chat Completions API (OpenAI-compatible).
   Model: IBM Granite 3.1 8B Instruct (ibm-granite/granite-3.1-8b-instruct)

   All credentials and settings live in config.js:
     HF_API_TOKEN  — your hf_... token from huggingface.co/settings/tokens
     HF_MODEL_ID   — the model to use
     HF_API_URL    — derived automatically from the model ID

   Flow:
     Browser → POST /api/ibm (proxy, same origin)
             → proxy.js forwards to HF API (server-to-server, no CORS)
             → response parsed into ResponseData for the UI

   ResponseData schema:
     { title, explanation, whyItMatters, howToStaySafe, tips[3], warning }
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Builds the chat messages array for the HF Chat Completions API.
 * The system prompt instructs the model to return strict JSON matching
 * the ResponseData schema the UI expects (including whyItMatters field).
 * @param {string} question
 * @returns {Array<{role: string, content: string}>}
 */
function buildHFMessages(question) {
  return [
    {
      role   : 'system',
      content:
        'You are CyberAware AI, an expert cybersecurity educator for complete beginners.\n' +
        'Answer clearly, accurately, and without technical jargon.\n\n' +
        'If the user just greets you (e.g. "hi", "hello") or asks an off-topic question:\n' +
        '  - "title": "Hello from CyberAware AI!"\n' +
        '  - "explanation": "Greet the user warmly and ask what cybersecurity topic they would like to learn about today."\n' +
        '  - "whyItMatters": "Cybersecurity awareness protects you, your family, and your data from digital threats."\n' +
        '  - "howToStaySafe": "Ask me a security question to get started!"\n' +
        '  - "tips": ["Ask me about phishing!", "Ask me about strong passwords!", "Ask me about VPNs!"]\n' +
        '  - "warning": ""\n\n' +
        'IMPORTANT: You MUST respond with ONLY a valid JSON object — no markdown, no prose, no code fences.\n' +
        'The JSON must have exactly these fields:\n' +
        '{\n' +
        '  "title": "Short topic title, 3-6 words, noun phrase (NOT \'What is...\' or \'How to...\')",\n' +
        '  "explanation": "2-3 sentences explaining this to a complete beginner.",\n' +
        '  "whyItMatters": "2-3 sentences on why this topic matters in real life and what the real-world impact is.",\n' +
        '  "howToStaySafe": "2-3 sentences of practical, actionable defence advice.",\n' +
        '  "tips": ["Tip 1 one sentence", "Tip 2 one sentence", "Tip 3 one sentence"],\n' +
        '  "warning": "One critical warning sentence, OR empty string if not applicable."\n' +
        '}\n' +
        'Output ONLY the JSON object. Nothing else.'
    },
    {
      role   : 'user',
      content: question
    }
  ];
}

/**
 * Parses raw text from the model into a ResponseData object.
 * Handles markdown fences, extracts JSON, validates all required fields.
 * @param {string} rawText
 * @param {string} question  — fallback for title if model omits it
 * @returns {object} ResponseData
 */
function parseModelResponse(rawText, question) {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('Model did not return a JSON object. Raw: ' + rawText.slice(0, 200));
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error('Could not parse JSON from model response. Raw: ' + rawText.slice(0, 200));
  }

  return {
    title        : String(parsed.title         || buildDynamicTitle(question)),
    explanation  : String(parsed.explanation   || 'No explanation provided.'),
    whyItMatters : String(parsed.whyItMatters  || parsed.danger || 'No danger information provided.'),
    howToStaySafe: String(parsed.howToStaySafe || 'No safety advice provided.'),
    tips         : Array.isArray(parsed.tips) && parsed.tips.length >= 3
                     ? parsed.tips.slice(0, 3).map(String)
                     : ['Stay informed about the latest cybersecurity threats.',
                        'Use strong, unique passwords for every account.',
                        'Keep all your devices and software up to date.'],
    warning      : String(parsed.warning || '')
  };
}

/**
 * askIBMBob — primary API entry point called by the chat UI.
 *
 * Guard: if HF_API_TOKEN is empty or proxy is unreachable,
 * falls back to the local knowledge base (Demo Mode).
 * Never exposes raw API errors to the user.
 *
 * @param {string} question
 * @returns {Promise<object>} ResponseData
 */
async function askIBMBob(question) {
  const token = (IBM_CONFIG.HF_API_TOKEN || '').trim();

  /* ── Guard: no token — use Demo Mode knowledge base ─────────────── */
  if (!token) {
    return getLocalResponse(question);
  }

  /* ── Build HF Chat Completions request ─────────────────────────── */
  const hfRequestBody = {
    model      : IBM_CONFIG.HF_MODEL_ID,
    messages   : buildHFMessages(question),
    max_tokens : IBM_CONFIG.MAX_NEW_TOKENS,
    temperature: IBM_CONFIG.TEMPERATURE,
    top_p      : IBM_CONFIG.TOP_P,
    stream     : false
  };

  /* ── Send via proxy (avoids CORS) — Browser → /api/ibm → proxy.js → HF API */
  const proxyResponse = await fetch('/api/ibm', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      targetUrl  : IBM_CONFIG.HF_API_URL,
      authHeader : `Bearer ${token}`,
      requestBody: hfRequestBody
    })
  });

  /* ── Handle quota / rate-limit → fall back to local knowledge base */
  if (!proxyResponse.ok) {
    if (proxyResponse.status === 402 || proxyResponse.status === 429) {
      console.warn(`HF API limit (${proxyResponse.status}) — falling back to local knowledge base.`);
      return getLocalResponse(question);
    }
    const errBody = await proxyResponse.text().catch(() => '');
    throw new Error(`HF API ${proxyResponse.status}: ${errBody.slice(0, 300)}`);
  }

  /* ── Parse HF Chat Completions response (OpenAI-compatible shape):
     { "choices": [{ "message": { "role": "assistant", "content": "<JSON>" } }] } */
  const json    = await proxyResponse.json();
  const content = json?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Hugging Face returned an empty or unexpected response structure.');
  }

  return parseModelResponse(content, question);
}


/* ════════════════════════════════════════════════════════════════════════
   2. DYNAMIC TITLE BUILDER
   Generates a contextual title from the user's question instead of always
   showing a generic heading.
   ════════════════════════════════════════════════════════════════════════ */

/** Maps keyword patterns → human-readable topic titles */
const TITLE_MAP = [
  { pattern: /phish/i,                                            title: 'Phishing Awareness' },
  { pattern: /password|passphrase/i,                             title: 'Password Security' },
  { pattern: /passkey/i,                                         title: 'Passkey Security' },
  { pattern: /email\s*scam|email.*safe|safe.*email|suspicious.*email/i, title: 'Email Scam Detection' },
  { pattern: /email/i,                                           title: 'Email Security' },
  { pattern: /malware|virus|trojan|spyware|adware/i,             title: 'Malware Protection' },
  { pattern: /ransomware|ransom/i,                               title: 'Ransomware Protection' },
  { pattern: /two.factor|2fa|mfa|multi.factor|authenticat/i,    title: 'Two-Factor Authentication' },
  { pattern: /vpn|virtual private/i,                             title: 'VPN Security' },
  { pattern: /social engineer/i,                                 title: 'Social Engineering Awareness' },
  { pattern: /firewall/i,                                        title: 'Firewall Protection' },
  { pattern: /encrypt/i,                                         title: 'Encryption Basics' },
  { pattern: /dark\s*web/i,                                      title: 'Dark Web Risks' },
  { pattern: /wi.?fi|wireless/i,                                 title: 'Wi-Fi Security' },
  { pattern: /hack|breach/i,                                     title: 'Cyber Attack Awareness' },
  { pattern: /scam|fraud/i,                                      title: 'Online Scam Detection' },
  { pattern: /privac/i,                                          title: 'Online Privacy' },
  { pattern: /backup|back.up/i,                                  title: 'Data Backup Best Practices' },
  { pattern: /update|patch/i,                                    title: 'Software Update Security' },
  { pattern: /identity theft/i,                                  title: 'Identity Theft Prevention' },
  { pattern: /cookie/i,                                          title: 'Browser Cookie Security' },
  { pattern: /https?|ssl|tls|certificate/i,                     title: 'HTTPS & Certificate Security' },
  { pattern: /port\s*scan|network scan/i,                       title: 'Network Scanning Awareness' },
  { pattern: /ddos|denial.of.service/i,                         title: 'DDoS Attack Awareness' },
  { pattern: /botnet/i,                                          title: 'Botnet Security' },
  { pattern: /keylog/i,                                          title: 'Keylogger Threats' },
  { pattern: /zero.day/i,                                        title: 'Zero-Day Vulnerabilities' },
];

/**
 * Derives a descriptive title from the user's question.
 * Falls back to a capitalised snippet of the question itself.
 * @param {string} question
 * @returns {string}
 */
function buildDynamicTitle(question) {
  for (const { pattern, title } of TITLE_MAP) {
    if (pattern.test(question)) return title;
  }
  const clean = question.trim().replace(/^(what is|how do i|how to|tell me about|explain)\s+/i, '');
  return clean.charAt(0).toUpperCase() + clean.slice(1, 60) + (clean.length > 60 ? '…' : '');
}


/* ════════════════════════════════════════════════════════════════════════
   3. LOCAL KNOWLEDGE BASE  (Demo Mode)
   Each entry has:
     keywords     — matched against lowercased question (scored)
     titleEmoji   — emoji prefix for the display title
     topicKey     — used by buildDynamicTitle / getLearnMoreLinks
     explanation  / whyItMatters / howToStaySafe / tips / warning
   ════════════════════════════════════════════════════════════════════════ */

const KNOWLEDGE_BASE = [
  {
    keywords: ['phishing', 'phish'],
    topicKey: 'phishing',
    titleEmoji: '🎣',
    explanation:
      'Phishing is a cyber-attack where criminals impersonate trusted entities — your bank, a popular website, or a colleague — to trick you into handing over passwords, credit card numbers, or personal details. Attacks arrive via email, SMS (smishing), or voice calls (vishing).',
    whyItMatters:
      'A successful phishing attack leads to stolen credentials, financial fraud, and identity theft, giving attackers a foothold for further assaults. Over $10 billion was lost to phishing in 2023 alone — making it the #1 most costly cybercrime category worldwide.',
    howToStaySafe:
      'Never click links in unsolicited messages. Navigate to websites directly by typing the address. Scrutinise sender email addresses for subtle misspellings (e.g. "paypa1.com" vs "paypal.com").',
    tips: [
      'HTTPS and a padlock icon do NOT guarantee a site is safe — phishing sites use them too.',
      'When in doubt, call the sender using an official number found independently, not in the suspicious message.',
      'Enable your email provider\'s built-in phishing filters and report suspicious emails.'
    ],
    warning: 'Never share your password or OTP code in response to any email or pop-up — no legitimate company will ever ask for it this way.'
  },
  {
    keywords: ['strong password', 'password', 'passphrase', 'passkey'],
    topicKey: 'password',
    titleEmoji: '🔐',
    explanation:
      'A strong password is your primary account defence. It should be long (16+ characters), complex (mixed case, numbers, symbols), and unique for every service. Passkeys — the modern replacement — use cryptographic key pairs stored on your device, eliminating the risk of password theft entirely.',
    whyItMatters:
      'Weak or reused passwords are the #1 cause of account breaches. Attackers use credential-stuffing tools to test leaked passwords across hundreds of sites in seconds. One compromised password can cascade into banking, email, and social media takeovers.',
    howToStaySafe:
      'Use a reputable password manager (Bitwarden, 1Password, KeePass) to generate and store unique credentials. Enable 2FA everywhere. Where available, opt into passkeys for passwordless, phishing-resistant login.',
    tips: [
      'A passphrase like "Purple!Rain#Falls@Night" is both memorable and extremely hard to crack.',
      'Never reuse the same password on multiple sites — one breach exposes all.',
      'Change passwords immediately if a service you use notifies you of a data breach.'
    ]
  },
  {
    keywords: ['email safe', 'safe email', 'suspicious email', 'email phishing', 'email scam', 'email'],
    topicKey: 'email',
    titleEmoji: '📧',
    explanation:
      'Not every email in your inbox is legitimate. Attackers impersonate banks, employers, delivery services, and government agencies to trick you into clicking malicious links or opening infected attachments. Learning to spot warning signs is a foundational cybersecurity skill.',
    whyItMatters:
      'One click on a malicious link can install malware, steal credentials, or trigger a ransomware infection. Business Email Compromise (BEC) scams cost organisations over $2.7 billion annually — making email the most exploited attack vector globally.',
    howToStaySafe:
      'Before clicking, check the sender\'s full email address, hover over links to preview the destination URL, and treat any email that creates urgency or requests sensitive information as suspicious until verified.',
    tips: [
      '"support@paypa1.com" is not PayPal — always check every character of the sender address.',
      'Never open attachments you weren\'t expecting, even from known contacts (their account could be hacked).',
      'Use your email client\'s "Report Phishing" feature to protect everyone from the same attack.'
    ],
    warning: 'Legitimate banks and companies will NEVER ask for your password, PIN, or OTP via email.'
  },
  {
    keywords: ['malware', 'virus', 'trojan', 'spyware', 'adware', 'worm'],
    topicKey: 'malware',
    titleEmoji: '🦠',
    explanation:
      'Malware (malicious software) is any program intentionally designed to harm a device, network, or user. The category includes viruses, trojans, spyware, adware, worms, rootkits, and more. Malware spreads through phishing emails, malicious downloads, infected USB drives, and compromised websites.',
    whyItMatters:
      'Malware can silently steal data, log every keystroke, hijack your webcam, enlist your device in a botnet, corrupt files, and serve as the delivery vehicle for ransomware — often with zero visible symptoms. In 2023, over 6 billion malware attacks were recorded globally.',
    howToStaySafe:
      'Keep your OS and all applications updated, run reputable antivirus/antimalware software, avoid downloading files from untrusted sources, and never insert unknown USB drives.',
    tips: [
      'Run scheduled antivirus scans and keep threat definitions updated daily.',
      'Only install apps from official stores (App Store, Google Play) or verified vendor sites.',
      'Maintain regular offline backups so you can recover even if malware destroys your files.'
    ]
  },
  {
    keywords: ['ransomware', 'ransom'],
    topicKey: 'ransomware',
    titleEmoji: '💰',
    explanation:
      'Ransomware is malware that encrypts your files or locks your device, then demands a cryptocurrency ransom to restore access. Targets range from individual users to hospitals, schools, pipelines, and governments.',
    whyItMatters:
      'Ransomware can cause permanent data loss, massive financial damage, and prolonged operational downtime. Even paying the ransom provides no guarantee of recovery and funds further criminal operations. Global ransomware damages exceeded $20 billion in 2023.',
    howToStaySafe:
      'Your best defence is regular, tested backups stored offline or in isolated cloud storage. Maintain software patches, limit user privileges, and segment your network to contain potential outbreaks.',
    tips: [
      'Follow the 3-2-1 rule: 3 copies of data, on 2 different media, with 1 stored offsite.',
      'Patch your OS and software immediately — ransomware exploits known vulnerabilities.',
      'Never open email attachments from unknown senders; most ransomware arrives via phishing.'
    ],
    warning: 'Do NOT pay the ransom. Payment finances criminals and offers no guaranteed decryption. Contact your local cybersecurity authority (e.g. CISA, NCSC) for free assistance.'
  },
  {
    keywords: ['two-factor', '2fa', 'mfa', 'multi-factor', 'authentication', 'two factor', 'otp', 'authenticator'],
    topicKey: '2fa',
    titleEmoji: '🔑',
    explanation:
      'Two-Factor Authentication (2FA) — also called Multi-Factor Authentication (MFA) — adds a second verification step beyond your password. Even if an attacker steals your password, they cannot log in without the second factor: a one-time code, biometric scan, or hardware security key.',
    whyItMatters:
      'Accounts protected only by a password are highly vulnerable. Data breaches expose billions of passwords yearly. Without 2FA, one leaked credential gives an attacker immediate full access. Enabling 2FA blocks over 99.9% of automated account-takeover attacks.',
    howToStaySafe:
      'Enable 2FA on every account that supports it — especially email, banking, and social media. Use an authenticator app (Authy, Google Authenticator, Microsoft Authenticator) or a hardware key (YubiKey) rather than SMS codes, which are vulnerable to SIM-swapping.',
    tips: [
      'Authenticator apps are more secure than SMS codes — switch to one where possible.',
      'Store your backup recovery codes in a password manager so you\'re never locked out.',
      'Never share a 2FA code with anyone — legitimate services will never request it.'
    ]
  },
  {
    keywords: ['vpn', 'virtual private network'],
    topicKey: 'vpn',
    titleEmoji: '🌐',
    explanation:
      'A Virtual Private Network (VPN) creates an encrypted tunnel for your internet traffic and routes it through a server of your choice. This masks your real IP address, protects data on public Wi-Fi, and helps bypass geographic restrictions.',
    whyItMatters:
      'On public Wi-Fi without a VPN, attackers on the same network can intercept your traffic via Man-in-the-Middle attacks, capturing login credentials and private data. This is particularly risky in cafes, airports, and hotels where millions connect daily.',
    howToStaySafe:
      'Use a reputable paid VPN service (Mullvad, ProtonVPN, ExpressVPN) on any public or untrusted network. Avoid free VPNs — many monetise your data. Remember: a VPN does not protect against malware or phishing.',
    tips: [
      'Always activate your VPN before connecting to public Wi-Fi.',
      'Choose a provider with an independently audited no-logs policy.',
      'A VPN encrypts data in transit only — it doesn\'t secure the endpoints themselves.'
    ]
  },
  {
    keywords: ['social engineering', 'social engineer', 'pretexting'],
    topicKey: 'social_engineering',
    titleEmoji: '🎭',
    explanation:
      'Social engineering exploits human psychology rather than technical vulnerabilities. Attackers impersonate authority figures, create urgency, or build false rapport to manipulate people into divulging credentials, transferring money, or granting system access.',
    whyItMatters:
      'Social engineering is devastatingly effective because it bypasses technical defences entirely. Over 85% of data breaches involve a human element. From phone scams and pretexting to in-person tailgating, these attacks rely on the fact that humans are often the weakest link.',
    howToStaySafe:
      'Be sceptical of unexpected requests — especially ones that create urgency or invoke authority. Always verify identities through official, independently sourced contact details before taking any action.',
    tips: [
      'If "IT support" calls and asks for your password — hang up and call IT yourself.',
      'Slow down: attackers deliberately create urgency to prevent critical thinking.',
      'Train everyone around you; social engineering targets the least-aware person in the room.'
    ]
  },
  {
    keywords: ['firewall'],
    topicKey: 'firewall',
    titleEmoji: '🧱',
    explanation:
      'A firewall is a network security system — hardware, software, or both — that monitors and controls incoming and outgoing network traffic based on predefined security rules. It acts as a barrier between trusted internal networks and untrusted external ones.',
    whyItMatters:
      'Without a firewall, any device or service on your network is directly reachable from the internet, giving attackers a clear path to exploit open ports, run brute-force attacks, or deliver malware. Firewalls are the first line of perimeter defence.',
    howToStaySafe:
      'Enable the built-in firewall on your OS (Windows Defender Firewall, macOS Firewall). For organisations, deploy a next-generation firewall (NGFW) with application-layer inspection. Review and minimise open inbound rules regularly.',
    tips: [
      'Never disable your firewall — not even temporarily "for a game" or application.',
      'Regularly audit firewall rules and remove any that are no longer needed.',
      'Pair your firewall with an IDS/IPS (Intrusion Detection/Prevention System) for deeper protection.'
    ]
  },
  {
    keywords: ['encrypt', 'encryption', 'https', 'ssl', 'tls'],
    topicKey: 'encryption',
    titleEmoji: '🔒',
    explanation:
      'Encryption converts readable data into an unreadable scrambled format that can only be decoded with the correct key. HTTPS uses TLS encryption to protect data transmitted between your browser and a web server.',
    whyItMatters:
      'Without encryption, data transmitted over a network is in plain text — readable by anyone who intercepts it. This includes passwords, credit card numbers, personal messages, and health records. Encryption is the foundation of digital trust.',
    howToStaySafe:
      'Always look for HTTPS in the address bar before submitting sensitive information. Use end-to-end encrypted messaging apps (Signal, WhatsApp). Enable full-disk encryption on your devices (BitLocker, FileVault).',
    tips: [
      'HTTPS encrypts data in transit — but does not guarantee the site itself is trustworthy.',
      'Enable full-disk encryption on your laptop and phone in case the device is stolen.',
      'Use encrypted messaging apps for sensitive conversations rather than regular SMS.'
    ]
  },
  {
    keywords: ['dark web', 'darkweb', 'dark net'],
    topicKey: 'dark_web',
    titleEmoji: '🕳️',
    explanation:
      'The dark web is a part of the internet that is intentionally hidden and requires specialised software (like Tor) to access. While it has legitimate privacy uses for journalists and activists in repressive regimes, it also hosts illegal marketplaces trading in stolen data, credentials, drugs, and malware.',
    whyItMatters:
      'Billions of stolen email addresses, passwords, and financial records are sold on dark web marketplaces. If your data appears there, it can be used for identity theft, account takeovers, or targeted phishing attacks against you or your organisation.',
    howToStaySafe:
      'Monitor whether your credentials have been leaked using services like Have I Been Pwned (haveibeenpwned.com). Use unique passwords so a single breach doesn\'t cascade. Enable 2FA on all accounts.',
    tips: [
      'Check haveibeenpwned.com regularly and change any leaked passwords immediately.',
      'Use a password manager — unique passwords prevent one breach from affecting all accounts.',
      'Enable credit monitoring alerts to catch signs of identity theft early.'
    ],
    warning: 'Do NOT access the dark web out of curiosity — exposure to illegal content carries legal risk and security risk from malware-laden sites.'
  },
  {
    keywords: ['wi-fi', 'wifi', 'wireless', 'public wi-fi', 'public wifi'],
    topicKey: 'wifi',
    titleEmoji: '📶',
    explanation:
      'Public Wi-Fi networks in cafes, airports, hotels, and shopping centres are convenient but inherently insecure. Unlike your home network, public Wi-Fi is shared with strangers and often unencrypted, making it easy for attackers to eavesdrop on traffic.',
    whyItMatters:
      'On unsecured Wi-Fi, attackers can perform Man-in-the-Middle attacks to intercept traffic, set up "Evil Twin" rogue hotspots with convincing names, and steal session cookies to hijack your logged-in accounts — all without you noticing.',
    howToStaySafe:
      'Always use a trusted VPN on public Wi-Fi. Avoid accessing banking or sensitive accounts on public networks. Verify the exact network name with staff before connecting — rogue hotspots often use similar names.',
    tips: [
      'Use a VPN every time you connect to public or untrusted Wi-Fi.',
      'Turn off "auto-connect to Wi-Fi" on your devices to avoid joining rogue hotspots.',
      'Prefer mobile data over public Wi-Fi for sensitive transactions like banking.'
    ]
  },
  {
    keywords: ['backup', 'back up', 'back-up', 'data recovery'],
    topicKey: 'backup',
    titleEmoji: '💾',
    explanation:
      'A data backup is a copy of your files and data stored separately from the originals. In the event of ransomware, hardware failure, accidental deletion, or theft, a backup is often your only path to full recovery.',
    whyItMatters:
      'Without backups, ransomware or a failed hard drive means permanent data loss. Ransomware specifically targets and deletes local backup copies — making offsite or cloud backups critical. Businesses that lose data often close within 6 months.',
    howToStaySafe:
      'Follow the 3-2-1 backup rule: maintain 3 copies of data, on 2 different media types, with 1 copy stored offsite or in an isolated cloud account. Test your backups regularly — an untested backup is an unknown backup.',
    tips: [
      'Automate backups so they run on a schedule without relying on memory.',
      'Store at least one backup offline or in a cloud account with separate credentials.',
      'Test restoring from your backup at least once — many people only discover failures when they need to recover.'
    ]
  },
  {
    keywords: ['identity theft', 'identity'],
    topicKey: 'identity_theft',
    titleEmoji: '🪪',
    explanation:
      'Identity theft occurs when a criminal steals your personal information — name, Social Security number, date of birth, financial account details — to impersonate you for financial gain, taking out loans, opening accounts, or committing crimes in your name.',
    whyItMatters:
      'Identity theft is one of the fastest-growing crimes globally. Victims spend an average of 200+ hours and years of effort reclaiming their identity. The financial and emotional damage can be devastating and long-lasting.',
    howToStaySafe:
      'Monitor your credit reports regularly (use free services like AnnualCreditReport.com). Enable fraud alerts or credit freezes at the three major bureaus. Shred physical documents containing personal details before disposal.',
    tips: [
      'Never share your Social Security number, date of birth, or full name unnecessarily online.',
      'Set up bank and credit card alerts so you\'re notified of every transaction immediately.',
      'Use a credit freeze — it\'s free and prevents new accounts being opened in your name.'
    ],
    warning: 'If you suspect identity theft, act immediately: freeze your credit, change passwords, and report to your country\'s cybercrime authority.'
  }
];

/**
 * Fallback when no keyword match is found — provides general cybersecurity advice.
 * @param {string} question
 * @returns {object} ResponseData
 */
function buildFallbackResponse(question) {
  const title = buildDynamicTitle(question);
  return {
    title,
    explanation:
      `You've asked about "${question}". Cybersecurity is the practice of protecting systems, networks, and data from digital attacks and unauthorised access. While a specific knowledge base entry isn't available for this exact topic, the general principles below apply broadly.`,
    whyItMatters:
      'Cyber threats — whether targeted attacks or opportunistic malware — can cause financial loss, identity theft, reputational damage, and privacy violations. The threat landscape evolves constantly, making awareness your most important defence.',
    howToStaySafe:
      'Practice strong cyber hygiene: keep software updated, use strong unique passwords with 2FA, think critically before clicking links or opening attachments, and maintain regular data backups.',
    tips: [
      'Keep all operating systems and applications updated to eliminate known vulnerabilities.',
      'Use a password manager and enable two-factor authentication on every important account.',
      'Back up critical data regularly and verify your backups can actually be restored.'
    ]
  };
}


/* ════════════════════════════════════════════════════════════════════════
   4. LEARN MORE LINKS
   Topic-keyed links to authoritative cybersecurity resources.
   Each entry returns 2-3 pill links shown at the bottom of AI responses.
   ════════════════════════════════════════════════════════════════════════ */

/** @type {Record<string, Array<{label: string, url: string}>>} */
const LEARN_MORE_MAP = {
  phishing:          [
    { label: '🎣 Google Phishing Quiz', url: 'https://phishingquiz.withgoogle.com/' },
    { label: '📖 NCSC Guide', url: 'https://www.ncsc.gov.uk/guidance/phishing' }
  ],
  password:          [
    { label: '🔐 Have I Been Pwned', url: 'https://haveibeenpwned.com/' },
    { label: '📖 Bitwarden Free', url: 'https://bitwarden.com/' }
  ],
  email:             [
    { label: '📧 NCSC Email Security', url: 'https://www.ncsc.gov.uk/collection/email-security-and-anti-spoofing' },
    { label: '📖 Gmail Phishing Tips', url: 'https://support.google.com/mail/answer/8253' }
  ],
  malware:           [
    { label: '🦠 MalwareBytes Guide', url: 'https://www.malwarebytes.com/malware' },
    { label: '📖 CISA Malware Tips', url: 'https://www.cisa.gov/news-events/news/understanding-anti-virus-software' }
  ],
  ransomware:        [
    { label: '💰 No More Ransom', url: 'https://www.nomoreransom.org/' },
    { label: '📖 CISA Ransomware', url: 'https://www.cisa.gov/stopransomware' }
  ],
  '2fa':             [
    { label: '🔑 2FA Directory', url: 'https://2fa.directory/' },
    { label: '📖 Google Authenticator', url: 'https://support.google.com/accounts/answer/1066447' }
  ],
  vpn:               [
    { label: '🌐 ProtonVPN Free', url: 'https://protonvpn.com/' },
    { label: '📖 EFF VPN Guide', url: 'https://ssd.eff.org/module/choosing-vpn-right-you' }
  ],
  social_engineering: [
    { label: '🎭 SANS Social Eng.', url: 'https://www.sans.org/blog/what-is-social-engineering/' },
    { label: '📖 KnowBe4 Training', url: 'https://www.knowbe4.com/social-engineering' }
  ],
  firewall:          [
    { label: '🧱 Microsoft Firewall', url: 'https://support.microsoft.com/en-us/windows/turn-microsoft-defender-firewall-on-or-off-ec0844f7-aebd-0583-67fe-601ecf5d774f' },
    { label: '📖 Cloudflare Firewall', url: 'https://www.cloudflare.com/learning/security/what-is-a-firewall/' }
  ],
  encryption:        [
    { label: '🔒 EFF Encryption', url: 'https://ssd.eff.org/module/what-encryption' },
    { label: '📖 Signal App', url: 'https://signal.org/' }
  ],
  dark_web:          [
    { label: '🕳️ Have I Been Pwned', url: 'https://haveibeenpwned.com/' },
    { label: '📖 Dark Web Explained', url: 'https://www.kaspersky.com/resource-center/threats/deep-web' }
  ],
  wifi:              [
    { label: '📶 Wi-Fi Security Tips', url: 'https://www.fcc.gov/consumers/guides/protecting-your-wireless-network' },
    { label: '📖 Mullvad VPN', url: 'https://mullvad.net/' }
  ],
  backup:            [
    { label: '💾 3-2-1 Backup Rule', url: 'https://www.backblaze.com/blog/the-3-2-1-backup-strategy/' },
    { label: '📖 CISA Backup Tips', url: 'https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf' }
  ],
  identity_theft:    [
    { label: '🪪 IdentityTheft.gov', url: 'https://www.identitytheft.gov/' },
    { label: '📖 AnnualCreditReport', url: 'https://www.annualcreditreport.com/' }
  ]
};

/** Default links shown when topic has no specific entry */
const DEFAULT_LEARN_MORE = [
  { label: '🛡️ NCSC Cyber Aware', url: 'https://www.ncsc.gov.uk/cyberaware' },
  { label: '📖 CISA Resources', url: 'https://www.cisa.gov/resources-tools/resources' }
];

/**
 * Returns the learn-more links for a knowledge-base topicKey.
 * @param {string|undefined} topicKey
 * @returns {Array<{label: string, url: string}>}
 */
function getLearnMoreLinks(topicKey) {
  return (topicKey && LEARN_MORE_MAP[topicKey]) ? LEARN_MORE_MAP[topicKey] : DEFAULT_LEARN_MORE;
}


/* ════════════════════════════════════════════════════════════════════════
   5. UTILITIES
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Escapes HTML special characters to prevent XSS from user input or
 * knowledge-base strings inserted into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

/**
 * Returns the current local time as "HH:MM AM/PM".
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


/* ════════════════════════════════════════════════════════════════════════
   6. CHAT RENDERING
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Injects a user message bubble (right-aligned, blue) into #chatMessages.
 * @param {string} question — raw user text (will be HTML-escaped)
 */
function renderUserBubble(question) {
  const time = getTimestamp();
  const html = `
    <div class="chat-row chat-row--user" role="listitem">
      <div class="chat-bubble chat-bubble--user">
        <div class="chat-bubble__meta chat-bubble__meta--user">
          <span class="chat-bubble__sender" aria-label="You">👤 You</span>
        </div>
        <p class="chat-bubble__text">${escapeHtml(question)}</p>
        <span class="chat-bubble__time" aria-label="Sent at ${time}">${time}</span>
      </div>
    </div>`;
  chatMessages.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

/**
 * Injects a temporary "CyberAware AI is analysing your question..." typing indicator.
 * The animated dots are shown using CSS keyframes.
 * @returns {HTMLElement} the indicator element (so it can be replaced)
 */
function renderTypingIndicator() {
  const id = `typing-${Date.now()}`;
  const html = `
    <div class="chat-row chat-row--ai" id="${id}" role="listitem" aria-live="polite" aria-label="CyberAware AI is analysing your question">
      <div class="chat-bubble chat-bubble--ai chat-bubble--typing">
        <div class="chat-bubble__meta">
          <span class="shield-icon" aria-hidden="true">🛡️</span>
          <span class="chat-bubble__sender">CyberAware AI</span>
        </div>
        <div class="typing-indicator" aria-hidden="true">
          <span class="typing-label">CyberAware AI is analysing your question</span>
          <span class="typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>`;
  chatMessages.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
  return document.getElementById(id);
}

/**
 * Replaces the typing indicator with the full structured AI response card.
 * Response structure:
 *   Title · Explanation · Why It Matters · How to Stay Safe · 3 Tips · Warning · Learn More
 *
 * @param {HTMLElement} typingEl   — element returned by renderTypingIndicator()
 * @param {string}      question   — original user question
 * @param {object}      data       — ResponseData
 * @param {string}      [topicKey] — knowledge-base topic key for learn-more links
 */
function replaceTypingWithResponse(typingEl, question, data, topicKey) {
  const id   = `block-${Date.now()}`;
  const time = getTimestamp();

  /* ── 3 Safety Tips ─────────────────────────────────────────────── */
  const tipsHtml = data.tips
    .map((tip, i) => `
      <li>
        <span class="tip-icon" aria-hidden="true">${i + 1}</span>
        <span>${escapeHtml(tip)}</span>
      </li>`)
    .join('');

  /* ── Warning box (conditional) ──────────────────────────────────── */
  const warningHtml = data.warning
    ? `<div class="warning-box" role="alert" aria-label="Warning">
         <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
         ${escapeHtml(data.warning)}
       </div>`
    : '';

  /* ── Learn More pill links ──────────────────────────────────────── */
  const learnLinks = getLearnMoreLinks(topicKey);
  const learnHtml  = learnLinks
    .map(({ label, url }) =>
      `<a class="learn-more-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
         ${escapeHtml(label)}
         <svg style="width:11px;height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
       </a>`)
    .join('');

  /* ── Full response card HTML ────────────────────────────────────── */
  const html = `
    <div class="chat-row chat-row--ai" id="${id}" role="listitem">
      <div class="chat-bubble chat-bubble--ai">
        <div class="chat-bubble__meta">
          <span class="shield-icon" aria-hidden="true">🛡️</span>
          <span class="chat-bubble__sender">CyberAware AI</span>
        </div>

        <div class="response-block">
          <h2 class="response-block__title">${escapeHtml(data.title)}</h2>

          <!-- Explanation -->
          <div class="info-section">
            <div class="info-section__label info-section__label--explain">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Explanation
            </div>
            <p class="info-section__text">${escapeHtml(data.explanation)}</p>
          </div>

          <!-- Why It Matters (replaces/extends "Why It's Dangerous") -->
          <div class="info-section">
            <div class="info-section__label info-section__label--why">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Why It Matters
            </div>
            <p class="info-section__text">${escapeHtml(data.whyItMatters)}</p>
          </div>

          <!-- How to Stay Safe -->
          <div class="info-section">
            <div class="info-section__label info-section__label--safe">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              How to Stay Safe
            </div>
            <p class="info-section__text">${escapeHtml(data.howToStaySafe)}</p>
          </div>

          <!-- 3 Safety Tips -->
          <div class="info-section">
            <div class="info-section__label info-section__label--tips">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              3 Safety Tips
            </div>
            <ul class="tips-list" aria-label="Safety tips">${tipsHtml}</ul>
          </div>

          ${warningHtml}

          <!-- Learn More -->
          <div class="info-section">
            <div class="info-section__label info-section__label--learn">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              Learn More
            </div>
            <div class="learn-more-links" aria-label="External learning resources">
              ${learnHtml}
            </div>
          </div>
        </div>

        <div class="response-block__footer">
          <span class="chat-bubble__time" aria-label="Received at ${time}">${time}</span>
          <button class="btn--copy" aria-label="Copy this AI response to clipboard" id="copy-${id}">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Response
          </button>
        </div>

        <p class="response-disclaimer">
          <svg style="width:12px;height:12px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          AI-generated guidance for educational purposes only. For serious cybersecurity incidents, contact your IT/security team.
        </p>
      </div>
    </div>`;

  /* ── Swap typing indicator for real response ─────────────────────── */
  typingEl.outerHTML = html;

  /* Re-query because outerHTML replacement detaches the old reference */
  const newBlock = document.getElementById(id);
  newBlock.querySelector(`#copy-${id}`).addEventListener('click', () => copyResponse(id, data, question));

  scrollToBottom();
}

/**
 * Scrolls the response area smoothly to the latest message.
 * Wrapped in a short timeout to allow layout reflow before measuring.
 */
function scrollToBottom() {
  const area = document.getElementById('responseArea');
  setTimeout(() => area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' }), 60);
}


/* ════════════════════════════════════════════════════════════════════════
   7. COPY RESPONSE
   Copies a plain-text version of the full AI response to the clipboard.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * @param {string} blockId
 * @param {object} data       — ResponseData
 * @param {string} question   — original user question
 */
function copyResponse(blockId, data, question) {
  const lines = [
    `Q: ${question}`,
    '',
    data.title,
    '',
    '📖 EXPLANATION',
    data.explanation,
    '',
    '⚠️  WHY IT MATTERS',
    data.whyItMatters,
    '',
    '🛡️  HOW TO STAY SAFE',
    data.howToStaySafe,
    '',
    '⭐ SAFETY TIPS',
    ...data.tips.map((t, i) => `  ${i + 1}. ${t}`)
  ];
  if (data.warning) {
    lines.push('', '⚠️  WARNING', data.warning);
  }
  lines.push('', '— CyberAware AI · IBM SkillsBuild Hackathon');

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById(`copy-${blockId}`);
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy Response`;
    }, 2500);
  }).catch(() => {
    alert('Copy failed. Please select and copy the text manually.');
  });
}


/* ════════════════════════════════════════════════════════════════════════
   8. INPUT VALIDATION
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Shows or hides the inline validation message below the input.
 * @param {string|null} message — null to hide the message
 */
function setValidationMessage(message) {
  const el = document.getElementById('validationMsg');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.hidden = false;
    questionInput.setAttribute('aria-invalid', 'true');
    questionInput.setAttribute('aria-describedby', 'validationMsg');
  } else {
    el.hidden = true;
    el.textContent = '';
    questionInput.removeAttribute('aria-invalid');
    questionInput.removeAttribute('aria-describedby');
  }
}


/* ════════════════════════════════════════════════════════════════════════
   9. API STATUS BADGE
   Updates the status pill at the top of the main content area.
   States:
     'live'    — HF token present, API reachable
     'demo'    — Demo Mode Active (no token / offline)
     'offline' — explicitly offline
     'error'   — internal error (should not reach user normally)
     'checking'— initial transient state
   ════════════════════════════════════════════════════════════════════════ */

/**
 * @param {'live'|'demo'|'offline'|'error'|'checking'} state
 * @param {string} [message] — optional label override
 */
function updateApiStatus(state, message) {
  const el   = document.getElementById('apiStatus');
  const text = document.getElementById('apiStatusText');
  if (!el || !text) return;

  /* Remove all state classes, then add the relevant one */
  el.classList.remove('api-status--live', 'api-status--offline', 'api-status--error', 'api-status--demo');
  if (state !== 'checking') el.classList.add(`api-status--${state}`);

  const labels = {
    live    : '⚡ IBM Granite AI — Live',
    demo    : '🎭 Demo Mode Active — Local Knowledge Base',
    offline : '📦 Offline Mode — Local Knowledge Base',
    error   : '⚡ IBM Granite AI — Live',   // don't show errors to user; stay as live
    checking: '… Checking AI connection'
  };
  text.textContent = message || labels[state] || '';
}

/* ── Initialise badge on page load based on config — no network call needed */
(function initApiStatus() {
  const hasToken = (IBM_CONFIG.HF_API_TOKEN || '').trim() !== '';
  /* Show Demo Mode if no token; Live if configured */
  updateApiStatus(hasToken ? 'live' : 'demo');
})();


/* ════════════════════════════════════════════════════════════════════════
   10. MAIN ASK FLOW
   ════════════════════════════════════════════════════════════════════════ */

/* Cache DOM references used repeatedly throughout the module */
const questionInput = document.getElementById('questionInput');
const askBtn        = document.getElementById('askBtn');
const clearBtn      = document.getElementById('clearBtn');
const emptyState    = document.getElementById('emptyState');
const chatMessages  = document.getElementById('chatMessages');
const charCount     = document.getElementById('charCount');

/**
 * Enables or disables the Ask AI button.
 * The typing indicator inside the chat provides visual loading feedback,
 * so the top loader bar is no longer used.
 * @param {boolean} active
 */
function setLoading(active) {
  askBtn.disabled = active;
  const loader = document.getElementById('loader');
  if (loader) loader.classList.toggle('active', false);
}

/** Hides the empty-state placeholder on the first user message. */
function hideEmptyState() {
  if (emptyState) {
    emptyState.style.display = 'none';
    chatMessages.setAttribute('role', 'list');
  }
}

/**
 * RESPONSE MATCHING — finds the best-matching knowledge-base entry.
 * Scores each entry by counting keyword hits; ties broken by first match.
 * Also returns the topicKey so learn-more links can be looked up.
 *
 * @param {string} question
 * @returns {{ data: object, topicKey: string|null }}
 */
function getLocalResponseWithKey(question) {
  const lower = question.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (!bestMatch) {
    return { data: buildFallbackResponse(question), topicKey: null };
  }

  const dynamicTitle = buildDynamicTitle(question);
  return {
    data: {
      ...bestMatch,
      title: `${bestMatch.titleEmoji} ${dynamicTitle}`
    },
    topicKey: bestMatch.topicKey
  };
}

/**
 * getLocalResponse — thin wrapper kept for backward-compat with askIBMBob fallback.
 * @param {string} question
 * @returns {object} ResponseData
 */
function getLocalResponse(question) {
  return getLocalResponseWithKey(question).data;
}

/**
 * Main ask handler.
 *   1. Validate input — show "Please enter a cybersecurity question." if empty.
 *   2. Render user bubble (right-aligned, blue).
 *   3. Show typing indicator with "CyberAware AI is analysing your question…"
 *   4. Call askIBMBob() — falls back to Demo Mode silently on error.
 *   5. Replace indicator with full structured response card.
 *
 * @param {string} [overrideQuestion] — pre-filled text from suggestion buttons
 */
async function handleAsk(overrideQuestion) {
  const raw = (overrideQuestion || questionInput.value).trim();

  /* ── 1. Empty input guard ─────────────────────────────────────── */
  if (!raw) {
    setValidationMessage('Please enter a cybersecurity question.');
    questionInput.focus();
    questionInput.style.borderColor = 'var(--clr-danger)';
    setTimeout(() => { questionInput.style.borderColor = ''; }, 1800);
    return;
  }

  setValidationMessage(null);
  hideEmptyState();
  setLoading(true);

  /* Clear input immediately after capturing the text */
  questionInput.value     = '';
  charCount.textContent   = '0 / 500';

  /* ── 2. Show user bubble ──────────────────────────────────────── */
  renderUserBubble(raw);

  /* ── 3. Show typing indicator ─────────────────────────────────── */
  const typingEl = renderTypingIndicator();

  /* Minimum typing delay for natural conversational feel */
  const MIN_DELAY_MS = 1000;

  try {
    const [data] = await Promise.all([
      askIBMBob(raw),
      new Promise(r => setTimeout(r, MIN_DELAY_MS))
    ]);

    /* Determine topicKey for learn-more links */
    const { topicKey } = getLocalResponseWithKey(raw);

    /* ── 5. Replace indicator with response ───────────────────────── */
    replaceTypingWithResponse(typingEl, raw, data, topicKey);

    /* Confirm live status after a successful API call */
    if ((IBM_CONFIG.HF_API_TOKEN || '').trim()) {
      updateApiStatus('live');
    }

  } catch (err) {
    /* ── Demo Mode fallback — never expose raw API errors to user ─── */
    console.warn('CyberAware AI: API error, falling back to Demo Mode.', err.message);
    updateApiStatus('demo');

    const { data: fallbackData, topicKey } = getLocalResponseWithKey(raw);
    replaceTypingWithResponse(typingEl, raw, fallbackData, topicKey);

  } finally {
    setLoading(false);
  }
}


/* ════════════════════════════════════════════════════════════════════════
   11. ABOUT MODAL
   ════════════════════════════════════════════════════════════════════════ */

const aboutModal = document.getElementById('aboutModal');
const aboutBtn   = document.getElementById('aboutBtn');
const modalClose = document.getElementById('modalClose');

/**
 * Opens the About modal and traps focus inside it.
 * Also prevents background scrolling while the modal is open.
 */
function openModal() {
  aboutModal.hidden = false;
  document.body.style.overflow = 'hidden';
  /* Move focus to the close button for accessibility */
  modalClose.focus();
}

/**
 * Closes the About modal and restores background scrolling.
 * Returns focus to the About button that opened it.
 */
function closeModal() {
  aboutModal.hidden = true;
  document.body.style.overflow = '';
  aboutBtn.focus();
}

/* Open modal on About button click */
aboutBtn.addEventListener('click', openModal);

/* Close modal on × button click */
modalClose.addEventListener('click', closeModal);

/* Close modal when clicking the dark overlay (outside the dialog) */
aboutModal.addEventListener('click', e => {
  if (e.target === aboutModal) closeModal();
});

/* Close modal on Escape key — standard modal accessibility behaviour */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !aboutModal.hidden) closeModal();
});


/* ════════════════════════════════════════════════════════════════════════
   12. EVENT LISTENERS
   ════════════════════════════════════════════════════════════════════════ */

/* ── Ask button click ──────────────────────────────────────────────── */
askBtn.addEventListener('click', () => handleAsk());

/* ── Keyboard: Enter = send, Shift+Enter = new line ─────────────── */
questionInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();   // prevent textarea newline on bare Enter
    handleAsk();
  }
  /* Shift+Enter falls through to default textarea behaviour (new line) */
});

/* ── Live character counter + clear validation as user types ────── */
questionInput.addEventListener('input', () => {
  const len = questionInput.value.length;
  charCount.textContent = `${len} / 500`;
  if (len > 0) setValidationMessage(null);
});

/* ── Clear chat button ──────────────────────────────────────────── */
clearBtn.addEventListener('click', () => {
  chatMessages.innerHTML = '';
  chatMessages.removeAttribute('role');
  questionInput.value   = '';
  charCount.textContent = '0 / 500';
  setValidationMessage(null);
  if (emptyState) emptyState.style.display = '';
  questionInput.focus();
});

/* ── Suggested question chips — auto-fill and immediately submit ── */
document.querySelectorAll('.suggestion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.q;
    /* Brief visual fill for UX, then submit immediately */
    questionInput.value   = q;
    charCount.textContent = `${q.length} / 500`;
    handleAsk(q);
  });
});
