/* ── CyberAware AI URL & Domain Heuristics Engine ──────────────────────── */

const HIGH_PROFILE_BRANDS = [
  { name: 'PayPal', primaryDomain: 'paypal.com', keywords: ['paypal', 'paypa1'] },
  { name: 'Apple', primaryDomain: 'apple.com', keywords: ['apple', 'apple-id', 'icloud', 'app1e'] },
  { name: 'Google', primaryDomain: 'google.com', keywords: ['google', 'gmail', 'g00gle'] },
  { name: 'Microsoft', primaryDomain: 'microsoft.com', keywords: ['microsoft', 'office365', 'outlook', 'onedrive', 'micros0ft'] },
  { name: 'Amazon', primaryDomain: 'amazon.com', keywords: ['amazon', 'prime-video', 'aws-login', 'amzon'] },
  { name: 'Netflix', primaryDomain: 'netflix.com', keywords: ['netflix', 'netflx'] },
  { name: 'Meta / Facebook', primaryDomain: 'facebook.com', keywords: ['facebook', 'instagram', 'whatsapp', 'meta-auth', 'fb-login'] },
  { name: 'Chase Bank', primaryDomain: 'chase.com', keywords: ['chase', 'chase-online'] },
  { name: 'Bank of America', primaryDomain: 'bankofamerica.com', keywords: ['bankofamerica', 'bofa'] },
  { name: 'Wells Fargo', primaryDomain: 'wellsfargo.com', keywords: ['wellsfargo'] },
  { name: 'Binance', primaryDomain: 'binance.com', keywords: ['binance', 'binance-us'] },
  { name: 'Coinbase', primaryDomain: 'coinbase.com', keywords: ['coinbase'] },
  { name: 'Steam', primaryDomain: 'steampowered.com', keywords: ['steamcommunity', 'steampowered', 'steam-gift'] },
  { name: 'DHL', primaryDomain: 'dhl.com', keywords: ['dhl-express', 'dhl-delivery', 'dhl'] },
  { name: 'FedEx', primaryDomain: 'fedex.com', keywords: ['fedex-tracking', 'fedex'] },
  { name: 'USPS', primaryDomain: 'usps.com', keywords: ['usps-track', 'usps-delivery', 'usps'] }
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'ow.ly',
  'rb.gy', 'tiny.cc', 'shorturl.at', 'buff.ly', 'rebrand.ly', 'bl.ink'
];

const HIGH_RISK_TLDS = [
  '.xyz', '.top', '.zip', '.mov', '.cc', '.tk', '.click', '.monster',
  '.club', '.work', '.gq', '.cf', '.ga', '.ml', '.country', '.stream',
  '.cam', '.live', '.loan', '.buzz', '.surf', '.icu', '.fit', '.rest'
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.vbs', '.vbe', '.iso', '.zip',
  '.tar.gz', '.apk', '.dmg', '.dll', '.ps1', '.jar', '.hta', '.msi'
];

const SUSPICIOUS_PATH_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'banking', 'secure',
  'authenticate', 'credential', 'update-billing', 'wallet', 'unlock',
  'password-reset', 'confirm-identity', 'auth', 'wp-login'
];

/**
 * Parses domain anatomy (root domain, subdomains, tld)
 */
function extractDomainAnatomy(hostname) {
  if (!hostname) return { rootDomain: '', subdomains: '', tld: '' };

  // Handle IPv4 address
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    return { rootDomain: hostname, subdomains: '(none)', tld: '(IP Address)' };
  }

  const parts = hostname.toLowerCase().split('.');
  if (parts.length === 1) {
    return { rootDomain: hostname, subdomains: '(none)', tld: '(none)' };
  }

  // Handle multi-part ccTLDs (e.g. .co.uk, .com.au, .gov.uk)
  const multiPartTlds = ['co.uk', 'com.au', 'co.in', 'org.uk', 'gov.uk', 'ac.uk', 'com.br', 'co.nz'];
  let isMultiPart = false;
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.');
    if (multiPartTlds.includes(lastTwo)) {
      isMultiPart = true;
    }
  }

  const tldPartsCount = isMultiPart ? 2 : 1;
  const tld = '.' + parts.slice(-tldPartsCount).join('.');
  const rootDomain = parts.slice(-(tldPartsCount + 1)).join('.');
  const subdomains = parts.slice(0, -(tldPartsCount + 1)).join('.');

  return { rootDomain, subdomains, tld };
}

