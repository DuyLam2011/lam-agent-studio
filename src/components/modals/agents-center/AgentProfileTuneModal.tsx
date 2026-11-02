import React, { useState, useEffect } from 'react';
import { X, Save, Cloud, Bot } from 'lucide-react';
import { AgentProfileConfig } from '../../../types/agent-profile';
import { ProfileIntelligenceSection } from './profile-tune/ProfileIntelligenceSection';
import { ProfileCostEffortSection } from './profile-tune/ProfileCostEffortSection';
import clsx from 'clsx';

interface AgentProfileTuneModalProps {
  profile: AgentProfileConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: AgentProfileConfig) => void;
}

export const AgentProfileTuneModal: React.FC<AgentProfileTuneModalProps> = ({ profile, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<AgentProfileConfig | null>(null);

  useEffect(() => {
    if (profile) setFormData({ ...profile });
  }, [profile]);

  if (!isOpen || !formData) return null;

  const handlePatch = (patch: Partial<AgentProfileConfig>) => {
    setFormData((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, updatedAt: Date.now() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl max-h-[90vh] surface-modal flex flex-col overflow-hidden text-xs shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-subtle flex items-center justify-between surface-header">
          <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-xl border flex items-center justify-center", formData.isFatherAgent ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-primary/20 text-primary border-primary/30")}>
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-app-text text-sm">{formData.name}</h3>
                <span className={clsx("px-2 py-0.2 rounded-full font-mono text-[10px] uppercase font-bold border", formData.isFatherAgent ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30")}>
                  {formData.isFatherAgent ? 'Father Agent' : 'Subagent Profile'}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">Cấu hình trí tuệ, nỗ lực suy luận & cân bằng chi phí</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"><X size={16} /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <ProfileIntelligenceSection formData={formData} onChange={handlePatch} />
          <ProfileCostEffortSection formData={formData} onChange={handlePatch} />

          {/* Cloud Sync Ready Notice */}
          <div className="p-3 rounded-xl surface-card border border-subtle flex items-center justify-between text-[11px] text-secondary">
            <div className="flex items-center gap-2">
              <Cloud size={14} className="text-cyan-400" />
              <span>Sẵn sàng lưu & đồng bộ theo tài khoản người dùng trên Cloud DB</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">v1.0 Cloud Ready</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer">Hủy</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer">
              <Save size={13} /> Lưu Cấu Hình Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
