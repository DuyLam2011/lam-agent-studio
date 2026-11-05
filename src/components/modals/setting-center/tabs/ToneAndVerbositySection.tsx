import React from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { COMMUNICATION_TONES, EXPLANATION_VERBOSITIES, CommunicationTone, ExplanationVerbosity } from '../../../../types/engine-style';
import { MessageSquare, Sliders, Zap } from 'lucide-react';
import clsx from 'clsx';

export const ToneAndVerbositySection: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const currentTone = engineSettings.communicationTone || 'executive';
  const currentVerbosity = engineSettings.explanationVerbosity || (currentTone === 'caveman' ? 'terse' : 'concise');

  const handleToneChange = (tone: CommunicationTone) => {
    const patch: Partial<typeof engineSettings> = { communicationTone: tone };
    if (tone === 'caveman') patch.explanationVerbosity = 'terse';
    updateEngineSettings(patch);
    if (tone === 'caveman') {
      addToast('Activated Caveman Mode: Ultra-compressed telegraphic speech (~75% token savings)', 'info');
    } else {
      addToast(`Selected Communication Style: ${tone.toUpperCase()}`, 'info');
    }
  };

  const handleVerbosityChange = (verbosity: ExplanationVerbosity) => {
    updateEngineSettings({ explanationVerbosity: verbosity });
    addToast(`Explanation Depth: ${verbosity.toUpperCase()}`, 'info');
  };

  return (
    <div className="space-y-4 pt-1 border-t border-subtle">
      {/* Communication Tone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} className="text-primary" />
            Communication Style & Tone (Văn Phong)
          </label>
          {currentTone === 'caveman' && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <Zap size={10} className="fill-amber-300" /> Ultra-Compressed (~75% Token Savings)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {COMMUNICATION_TONES.map((t) => {
            const isSelected = currentTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToneChange(t.id)}
                className={clsx(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative surface-card",
                  isSelected
                    ? (t.id === 'caveman'
                        ? "border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30"
                        : "border-primary bg-primary/10 shadow-md ring-1 ring-primary/30")
                    : "border-subtle hover:border-primary/50 text-secondary"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx("text-xs font-bold", isSelected ? (t.id === 'caveman' ? "text-amber-300" : "text-primary") : "text-app-text")}>
                      {t.label}
                    </span>
                    <span className={clsx("text-[9px] font-mono px-1.5 py-0.2 rounded border", isSelected ? (t.id === 'caveman' ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-primary/20 text-primary border-primary/30") : "bg-white/5 text-muted border-subtle")}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted line-clamp-2 leading-relaxed">{t.description}</p>
                </div>
                <div className="text-[9px] font-mono pt-1 text-secondary mt-1">
                  Efficiency: <span className={t.id === 'caveman' ? "text-emerald-400 font-semibold" : "text-muted"}>{t.tokenSavings}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Verbosity */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={13} className="text-cyan-400" />
          Explanation Detail Level (Độ Chi Tiết Giải Thích)
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {EXPLANATION_VERBOSITIES.map((v) => {
            const isSelected = currentVerbosity === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVerbosityChange(v.id)}
                className={clsx(
                  "p-2 rounded-xl border text-center transition-all cursor-pointer text-xs font-medium surface-card",
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/20"
                    : "border-subtle text-muted hover:text-app-text"
                )}
                title={v.description}
              >
                <div className="text-[11px] leading-tight">{v.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
