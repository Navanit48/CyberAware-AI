import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Bot, 
  Lock, 
  Globe, 
  Mail, 
  BookOpen, 
  Settings, 
  Shield, 
  Award 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'password', label: 'Password Strength', icon: Lock },
  { id: 'url', label: 'URL Safety Checker', icon: Globe },
  { id: 'email', label: 'Email Analyzer', icon: Mail },
  { id: 'learn', label: 'Security Learn', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-[260px] h-screen sticky top-0 flex flex-col frosted-glass border-r border-border-subtle z-30 select-none bg-surface-glass backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center text-emerald-accent shadow-emerald-soft">
          <Shield className="w-5 h-5 text-emerald-accent" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-subtext-primary flex items-center gap-1.5">
            CyberAware <span className="text-emerald-accent font-bold">AI</span>
          </h1>
          <p className="text-xs text-subtext-muted">Stay Safe Online</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-accent bg-emerald-dim border border-border-glow shadow-emerald-soft'
                  : 'text-subtext-secondary hover:text-subtext-primary hover:bg-surface-hover border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-accent' : 'text-subtext-muted'}`} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activePillGlow"
                  className="absolute left-0 w-1 h-5 bg-emerald-accent rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer Badges & Developer Info */}
      <div className="p-4 space-y-3 border-t border-border-subtle bg-obsidian-subtle/40">
        {/* IBM SkillsBuild Badge */}
        <div className="p-3 rounded-xl bg-surface-card border border-border-subtle flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-subtext-primary truncate">IBM SkillsBuild</p>
            <p className="text-[11px] text-subtext-muted truncate">AI for Impact</p>
          </div>
        </div>

        {/* Developer Profile */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-8 h-8 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center text-xs font-bold text-emerald-accent">
            N
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-subtext-primary truncate">Navanit Merla</p>
            <p className="text-[11px] text-subtext-muted truncate">Developer</p>
          </div>
        </div>

        {/* Version */}
        <div className="px-2 pt-1 text-[10px] text-subtext-muted flex justify-between items-center">
          <span>v2.0.0</span>
          <span>© 2026 CyberAware AI</span>
        </div>
      </div>
    </aside>
  );
}
