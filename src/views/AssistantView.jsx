import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Copy, Check, Trash2, Bot, User, Sparkles } from 'lucide-react';
import FloatingChat from '../components/FloatingChat';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function AssistantView({ 
  messages, 
  onSendMessage, 
  isAsking, 
  onClearMessages 
}) {
  const messagesEndRef = useRef(null);
  const [copiedId, setCopiedId] = React.useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col justify-between max-w-4xl mx-auto px-6 py-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-dim border border-border-glow flex items-center justify-center text-emerald-accent">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-subtext-primary">AI Security Assistant</h2>
            <p className="text-xs text-subtext-muted">CyberAware Intelligence Engine</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle hover:border-red-500/30 text-xs text-subtext-muted hover:text-red-500 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto my-6 pr-2 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-subtext-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-center text-emerald-accent shadow-glass-smooth">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-subtext-primary">How can I protect you today?</h3>
              <p className="text-sm max-w-sm mx-auto text-subtext-secondary">
                Ask any cybersecurity question, check website safety, analyze phishing emails, or get password advice.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-emerald-dim border border-border-glow flex items-center justify-center text-emerald-accent shrink-0 mt-1">
                  <Shield className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed relative group ${
                  msg.sender === 'user'
                    ? 'bg-emerald-dim border border-border-glow text-subtext-primary rounded-br-sm'
                    : 'bg-surface-card border border-border-subtle text-subtext-primary rounded-bl-sm shadow-glass-smooth'
                }`}
              >
                {/* Formatted Markdown Content */}
                {msg.sender === 'ai' ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}

                {/* Key Takeaways Card if available */}
                {msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-surface-hover/60 border border-border-glow space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-accent">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Key Security Rules</span>
                    </div>
                    <ul className="space-y-1 text-xs text-subtext-secondary list-disc list-inside">
                      {msg.keyTakeaways.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer timestamp & copy button */}
                <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-subtext-muted">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:text-subtext-primary transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-accent" />
                          <span className="text-emerald-accent">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center text-subtext-primary shrink-0 mt-1">
                  <User className="w-4 h-4 text-emerald-accent" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* 3 Animated Dots Typing Indicator */}
        <AnimatePresence>
          {isAsking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-dim border border-border-glow flex items-center justify-center text-emerald-accent shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="bg-surface-card border border-border-subtle px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Chat Dock */}
      <div className="pt-2">
        <FloatingChat 
          onSendMessage={onSendMessage} 
          isAsking={isAsking} 
          showSuggestions={messages.length === 0} 
        />
      </div>
    </div>
  );
}
