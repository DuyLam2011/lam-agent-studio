import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Code2 } from 'lucide-react';
import { openFileInEditor } from '../../../services/workspaceFileService';

interface MarkdownMessageBodyProps {
  content: string;
  /** Smaller, dimmed rendering used for reasoning traces. */
  compact?: boolean;
}

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/50 overflow-hidden font-mono text-[11px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/5 text-[10px] text-gray-400">
        <span className="uppercase font-semibold tracking-wider text-cyan-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Copy snippet"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto custom-scrollbar text-gray-200 whitespace-pre leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const MarkdownMessageBody: React.FC<MarkdownMessageBodyProps> = React.memo(({ content, compact }) => {
  return (
    <div className={compact
      ? 'select-text font-normal text-app-text text-[11.5px] leading-relaxed break-words space-y-1 opacity-75'
      : 'select-text font-normal text-app-text text-[12.5px] leading-relaxed break-words space-y-2'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-2.5 mb-1 flex items-center gap-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-bold text-amber-300 mt-2 mb-1 flex items-center gap-1.5 tracking-wide">{children}</h3>,
          h4: ({ children }) => <h4 className="text-xs font-semibold text-gray-200 mt-1.5 mb-0.5">{children}</h4>,
          p: ({ children }) => <p className="my-1.5 leading-relaxed text-gray-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-1.5 space-y-1 text-gray-300 marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5 space-y-1 text-gray-300 marker:text-amber-400">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => <hr className="border-white/10 my-3" />,
          blockquote: ({ children }) => {
            const raw = React.Children.toArray(children).map(c => typeof c === 'string' ? c : (c as any)?.props?.children).flat().join('');
            const isCaution = /\[!(?:CAUTION|WARNING)\]|SAFEGUARD/i.test(raw);
            const isImportant = /\[!IMPORTANT\]|YÊU CẦU HÀNH ĐỘNG|ACTION REQUIRED/i.test(raw);
            if (isCaution) {
              return (
                <div className="border-l-4 border-rose-500 bg-rose-500/10 p-3 my-2.5 rounded-r-xl text-rose-200 text-xs shadow-sm not-italic">
                  {children}
                </div>
              );
            }
            if (isImportant) {
              return (
                <div className="border-l-4 border-amber-500 bg-amber-500/10 p-3 my-2.5 rounded-r-xl text-amber-200 text-xs shadow-sm not-italic">
                  {children}
                </div>
              );
            }
            return (
              <blockquote className="border-l-2 border-primary/60 bg-white/[0.02] pl-3 py-1 my-2 text-gray-400 italic rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto custom-scrollbar rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse bg-black/30">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.06] border-b border-white/10 text-gray-300 font-semibold">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-b border-white/5 text-gray-300 text-[11px] font-mono">{children}</td>,
          a: ({ href, children }) => {
            if (href && href.startsWith('file://')) {
              const cleanPath = decodeURIComponent(href.replace(/^file:\/\/\/?/, '')).split('#')[0];
              const filePath = cleanPath.includes(':') ? cleanPath : `/${cleanPath}`;
              const lineMatch = /#L?(\d+)/i.exec(href);
              const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openFileInEditor(filePath, undefined, line);
                  }}
                  className="text-cyan-300 hover:text-cyan-200 underline font-mono text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  title={`Open in Editor: ${filePath}`}
                >
                  <Code2 size={11} className="shrink-0" />
                  <span>{children}</span>
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                {children}
              </a>
            );
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 border border-white/10">
                  {children}
                </code>
              );
            }
            const codeString = String(children).replace(/\n$/, '');
            return <CodeBlock language={match?.[1]} value={codeString} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
MarkdownMessageBody.displayName = 'MarkdownMessageBody';
