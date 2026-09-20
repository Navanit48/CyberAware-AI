/* ── CyberAware AI Email & Phishing Analyzer Engine ───────────────────── */

export function analyzeEmail(content) {
  const text = content ? content.trim() : '';

  if (!text) {
    return {
      score: 0,
      riskLevel: 'UNKNOWN',
      badgeColor: 'text-subtext-muted',
      badgeBg: 'bg-border-subtle',
      summary: 'Paste email text, subject lines, or headers to analyze for phishing markers.',
      findings: []
    };
  }

  const findings = [];
  let score = 0;
  const lowerText = text.toLowerCase();

  // Check 1: High-Urgency & Threat Cues
  const urgencyKeywords = [
    'immediate action', 'suspended within 24', 'account terminated',
    'unauthorized access', 'urgent security update', 'verify your account now',
    'act immediately', 'fail to respond', 'final warning', 'lawsuit'
  ];
  const foundUrgency = urgencyKeywords.filter(kw => lowerText.includes(kw));
  if (foundUrgency.length > 0) {
    score += 30;
    findings.push({
      title: 'High Urgency & Threat Pressure',
      type: 'danger',
      desc: `Email uses artificial urgency cues ("${foundUrgency[0]}") designed to induce panic.`
    });
  }

  // Check 2: Credential / Financial Requests
  const credentialKeywords = [
    'confirm your password', 'verify SSN', 'credit card details',
    'enter pin code', 'update billing info', 'wire transfer',
    'gift card', 'bitcoin payment', 'crypto deposit', 'tax refund'
  ];
  const foundCreds = credentialKeywords.filter(kw => lowerText.includes(kw));
  if (foundCreds.length > 0) {
    score += 35;
    findings.push({
      title: 'Credential or Financial Data Request',
      type: 'danger',
      desc: `Explicitly requests sensitive credentials or payments ("${foundCreds[0]}").`
    });
  }

  // Check 3: Generic Greeting
  const genericGreetings = ['dear customer', 'dear user', 'dear account holder', 'valuable client', 'dear sir/madam'];
  if (genericGreetings.some(g => lowerText.includes(g))) {
    score += 15;
    findings.push({
      title: 'Impersonal / Generic Greeting',
      type: 'warning',
      desc: 'Legitimate organizations typically address you by your registered name.'
    });
  }

  // Check 4: Suspicious Links / IP Addresses
  if (text.includes('http://') || lowerText.includes('click here') || lowerText.includes('bit.ly') || lowerText.includes('tinyurl')) {
    score += 20;
    findings.push({
      title: 'Suspicious Hyperlink or Link Shortener',
      type: 'warning',
      desc: 'Contains generic "Click Here" anchors or unencrypted short links.'
    });
  }

  // Check 5: Lookalike / Spoofed Domain Detection
  const spoofedDomains = ['paypaI.com', 'micros0ft.com', 'app1e.com', 'sec-bank.net', 'netflix-verify.com'];
  if (spoofedDomains.some(d => lowerText.includes(d.toLowerCase()))) {
    score += 40;
    findings.push({
      title: 'Spoofed Brand Domain Detected',
      type: 'danger',
      desc: 'Contains domain names using homoglyphs or lookalike character substitutions.'
    });
  }

  // Risk Classification
  let riskLevel = 'SAFE / LOW RISK';
  let badgeColor = 'text-emerald-accent';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30';
  let summary = 'No high-risk phishing markers identified in the provided text.';

  if (score >= 60) {
    riskLevel = 'HIGH PHISHING RISK';
    badgeColor = 'text-red-400';
    badgeBg = 'bg-red-500/10 border-red-500/30';
    summary = 'CRITICAL PHISHING RISK! Do not click links, open attachments, or reply.';
  } else if (score >= 25) {
    riskLevel = 'SUSPICIOUS / MEDIUM RISK';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30';
    summary = 'Contains suspicious email indicators. Verify sender details through an official channel.';
  }

  return {
    score,
    riskLevel,
    badgeColor,
    badgeBg,
    summary,
    findings
  };
}
