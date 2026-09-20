import React, { useState } from 'react';
import { Settings, Server, Trash2, Info } from 'lucide-react';

export default function SettingsView({ 
  onClearHistory 
}) {
  const [proxyStatus, setProxyStatus] = useState('unknown');
  const [isTestingProxy, setIsTestingProxy] = useState(false);

  const testProxyConnection = async () => {
    setIsTestingProxy(true);
    try {
      const res = await fetch('/api/ibm', { method: 'OPTIONS' });
      if (res.ok || res.status === 204) {
        setProxyStatus('online');
      } else {
        setProxyStatus('error');
      }
    } catch {
      setProxyStatus('offline');
    }
    setIsTestingProxy(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-dim border border-border-glow text-xs text-emerald-accent font-medium">
          <Settings className="w-3.5 h-3.5" />
          <span>System Preferences & Configuration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-subtext-primary tracking-tight">Application Settings</h1>
        <p className="text-sm text-subtext-secondary">
          Test local proxy server connectivity and manage local storage preferences.
        </p>
      </div>

      {/* Local Proxy Status */}
      <div className="frosted-glass-card p-6 rounded-3xl space-y-4 border border-border-subtle shadow-glass-smooth">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-hover border border-border-subtle flex items-center justify-center text-emerald-accent">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-subtext-primary">Local Proxy Status</h3>
              <p className="text-xs text-subtext-muted">Node.js server listening on port 3000 forwarding to /api/ibm</p>
            </div>
          </div>

          <button
            onClick={testProxyConnection}
            disabled={isTestingProxy}
            className="px-4 py-2 rounded-xl bg-surface-card border border-border-subtle hover:border-border-glow text-xs font-semibold text-subtext-primary transition-all cursor-pointer"
          >
            {isTestingProxy ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {proxyStatus !== 'unknown' && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
            proxyStatus === 'online'
              ? 'bg-emerald-dim border-border-glow text-emerald-accent'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}>
            <Info className="w-4 h-4" />
            <span>
              {proxyStatus === 'online'
                ? 'Proxy Server is ONLINE and operational on http://localhost:3000.'
                : 'Proxy Server unreachable. AI client will fallback to direct cloud endpoint.'}
            </span>
          </div>
        )}
      </div>

      {/* Clear Storage */}
      <div className="frosted-glass-card p-6 rounded-3xl space-y-4 border border-border-subtle shadow-glass-smooth flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-subtext-primary">Reset Local Session</h3>
            <p className="text-xs text-subtext-muted">Clear stored conversation history and reset active tabs.</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
        >
          Clear History
        </button>
      </div>
    </div>
  );
}
