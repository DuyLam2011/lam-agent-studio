import React, { useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { Globe, Camera, MousePointerClick, FileCode2, Plus, X } from 'lucide-react';
import clsx from 'clsx';

export const BrowserPermissionsTab: React.FC = () => {
  const { agentPermissions, updateAgentPermissions, addToast } = useAgentStore();
  const [newDomain, setNewDomain] = useState('');
  const browser = agentPermissions.browser;

  const handleToggle = (key: 'enabled' | 'captureScreenshots' | 'allowDomClick') => {
    updateAgentPermissions({
      browser: { ...browser, [key]: !browser[key] }
    });
    addToast(`Cập nhật quyền Browser: ${key} = ${!browser[key] ? 'BẬT' : 'TẮT'}`, 'info');
  };

  const handleAddDomain = () => {
    const val = newDomain.trim().toLowerCase();
    if (!val || browser.allowedDomains.includes(val)) return;
    updateAgentPermissions({
      browser: { ...browser, allowedDomains: [...browser.allowedDomains, val] }
    });
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    updateAgentPermissions({
      browser: { ...browser, allowedDomains: browser.allowedDomains.filter(d => d !== dom) }
    });
  };

  return (
    <div className="space-y-4 p-1">
      {/* Main Switch */}
      <div className="p-3.5 rounded-xl surface-card border border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Globe size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-app-text">Kích Hoạt Công Cụ Browser (Browser Tool)</h4>
            <p className="text-[11px] text-muted">Cho phép Agent mở trang web, kiểm tra DOM và chụp ảnh preview</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleToggle('enabled')}
          className={clsx(
            "w-11 h-6 rounded-full transition-colors relative cursor-pointer border border-subtle",
            browser.enabled ? "bg-primary" : "bg-white/10"
          )}
        >
          <span className={clsx(
            "block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm",
            browser.enabled ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      {/* Sub-capabilities */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleToggle('captureScreenshots')}
          className={clsx(
            "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer surface-card",
            browser.captureScreenshots ? "border-primary bg-primary/10 text-primary" : "border-subtle text-secondary"
          )}
        >
          <Camera size={15} className="mt-0.5" />
          <div>
            <div className="text-xs font-medium">Chụp Ảnh Màn Hình (Screenshots)</div>
            <div className="text-[10px] text-muted">Chụp trang web để phân tích layout UI</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleToggle('allowDomClick')}
          className={clsx(
            "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer surface-card",
            browser.allowDomClick ? "border-primary bg-primary/10 text-primary" : "border-subtle text-secondary"
          )}
        >
          <MousePointerClick size={15} className="mt-0.5" />
          <div>
            <div className="text-xs font-medium">Tương Tác DOM (Click & Type)</div>
            <div className="text-[10px] text-muted">Cho phép nhấn nút kiểm thử luồng web</div>
          </div>
        </button>
      </div>

      {/* Allowed Domains */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <FileCode2 size={13} className="text-primary" />
          Danh Sách Tên Miền Cho Phép (Allowed Web Domains)
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl surface-card border border-subtle max-h-28 overflow-y-auto custom-scrollbar">
          {browser.allowedDomains.map((dom) => (
            <span key={dom} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300">
              {dom}
              <button type="button" onClick={() => handleRemoveDomain(dom)} className="hover:text-red-400 cursor-pointer">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
            placeholder="Thêm tên miền (ví dụ: my-api.dev, *.local)..."
            className="flex-1 surface-input px-3 py-1.5 rounded-lg text-xs font-mono border border-subtle text-app-text focus:outline-none focus:border-primary"
          />
          <button type="button" onClick={handleAddDomain} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 cursor-pointer">
            <Plus size={13} /> Thêm
          </button>
        </div>
      </div>
    </div>
  );
};
