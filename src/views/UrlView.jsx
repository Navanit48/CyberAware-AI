import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { analyzeUrl } from '../lib/url-checker';
import { askCyberAwareAI } from '../lib/gemini';

export default function UrlView({ onNavigateToEmail }) {
  const [urlInput, setUrlInput] = useState('');
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const heuristic = analyzeUrl(urlInput);

  const handleDeepScan = async () => {
    if (!urlInput.trim() || isScanning) return;
    setIsScanning(true);
    setDeepAnalysis(null);

    const prompt = `Perform a deep cybersecurity threat inspection on this domain/URL: "${urlInput}".
Evaluate:
1. Phishing & Brand Spoofing Risks
2. SSL/TLS Certificate & Transport Security
3. Domain Age & Registrar Anomalies
4. Recommendation on whether users should visit or input credentials.`;

    const res = await askCyberAwareAI(prompt);
    setIsScanning(false);
    if (res.success) {
      setDeepAnalysis(res.text);
    } else {
      setDeepAnalysis("Unable to reach AI deep scan servers. Rely on local heuristic indicators below.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
          <Globe className="w-3.5 h-3.5" />
          <span>Real-time Domain & URL Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">URL Safety Checker</h1>
        <p className="text-sm text-subtext-secondary">
          Detect phishing links, credential harvesting scams, obfuscated URLs, and high-risk TLDs.
        </p>
      </div>

      {/* URL Input Box */}
      <div className="frosted-glass-card p-6 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
            Enter Domain or Web Address
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://secure-login.bank.com or my-website.org"
              className="flex-1 bg-obsidian-subtle border border-border-subtle focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/20 rounded-2xl px-5 py-4 text-subtext-primary text-base placeholder-subtext-muted outline-none transition-all font-mono"
            />
            <button
              onClick={handleDeepScan}
              disabled={!urlInput.trim() || isScanning}
              className={`px-6 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shrink-0 ${
                urlInput.trim() && !isScanning
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
                  <span>AI Deep Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Address Special Redirect Warning */}
        {heuristic.isEmail && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-subtext-primary">Email Address Input Detected</p>
                <p className="text-subtext-secondary">You entered an email address instead of a web URL.</p>
              </div>
            </div>
            {onNavigateToEmail && (
              <button
                onClick={onNavigateToEmail}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-semibold text-amber-600 dark:text-amber-300 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Go to Email Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Risk Level Badge */}
        {urlInput.trim() && !heuristic.isEmail && (
          <div className="p-5 rounded-2xl bg-surface-hover/60 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${heuristic.badgeBg} ${heuristic.badgeColor}`}>
                  {heuristic.riskLevel}
                </span>
                <span className="text-xs text-subtext-muted font-mono">{heuristic.hostname}</span>
              </div>
              <p className="text-sm font-medium text-subtext-primary">{heuristic.summary}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-subtext-muted">Threat Score</span>
              <p className="text-2xl font-bold text-subtext-primary font-mono">{heuristic.score} <span className="text-xs font-sans font-normal text-subtext-muted">/ 100</span></p>
            </div>
          </div>
        )}

        {/* Heuristic Signals List */}
        {urlInput.trim() && heuristic.signals.length > 0 && !heuristic.isEmail && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              Heuristic Inspection Signals
            </p>
            <div className="space-y-2">
              {heuristic.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs ${
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
                  <div>
                    <p className="font-semibold text-subtext-primary">{sig.title}</p>
                    <p className="text-subtext-secondary mt-0.5">{sig.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Deep Inspection Output */}
        {deepAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-emerald-dim border border-border-glow space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
              <Sparkles className="w-4 h-4" />
              <span>AI Security Intelligence Report</span>
            </div>
            <div className="text-xs text-subtext-primary leading-relaxed whitespace-pre-wrap">
              {deepAnalysis}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
