import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Globe, Mail, BrainCircuit, ShieldAlert, ChevronRight } from 'lucide-react';

const ACTIONS = [
  { id: 'password', label: 'Check Password', icon: ShieldCheck },
  { id: 'url', label: 'Analyze Website', icon: Globe },
  { id: 'email', label: 'Scan Email', icon: Mail },
  { id: 'quiz', label: 'Cyber Quiz', icon: BrainCircuit },
  { id: 'learn', label: 'Learn Phishing', icon: ShieldAlert },
];

export default function QuickActions({ onSelectAction }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3.5 my-8 z-10 relative">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            onClick={() => onSelectAction(action.id)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-surface-card border border-border-subtle hover:border-emerald-accent/50 text-sm font-medium text-subtext-primary hover:text-emerald-accent shadow-sm backdrop-blur-md group transition-all"
          >
            <Icon className="w-4 h-4 text-emerald-accent transition-transform group-hover:scale-110" />
            <span>{action.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-subtext-muted group-hover:text-emerald-accent group-hover:translate-x-0.5 transition-all" />
          </motion.button>
        );
      })}
    </div>
  );
}
