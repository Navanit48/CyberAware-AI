import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, AlertTriangle, ShieldAlert, ShieldCheck, Sparkles, FileSearch } from 'lucide-react';
import { analyzeEmail } from '../lib/email-analyzer';
import { askCyberAwareAI } from '../lib/gemini';

export default function EmailView() {
  const [content, setContent] = useState('');
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const report = analyzeEmail(content);

  const handleDeepScan = async () => {
    if (!content.trim() || isScanning) return;
    setIsScanning(true);
    setDeepAnalysis(null);

    const prompt = `Analyze this email for phishing, social engineering, credential harvesting, or spoofing tactics:
"""
${content}
"""

Provide a structured report:
1. Threat Level (Safe / Suspicious / Malicious)
2. Identified Red Flags & Manipulative Language
3. Technical Indicators (Sender Spoofing, Link Anomalies)
4. Recommended Actions for the Receiver.`;

    const res = await askCyberAwareAI(prompt);
    setIsScanning(false);
    if (res.success) {
      setDeepAnalysis(res.text);
    } else {
      setDeepAnalysis("Unable to connect to AI server. Review local heuristic findings below.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Phishing Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">Email Phishing Scanner</h1>
        <p className="text-sm text-subtext-secondary">
          Paste suspicious emails, headers, or messages to detect social engineering, urgency manipulation, and credential scams.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="frosted-glass-card p-6 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
            Email Message Content or Headers
          </label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste full email text, subject line, or sender headers here..."
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
                <span>Scan Email with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Risk Score Badge */}
        {content.trim() && (
          <div className="p-5 rounded-2xl bg-surface-hover/60 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${report.badgeBg} ${report.badgeColor}`}>
                  {report.riskLevel}
                </span>
              </div>
              <p className="text-sm font-medium text-subtext-primary">{report.summary}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-subtext-muted">Phishing Threat Score</span>
              <p className="text-2xl font-bold text-subtext-primary font-mono">{report.score} <span className="text-xs font-sans font-normal text-subtext-muted">/ 100</span></p>
            </div>
          </div>
        )}

        {/* Findings List */}
        {content.trim() && report.findings.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
              Identified Threat Findings
            </p>
            <div className="space-y-2">
              {report.findings.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs ${
                    item.type === 'danger'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}
                >
                  {item.type === 'danger' ? (
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-subtext-primary">{item.title}</p>
                    <p className="text-subtext-secondary mt-0.5">{item.desc}</p>
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
            className="p-5 rounded-2xl bg-emerald-dim border border-border-glow space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
              <Sparkles className="w-4 h-4" />
              <span>Deep AI Phishing Report</span>
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
