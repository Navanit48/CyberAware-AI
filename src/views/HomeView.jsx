import React from 'react';
import { motion } from 'framer-motion';
import PlanetHorizon from '../components/PlanetHorizon';
import QuickActions from '../components/QuickActions';
import FloatingChat from '../components/FloatingChat';

export default function HomeView({ onSelectAction, onSendMessage, isAsking }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center px-6 py-12 overflow-hidden">
      {/* Background Planet Horizon */}
      <PlanetHorizon />

      {/* Main Centered Hero Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center mt-12 mb-8 space-y-6">
        {/* Small Label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-card border border-border-subtle text-xs text-subtext-secondary font-medium tracking-wide uppercase backdrop-blur-md shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
          <span>A Safer Internet Starts Here</span>
        </motion.div>

        {/* Huge Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-subtext-primary leading-tight"
        >
          CyberAware <span className="text-emerald-accent">AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-subtext-secondary font-normal max-w-2xl mx-auto leading-relaxed"
        >
          Your intelligent cybersecurity assistant. Ask questions, verify websites, analyze passwords and stay protected.
        </motion.p>

        {/* Quick Actions Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <QuickActions onSelectAction={onSelectAction} />
        </motion.div>
      </div>

      {/* Bottom Floating Chat Dock */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full relative z-20 pb-4"
      >
        <FloatingChat 
          onSendMessage={onSendMessage} 
          isAsking={isAsking} 
          showSuggestions={true} 
        />
        <p className="text-[11px] text-center text-subtext-muted mt-3">
          CyberAware AI can make mistakes. Always verify important security information.
        </p>
      </motion.div>
    </div>
  );
}
