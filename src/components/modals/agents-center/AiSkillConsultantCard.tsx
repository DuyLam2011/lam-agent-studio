import React, { useState } from 'react';
import { Sparkles, Check, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { AiSkillRecommendation } from '../../../types/skills';
import clsx from 'clsx';

interface AiSkillConsultantCardProps {
  rec: AiSkillRecommendation;
  onAdopt: (rec: AiSkillRecommendation) => Promise<void>;
  isAdopted: boolean;
}

export const AiSkillConsultantCard: React.FC<AiSkillConsultantCardProps> = ({ rec, onAdopt, isAdopted }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdoptClick = async () => {
    setLoading(true);
    try {
      await onAdopt(rec);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-200">{rec.name}</span>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono uppercase">
              {rec.category}
            </span>
            <span className="text-[9px] text-gray-500 font-mono">
              {rec.folderName}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
            {rec.description}
          </p>
        </div>

        <button
          onClick={handleAdoptClick}
          disabled={isAdopted || loading}
          className={clsx(
            "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0",
            isAdopted
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
          )}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : (isAdopted ? <Check size={12} /> : <Download size={12} />)}
          <span>{isAdopted ? 'Installed' : 'Adopt Skill'}</span>
        </button>
      </div>

      {/* AI Rationale / Advice Pill */}
      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200 flex items-start gap-2">
        <Sparkles size={13} className="text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-purple-300">AI Advice: </span>
          <span className="text-gray-300 leading-relaxed">{rec.rationale}</span>
        </div>
      </div>

      {/* Toggle Preview Button */}
      <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[10px]">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>{showPreview ? 'Hide SKILL.md Preview' : 'Preview SKILL.md Blueprint'}</span>
          {showPreview ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {showPreview && (
        <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] text-gray-300 font-mono overflow-x-auto max-h-40 custom-scrollbar leading-relaxed">
          {rec.suggestedContent}
        </pre>
      )}
    </div>
  );
};
