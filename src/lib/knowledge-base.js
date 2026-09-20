/* ── CyberAware AI Knowledge Base (Offline Fallback Database) ────────── */

export const LOCAL_KNOWLEDGE_BASE = {
  phishing: {
    title: "Understanding & Preventing Phishing Attacks",
    summary: "Phishing is a social engineering attack where bad actors impersonate trusted organizations via email, SMS, or websites to steal credentials or financial data.",
    link: "https://www.ibm.com/topics/phishing",
    keyTakeaways: [
      "Check sender addresses carefully (e.g. `support@sec-bank.com` vs `support@bank.com`).",
      "Look for urgency cues: 'Your account will be suspended in 24 hours!'",
      "Never click embedded links directly; navigate to official websites manually.",
      "Enable Multi-Factor Authentication (MFA) on all sensitive accounts."
    ],
    details: "Phishing accounts for over 80% of reported security incidents. Common variations include Spear Phishing (targeted at specific individuals), Whaling (targeted at executives), and Smishing (SMS phishing)."
  },

  password: {
    title: "Password Hygiene & Entropy Standards",
    summary: "Strong passwords are the first line of defense against brute-force and dictionary attacks.",
    link: "https://www.ibm.com/topics/password-security",
    keyTakeaways: [
      "Use passphrases of at least 15–16 characters (e.g., `purple-dragon-flying-coffee-92`).",
      "Never reuse passwords across multiple services.",
      "Utilize a dedicated password manager (like Bitwarden or 1Password).",
      "Avoid predictable patterns like birthdays, pet names, or sequential digits."
    ],
    details: "A 12-character random password takes years to crack, whereas an 8-character password using only lowercase letters can be broken in seconds with modern GPUs."
  },

  mfa: {
    title: "Multi-Factor Authentication (MFA & 2FA)",
    summary: "MFA requires two or more verification factors to gain access to a resource, drastically reducing account takeover risks.",
    link: "https://www.ibm.com/topics/multifactor-authentication",
    keyTakeaways: [
      "Prefer Hardware Security Keys (YubiKey) or Authenticator Apps (TOTP) over SMS OTP.",
      "SMS codes can be intercepted via SIM-swapping attacks.",
      "Store backup recovery codes securely offline or in your password manager.",
      "Beware of MFA fatigue attacks (repeated push notification spam)."
    ],
    details: "Enabling MFA blocks 99.9% of automated account compromise attempts according to industry research."
  },

  ransomware: {
    title: "Ransomware Defense & Mitigation",
    summary: "Ransomware encrypts victim files and demands payment for the decryption key.",
    link: "https://www.ibm.com/topics/ransomware",
    keyTakeaways: [
      "Maintain offline, immutable 3-2-1 backups (3 copies, 2 media types, 1 offsite/air-gapped).",
      "Keep operating systems and software patched against known exploits.",
      "Disable remote access services like RDP unless protected behind a VPN.",
      "Never pay the ransom without consulting professional incident responders."
    ],
    details: "Modern ransomware attackers also employ 'double extortion', threatening to leak stolen confidential data online if the ransom is not paid."
  },

  wifi: {
    title: "Public Wi-Fi & Network Security",
    summary: "Unencrypted public Wi-Fi networks allow attackers to perform Man-in-the-Middle (MitM) eavesdropping.",
    link: "https://www.cisa.gov/news-events/news/understanding-risks-virtual-private-networks-vpns",
    keyTakeaways: [
      "Use a reputable VPN on public networks to encrypt your traffic.",
      "Verify websites use HTTPS (look for standard TLS protocols).",
      "Turn off automatic Wi-Fi auto-connect on mobile devices.",
      "Disable file sharing and discovery features on public networks."
    ],
    details: "Attackers can set up malicious rogue hotspots named 'Free Airport Wi-Fi' (Evil Twin attack) to intercept sensitive login credentials."
  },

  social_engineering: {
    title: "Social Engineering Tactics & Awareness",
    summary: "Social engineering manipulates human psychology rather than exploiting software vulnerabilities.",
    link: "https://www.ibm.com/topics/social-engineering",
    keyTakeaways: [
      "Be skeptical of unsolicited calls, texts, or emails asking for sensitive information.",
      "Verify unexpected requests through an independent communication channel.",
      "Remember that legitimate support agents will never ask for your password or 2FA code.",
      "Watch out for pretexting, baiting, and authority impersonation."
    ],
    details: "Human error remains the leading factor in cybersecurity breaches. Vigilance and verification are key."
  },

  malware: {
    title: "Malware Detection & Endpoint Protection",
    summary: "Malware includes viruses, trojans, spyware, keyloggers, and adware designed to compromise devices.",
    link: "https://www.ibm.com/topics/malware",
    keyTakeaways: [
      "Use modern EDR / Antivirus software and keep definitions updated.",
      "Only download files and applications from verified official sources.",
      "Be cautious with file extensions like `.exe`, `.scr`, `.iso`, or `.vbs`.",
      "Regularly audit running processes and startup items."
    ],
    details: "Keyloggers silently capture keystrokes to steal passwords and credit card numbers, highlighting the need for memory integrity monitoring."
  },

  vpn: {
    title: "Virtual Private Networks (VPN) Explained",
    summary: "A VPN routes your internet traffic through an encrypted tunnel to a remote server, masking your IP address.",
    link: "https://www.ibm.com/topics/vpn",
    keyTakeaways: [
      "VPNs protect against ISP tracking and public Wi-Fi snooping.",
      "A VPN does not make you completely anonymous online or immune to malware.",
      "Choose audit-verified no-logs VPN providers.",
      "Combine VPN usage with privacy-focused browser configurations."
    ],
    details: "While a VPN encrypts transit data, malicious websites can still track user activity through cookies and browser fingerprinting."
  }
};