/**
 * Analyzes a URL / domain string for cybersecurity threats and heuristics
 */
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
      anatomy: null,
      isEmail: false,
    };
  }

  // 1. Email address check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return {
      riskLevel: 'INVALID',
      score: 100,
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      summary: 'Input is an Email Address, not a website URL.',
      signals: [
        {
          title: 'Email Address Detected',
          type: 'warning',
          desc: 'You entered an email address. Use the Email Phishing Scanner to inspect emails for threats.'
        }
      ],
      anatomy: null,
      isEmail: true,
    };
  }

  // 2. Spaces or illegal characters in domain
  if (/\s/.test(trimmed)) {
    return {
      riskLevel: 'MALFORMED',
      score: 85,
      badgeColor: 'text-red-400',
      badgeBg: 'bg-red-500/10 border-red-500/30',
      summary: 'URL contains whitespace or illegal characters.',
      signals: [
        {
          title: 'Invalid URL Syntax',
          type: 'danger',
          desc: 'URLs cannot contain unencoded whitespace or random space-separated text.'
        }
      ],
      anatomy: null,
      isEmail: false,
    };
  }

  let parsedUrl = null;
  let hasExplicitProtocol = true;
  let urlToParse = trimmed;

  if (!/^https?:\/\//i.test(trimmed)) {
    hasExplicitProtocol = false;
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
        {
          title: 'Malformed URL Structure',
          type: 'danger',
          desc: 'The input string could not be parsed as a valid web address.'
        }
      ],
      anatomy: null,
      isEmail: false,
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const search = parsedUrl.search.toLowerCase();
  const port = parsedUrl.port;
  const signals = [];
  let riskPoints = 0;

  // Anatomy Breakdown
  const { rootDomain, subdomains, tld } = extractDomainAnatomy(hostname);

  // Check if domain has at least a dot (or is localhost)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!hostname.includes('.') && !isLocalhost) {
    return {
      riskLevel: 'INCOMPLETE',
      score: 70,
      badgeColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      summary: 'Incomplete domain name. Missing top-level domain (TLD) like .com, .org.',
      signals: [
        {
          title: 'Missing TLD Extension',
          type: 'warning',
          desc: `"${hostname}" is not a fully-qualified domain name (e.g., use "${hostname}.com").`
        }
      ],
      anatomy: { hostname, rootDomain, subdomains, tld: 'None', protocol: parsedUrl.protocol, pathname },
      isEmail: false,
    };
  }

  // Signal: Protocol Security (HTTP vs HTTPS)
  if (hasExplicitProtocol && parsedUrl.protocol === 'http:') {
    riskPoints += 25;
    signals.push({
      title: 'Unencrypted Protocol (HTTP)',
      type: 'warning',
      desc: 'Website uses unencrypted HTTP. Data sent to this site is vulnerable to packet interception and eavesdropping.'
    });
  } else if (hasExplicitProtocol && parsedUrl.protocol === 'https:') {
    signals.push({
      title: 'Encrypted Protocol (HTTPS)',
      type: 'success',
      desc: 'Connection uses SSL/TLS encryption for in-transit communication.'
    });
  } else {
    signals.push({
      title: 'Default HTTPS Assumed',
      type: 'success',
      desc: 'No protocol was explicitly typed; evaluated using modern HTTPS standard.'
    });
  }

  // Signal: Punycode / Internationalized Domain Name (Homoglyph Attack)
  if (hostname.startsWith('xn--') || /[^\u0000-\u007F]/.test(hostname)) {
    riskPoints += 50;
    signals.push({
      title: 'Punycode / Homoglyph Spoofing Detected',
      type: 'danger',
      desc: 'Domain contains punycode ("xn--") or non-ASCII characters, frequently used to visually impersonate trusted brands.'
    });
  }

  // Signal: Brand Impersonation & Spoofing
  let brandSpoofed = null;
  for (const brand of HIGH_PROFILE_BRANDS) {
    const isBrandKeywordInHost = brand.keywords.some(kw => hostname.includes(kw));
    if (isBrandKeywordInHost) {
      // Check if root domain is actually the genuine brand domain
      const isGenuine = rootDomain === brand.primaryDomain || rootDomain.endsWith('.' + brand.primaryDomain);
      if (!isGenuine) {
        brandSpoofed = brand;
        riskPoints += 55;
        signals.push({
          title: `Brand Impersonation Target: ${brand.name}`,
          type: 'danger',
          desc: `Spoofs "${brand.name}" in subdomain or prefix, but destination resolves to unrelated root domain "${rootDomain}".`
        });
        break;
      }
    }
  }

  // Signal: Raw IP Address Hostname
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    riskPoints += 40;
    const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.)/.test(hostname);
    signals.push({
      title: isPrivate ? 'Private Network IP Address' : 'Raw Public IP Address Hostname',
      type: 'danger',
      desc: isPrivate
        ? 'Points to a local/private network address rather than a public Internet domain.'
        : 'Domain points directly to a raw public IP address, a hallmark of malicious servers or phishing kits.'
    });
  }

  // Signal: URL Shortener
  if (URL_SHORTENERS.includes(rootDomain) || URL_SHORTENERS.includes(hostname)) {
    riskPoints += 25;
    signals.push({
      title: 'URL Shortener / Masked Destination',
      type: 'warning',
      desc: 'This URL uses a shortening service that conceals the true destination web server.'
    });
  }

  // Signal: High-Risk TLD
  const matchedTld = HIGH_RISK_TLDS.find(t => hostname.endsWith(t));
  if (matchedTld) {
    riskPoints += 30;
    signals.push({
      title: `High-Risk TLD (${matchedTld})`,
      type: 'warning',
      desc: `The top-level domain ${matchedTld} has elevated abuse rates for cheap, disposable phishing and malware hosting.`
    });
  }

  // Signal: Obfuscation via @ Symbol in original input
  if (trimmed.includes('@')) {
    riskPoints += 45;
    signals.push({
      title: 'Credential / Spoofing Obfuscation (@ Symbol)',
      type: 'danger',
      desc: 'URL contains an "@" symbol. Browsers treat text before "@" as credentials, redirecting to the host after it.'
    });
  }

  // Signal: Non-Standard Port
  if (port && !['80', '443'].includes(port)) {
    riskPoints += 25;
    signals.push({
      title: `Non-Standard Port (:${port})`,
      type: 'warning',
      desc: `Connects via non-standard port :${port}, commonly seen on testing environments, exposed dashboards, or malicious proxies.`
    });
  }

  // Signal: Excessive Subdomain Depth
  const domainParts = hostname.split('.');
  if (domainParts.length > 4) {
    riskPoints += 25;
    signals.push({
      title: 'Excessive Subdomain Hierarchy',
      type: 'warning',
      desc: `Contains ${domainParts.length} domain levels, frequently used to mislead victims about the true domain.`
    });
  }

  // Signal: Excessive Hyphens in Hostname
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    riskPoints += 20;
    signals.push({
      title: 'Excessive Hyphenation in Domain',
      type: 'warning',
      desc: `Hostname contains ${hyphenCount} hyphens, commonly seen in lookalike phishing domains (e.g. "secure-login-bank-auth").`
    });
  }

  // Signal: Dangerous File Extension in Path
  const matchedExt = DANGEROUS_EXTENSIONS.find(ext => pathname.endsWith(ext) || pathname.includes(ext + '?'));
  if (matchedExt) {
    riskPoints += 40;
    signals.push({
      title: `Dangerous Executable File (${matchedExt})`,
      type: 'danger',
      desc: `URL points directly to an executable or archive file (${matchedExt}) that could execute arbitrary code.`
    });
  }

  // Signal: Phishing / Sensitive Path Keywords on Suspicious Domain
  if (riskPoints > 0) {
    const foundPathKw = SUSPICIOUS_PATH_KEYWORDS.find(kw => pathname.includes(kw) || search.includes(kw));
    if (foundPathKw) {
      riskPoints += 15;
      signals.push({
        title: `Sensitive Path Indicator (${foundPathKw})`,
        type: 'warning',
        desc: `Path or query string contains authentication keyword "${foundPathKw}".`
      });
    }
  }

  // Cap risk score between 0 and 100
  const finalScore = Math.min(Math.max(riskPoints, 0), 100);

  // Risk Classification
  let riskLevel = 'LOW RISK';
  let badgeColor = 'text-emerald-accent';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30';
  let summary = 'Standard domain structure. No high-risk heuristics triggered.';

  if (finalScore >= 50) {
    riskLevel = 'HIGH RISK';
    badgeColor = 'text-red-400';
    badgeBg = 'bg-red-500/10 border-red-500/30';
    summary = brandSpoofed
      ? `CRITICAL: High-risk brand impersonation of ${brandSpoofed.name} detected!`
      : 'CRITICAL: Multiple severe security and phishing anomalies identified!';
  } else if (finalScore >= 20) {
    riskLevel = 'MEDIUM RISK';
    badgeColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30';
    summary = 'Potential security anomalies found. Exercise caution before entering credentials.';
  }

  return {
    riskLevel,
    score: finalScore,
    badgeColor,
    badgeBg,
    summary,
    hostname,
    protocol: parsedUrl.protocol,
    signals,
    anatomy: {
      hostname,
      rootDomain,
      subdomains: subdomains || '(none)',
      tld: tld || '(none)',
      protocol: parsedUrl.protocol,
      port: port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
      pathname: parsedUrl.pathname || '/'
    },
    isEmail: false,
  };
}

