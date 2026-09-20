import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { analyzePassword, generateSecurePassword } from '../lib/password-checker';

export default function PasswordView() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const result = analyzePassword(password);

  const handleGenerate = () => {
    const newPw = generateSecurePassword(16);
    setPassword(newPw);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Entropy & Cryptographic Strength</span>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">Password Strength Evaluator</h1>
        <p className="text-sm text-subtext-secondary">
          Analyze password complexity, entropy bits, and estimated crack times against brute-force attacks.
        </p>
      </div>

      {/* Input Card */}
      <div className="frosted-glass-card p-6 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
            Enter Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type or generate a password..."
              className="w-full bg-obsidian-subtle border border-border-subtle focus:border-emerald-accent/50 focus:ring-2 focus:ring-emerald-accent/20 rounded-2xl px-5 py-4 text-subtext-primary text-base placeholder-subtext-muted outline-none pr-28 transition-all font-mono"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-subtext-muted hover:text-subtext-primary transition-colors rounded-xl cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="p-2 text-emerald-accent hover:bg-emerald-dim rounded-xl transition-all cursor-pointer"
                title="Generate secure password"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Strength Meter Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-subtext-secondary">Overall Strength</span>
            <span className={result.color}>{result.label} ({result.score}%)</span>
          </div>
          <div className="w-full h-2.5 bg-obsidian-subtle rounded-full overflow-hidden p-0.5 border border-border-subtle">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 0.4 }}
              className={`h-full rounded-full ${result.bgBar}`}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border-subtle space-y-1">
            <p className="text-xs text-subtext-muted">Cryptographic Entropy</p>
            <p className="text-2xl font-bold text-subtext-primary font-mono">
              {result.entropyBits} <span className="text-xs text-emerald-accent font-sans">bits</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border-subtle space-y-1">
            <p className="text-xs text-subtext-muted">Estimated Brute-Force Crack Time</p>
            <p className="text-2xl font-bold text-subtext-primary font-mono">{result.crackTime}</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <p className="text-xs font-semibold text-subtext-secondary uppercase tracking-wider">
            Complexity Requirements
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries({
              '12+ Characters': result.checks.length,
              'Uppercase (A-Z)': result.checks.uppercase,
              'Lowercase (a-z)': result.checks.lowercase,
              'Numbers (0-9)': result.checks.numbers,
              'Symbols (!@#$)': result.checks.symbols,
            }).map(([label, checked]) => (
              <div
                key={label}
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  checked
                    ? 'bg-emerald-dim border-border-glow text-emerald-accent'
                    : 'bg-surface-hover/40 border-border-subtle text-subtext-muted'
                }`}
              >
                {checked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-accent shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-subtext-muted shrink-0" />
                )}
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 rounded-2xl bg-emerald-dim border border-border-glow space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent">
            <Sparkles className="w-4 h-4" />
            <span>Security Recommendations</span>
          </div>
          <ul className="space-y-1 text-xs text-subtext-secondary list-disc list-inside">
            {result.suggestions.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
