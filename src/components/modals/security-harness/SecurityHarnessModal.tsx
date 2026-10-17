import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SecurityAuditResult } from '../../../types/security';
import { McpServerPlugin } from '../../../types/plugins';
import { SecurityHeader } from './SecurityHeader';
import { SecurityFindingCard } from './SecurityFindingCard';
import clsx from 'clsx';

export const SecurityHarnessModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { agentRules, agentSkills, mcpPlugins, updateRule, addToast } = useAgentStore();
  const [auditList, setAuditList] = useState<SecurityAuditResult[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'rule' | 'skill' | 'mcp'>('all');
  const [isScanning, setIsScanning] = useState(false);

  const runFullScan = async () => {
    // @ts-ignore
    const api = window.lamApi?.security;
    if (!api) return;

    setIsScanning(true);
    const items = [
      ...agentRules.map(r => ({ name: r.name, type: 'rule' as const, content: r.content })),
      ...agentSkills.map(s => ({ name: s.name, type: 'skill' as const, content: `${s.description}\n${s.content}` })),
      ...mcpPlugins.map((p: McpServerPlugin) => ({ name: p.name, type: 'mcp' as const, content: `${p.description}\nTools: ${p.toolsExposed.join(', ')}` })),
    ];

    try {
      const results: SecurityAuditResult[] = await api.auditBatch(items);
      setAuditList(results);
    } catch (e: any) {
      addToast(`Security audit error: ${e.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) runFullScan();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filterType === 'all' ? auditList : auditList.filter(a => a.type === filterType);
  const overallScore = auditList.length > 0
    ? Math.round(auditList.reduce((acc, curr) => acc + curr.score, 0) / auditList.length)
    : 100;

  const handleSanitizeRule = (audit: SecurityAuditResult) => {
    const target = agentRules.find(r => r.name === audit.name);
    if (target) {
      updateRule(target.id, { content: audit.sanitizedContent });
      addToast(`Applied sanitized content to rule: ${target.name}`, 'success');
      runFullScan();
    }
  };

  const handleQuarantineRule = (audit: SecurityAuditResult) => {
    const target = agentRules.find(r => r.name === audit.name);
    if (target) {
      updateRule(target.id, { active: false });
      addToast(`Quarantined & disabled: ${target.name}`, 'info');
      runFullScan();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[850px] max-h-[85vh] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <SecurityHeader
          onClose={onClose}
          onRefresh={runFullScan}
          isScanning={isScanning}
          overallScore={overallScore}
        />

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 px-5 py-2 bg-black/30 border-b border-white/5 shrink-0 text-xs">
          <span className="text-gray-400 font-medium">Filter Category:</span>
          {(['all', 'rule', 'skill', 'mcp'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={clsx(
                "px-2.5 py-0.5 rounded-lg font-medium transition-all capitalize",
                filterType === tab ? "bg-primary text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              {tab === 'mcp' ? 'MCP / Plugins' : tab}
            </button>
          ))}
        </div>

        {/* Audit Cards List */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <SecurityFindingCard
                key={idx}
                audit={item}
                onSanitize={item.findings.length > 0 ? () => handleSanitizeRule(item) : undefined}
                onQuarantine={item.findings.length > 0 ? () => handleQuarantineRule(item) : undefined}
              />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              {isScanning ? 'Running deep security audit...' : 'No items found in selected category.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityHarnessModal;
