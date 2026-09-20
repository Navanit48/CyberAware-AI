import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldAlert, Lock, Smartphone, Wifi, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { LOCAL_KNOWLEDGE_BASE } from '../lib/knowledge-base';

const MODULES = [
  { id: 'phishing', label: 'Phishing Attacks', icon: ShieldAlert, data: LOCAL_KNOWLEDGE_BASE.phishing },
  { id: 'password', label: 'Password Entropy', icon: Lock, data: LOCAL_KNOWLEDGE_BASE.password },
  { id: 'mfa', label: '2FA & Authentication', icon: Smartphone, data: LOCAL_KNOWLEDGE_BASE.mfa },
  { id: 'ransomware', label: 'Ransomware Defense', icon: ShieldAlert, data: LOCAL_KNOWLEDGE_BASE.ransomware },
  { id: 'wifi', label: 'Public Wi-Fi Security', icon: Wifi, data: LOCAL_KNOWLEDGE_BASE.wifi },
  { id: 'social', label: 'Social Engineering', icon: Users, data: LOCAL_KNOWLEDGE_BASE.social_engineering },
];

export default function LearnView({ onAskQuestion }) {
  const [selectedId, setSelectedId] = useState('phishing');
  const currentModule = MODULES.find(m => m.id === selectedId) || MODULES[0];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interactive Cyber Awareness Hub</span>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">Security Education Modules</h1>
        <p className="text-sm text-subtext-secondary">
          Master core defensive cybersecurity concepts through structured guides and actionable countermeasures.
        </p>
      </div>

      {/* Module Selector Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = selectedId === mod.id;
          return (
            <motion.button
              key={mod.id}
              onClick={() => setSelectedId(mod.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-dim border-border-glow text-emerald-accent shadow-emerald-soft font-semibold'
                  : 'bg-surface-card border-border-subtle text-subtext-secondary hover:text-subtext-primary hover:border-border-glow'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? 'bg-emerald-accent text-slate-950 font-bold' : 'bg-obsidian-subtle border border-border-subtle text-subtext-muted'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{mod.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Active Module Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentModule.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="frosted-glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-border-subtle shadow-glass-smooth"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-subtext-primary">{currentModule.data.title}</h2>
            <p className="text-sm text-subtext-secondary leading-relaxed">{currentModule.data.summary}</p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-hover/60 border border-border-glow space-y-3">
            <h3 className="text-xs font-semibold text-emerald-accent uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Core Defense Guidelines</span>
            </h3>
            <ul className="space-y-2 text-xs text-subtext-primary">
              {currentModule.data.keyTakeaways.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 text-xs text-subtext-secondary leading-relaxed">
            <h4 className="font-semibold text-subtext-primary text-xs">Deep Technical Context</h4>
            <p>{currentModule.data.details}</p>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <button
              onClick={() => onAskQuestion && onAskQuestion(`Explain ${currentModule.label} in detail and how to protect myself.`)}
              className="px-5 py-2.5 rounded-xl bg-emerald-accent text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-emerald-pill hover:bg-emerald-hover transition-all cursor-pointer"
            >
              <span>Ask AI About This Topic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