export function getLocalFallback(query) {
  const q = query.toLowerCase();
  
  if (q.includes('phish') || q.includes('fake email') || q.includes('scam')) {
    return LOCAL_KNOWLEDGE_BASE.phishing;
  }
  if (q.includes('pass') || q.includes('entropy') || q.includes('strong')) {
    return LOCAL_KNOWLEDGE_BASE.password;
  }
  if (q.includes('mfa') || q.includes('2fa') || q.includes('two factor') || q.includes('authenticator')) {
    return LOCAL_KNOWLEDGE_BASE.mfa;
  }
  if (q.includes('ransom') || q.includes('encrypt') || q.includes('extort')) {
    return LOCAL_KNOWLEDGE_BASE.ransomware;
  }
  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('public net')) {
    return LOCAL_KNOWLEDGE_BASE.wifi;
  }
  if (q.includes('social') || q.includes('trick') || q.includes('impersonat')) {
    return LOCAL_KNOWLEDGE_BASE.social_engineering;
  }
  if (q.includes('malware') || q.includes('virus') || q.includes('trojan')) {
    return LOCAL_KNOWLEDGE_BASE.malware;
  }
  if (q.includes('vpn') || q.includes('tunnel') || q.includes('ip address')) {
    return LOCAL_KNOWLEDGE_BASE.vpn;
  }

  return {
    title: `Cybersecurity Guidance: "${query.slice(0, 30)}..."`,
    summary: "CyberAware AI recommends implementing defense-in-depth protocols across all personal and enterprise systems.",
    keyTakeaways: [
      "Keep all software, operating systems, and firmware updated to patch vulnerabilities.",
      "Use unique, 16+ character passwords stored in a secure password manager.",
      "Enforce multi-factor authentication (MFA) across all email and financial portals.",
      "Remain vigilant against unverified communications requesting credentials or urgency."
    ],
    details: "For real-time threats, consult certified security feeds such as CISA, NIST, or OWASP top security advisories."
  };
}
