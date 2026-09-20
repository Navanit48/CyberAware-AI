import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Bot, 
  Lock, 
  Globe, 
  Mail, 
  BookOpen, 
  BrainCircuit,
  Settings, 
  Shield, 
  Users,
  ChevronUp
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'password', label: 'Password Strength', icon: Lock },
  { id: 'url', label: 'URL Safety Checker', icon: Globe },
  { id: 'email', label: 'Email Analyzer', icon: Mail },
  { id: 'quiz', label: 'Cyber Quiz', icon: BrainCircuit },
  { id: 'learn', label: 'Security Learn', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Navanit Merla', initial: 'NM' },
  { id: 2, name: 'Nithin Praveen', initial: 'NP' },
  { id: 3, name: 'Rohan Reddy', initial: 'RR' },
  { id: 4, name: 'Akash S', initial: 'AS' },
  { id: 5, name: 'PJ Prem Jesuraj', initial: 'PJ' }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [showTeam, setShowTeam] = useState(false);

  return (
    <aside className="w-[260px] h-screen flex-shrink-0 flex flex-col frosted-glass border-r border-border-subtle z-30 select-none bg-surface-glass backdrop-blur-2xl">
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

      {/* Footer Team Info & Version */}
      <div className="p-4 space-y-3 border-t border-border-subtle bg-obsidian-subtle/40 relative">
        {/* Team Hover Card Trigger */}
        <div
          className="relative"
          onMouseEnter={() => setShowTeam(true)}
          onMouseLeave={() => setShowTeam(false)}
        >
          {/* Smooth Hover Popup */}
          <AnimatePresence>
            {showTeam && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full left-0 right-0 mb-2 p-3.5 rounded-2xl bg-surface-card border border-border-glow shadow-glass-smooth space-y-2.5 backdrop-blur-2xl z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/80">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-accent" />
                    <span className="text-xs font-bold text-subtext-primary">Team Members</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-dim border border-border-glow text-[10px] font-semibold text-emerald-accent">
                    5 Members
                  </span>
                </div>

                <div className="space-y-1.5">
                  {TEAM_MEMBERS.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-surface-hover/80 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-dim border border-border-glow flex items-center justify-center text-[10px] font-bold text-emerald-accent shrink-0">
                        {member.id}
                      </div>
                      <span className="text-xs font-medium text-subtext-primary truncate">
                        {member.name}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Team LinkedIn Park Card Button */}
          <div className="p-2.5 rounded-2xl bg-surface-card border border-border-subtle hover:border-emerald-accent/40 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-dim border border-border-glow flex items-center justify-center text-xs font-bold text-emerald-accent shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4 text-emerald-accent" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-subtext-primary truncate group-hover:text-emerald-accent transition-colors">
                  Team LinkedIn Park
                </p>
                <p className="text-[11px] text-subtext-muted truncate">
                  Hover to view team
                </p>
              </div>
            </div>

            <ChevronUp className={`w-3.5 h-3.5 text-subtext-muted transition-transform duration-200 shrink-0 ${showTeam ? 'rotate-180 text-emerald-accent' : 'group-hover:text-subtext-primary'}`} />
          </div>
        </div>

        {/* Version */}
        <div className="px-2 pt-0.5 text-[10px] text-subtext-muted flex justify-between items-center">
          <span>v2.0.0</span>
          <span>© 2026 CyberAware AI</span>
        </div>
      </div>
    </aside>
  );
}
