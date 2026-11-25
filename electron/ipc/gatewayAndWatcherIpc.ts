import type { IpcMain, BrowserWindow } from 'electron';
import { ApiGatewayClient } from '../services/ApiGatewayClient';
import { VendorUpdateService } from '../services/VendorUpdateService';
import { ExternalAgentInspectorService } from '../services/ExternalAgentInspectorService';
import { SettingsManager } from '../services/SettingsManager';
import { panelWindowManager } from '../services/PanelWindowManager';

const settingsManager = new SettingsManager();

export function registerGatewayAndWatcherIpc(
  ipcMain: IpcMain,
  getMainWindow: () => BrowserWindow | null
) {
  ipcMain.handle('gateway:getHealth', async () => ApiGatewayClient.getHealth());

  ipcMain.handle('gateway:getConfig', async () => {
    const settings = await settingsManager.loadSettings().catch(() => ({}) as any);
    return {
      gatewayUrl: await ApiGatewayClient.getBaseUrl(),
      agentVendorVersion: settings?.agentVendorVersion || '1.0.0'
    };
  });

  ipcMain.handle('gateway:saveConfig', async (_, gatewayUrl: string) => {
    const cleanUrl = (gatewayUrl || 'http://localhost:3000').trim().replace(/\/+$/, '');
    await settingsManager.saveSettings({ gatewayUrl: cleanUrl });
    return { success: true, gatewayUrl: cleanUrl };
  });

  ipcMain.handle('gateway:syncProfiles', async (_, workspaceId: string, profiles: any) =>
    ApiGatewayClient.syncProfiles(workspaceId || 'default', profiles || {})
  );

  ipcMain.handle('gateway:pullProfiles', async (_, workspaceId: string) =>
    ApiGatewayClient.pullProfiles(workspaceId || 'default')
  );

  ipcMain.handle('gateway:syncSettings', async (_, workspaceId: string, settings: any) =>
    ApiGatewayClient.syncSettings(workspaceId || 'default', settings || {})
  );

  ipcMain.handle('gateway:pullSettings', async (_, workspaceId: string) =>
    ApiGatewayClient.pullSettings(workspaceId || 'default')
  );

  ipcMain.handle('gateway:emitCallback', async (_, kind: any, payload: any) =>
    ApiGatewayClient.emitCallback(kind, payload)
  );

  ipcMain.handle('gateway:getEvents', async (_, type?: string, limit = 30) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (type) qs.set('type', type);
    return ApiGatewayClient.request(`/callbacks/events?${qs.toString()}`);
  });

  ipcMain.handle('updates:check', async (_, channel?: string) =>
    VendorUpdateService.checkForUpdates(channel || 'stable')
  );

  ipcMain.handle('updates:install', async (_, artifact: any, workspaceRoot?: string) => {
    const res = await VendorUpdateService.installArtifact(artifact, workspaceRoot);
    getMainWindow()?.webContents?.send('updates:installed', res);
    return res;
  });

  ipcMain.handle('updates:publishVendor', async (_, params: any) =>
    VendorUpdateService.publishVendorPack({
      workspaceRoot: params?.workspaceRoot || process.cwd(),
      version: params?.version || '1.1.0',
      channel: params?.channel || 'stable',
      notes: params?.notes,
      secret: params?.secret
    })
  );

  ipcMain.handle('externalAgents:scan', async (_, maxPerProvider?: number, force = true) =>
    ExternalAgentInspectorService.scanExternalAgents(maxPerProvider || 5, force)
  );

  ipcMain.handle('externalAgents:getFatherContext', async (_, maxPerProvider?: number) =>
    ExternalAgentInspectorService.buildFatherContextPacket(maxPerProvider || 4)
  );

  ipcMain.handle('externalAgents:pushToGateway', async (_, workspaceRoot?: string) => {
    await ExternalAgentInspectorService.pushSnapshotToGateway(workspaceRoot);
    return { success: true };
  });

  ipcMain.handle('fatherWindow:open', async (_, initialPrompt?: string) => ({
    success: panelWindowManager.openFatherWindow(initialPrompt)
  }));
}
