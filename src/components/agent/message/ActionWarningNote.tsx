import React, { useState } from 'react';
import { AlertTriangle, Undo2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export interface ActionWarningProps {
  title?: string;
  category: 'database' | 'credentials' | 'system_command' | 'core_config' | 'high_complexity' | 'none';
  target: string;
  description: string;
  riskLevel?: 'low' | 'medium' | 'high';
  diffId?: string;
  autoApproved?: boolean;
}

export const ActionWarningNote: React.FC<ActionWarningProps> = ({
  title,
  category,
  target,
  description,
  riskLevel = 'medium',
  diffId,
  autoApproved = true,
}) => {
  const { revertAgentDiff, pendingAgentDiffs, addToast } = useAgentStore();
  const [expanded, setExpanded] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const hasDiff = Boolean(diffId && pendingAgentDiffs.some((d) => d.id === diffId));

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!diffId) return;
    setIsReverting(true);
    const success = await revertAgentDiff(diffId);
    setIsReverting(false);
    if (success) addToast(`Đã hoàn tác thay đổi cho: ${target}`, 'info');
  };

  const isHighRisk = riskLevel === 'high';

  return (
    <div
      className={clsx(
        "my-2 rounded-xl border p-3 text-xs transition-all select-none",
        isHighRisk
          ? "bg-rose-950/25 border-rose-500/30 text-rose-200"
          : "bg-amber-950/20 border-amber-500/30 text-amber-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={clsx(
              "p-1.5 rounded-lg shrink-0 mt-0.5",
              isHighRisk ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"
            )}
          >
            <AlertTriangle size={15} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-white tracking-wide">
                {title || 'Cảnh Báo Tác Vụ Độ Rủi Ro / Nhạy Cảm'}
              </span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 rounded font-mono text-[9px] uppercase border",
                  isHighRisk
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                )}
              >
                {category.replace('_', ' ')}
              </span>
              {autoApproved && (
                <span className="flex items-center gap-1 text-[9.5px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  <ShieldCheck size={11} /> Auto-Approved
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed mb-1.5">{description}</p>
            <div className="text-[10px] font-mono text-gray-400 truncate max-w-md">
              Mục tiêu: <span className="text-gray-200">{target}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasDiff && (
            <button
              type="button"
              disabled={isReverting}
              onClick={handleRevert}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 transition-colors cursor-pointer"
              title="Khôi phục trạng thái tệp tin ban đầu"
            >
              <Undo2 size={12} />
              <span>{isReverting ? 'Đang hoàn tác...' : 'Hoàn tác'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Chi tiết an toàn"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-white/10 text-[10.5px] text-gray-400 space-y-1 font-sans">
          <div>
            • <strong>Cơ chế bảo vệ:</strong> Tác vụ đã được tự động cấp phép theo thiết lập Turbo/Guarded trong Setting Center.
          </div>
          <div>
            • <strong>Điểm an toàn:</strong> FileSecurityHarness đã xác thực đường dẫn nằm trong ranh giới Sandbox của Workspace.
          </div>
          <div>
            • <strong>Rollback:</strong> Bản vá lưu vết trong SurgicalPatchEngine, có thể hoàn tác bất kỳ lúc nào qua nút Hoàn tác ở trên.
          </div>
        </div>
      )}
    </div>
  );
};
