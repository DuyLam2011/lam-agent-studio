import React from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { COMMUNICATION_TONES, EXPLANATION_VERBOSITIES, CommunicationTone, ExplanationVerbosity } from '../../../types/engine-style';
import { MessageSquare, Sliders, Zap } from 'lucide-react';
import clsx from 'clsx';

export const ToneVerbositySelector: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const currentTone = engineSettings.communicationTone || 'executive';
  const currentVerbosity = engineSettings.explanationVerbosity || (currentTone === 'caveman' ? 'terse' : 'concise');

  const handleToneChange = (tone: CommunicationTone) => {
    const patch: Partial<typeof engineSettings> = { communicationTone: tone };
    if (tone === 'caveman') patch.explanationVerbosity = 'terse';
    updateEngineSettings(patch);
    if (tone === 'caveman') {
      addToast('Caveman Mode Activated: ~75% token savings', 'info');
    } else {
      addToast(`Tone: ${tone.toUpperCase()}`, 'info');
    }
  };

  const handleVerbosityChange = (verbosity: ExplanationVerbosity) => {
    updateEngineSettings({ explanationVerbosity: verbosity });
    addToast(`Explanation Depth: ${verbosity.toUpperCase()}`, 'info');
  };

  return (
    <div className="space-y-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
      {/* Tone Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={12} className="text-amber-400" /> Tone / Văn Phong
          </span>
          <span className={clsx("font-mono capitalize text-[10px]", currentTone === 'caveman' ? "text-amber-300 font-bold" : "text-gray-300")}>
            {currentTone}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {COMMUNICATION_TONES.map((t) => {
            const isSelected = currentTone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleToneChange(t.id)}
                className={clsx(
                  "p-2 rounded-lg text-left transition-all border text-xs cursor-pointer flex flex-col justify-between",
                  isSelected
                    ? (t.id === 'caveman'
                        ? "bg-amber-500/20 border-amber-500/60 text-white shadow ring-1 ring-amber-500/30"
                        : "bg-primary/20 border-primary/60 text-white shadow")
                    : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="font-semibold text-[11px] truncate">{t.label}</span>
                  {t.id === 'caveman' && <Zap size={10} className="text-amber-400 shrink-0 fill-amber-400" />}
                </div>
                <div className="text-[9px] text-gray-400 truncate">{t.tokenSavings}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verbosity Selection */}
      <div className="space-y-1.5 pt-1 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sliders size={12} className="text-cyan-400" /> Explanation Depth
          </span>
          <span className="text-cyan-300 font-mono capitalize text-[10px]">{currentVerbosity}</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {EXPLANATION_VERBOSITIES.map((v) => {
            const isSelected = currentVerbosity === v.id;
            return (
              <button
                key={v.id}
                onClick={() => handleVerbosityChange(v.id)}
                className={clsx(
                  "py-1 px-0.5 rounded text-center text-[10px] font-semibold capitalize transition-all border truncate cursor-pointer",
                  isSelected
                    ? "bg-cyan-600/30 border-cyan-500/50 text-white shadow"
                    : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
                )}
                title={v.description}
              >
                {v.id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
