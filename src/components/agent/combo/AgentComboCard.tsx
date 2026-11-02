import React from 'react';
import { Layers, ShieldCheck, Clock, Sparkles, Check, CheckCircle2, Bot, Trash2, Edit3 } from 'lucide-react';
import { AgentCombo } from '../../../types/agent-combo';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface AgentComboCardProps {
  combo: AgentCombo;
  isActive: boolean;
  repoTag?: string;
  onSelectForRepo: (comboId: string) => void;
  onSelectGlobal: (comboId: string) => void;
  onEdit?: (combo: AgentCombo) => void;
  onDelete?: (comboId: string) => void;
}

export const AgentComboCard: React.FC<AgentComboCardProps> = ({
  combo,
  isActive,
  repoTag,
  onSelectForRepo,
  onSelectGlobal,
  onEdit,
  onDelete
}) => {
  const { subagentPersonas } = useAgentStore();

  const getSubagentName = (id: string) => {
    const found = subagentPersonas.find((s) => s.id === id);
    return found ? found.name : id.replace(/^subagent-/, '');
  };

  const renderIcon = () => {
    switch (combo.icon) {
      case 'ShieldCheck': return <ShieldCheck size={16} className="text-emerald-400" />;
      case 'Clock': return <Clock size={16} className="text-amber-400" />;
      case 'Sparkles': return <Sparkles size={16} className="text-cyan-400" />;
      default: return <Layers size={16} className="text-primary" />;
    }
  };

  return (
    <div
      className={clsx(
        "p-3.5 rounded-xl border transition-all text-left relative flex flex-col justify-between gap-3",
        isActive
          ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
          : "surface-card border-white/5 hover:border-white/15"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
              {renderIcon()}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
                <span>{combo.name}</span>
                {isActive && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                    <Check size={9} /> Active
                  </span>
                )}
              </h4>
              <span className="text-[10px] text-gray-400 capitalize">{combo.flowType.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onEdit && !combo.isBuiltin && (
              <button onClick={() => onEdit(combo)} className="p-1 hover:text-white text-gray-400 transition-colors">
                <Edit3 size={12} />
              </button>
            )}
            {onDelete && !combo.isBuiltin && (
              <button onClick={() => onDelete(combo.id)} className="p-1 hover:text-rose-400 text-gray-400 transition-colors">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
          {combo.description}
        </p>

        {/* Subagent team tags */}
        <div className="space-y-1 mb-3">
          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Subagent Ensemble ({combo.subagentIds.length})</span>
          <div className="flex flex-wrap gap-1">
            {combo.subagentIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-200"
              >
                <Bot size={10} className="text-primary" />
                <span className="truncate max-w-[130px]">{getSubagentName(id)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 shrink-0">
        <button
          onClick={() => onSelectGlobal(combo.id)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
        >
          Use as Default
        </button>

        {repoTag && (
          <button
            onClick={() => onSelectForRepo(combo.id)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors flex items-center gap-1"
          >
            <CheckCircle2 size={10} />
            <span>Set for {repoTag}</span>
          </button>
        )}
      </div>
    </div>
  );
};
