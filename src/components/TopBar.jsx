import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function TopBar({ 
  theme, 
  setTheme 
}) {
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
