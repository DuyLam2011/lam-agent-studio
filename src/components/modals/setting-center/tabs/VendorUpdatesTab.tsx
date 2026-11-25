import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, Cloud, UploadCloud, CheckCircle2, Globe } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { serializeCloudProfilesPayload } from '../../../../services/agent-profile/agentProfileStorageService';
import { SettingsPage, SettingsSection, SettingsRow } from '../../../ui/settings/SettingsPrimitives';
import clsx from 'clsx';

export const VendorUpdatesTab: React.FC = () => {
  const { systemContext, engineSettings, agentProfiles, updateAgentProfile, updateEngineSettings, addToast } = useAgentStore();
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:3000');
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [bundleVer, setBundleVer] = useState('1.1.0');

  const refreshGateway = async () => {
    const cfg = await window.lamApi?.gateway?.getConfig?.();
    if (cfg?.gatewayUrl) setGatewayUrl(cfg.gatewayUrl);
    const h = await window.lamApi?.gateway?.getHealth?.();
    setHealthOk(Boolean(h?.ok));
  };

  useEffect(() => { void refreshGateway(); }, []);

  const handleSaveUrl = async () => {
    const res = await window.lamApi?.gateway?.saveConfig?.(gatewayUrl);
    if (res?.gatewayUrl) setGatewayUrl(res.gatewayUrl);
    await refreshGateway();
    addToast('Saved API Gateway endpoint', 'success');
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      const res = await window.lamApi?.updates?.check?.('stable');
      setUpdateInfo(res);
      addToast(res?.hasAppUpdate || res?.hasVendorUpdate ? 'New update available!' : 'Studio and AI vendor modules are up to date', 'info');
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async (artifact: any) => {
    setInstalling(true);
    try {
      const res = await window.lamApi?.updates?.install?.(artifact, systemContext.cwd);
      addToast(res?.launchedInstaller ? 'Launched Studio Installer' : `Applied Vendor AI v${res?.version} (${res?.filesApplied} files)`, 'success');
      await handleCheckUpdates();
    } catch (err: any) {
      addToast(err?.message || 'Update installation failed', 'error');
    } finally {
      setInstalling(false);
    }
  };

  const handlePublishVendor = async () => {
    const res = await window.lamApi?.updates?.publishVendor?.({ workspaceRoot: systemContext.cwd || '.', version: bundleVer });
    addToast(res?.ok ? `Published Agent Vendor v${bundleVer} to Gateway` : `Publish failed: ${res?.error}`, res?.ok ? 'success' : 'error');
    if (res?.ok) await handleCheckUpdates();
  };

  const handlePushSync = async () => {
    const wsId = systemContext.activeWorkspaceId || 'default';
    await window.lamApi?.gateway?.syncProfiles?.(wsId, serializeCloudProfilesPayload(agentProfiles));
    await window.lamApi?.gateway?.syncSettings?.(wsId, engineSettings);
    addToast('Synchronized profiles & engine settings to API Gateway', 'success');
  };

  const handlePullSync = async () => {
    const wsId = systemContext.activeWorkspaceId || 'default';
    const [profRes, setRes] = await Promise.all([window.lamApi?.gateway?.pullProfiles?.(wsId), window.lamApi?.gateway?.pullSettings?.(wsId)]);
    const pulled = profRes?.data?.data?.profiles;
    if (Array.isArray(pulled)) {
      for (const p of pulled) { if (p?.agentId) updateAgentProfile(p.agentId, p); }
    } else if (pulled && typeof pulled === 'object') {
      for (const [id, cfg] of Object.entries(pulled)) updateAgentProfile(id, cfg as any);
    }
    if (setRes?.data?.data && Object.keys(setRes.data.data).length > 0) updateEngineSettings(setRes.data.data);
    addToast('Restored profiles & settings from API Gateway', 'success');
  };

  return (
    <SettingsPage>
      <SettingsSection title="Vendor Gateway & Sync Server" description="Connect L.A.M Studio to lam-studio-api-gateway for seamless updates and callbacks." icon={Globe} divided>
        <SettingsRow title="API Gateway URL" description="Endpoint serving OAuth callbacks, vendor update feeds, and telemetry sync.">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-mono border', healthOk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30')}>
              {healthOk ? 'ONLINE' : 'OFFLINE'}
            </span>
            <input type="text" value={gatewayUrl} onChange={(e) => setGatewayUrl(e.target.value)}
              className="w-48 surface-input border border-subtle rounded-lg px-2.5 py-1 text-xs font-mono text-app-text" />
            <button type="button" onClick={handleSaveUrl} className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer">Save</button>
          </div>
        </SettingsRow>
        <SettingsRow title="Cloud Profile & Engine Sync" description="Backup or restore Father Agent, subagent configs, and model defaults via Gateway.">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePushSync} className="px-2.5 py-1.5 rounded-lg surface-input border border-subtle hover:border-primary/40 text-xs flex items-center gap-1 cursor-pointer">
              <UploadCloud size={12} className="text-primary" /><span>Push</span>
            </button>
            <button type="button" onClick={handlePullSync} className="px-2.5 py-1.5 rounded-lg surface-input border border-subtle hover:border-primary/40 text-xs flex items-center gap-1 cursor-pointer">
              <Cloud size={12} className="text-emerald-400" /><span>Restore</span>
            </button>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Studio & Agent AI Vendor Installer" description="One-click install for Studio releases or hot-swappable Agent/AI vendor packs (SHA-256 verified in Rust)." icon={Download} divided>
        <SettingsRow title="Check & Install Updates" description={updateInfo ? `App v${updateInfo.currentAppVersion} -> v${updateInfo.latestAppVersion} | Agent v${updateInfo.currentAgentVersion} -> v${updateInfo.latestAgentVersion}` : 'Check Gateway update manifest'}>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" disabled={checking} onClick={handleCheckUpdates} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={12} className={clsx(checking && 'animate-spin')} /><span>Check Updates</span>
            </button>
            {updateInfo?.hasVendorUpdate && updateInfo.vendorUpdate && (
              <button type="button" disabled={installing} onClick={() => handleInstall(updateInfo.vendorUpdate)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer">
                <CheckCircle2 size={12} /><span>Install AI v{updateInfo.vendorUpdate.version}</span>
              </button>
            )}
            {updateInfo?.hasAppUpdate && updateInfo.appUpdate && (
              <button type="button" disabled={installing} onClick={() => handleInstall(updateInfo.appUpdate)} className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer">
                <Download size={12} /><span>Install App v{updateInfo.appUpdate.version}</span>
              </button>
            )}
          </div>
        </SettingsRow>
        <SettingsRow title="Publish Current AI Vendor Pack" description="Bundle active .agents/rules & AI configs to the Gateway update feed for instant distribution.">
          <div className="flex items-center gap-2">
            <input type="text" value={bundleVer} onChange={(e) => setBundleVer(e.target.value)} className="w-20 surface-input border border-subtle rounded-lg px-2 py-1 text-xs font-mono text-app-text" />
            <button type="button" onClick={handlePublishVendor} className="px-3 py-1.5 rounded-lg surface-input border border-subtle hover:border-primary/40 text-xs font-medium cursor-pointer">Publish</button>
          </div>
        </SettingsRow>
      </SettingsSection>
    </SettingsPage>
  );
};
