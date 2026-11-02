import React from 'react';
import { Gauge, Sliders, CheckSquare, Square } from 'lucide-react';
import { AgentProfileConfig, ReasoningEffortLevel } from '../../../../types/agent-profile';
import clsx from 'clsx';

interface ProfileCostEffortSectionProps {
  formData: AgentProfileConfig;
  onChange: (patch: Partial<AgentProfileConfig>) => void;
}

export const ProfileCostEffortSection: React.FC<ProfileCostEffortSectionProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Reasoning Effort & Temperature */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-subtle">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-app-text flex items-center gap-1.5">
            <Gauge size={13} className="text-amber-400" /> Nỗ Lực Suy Luận (Effort)
          </label>
          <div className="flex rounded-xl surface-input p-1 border border-subtle">
            {(['low', 'medium', 'high', 'max'] as ReasoningEffortLevel[]).map((effort) => (
              <button
                key={effort}
                type="button"
                onClick={() => onChange({ reasoningEffort: effort })}
                className={clsx(
                  "flex-1 py-1 rounded-lg text-center uppercase font-mono text-[10px] font-bold transition-all cursor-pointer",
                  formData.reasoningEffort === effort ? "bg-amber-500 text-black shadow-sm" : "text-muted hover:text-app-text"
                )}
              >
                {effort}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-app-text flex items-center gap-1.5">
              <Sliders size={13} className="text-cyan-400" /> Nhiệt Độ (Temperature)
            </label>
            <span className="font-mono text-cyan-400 text-[11px] font-bold">{formData.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={formData.temperature}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted font-mono">
            <span>0.0 (Chính xác code)</span>
            <span>1.0 (Sáng tạo)</span>
          </div>
        </div>
      </div>

      {/* Model ID & Max Output Tokens */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-subtle">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-app-text">Model ID Mục Tiêu</label>
          <input
            type="text" value={formData.modelId}
            onChange={(e) => onChange({ modelId: e.target.value })}
            className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text font-mono outline-none focus:border-primary transition-colors"
            placeholder="e.g. gemini-2.5-flash, claude-3-5-sonnet"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-app-text">Giới Hạn Token Output</label>
          <select
            value={formData.maxOutputTokens}
            onChange={(e) => onChange({ maxOutputTokens: parseInt(e.target.value, 10) })}
            className="w-full surface-input border border-subtle rounded-xl p-2 text-xs text-app-text font-mono outline-none focus:border-primary transition-colors"
          >
            <option value={2048}>2,048 tokens (Tiết kiệm)</option>
            <option value={4096}>4,096 tokens (Tiêu chuẩn)</option>
            <option value={8192}>8,192 tokens (Mở rộng)</option>
            <option value={16384}>16,384 tokens (Tối đa)</option>
          </select>
        </div>
      </div>

      {/* Auto-Approve Tools Switch */}
      <div className="flex items-center justify-between pt-2 border-t border-subtle text-[11px]">
        <div className="flex flex-col">
          <span className="font-semibold text-app-text">Tự Động Phê Duyệt Tool (Auto-Approve)</span>
          <span className="text-[10px] text-muted">Cho phép profile này tự động thực thi các tool an toàn</span>
        </div>
        <button
          type="button"
          onClick={() => onChange({ autoApproveTools: !formData.autoApproveTools })}
          className="p-1 text-primary hover:text-primary-hover cursor-pointer"
        >
          {formData.autoApproveTools ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-muted" />}
        </button>
      </div>
    </div>
  );
};
