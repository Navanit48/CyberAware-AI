import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe,
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  X, 
  Layers, 
  Server, 
  Lock, 
  Database,
  Radio
} from 'lucide-react';
import { 
  analyzeUrl, 
  generateLocalUrlReport, 
  extractAiUrlVerdict,
  checkThreatIntelligence, 
  scourInternetThreats 
} from '../lib/url-checker';
import { askCyberAwareAI } from '../lib/gemini';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function UrlView({ onNavigateToEmail }) {
  const [urlInput, setUrlInput] = useState('');
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [threatIntel, setThreatIntel] = useState({ found: false, databaseSize: 290676 });
  const [liveIntel, setLiveIntel] = useState(null);

  const heuristic = analyzeUrl(urlInput);
  const aiVerdict = extractAiUrlVerdict(deepAnalysis);

  // Live Threat Intelligence Database Lookup
  useEffect(() => {
    let isCancelled = false;
    if (!urlInput.trim() || heuristic.isEmail) {
      setThreatIntel({ found: false, databaseSize: 290676 });
      setLiveIntel(null);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await checkThreatIntelligence(urlInput);
      if (!isCancelled && res) {
        setThreatIntel(res);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [urlInput]);

  const isDbCompromised = threatIntel.found || (liveIntel && (liveIntel.localDbMatch || liveIntel.cloudflareBlocked));
  
  const effectiveScore = isDbCompromised 
    ? 100 
    : (aiVerdict 
        ? aiVerdict.score 
        : (liveIntel?.threatScore ? Math.max(heuristic.score, liveIntel.threatScore) : heuristic.score));

  const effectiveRiskLevel = isDbCompromised 
    ? 'CRITICAL COMPROMISED' 
    : (aiVerdict ? aiVerdict.riskLevel : heuristic.riskLevel);

  const effectiveSummary = isDbCompromised
    ? `CRITICAL THREAT: Verified match in Global Threat Intelligence Database (${(threatIntel.databaseSize || 290676).toLocaleString()} indexed domains).`
    : (aiVerdict ? aiVerdict.summary : heuristic.summary);

  const effectiveBadgeBg = isDbCompromised
    ? 'bg-red-500/10 border-red-500/30'
    : (aiVerdict ? aiVerdict.badgeBg : heuristic.badgeBg);

  const effectiveBadgeColor = isDbCompromised
    ? 'text-red-400'
    : (aiVerdict ? aiVerdict.badgeColor : heuristic.badgeColor);

  const handleDeepScan = async () => {
    if (!urlInput.trim() || isScanning) return;
    setIsScanning(true);
    setDeepAnalysis(null);

    // 1. Live Internet Threat Scour (0 Gemini API Quota)
    let scourData = null;
    try {
      scourData = await scourInternetThreats(urlInput);
      if (scourData) {
        setLiveIntel(scourData);
      }
    } catch (e) {
      console.warn('Scour error:', e);
    }

    const currentCompromised = (scourData && (scourData.localDbMatch || scourData.cloudflareBlocked)) || isDbCompromised;
    const currentScore = currentCompromised ? 100 : (scourData?.threatScore ? Math.max(heuristic.score, scourData.threatScore) : effectiveScore);
    const currentRisk = currentCompromised ? 'CRITICAL COMPROMISED' : heuristic.riskLevel;

    const prompt = `Perform a comprehensive cybersecurity domain and threat intelligence inspection on this target domain/URL: "${urlInput.trim()}".

Technical Scan Findings:
- Domain: ${heuristic.hostname || urlInput}
- Root Domain: ${heuristic.anatomy?.rootDomain || 'N/A'} (TLD: ${heuristic.anatomy?.tld || 'N/A'})
- Subdomains: ${heuristic.anatomy?.subdomains || '(none)'}
- Initial Calculated Threat Score: ${currentScore}/100 (${currentRisk})
- Threat Database Blacklist Match: ${currentCompromised ? `MATCHED / COMPROMISED (Found in active database of ${threatIntel.databaseSize?.toLocaleString()} malicious domains)` : 'Clean in local blacklist'}
- Cloudflare Security Filter: ${scourData?.cloudflareBlocked ? 'BLOCKED / MALICIOUS' : 'CLEAN / RESOLVED'}
- Live DNS Origin: ${scourData?.googleResolved ? `Active (${scourData.resolvedIps?.join(', ') || 'Resolvable'})` : 'Unresolved / Dormant'}
- Mail Server (MX): ${scourData?.hasMxRecords ? 'Active MX Records' : 'None / Potential Disposable'}
- Triggered Signals: ${heuristic.signals?.map(s => s.title).join(', ') || 'None'}

CRITICAL INSTRUCTIONS FOR ASSESSMENT:
1. Brand Spoofing, TLD Mismatch & Squatting Analysis: Evaluate if this domain uses an alternate or non-canonical TLD (such as .org, .net, .xyz, or hyphens) for an established commercial or consumer brand/service whose primary official domain is different (e.g. using .org or .net when the genuine platform operates on .com, or lookalike typosquats).
2. Threat Score Calibration: If the domain is an alternate TLD, unverified brand copy, or potential domain squatting/traffic capture site, DO NOT assign 0. Assign an evaluated threat score reflecting the risk (e.g. 35–55 for alternate TLD/domain squatting/brand confusion, 60–100 for active phishing/malware/deceptive credentials).
3. Structure: Provide the OVERALL SAFETY VERDICT and EXECUTIVE SUMMARY FIRST so the user immediately knows if it is safe to browse or if caution is required, followed by technical breakdowns.

Please structure your report strictly in the following format:

### Overall Safety Verdict

**Is this website safe?** [SAFE / CAUTION (POTENTIAL BRAND MISMATCH OR SQUATTING) / DANGEROUS]  
**AI Threat Score:** [0-100] (0-15: Verified genuine & safe, 25-55: Alternate TLD/Potential Squatting/Brand Confusion, 60-100: Malicious/Phishing)  
**Executive Summary:** [Clear 1-2 sentence plain-English summary answering directly whether the user should visit, exercise caution, or avoid]

---

### 1. Brand Spoofing & Domain Authenticity
- Analysis of whether the domain represents the genuine canonical brand or an alternate TLD/typosquatting risk.

### 2. Live DNS & Network Security Status
- DNS resolution, server IP origin, Cloudflare security filters, and mail host status.

### 3. Transport Security & Domain Architecture
- Encryption protocol (HTTPS/TLS), subdomain hierarchy, and target port.

### 4. Actionable Defense Recommendations
- Clear recommendations on verifying official URLs, using MFA, and safe browsing habits.`;

    try {
      const res = await askCyberAwareAI(prompt);
      setIsScanning(false);
      if (res && res.success && res.text) {
        setDeepAnalysis(res.text);
      } else {
        const fallback = generateLocalUrlReport(urlInput, {
          ...heuristic,
          score: currentScore,
          riskLevel: currentRisk,
          signals: currentCompromised
            ? [
                {
                  title: `Confirmed Compromised Threat Match (${scourData?.matchedEntry || threatIntel.matchedEntry || urlInput})`,
                  type: 'danger',
                  desc: `Domain is actively cataloged in the global compromised database (${threatIntel.databaseSize?.toLocaleString()} active threats).`
                },
                ...heuristic.signals
              ]
            : heuristic.signals
        }, scourData);
        setDeepAnalysis(fallback);
      }
    } catch {
      setIsScanning(false);
      const fallback = generateLocalUrlReport(urlInput, {
        ...heuristic,
        score: currentScore,
        riskLevel: currentRisk
      }, scourData);
      setDeepAnalysis(fallback);
    }
  };

  const handleCopyReport = () => {
    if (!deepAnalysis) return;
    navigator.clipboard.writeText(deepAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setUrlInput('');
    setDeepAnalysis(null);
    setLiveIntel(null);
    setThreatIntel({ found: false, databaseSize: 290676 });
  };

  const getScoreColor = (score) => {
    if (score >= 50) return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40' };
    if (score >= 20) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/40' };
    return { text: 'text-emerald-accent', bg: 'bg-emerald-accent', border: 'border-emerald-accent/40' };
  };

  const scoreTheme = getScoreColor(effectiveScore);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
            <Globe className="w-3.5 h-3.5" />
            <span>Real-time Domain & URL Verification Engine</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-subtext-muted">
            <Database className="w-3 h-3 text-emerald-accent" />
            <span>{(threatIntel.databaseSize || 290676).toLocaleString()} Compromised Domains Active</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">URL Safety & Threat Scanner</h1>
        <p className="text-sm text-subtext-secondary">
          Detect phishing links, active compromised domains, deceptive subdomains, and malicious download vectors.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="frosted-glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
        {/* Input Bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
            Enter Web Address or Domain
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setDeepAnalysis(null);
                }}
                placeholder="e.g. https://secure-login.paypal.com.verify.xyz/auth or google.com"
                className="w-full bg-obsidian-subtle border border-border-subtle focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/20 rounded-2xl px-5 py-4 text-subtext-primary text-sm sm:text-base placeholder-subtext-muted outline-none pr-12 transition-all font-mono"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3.5 p-1.5 text-subtext-muted hover:text-subtext-primary hover:bg-surface-hover rounded-xl transition-all cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleDeepScan}
              disabled={!urlInput.trim() || isScanning || heuristic.isEmail}
              className={`px-6 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shrink-0 ${
                urlInput.trim() && !isScanning && !heuristic.isEmail
                  ? 'bg-emerald-accent text-slate-950 shadow-emerald-pill hover:bg-emerald-hover cursor-pointer'
                  : 'bg-surface-hover text-subtext-muted cursor-not-allowed'
              }`}
            >
              {isScanning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Address Warning Notice */}
        {heuristic.isEmail && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-subtext-primary">Email Address Input Detected</p>
                <p className="text-subtext-secondary">You entered an email address instead of a website domain.</p>
              </div>
            </div>
            {onNavigateToEmail && (
              <button
                onClick={onNavigateToEmail}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-semibold text-amber-600 dark:text-amber-300 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>Switch to Email Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Threat Intelligence Feed Critical Match Alert */}
        {isDbCompromised && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 space-y-2 shadow-lg shadow-red-500/10"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-red-400">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
              <span>CONFIRMED COMPROMISED / BLACKLISTED DOMAIN</span>
            </div>
            <p className="text-xs text-subtext-secondary leading-relaxed">
              This domain (<span className="font-mono font-bold text-red-400">{threatIntel.matchedEntry || urlInput}</span>) was verified and matched directly inside the active <strong className="text-red-300">Global Threat Intelligence Database ({(threatIntel.databaseSize || 290676).toLocaleString()} malicious websites)</strong>.
            </p>
            <div className="text-[11px] font-semibold text-red-300 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>DO NOT VISIT, DOWNLOAD FILES, OR ENTER PASSWORDS</span>
            </div>
          </motion.div>
        )}

        {/* Threat Score & Risk Badge Card */}
        {urlInput.trim() && !heuristic.isEmail && (
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${effectiveBadgeBg} ${effectiveBadgeColor}`}>
                    {effectiveRiskLevel}
                  </span>
                  {heuristic.hostname && (
                    <span className="text-xs text-subtext-muted font-mono">{heuristic.hostname}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-subtext-primary">
                  {effectiveSummary}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-subtext-muted">Calculated Threat Score</span>
                <p className="text-3xl font-extrabold text-subtext-primary font-mono">
                  <span className={scoreTheme.text}>{effectiveScore}</span>
                  <span className="text-xs font-sans font-normal text-subtext-muted"> / 100</span>
                </p>
              </div>
            </div>

            {/* Threat Meter Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-obsidian-subtle rounded-full overflow-hidden p-0.5 border border-border-subtle">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(effectiveScore, 4)}%` }}
                  transition={{ duration: 0.4 }}
                  className={`h-full rounded-full ${scoreTheme.bg}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-subtext-muted font-mono">
                <span>0 (Safe)</span>
                <span>50 (Suspicious)</span>
                <span>100 (Dangerous)</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Security Network Verification Card */}
        {liveIntel && (
          <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-subtext-primary">
                <Radio className="w-4 h-4 text-emerald-accent animate-pulse" />
                <span>Live Security Network Verification</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-obsidian-subtle border border-border-subtle space-y-0.5">
                <span className="text-[10px] text-subtext-muted">Threat Database</span>
                <p className={`font-semibold text-xs ${liveIntel.localDbMatch ? 'text-red-400' : 'text-emerald-accent'}`}>
                  {liveIntel.localDbMatch ? 'Threat Listed' : 'Clean'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-obsidian-subtle border border-border-subtle space-y-0.5">
                <span className="text-[10px] text-subtext-muted">Cloudflare Security</span>
                <p className={`font-semibold text-xs ${liveIntel.cloudflareBlocked ? 'text-red-400' : 'text-emerald-accent'}`}>
                  {liveIntel.cloudflareBlocked ? 'Blocked' : 'Clean'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-obsidian-subtle border border-border-subtle space-y-0.5">
                <span className="text-[10px] text-subtext-muted">DNS Resolution</span>
                <p className="font-semibold text-xs text-subtext-primary truncate" title={liveIntel.resolvedIps?.join(', ')}>
                  {liveIntel.googleResolved ? `Active (${liveIntel.resolvedIps?.[0] || 'IP'})` : 'Unresolved'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-obsidian-subtle border border-border-subtle space-y-0.5">
                <span className="text-[10px] text-subtext-muted">Mail Exchanger (MX)</span>
                <p className="font-semibold text-xs text-subtext-primary">
                  {liveIntel.hasMxRecords ? 'Configured' : 'None / Disposable'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Domain Anatomy Breakdown Grid */}
        {urlInput.trim() && heuristic.anatomy && !heuristic.isEmail && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-accent" />
              <span>Domain Anatomy & Technical Architecture</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Root Registered Domain</p>
                <p className="font-mono font-bold text-subtext-primary truncate">{heuristic.anatomy.rootDomain || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Subdomain(s)</p>
                <p className="font-mono font-medium text-emerald-accent truncate">{heuristic.anatomy.subdomains || '(none)'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Top-Level Domain (TLD)</p>
                <p className="font-mono font-medium text-subtext-primary">{heuristic.anatomy.tld || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Protocol & Transport</p>
                <p className="font-mono font-medium text-subtext-primary flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-accent" />
                  <span>{heuristic.anatomy.protocol}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Target Port</p>
                <p className="font-mono font-medium text-subtext-primary flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-subtext-muted" />
                  <span>{heuristic.anatomy.port}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-hover/40 border border-border-subtle space-y-1">
                <p className="text-[11px] text-subtext-muted">Path / Resource</p>
                <p className="font-mono font-medium text-subtext-secondary truncate">{heuristic.anatomy.pathname || '/'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Heuristic Inspection Signals */}
        {urlInput.trim() && heuristic.signals.length > 0 && !heuristic.isEmail && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              Heuristic Inspection Signals ({heuristic.signals.length})
            </p>
            <div className="space-y-2.5">
              {heuristic.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs transition-all ${
                    sig.type === 'danger'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : sig.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-emerald-dim border-border-glow text-emerald-accent'
                  }`}
                >
                  {sig.type === 'danger' ? (
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : sig.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold text-subtext-primary">{sig.title}</p>
                    <p className="text-subtext-secondary leading-relaxed">{sig.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Deep Inspection Intelligence Output */}
        {deepAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-emerald-dim border border-border-glow space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
                <Sparkles className="w-4 h-4" />
                <span>AI Security Intelligence Report</span>
              </div>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle hover:border-emerald-accent/40 text-xs text-subtext-secondary hover:text-subtext-primary transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-accent" />
                    <span className="text-emerald-accent">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Report</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-border-glow/50">
              <MarkdownRenderer content={deepAnalysis} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

