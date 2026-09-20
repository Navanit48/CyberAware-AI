/* ── CyberAware AI URL & Domain Heuristics Engine ──────────────────────── */

export function analyzeUrl(inputUrl) {
  const trimmed = inputUrl ? inputUrl.trim() : '';

  if (!trimmed) {
    return {
      riskLevel: 'UNKNOWN',
      score: 0,
      badgeColor: 'text-subtext-muted',
      badgeBg: 'bg-border-subtle',
      summary: 'Enter a domain or website URL to analyze safety parameters.',
      signals: [],
      isEmail: false,
    };
  }

  // 1. Email address detection check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return {
      riskLevel: 'INVALID',
      score: 100,
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      summary: 'Input is an Email Address, not a website URL.',
      signals: [
        { title: 'Email Address Detected', type: 'warning', desc: 'You entered an email address. Please use our Email Phishing Analyzer tool to test emails.' }
      ],
      isEmail: true,
    };
  }

  let parsedUrl = null;
  let hasProtocol = true;
  let urlToParse = trimmed;

  if (!/^https?:\/\//i.test(trimmed)) {
    hasProtocol = false;
    urlToParse = 'https://' + trimmed;
  }

  try {
    parsedUrl = new URL(urlToParse);
  } catch {
    return {
      riskLevel: 'MALFORMED',
      score: 90,
      badgeColor: 'text-red-400',
      badgeBg: 'bg-red-500/10 border-red-500/30',
      summary: 'Invalid or unparseable URL syntax.',
      signals: [
        { title: 'Malformed URL Structure', type: 'danger', desc: 'The input string could not be parsed as a valid web address.' }
      ],
      isEmail: false,
    };
  }

  const hostname = parsedUrl.hostname;
  const pathname = parsedUrl.pathname;
  const signals = [];
  let riskPoints = 0;

  // Signal: Missing SSL/HTTPS
  if (parsedUrl.protocol === 'http:') {
    riskPoints += 25;
    signals.push({
      title: 'Unencrypted Protocol (HTTP)',
      type: 'warning',
      desc: 'Website uses unencrypted HTTP. Data sent to this site can be intercepted.'
    });
  } else {
    signals.push({
      title: 'Encrypted Protocol (HTTPS)',
      type: 'success',
      desc: 'Connection uses SSL/TLS encryption.'
    });
  }

  // Signal: Obfuscation via @ symbol
  if (trimmed.includes('@')) {
    riskPoints += 40;
    signals.push({
      title: 'Credential Obfuscation (@ Symbol)',
      type: 'danger',
      desc: 'URL contains an "@" symbol, often used in phishing to spoof legitimate domains.'
    });
  }

  // Signal: IP Address Hostname
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    riskPoints += 35;
    signals.push({
      title: 'Raw IP Address Hostname',
      type: 'danger',
      desc: 'Domain points directly to a raw IP address instead of a registered domain name.'
    });
  }

  // Signal: Excessive Subdomains
  const parts = hostname.split('.');
  if (parts.length > 4) {
    riskPoints += 25;
    signals.push({
      title: 'Excessive Subdomain Depth',
      type: 'warning',
      desc: `Contains ${parts.length} domain levels, often used to disguise malicious destinations.`
    });
  }

  // Signal: High-Risk TLDs
  const suspiciousTlds = ['.xyz', '.top', '.zip', '.mov', '.cc', '.tk', '.click', '.monster', '.club', '.work', '.gq', '.cf', '.ga', '.ml'];
  const matchedTld = suspiciousTlds.find(tld => hostname.endsWith(tld));
  if (matchedTld) {
    riskPoints += 25;
    signals.push({
      title: `High-Risk TLD (${matchedTld})`,
      type: 'warning',
      desc: `The top-level domain ${matchedTld} is frequently associated with disposable phishing sites.`
    });
  }

  // Signal: Suspicious Keywords in Domain
  const sensitiveKeywords = ['login', 'verify', 'account', 'banking', 'secure', 'paypal', 'apple-id', 'support-center', 'auth'];
  const foundKeyword = sensitiveKeywords.find(kw => hostname.toLowerCase().includes(kw));
  if (foundKeyword && parts.length > 2) {
    riskPoints += 20;
    signals.push({
      title: `Sensitive Keyword (${foundKeyword})`,
      type: 'warning',
      desc: `Domain contains sensitive keyword "${foundKeyword}" in a non-standard subdomain configuration.`
    });
  }

  // Risk Classification
  let riskLevel = 'LOW';
  let badgeColor = 'text-emerald-accent';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30';
  let summary = 'Standard domain structure. No high-risk heuristics triggered.';

  if (riskPoints >= 50) {
    riskLevel = 'HIGH RISK';
    badgeColor = 'text-red-400';
    badgeBg = 'bg-red-500/10 border-red-500/30';
    summary = 'Multiple critical phishing and obfuscation signals detected!';
  } else if (riskPoints >= 20) {
    riskLevel = 'MEDIUM RISK';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30';
    summary = 'Potential security anomalies found. Exercise caution before entering credentials.';
  }

  return {
    riskLevel,
    score: riskPoints,
    badgeColor,
    badgeBg,
    summary,
    hostname,
    protocol: parsedUrl.protocol,
    signals,
    isEmail: false,
  };
}
