import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { app, shell } from 'electron';
import { ApiGatewayClient } from './ApiGatewayClient';
import { SettingsManager } from './SettingsManager';
import { NativeGatewayWatcherBridge } from './NativeGatewayWatcherBridge';
import type { UpdateCheckResponse, VendorArtifactInfo } from './VendorUpdateTypes';

export type { UpdateCheckResponse, VendorArtifactInfo };

const settingsManager = new SettingsManager();

export class VendorUpdateService {
  private static getUpdatesCacheDir(): string {
    const base = app?.getPath ? app.getPath('userData') : path.join(os.homedir(), '.lam-studio');
    return path.join(base, 'updates');
  }

  public static async checkForUpdates(channel = 'stable'): Promise<UpdateCheckResponse> {
    const settings = await settingsManager.loadSettings().catch(() => ({}) as any);
    const currentAppVersion = app?.getVersion ? app.getVersion() : '1.0.0';
    const currentAgentVersion = settings?.agentVendorVersion || '1.0.0';
    const qs = new URLSearchParams({
      channel,
      currentVersion: currentAppVersion,
      agentVersion: currentAgentVersion,
      platform: process.platform,
      arch: process.arch
    });
    const res = await ApiGatewayClient.request(`/updates/check?${qs.toString()}`, { timeoutMs: 3500 });
    if (!res.ok || !res.data) {
      return {
        gatewayOnline: false, channel, currentAppVersion, latestAppVersion: currentAppVersion,
        hasAppUpdate: false, appUpdate: null, currentAgentVersion, latestAgentVersion: currentAgentVersion,
        hasVendorUpdate: false, vendorUpdate: null, error: res.error || 'Gateway update server unavailable'
      };
    }
    return { gatewayOnline: true, ...res.data };
  }

  public static async downloadAndVerify(artifact: VendorArtifactInfo): Promise<{ localPath: string; sha256: string; verified: boolean }> {
    const dir = this.getUpdatesCacheDir();
    await fs.mkdir(dir, { recursive: true });
    const safeName = path.basename(artifact.fileName);
    const localPath = path.join(dir, safeName);
    const res = await fetch(artifact.downloadUrl);
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(localPath, buffer);
    const computed = NativeGatewayWatcherBridge.sha256File(localPath) || crypto.createHash('sha256').update(buffer).digest('hex');
    const verified = !artifact.sha256 || artifact.sha256.toLowerCase() === computed.toLowerCase();
    if (!verified) throw new Error(`SHA-256 verification failed for ${safeName}`);
    return { localPath, sha256: computed, verified };
  }

  public static async installArtifact(artifact: VendorArtifactInfo, workspaceRoot?: string) {
    const { localPath, sha256 } = await this.downloadAndVerify(artifact);
    if (artifact.kind === 'app') {
      const openErr = await shell.openPath(localPath);
      if (openErr) throw new Error(`Failed to launch installer: ${openErr}`);
      return { success: true, kind: 'app', launchedInstaller: true, localPath, sha256 };
    }

    const raw = await fs.readFile(localPath, 'utf-8');
    const pack = JSON.parse(raw) as { version?: string; files?: Array<{ relativePath: string; content: string }> };
    const vendorTargetRoot = path.join(os.homedir(), '.lam-studio', 'vendor', 'current');
    await fs.mkdir(vendorTargetRoot, { recursive: true });
    const written: string[] = [];

    for (const file of pack.files || []) {
      const cleanRel = path.normalize(file.relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const destVendor = path.join(vendorTargetRoot, cleanRel);
      await fs.mkdir(path.dirname(destVendor), { recursive: true });
      await fs.writeFile(destVendor, file.content, 'utf-8');
      if (workspaceRoot && (cleanRel.startsWith('.agents') || cleanRel.startsWith('src'))) {
        const destWs = path.join(workspaceRoot, cleanRel);
        if (destWs.startsWith(path.resolve(workspaceRoot))) {
          await fs.mkdir(path.dirname(destWs), { recursive: true });
          await fs.writeFile(destWs, file.content, 'utf-8');
        }
      }
      written.push(cleanRel);
    }

    await settingsManager.saveSettings({ agentVendorVersion: pack.version || artifact.version, lastVendorUpdatedAt: Date.now() });
    return { success: true, kind: 'vendor-agent', version: artifact.version, filesApplied: written.length, written, sha256 };
  }

  public static async publishVendorPack(params: { workspaceRoot: string; version: string; channel?: string; notes?: string[]; secret?: string }) {
    const vendorFiles: Array<{ relativePath: string; content: string }> = [];
    const rulesDir = path.join(params.workspaceRoot, '.agents', 'rules');
    try {
      for (const e of await fs.readdir(rulesDir, { withFileTypes: true })) {
        if (e.isFile() && /\.(md|rules)$/i.test(e.name)) {
          vendorFiles.push({ relativePath: `.agents/rules/${e.name}`, content: await fs.readFile(path.join(rulesDir, e.name), 'utf-8') });
        }
      }
    } catch {}
    return ApiGatewayClient.request('/updates/publish', {
      method: 'POST',
      headers: params.secret ? { 'x-gateway-secret': params.secret } : {},
      body: {
        kind: 'vendor-agent',
        version: params.version,
        channel: params.channel || 'stable',
        vendorFiles,
        releaseNotes: params.notes || [`Vendor AI bundle v${params.version} (${vendorFiles.length} specs)`]
      },
      timeoutMs: 8000
    });
  }
}
