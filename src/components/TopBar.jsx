import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, ChevronDown, Sparkles, Check } from 'lucide-react';

const MODELS = [
  { id: 'gemini-3.6-flash', label: 'Gemini Flash', desc: 'Fast & Intelligent' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Deep Security Analysis' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Ultra Low Latency' },
];

export default function TopBar({ 
  selectedModel, 
  setSelectedModel, 
  theme, 
  setTheme 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModelObj = MODELS.find(m => m.id === selectedModel || m.label === selectedModel) || MODELS[0];

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <header className="h-16 px-8 flex items-center justify-end border-b border-border-subtle/40 bg-surface-glass backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-4 text-xs select-none">
        {/* AI Online status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 text-emerald-accent font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
          <span>AI Online</span>
        </div>

        {/* Model Selector Dropdown Pill */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-subtle hover:border-emerald-accent/40 text-subtext-primary font-medium transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-accent" />
            <span>{activeModelObj.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-subtext-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-emerald-accent' : ''}`} />
          </button>

          {/* Interactive Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-surface-card border border-border-subtle shadow-glass-smooth z-50 backdrop-blur-2xl space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-subtext-muted">
                Select Intelligence Engine
              </div>
              {MODELS.map((mod) => {
                const isSelected = activeModelObj.id === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setSelectedModel(mod.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-accent/10 text-emerald-accent font-semibold'
                        : 'text-subtext-primary hover:bg-surface-hover hover:text-subtext-primary'
                    }`}
                  >
                    <div>
                      <p className="text-xs">{mod.label}</p>
                      <p className="text-[10px] text-subtext-muted font-normal">{mod.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dark / Light Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-subtext-secondary hover:text-subtext-primary hover:border-emerald-accent/30 transition-all cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-emerald-accent" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>
      </div>
    </header>
  );
}
