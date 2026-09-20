import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  FileSearch, 
  Copy, 
  Check, 
  X, 
  Database, 
  Tag, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Server, 
  KeyRound, 
  FileCode,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analyzeEmail, generateLocalEmailReport, extractAiThreatVerdict } from '../lib/email-analyzer';
import { askCyberAwareAI } from '../lib/gemini';
import MarkdownRenderer from '../components/MarkdownRenderer';

const SAMPLE_LEGIT_HEADER = `Delivered-To: recipient@example.com
Received: by 2002:a05:6512:1234 with SMTP id abcd;
        Sun, 20 Sep 2026 10:15:30 -0700 (PDT)
Authentication-Results: mx.google.com;
       dkim=pass header.i=@paypal.com header.s=s1024 header.b=AbCdEfGh;
       spf=pass (google.com: domain of support@paypal.com designates 64.4.241.34 as permitted sender) smtp.mailfrom=support@paypal.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=paypal.com
Received-SPF: pass (google.com: domain of support@paypal.com designates 64.4.241.34 as permitted sender) client-ip=64.4.241.34;
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=paypal.com; s=s1024;
From: PayPal Support <support@paypal.com>
To: recipient@example.com
Subject: Your Monthly Account Activity Summary - September 2026
Date: Sun, 20 Sep 2026 10:15:00 -0700
Return-Path: <support@paypal.com>

Dear Customer,
Here is your monthly account transaction summary. Your balance is in good standing.`;

const SAMPLE_SPOOFED_HEADER = `Delivered-To: recipient@example.com
Received: from mail.attacker-scam-server.net (198.51.100.42)
        by mx.google.com with SMTP id xyz987;
        Sun, 20 Sep 2026 11:20:15 -0700 (PDT)
Authentication-Results: mx.google.com;
       dkim=fail (no key for signature) header.i=@paypal.com;
       spf=fail (google.com: domain of support@paypal.com does not designate 198.51.100.42 as permitted sender) smtp.mailfrom=support@paypal.com;
       dmarc=fail (p=REJECT dis=REJECT) header.from=paypal.com
Received-SPF: fail (google.com: domain of support@paypal.com does not designate 198.51.100.42 as permitted sender) client-ip=198.51.100.42;
From: PayPal Security Team <support@paypal.com>
Return-Path: <scammer-relay@attacker-scam-server.net>
Reply-To: <phish-collector@gmail.com>
To: recipient@example.com
Subject: URGENT: Your PayPal Account Has Been Suspended - Verify PIN Now
Date: Sun, 20 Sep 2026 11:20:00 -0700

Dear Customer,
Your PayPal account has been suspended due to unauthorized login attempts. Click here to confirm your PIN and reactivate your profile immediately.`;

