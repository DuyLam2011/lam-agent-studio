import React from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Cpu, Zap, KeyRound, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export const AiEngineSettingsTab: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();

  const handleProviderChange = (provider: string) => {
    updateEngineSettings({ provider });
    addToast(`Đã chọn AI Provider: ${provider.toUpperCase()}`, 'info');
  };

  const handleModelChange = (selectedModel: string) => {
    updateEngineSettings({ selectedModel });
    addToast(`Đã chọn Model mặc định: ${selectedModel}`, 'info');
  };

  return (
    <div className="space-y-4 p-1">
      {/* Provider Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={13} className="text-primary" />
          Nhà Cung Cấp Trí Tuệ Nhân Tạo (AI Provider)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'gemini', label: 'Google Gemini' },
            { id: 'anthropic', label: 'Claude AI' },
            { id: 'deepseek', label: 'DeepSeek' },
            { id: 'ollama', label: 'Local Ollama' }
          ].map(({ id, label }) => {
            const isSelected = (engineSettings.provider || 'gemini').toLowerCase() === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleProviderChange(id)}
                className={clsx(
                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer surface-card text-xs font-medium",
                  isSelected ? "border-primary bg-primary/10 text-primary font-bold shadow-sm" : "border-subtle text-secondary hover:text-app-text"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto Smart Router Mode vs Fixed Model */}
      <div className="p-3.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-app-text">Auto (Smart Router)</h4>
            <p className="text-[11px] text-muted">Tự động chấm điểm độ phức tạp 4 chiều và định tuyến model tối ưu</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleModelChange(engineSettings.selectedModel === 'auto-smart-router' ? 'gemini-3.5-flash-lite' : 'auto-smart-router')}
          className={clsx(
            "w-11 h-6 rounded-full transition-colors relative cursor-pointer border border-subtle",
            engineSettings.selectedModel === 'auto-smart-router' || !engineSettings.selectedModel ? "bg-primary" : "bg-white/10"
          )}
        >
          <span className={clsx(
            "block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm",
            engineSettings.selectedModel === 'auto-smart-router' || !engineSettings.selectedModel ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      {/* API Key Status & Quick Config */}
      <div className="p-3 rounded-xl surface-card border border-subtle space-y-2">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound size={13} className="text-primary" />
          Khóa API (API Key) & Endpoint
        </label>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={engineSettings.customApiKey || ''}
            onChange={(e) => updateEngineSettings({ customApiKey: e.target.value })}
            placeholder="Nhập khóa API (ví dụ: AIzaSy... / sk-ant-...)"
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => addToast('Đã lưu khóa API an toàn vào cấu hình máy', 'success')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary-hover text-white cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>

      {/* Adaptive Temperature & Reasoning */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl surface-card border border-subtle">
          <div className="text-xs font-medium text-app-text flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-amber-400" />
            Nhiệt Độ Thích Ứng (Adaptive Temp)
          </div>
          <div className="text-[10px] text-muted">
            Tự động hạ xuống 0.05 khi xử lý mã nguồn/bảo mật, và 0.20 khi sáng tạo nội dung.
          </div>
        </div>

        <div className="p-3 rounded-xl surface-card border border-subtle">
          <div className="text-xs font-medium text-app-text flex items-center gap-1.5 mb-1">
            <Cpu size={13} className="text-cyan-400" />
            Reasoning Effort
          </div>
          <div className="text-[10px] text-muted">
            Tự động kích hoạt mức độ suy luận Deep Thinking khi Task Complexity đạt L3/L4.
          </div>
        </div>
      </div>
    </div>
  );
};
