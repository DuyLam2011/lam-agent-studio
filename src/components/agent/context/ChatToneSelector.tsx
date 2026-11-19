import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Zap, ShieldCheck, Users, BookOpen, ChevronUp, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { COMMUNICATION_TONES, CommunicationTone } from '../../../types/engine-style';
import clsx from 'clsx';

export const ChatToneSelector: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTone = engineSettings.communicationTone || 'executive';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectTone = (tone: CommunicationTone) => {
    const patch: Partial<typeof engineSettings> = { communicationTone: tone };
    if (tone === 'caveman') patch.explanationVerbosity = 'terse';
    updateEngineSettings(patch);
    setIsOpen(false);

    if (tone === 'caveman') {
      addToast('Caveman Mode: Saves ~75% tokens with zero fluff', 'info');
    } else {
      addToast(`Communication tone switched: ${tone.toUpperCase()}`, 'info');
    }
  };

  const renderIcon = (id: CommunicationTone) => {
    switch (id) {
      case 'caveman': return <Zap size={11} className="text-amber-400 shrink-0 fill-amber-400" />;
      case 'executive': return <ShieldCheck size={11} className="text-emerald-400 shrink-0" />;
      case 'collaborative': return <Users size={11} className="text-purple-400 shrink-0" />;
      case 'academic': return <BookOpen size={11} className="text-cyan-400 shrink-0" />;
      default: return <MessageSquare size={11} className="text-gray-400 shrink-0" />;
    }
  };

  const isCaveman = currentTone === 'caveman';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all select-none",
          isCaveman
            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-sm"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
        )}
        title={`Agent Tone: ${currentTone.toUpperCase()} (Click to change)`}
      >
        {renderIcon(currentTone)}
        <span className="capitalize">{isCaveman ? 'Caveman (-75%)' : currentTone}</span>
        <ChevronUp size={10} className={clsx("transition-transform text-gray-400", !isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute bottom-full right-0 mb-1.5 w-64 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs rounded-xl border border-white/10 backdrop-blur-xl space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 mb-1">
            Communication Tone / Style
          </div>

          {COMMUNICATION_TONES.map((t) => {
            const isSelected = currentTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTone(t.id)}
                className={clsx(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left transition-all group",
                  isSelected
                    ? (t.id === 'caveman' ? "bg-amber-500/20 text-amber-200" : "bg-primary/20 text-primary")
                    : "hover:bg-white/5 text-gray-300"
                )}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5">{renderIcon(t.id)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-gray-100 group-hover:text-white truncate">{t.label}</span>
                      <span className={clsx(
                        "text-[9px] px-1 rounded font-mono",
                        t.id === 'caveman' ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-gray-400"
                      )}>
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight mt-0.5">{t.description}</p>
                  </div>
                </div>

                {isSelected && <Check size={12} className={t.id === 'caveman' ? "text-amber-400 shrink-0" : "text-primary shrink-0"} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
