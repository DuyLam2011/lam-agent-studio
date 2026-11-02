import React from 'react';
import { DOMElementInspection } from '../../types/browser';
import { Crosshair, Plus, Sparkles, X, Copy, Check } from 'lucide-react';

interface BrowserElementInspectorDrawerProps {
  element: DOMElementInspection;
  onClose: () => void;
  onAddToChat: (el: DOMElementInspection) => void;
  onAskAiToFix: (el: DOMElementInspection) => void;
}

export const BrowserElementInspectorDrawer: React.FC<BrowserElementInspectorDrawerProps> = ({
  element,
  onClose,
  onAddToChat,
  onAskAiToFix
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopySelector = () => {
    navigator.clipboard.writeText(element.selector);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface-card border-t border-white/10 p-3 space-y-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Crosshair size={13} className="text-sky-400 shrink-0" />
          <span className="font-mono font-semibold text-gray-200 truncate">{element.selector}</span>
          <button
            type="button"
            onClick={handleCopySelector}
            className="p-1 text-gray-400 hover:text-white rounded"
            title="Copy CSS Selector"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded"
          title="Close Inspector"
        >
          <X size={12} />
        </button>
      </div>

      {/* Element Properties Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
        <div className="p-2 rounded bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="text-[9px] uppercase tracking-wider text-app-muted">Bounding Box</div>
          <div className="text-gray-300">
            {element.boundingBox.width}px × {element.boundingBox.height}px
          </div>
          <div className="text-gray-500 text-[9.5px]">
            pos: ({element.boundingBox.x}, {element.boundingBox.y})
          </div>
        </div>

        <div className="p-2 rounded bg-white/[0.03] border border-white/5 space-y-0.5">
          <div className="text-[9px] uppercase tracking-wider text-app-muted">Key Styles</div>
          <div className="text-gray-300 truncate">
            display: {element.computedStyles.display || 'block'}
          </div>
          <div className="text-gray-500 text-[9.5px] truncate">
            font: {element.computedStyles.fontSize || '14px'}
          </div>
        </div>
      </div>

      {element.textContent && (
        <div className="text-[10.5px] font-mono text-gray-300 bg-white/[0.02] p-1.5 rounded border border-white/5 truncate">
          <span className="text-gray-500">Text: </span>"{element.textContent}"
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAddToChat(element)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors"
        >
          <Plus size={12} />
          <span>Add to Chat Context</span>
        </button>

        <button
          type="button"
          onClick={() => onAskAiToFix(element)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Sparkles size={12} />
          <span>Ask AI to Fix</span>
        </button>
      </div>
    </div>
  );
};