export default function EmailView() {
  const [content, setContent] = useState('');
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  const heuristicReport = analyzeEmail(content);
  const aiVerdict = extractAiThreatVerdict(deepAnalysis);

  const effectiveFindings = [...heuristicReport.findings];
  if (aiVerdict && aiVerdict.score >= 60 && effectiveFindings.length === 0) {
    effectiveFindings.push({
      title: 'AI Threat Intelligence Detection',
      type: 'danger',
      desc: aiVerdict.summary
    });
  }

  const effectiveCategories = [...heuristicReport.categories];
  if (aiVerdict && aiVerdict.score >= 60 && !effectiveCategories.includes('AI Flagged Phishing')) {
    effectiveCategories.push('AI Flagged Phishing');
  }

  const report = aiVerdict ? {
    score: aiVerdict.score,
    riskLevel: aiVerdict.riskLevel,
    badgeColor: aiVerdict.badgeColor,
    badgeBg: aiVerdict.badgeBg,
    summary: aiVerdict.summary || heuristicReport.summary,
    findings: effectiveFindings,
    categories: effectiveCategories,
    headers: heuristicReport.headers
  } : heuristicReport;

  const handleDeepScan = async () => {
    if (!content.trim() || isScanning) return;
    setIsScanning(true);
    setDeepAnalysis(null);

    const prompt = `Analyze this email for phishing, social engineering, credential harvesting, or spoofing tactics:
"""
${content}
"""

Evaluated Threat Score (Heuristic): ${heuristicReport.score}/100 (${heuristicReport.riskLevel})
Identified Categories: ${heuristicReport.categories?.join(', ') || 'General'}

Provide a structured report in the following format:
1. Threat Classification: [SAFE / SUSPICIOUS / CRITICAL PHISH]
2. AI Threat Score: [0-100] (0 for legitimate safe email, 25-50 for suspicious, 60-100 for malicious/phishing)
3. Identified Red Flags & Manipulative Language
4. Technical Indicators (Sender Spoofing, Link Anomalies, Header Authentication)
5. Recommended Actions for the Receiver`;

    try {
      const res = await askCyberAwareAI(prompt);
      setIsScanning(false);
      if (res && res.success && res.text) {
        setDeepAnalysis(res.text);
      } else {
        const fallback = generateLocalEmailReport(content, heuristicReport);
        setDeepAnalysis(fallback);
      }
    } catch {
      setIsScanning(false);
      const fallback = generateLocalEmailReport(content, heuristicReport);
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
    setContent('');
    setDeepAnalysis(null);
  };

  const getScoreTheme = (score) => {
    if (score >= 60) return { text: 'text-red-400', bg: 'bg-red-500' };
    if (score >= 25) return { text: 'text-amber-400', bg: 'bg-amber-500' };
    return { text: 'text-emerald-accent', bg: 'bg-emerald-accent' };
  };

  const scoreTheme = getScoreTheme(report.score);
  const headerInfo = heuristicReport.headers;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
            <Mail className="w-3.5 h-3.5" />
            <span>Email Phishing Intelligence Engine</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-subtext-muted">
            <Database className="w-3 h-3 text-emerald-accent" />
            <span>Calibrated on 82,500+ Research Emails</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-subtext-muted">
            <KeyRound className="w-3 h-3 text-emerald-accent" />
            <span>SPF / DKIM / DMARC Header Audit</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">Email Analyzer</h1>
        <p className="text-sm text-subtext-secondary">
          Paste suspicious email bodies, headers, or full message sources to detect social engineering, urgency manipulation, 419 fraud, and sender spoofing.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="frosted-glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider flex items-center gap-2">
              <span>Email Message Content or Headers</span>
              {headerInfo && headerInfo.isHeaderPresent && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-dim border border-border-glow text-[10px] text-emerald-accent font-mono">
                  Headers Detected
                </span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="text-xs text-emerald-accent hover:text-emerald-hover flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Sample Headers</span>
                {showSamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {content && (
                <button
                  onClick={handleClear}
                  className="text-xs text-subtext-muted hover:text-subtext-primary flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Text</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Header Sample Drawer */}
          <AnimatePresence>
            {showSamples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-2xl bg-surface-card border border-border-subtle flex flex-wrap gap-2.5 items-center text-xs"
              >
                <span className="text-subtext-muted font-medium">Demo Header Samples:</span>
                <button
                  onClick={() => {
                    setContent(SAMPLE_LEGIT_HEADER);
                    setDeepAnalysis(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-accent border border-emerald-500/30 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Legitimate Header (SPF/DKIM Pass)</span>
                </button>
                <button
                  onClick={() => {
                    setContent(SAMPLE_SPOOFED_HEADER);
                    setDeepAnalysis(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Spoofed Header (SPF/DKIM Fail)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            rows={7}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setDeepAnalysis(null);
            }}
            placeholder="Paste full email text, subject line, or raw email headers here..."
            className="w-full bg-obsidian-subtle border border-border-subtle focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/20 rounded-2xl p-5 text-subtext-primary text-sm placeholder-subtext-muted outline-none transition-all font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDeepScan}
            disabled={!content.trim() || isScanning}
            className={`px-6 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              content.trim() && !isScanning
                ? 'bg-emerald-accent text-slate-950 shadow-emerald-pill hover:bg-emerald-hover cursor-pointer'
                : 'bg-surface-hover text-subtext-muted cursor-not-allowed'
            }`}
          >
            {isScanning ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>Analyzing Email...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                <span>Scan Email</span>
              </>
            )}
          </button>
        </div>

        {/* Email Header Authentication Audit Card (When headers are present) */}
        {headerInfo && headerInfo.isHeaderPresent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border space-y-4 ${
              headerInfo.verdict === 'SPOOFED'
                ? 'bg-red-500/10 border-red-500/40'
                : headerInfo.verdict === 'LEGITIMATE'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-surface-card border-border-subtle'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  headerInfo.verdict === 'SPOOFED' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-emerald-dim text-emerald-accent'
                }`}>
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-subtext-primary">Email Header Authentication Audit</h3>
                  <p className="text-xs text-subtext-muted">RFC 822/5322 Cryptographic Sender Verification</p>
                </div>
              </div>

              {/* Verdict Pill */}
              <div className="shrink-0">
                {headerInfo.verdict === 'SPOOFED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>SPOOFED SENDER DETECTED</span>
                  </span>
                ) : headerInfo.verdict === 'LEGITIMATE' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-accent border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>LEGITIMATE SENDER VERIFIED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>UNALIGNED / PARTIAL</span>
                  </span>
                )}
              </div>
            </div>

            {/* Sender Header Data */}
            {headerInfo.from && headerInfo.from.email && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-obsidian-subtle p-3 rounded-xl border border-border-subtle/50 font-mono">
                <div>
                  <span className="text-subtext-muted font-sans font-medium">Claimed Sender (From): </span>
                  <span className="text-subtext-primary font-semibold">{headerInfo.from.email}</span>
                </div>
                {headerInfo.returnPath && headerInfo.returnPath.email && (
                  <div>
                    <span className="text-subtext-muted font-sans font-medium">Return-Path: </span>
                    <span className={headerInfo.returnPath.domain !== headerInfo.from.domain ? 'text-amber-400 font-semibold' : 'text-subtext-primary font-semibold'}>
                      {headerInfo.returnPath.email}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SPF / DKIM / DMARC Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SPF */}
              <div className="p-3.5 rounded-xl bg-obsidian-subtle border border-border-subtle/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-subtext-primary">SPF Record</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    headerInfo.spf.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-accent border border-emerald-500/30'
                      : headerInfo.spf.status === 'FAIL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-surface-hover text-subtext-muted'
                  }`}>
                    {headerInfo.spf.status}
                  </span>
                </div>
                <p className="text-[11px] text-subtext-muted leading-relaxed">{headerInfo.spf.details}</p>
              </div>

              {/* DKIM */}
              <div className="p-3.5 rounded-xl bg-obsidian-subtle border border-border-subtle/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-subtext-primary">DKIM Signature</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    headerInfo.dkim.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-accent border border-emerald-500/30'
                      : headerInfo.dkim.status === 'FAIL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-surface-hover text-subtext-muted'
                  }`}>
                    {headerInfo.dkim.status}
                  </span>
                </div>
                <p className="text-[11px] text-subtext-muted leading-relaxed">{headerInfo.dkim.details}</p>
              </div>

              {/* DMARC */}
              <div className="p-3.5 rounded-xl bg-obsidian-subtle border border-border-subtle/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-subtext-primary">DMARC Policy</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    headerInfo.dmarc.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-accent border border-emerald-500/30'
                      : headerInfo.dmarc.status === 'FAIL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-surface-hover text-subtext-muted'
                  }`}>
                    {headerInfo.dmarc.status}
                  </span>
                </div>
                <p className="text-[11px] text-subtext-muted leading-relaxed">{headerInfo.dmarc.details}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Risk Score & Categories Card */}
        {content.trim() && (
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${report.badgeBg} ${report.badgeColor}`}>
                    {report.riskLevel}
                  </span>
                </div>
                <p className="text-sm font-medium text-subtext-primary">{report.summary}</p>
                {report.categories?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {report.categories.map((cat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-hover border border-border-subtle text-[11px] font-medium text-emerald-accent">
                        <Tag className="w-3 h-3" />
                        <span>{cat}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-subtext-muted">Phishing Threat Score</span>
                <p className="text-3xl font-extrabold text-subtext-primary font-mono">
                  <span className={scoreTheme.text}>{report.score}</span>
                  <span className="text-xs font-sans font-normal text-subtext-muted"> / 100</span>
                </p>
              </div>
            </div>

            {/* Threat Meter */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-obsidian-subtle rounded-full overflow-hidden p-0.5 border border-border-subtle">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(report.score, 4)}%` }}
                  transition={{ duration: 0.4 }}
                  className={`h-full rounded-full ${scoreTheme.bg}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-subtext-muted font-mono">
                <span>0 (Legitimate)</span>
                <span>50 (Suspicious)</span>
                <span>100 (Critical Phish)</span>
              </div>
            </div>
          </div>
        )}

        {/* Findings List */}
        {content.trim() && report.findings.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              Identified Threat Findings ({report.findings.length})
            </p>
            <div className="space-y-2.5">
              {report.findings.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs ${
                    item.type === 'danger'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : item.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}
                >
                  {item.type === 'danger' ? (
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : item.type === 'success' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-accent shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-subtext-primary">{item.title}</p>
                    <p className="text-subtext-secondary mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deep AI Report Output */}
        {deepAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-emerald-dim border border-border-glow space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
                <Sparkles className="w-4 h-4" />
                <span>Deep AI Phishing Intelligence Report</span>
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



