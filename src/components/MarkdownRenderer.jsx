import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-content text-sm leading-relaxed space-y-3">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-subtext-primary tracking-tight mt-4 mb-2 pb-1 border-b border-border-subtle">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-subtext-primary tracking-tight mt-4 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-emerald-accent tracking-tight mt-3 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
              <span>{children}</span>
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-subtext-primary text-sm leading-relaxed mb-2">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-subtext-primary bg-emerald-dim text-emerald-accent px-1.5 py-0.5 rounded border border-border-glow">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-3 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 my-3 pl-5 text-subtext-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2.5 text-sm text-subtext-primary leading-relaxed">
              <span className="text-emerald-accent font-bold mt-0.5 shrink-0">•</span>
              <div className="flex-1">{children}</div>
            </li>
          ),
          hr: () => (
            <hr className="border-border-subtle my-4" />
          ),
          code: ({ inline, children }) => (
            inline ? (
              <code className="bg-surface-hover border border-border-subtle text-emerald-accent px-1.5 py-0.5 rounded font-mono text-xs">
                {children}
              </code>
            ) : (
              <pre className="bg-surface-dark border border-border-subtle p-4 rounded-xl overflow-x-auto text-xs font-mono text-emerald-accent my-3">
                <code>{children}</code>
              </pre>
            )
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-accent pl-4 py-1 italic text-subtext-secondary my-3 bg-emerald-dim rounded-r-lg">
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
