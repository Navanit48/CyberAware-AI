import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  "What is phishing?",
  "Is this website safe?",
  "Generate a secure password",
  "Explain ransomware"
];

export default function FloatingChat({ onSendMessage, isAsking, showSuggestions = true }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isAsking) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (suggestionText) => {
    onSendMessage(suggestionText);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 relative z-20">
      {/* Suggestions floating ABOVE the chat input */}
      {showSuggestions && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {SUGGESTIONS.map((suggestion, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-full bg-surface-card border border-border-subtle hover:border-emerald-accent/40 text-xs text-subtext-secondary hover:text-subtext-primary backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-accent" />
                <span>{suggestion}</span>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating Glass Input Container */}
      <form
        onSubmit={handleSubmit}
        className="w-full frosted-glass-card rounded-full p-2 pl-5 flex items-center gap-3 border border-border-subtle hover:border-border-glow shadow-glass-smooth focus-within:border-emerald-accent/50 focus-within:ring-2 focus-within:ring-emerald-accent/20 transition-all"
      >
        {/* Attachment Button */}
        <button
          type="button"
          title="Attach file"
          aria-label="Attach file"
          className="p-2 text-subtext-muted hover:text-subtext-primary transition-colors rounded-full hover:bg-surface-hover shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input Textarea / Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about cybersecurity..."
          disabled={isAsking}
          className="flex-1 bg-transparent text-sm text-subtext-primary placeholder-subtext-muted outline-none border-none focus:outline-none"
        />

        {/* Keyboard shortcut hint */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-hover border border-border-subtle text-[10px] text-subtext-muted font-mono">
          <span>⌘ ↵ to send</span>
        </div>

        {/* Voice Input Button */}
        <button
          type="button"
          title="Voice input"
          aria-label="Voice input"
          className="p-2 text-subtext-muted hover:text-subtext-primary transition-colors rounded-full hover:bg-surface-hover shrink-0"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!input.trim() || isAsking}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Send message"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
            input.trim() && !isAsking
              ? 'bg-emerald-accent text-slate-950 shadow-emerald-pill font-bold cursor-pointer'
              : 'bg-surface-hover text-subtext-muted cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
