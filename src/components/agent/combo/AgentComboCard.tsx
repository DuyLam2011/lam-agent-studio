import React from 'react';
import { Layers, ShieldCheck, Clock, Sparkles, Check, CheckCircle2, Trash2, Edit3, Copy, ArrowRight, Zap, Network } from 'lucide-react';
import { AgentCombo } from '../../../types/agent-combo';
import { useAgentStore } from '../../../store/useAgentStore';
import { ComboEnsemblePills } from './ComboEnsemblePills';
import clsx from 'clsx';

interface AgentComboCardProps {
  combo: AgentCombo;
  isActive: boolean;
  isRepoBound?: boolean;
  repoTag?: string;
  onSelectForRepo: (comboId: string) => void;
  onSelectGlobal: (comboId: string) => void;
  onEdit?: (combo: AgentCombo) => void;
  onClone?: (combo: AgentCombo) => void;
  onDelete?: (comboId: string) => void;
}

export const AgentComboCard: React.FC<AgentComboCardProps> = ({
  combo,
  isActive,
  isRepoBound,
  repoTag,
  onSelectForRepo,
  onSelectGlobal,
  onEdit,
  onClone,
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

  const flowMeta = {
    sequential_pipeline: { label: 'Pipeline Tuần Tự', icon: ArrowRight, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    parallel_swarm: { label: 'Swarm Song Song', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    lead_delegation: { label: 'Lead DAG Phân Quyền', icon: Network, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
  }[combo.flowType];

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all text-left relative flex flex-col justify-between gap-3",
      isActive
        ? isRepoBound
          ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
          : "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
        : "surface-card border-white/5 hover:border-white/15"
    )}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">{renderIcon()}</div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-gray-100 flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{combo.name}</span>
                {isActive && (
                  <span className={clsx("flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full border", isRepoBound ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" : "text-cyan-300 bg-cyan-500/15 border-cyan-500/30")}>
                    <Check size={9} /> {isRepoBound ? 'Áp dụng Repo' : 'Mặc định'}
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={clsx("text-[9px] px-1.5 py-0.2 rounded-full border font-mono flex items-center gap-1", flowMeta.color)}>
                  <flowMeta.icon size={9} /> {flowMeta.label}
                </span>
                {combo.isBuiltin && <span className="text-[9px] text-gray-400 font-mono">Built-in</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {combo.isBuiltin && onClone && (
              <button onClick={() => onClone(combo)} title="Nhân bản để tùy biến" className="p-1 hover:text-white text-gray-400 transition-colors">
                <Copy size={12} />
              </button>
            )}
            {onEdit && !combo.isBuiltin && (
              <button onClick={() => onEdit(combo)} title="Chỉnh sửa combo" className="p-1 hover:text-white text-gray-400 transition-colors">
                <Edit3 size={12} />
              </button>
            )}
            {onDelete && !combo.isBuiltin && (
              <button onClick={() => onDelete(combo.id)} title="Xóa combo" className="p-1 hover:text-rose-400 text-gray-400 transition-colors">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-300 leading-relaxed mb-3 line-clamp-2">{combo.description}</p>
        <ComboEnsemblePills subagentIds={combo.subagentIds} flowType={combo.flowType} getSubagentName={getSubagentName} />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/5 shrink-0">
        <button
          onClick={() => onSelectGlobal(combo.id)}
          className={clsx(
            "px-2.5 py-1 rounded-xl text-[10px] font-medium transition-colors",
            isActive && !isRepoBound ? "bg-primary/20 text-primary border border-primary/40 font-semibold" : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
          )}
        >
          {isActive && !isRepoBound ? '✓ Mặc định Toàn cục' : 'Dùng làm Mặc định'}
        </button>

        {repoTag && (
          <button
            onClick={() => onSelectForRepo(combo.id)}
            className={clsx(
              "px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-colors flex items-center gap-1",
              isRepoBound ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            )}
          >
            <CheckCircle2 size={10} />
            <span>{isRepoBound ? `✓ Đang gắn cho ${repoTag}` : `Gắn cho ${repoTag}`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