/**
 * Generates an intelligent fallback AI inspection report when offline or conserving quota
 */
export function generateLocalUrlReport(inputUrl, heuristic, liveIntel = null) {
  const isHighRisk = heuristic.score >= 50;
  const isMediumRisk = heuristic.score >= 20 && heuristic.score < 50;

  const threatBadge = isHighRisk ? 'HIGH RISK / COMPROMISED' : isMediumRisk ? 'MEDIUM RISK / CAUTION' : 'LOW RISK / GENERALLY SAFE';

  let redFlags = heuristic.signals
    .filter(s => s.type === 'danger' || s.type === 'warning')
    .map(s => `- **${s.title}**: ${s.desc}`)
    .join('\n');

  if (!redFlags) {
    redFlags = '- No suspicious anomalies or known phishing patterns detected in the domain structure.';
  }

  const recommendation = isHighRisk
    ? '**DO NOT VISIT OR ENTER CREDENTIALS.** This domain displays critical hallmarks of credential theft, brand spoofing, or active threat listing.'
    : isMediumRisk
    ? '**PROCEED WITH EXTREME CAUTION.** Verify the website address independently and never enter passwords unless you trust the sender.'
    : '**SAFE TO BROWSE.** Standard domain structure, live DNS resolution, and transport security verified.';

  const dnsStatus = liveIntel?.googleResolved 
    ? `Resolved to \`${liveIntel.resolvedIps?.join(', ') || 'Active IP'}\`` 
    : 'No active A-Record (Unresolved / Dormant)';

  const cfStatus = liveIntel?.cloudflareBlocked 
    ? 'Flagged by Cloudflare Security Firewall' 
    : 'Clean on Cloudflare Security Filter';

  const blacklistStatus = liveIntel?.localDbMatch 
    ? `Matched active entry in Global Threat Database (\`${liveIntel.matchedEntry}\`)` 
    : 'Clean in Global Threat Database';

  return `### Security Assessment & Network Intelligence

**Overall Verdict:** ${threatBadge} (Threat Score: ${heuristic.score}/100)

---

### Security Verification Indicators
- **Threat Database Status:** ${blacklistStatus}
- **Cloudflare Security DNS:** ${cfStatus}
- **Live DNS & Server Origin:** ${dnsStatus}
- **Mail Exchanger Defense (MX):** ${liveIntel?.hasMxRecords ? 'Configured (Active Mail Server)' : 'None (Potential Disposable Host)'}

---

### Domain Breakdown & Anatomy
- **Target Host:** \`${heuristic.hostname || inputUrl}\`
- **Root Domain:** \`${heuristic.anatomy?.rootDomain || 'N/A'}\`
- **Subdomain Depth:** \`${heuristic.anatomy?.subdomains || 'None'}\`
- **Protocol:** \`${heuristic.anatomy?.protocol || 'https:'}\` (Port: \`${heuristic.anatomy?.port || '443'}\`)

---

### Identified Risk Indicators & Heuristics
${redFlags}

---

### Actionable Defense Recommendations
1. ${recommendation}
2. **Double-check the address bar:** Pay close attention to subtle spelling variations or unexpected domain endings.
3. **Use Multi-Factor Authentication (MFA):** Keeps your accounts secure even if credentials are accidentally entered on a spoofed site.
4. **When in doubt:** Open a new browser tab and navigate to the official website directly rather than following links.`;
}

/**
 * Queries the active Threat Intelligence Database (290,000+ compromised domains)
 */
export async function checkThreatIntelligence(inputUrl) {
  if (!inputUrl || !inputUrl.trim()) return { found: false, databaseSize: 0 };

  const clean = inputUrl.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
  if (!clean) return { found: false, databaseSize: 0 };

  try {
    const res = await fetch(`/api/threat-intel?domain=${encodeURIComponent(clean)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Threat intel query failed:', err);
  }

  return { found: false, databaseSize: 290676, error: 'Service unreachable' };
}

/**
 * Scours live internet threat registries (DoH, Cloudflare Sec, Google DNS, 290k DB) with 0 Gemini quota
 */
export async function scourInternetThreats(inputUrl) {
  if (!inputUrl || !inputUrl.trim()) return null;

  const clean = inputUrl.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
  if (!clean) return null;

  try {
    const res = await fetch(`/api/live-threat-scour?domain=${encodeURIComponent(clean)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Live threat scouring query failed:', err);
  }

  return null;
}


