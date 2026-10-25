import fs from 'fs/promises';
import path from 'path';
import { app, shell } from 'electron';

export interface SavedWorkspace {
  id: string;
  name: string;
  folders: string[];
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeStyle = 'glassmorphism' | 'minimalism';

export interface AppSettings {
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  accentColor: string;
  theme: string;
  aiModel: string;
  workspaces: SavedWorkspace[];
  activeWorkspaceId: string | null;
  [key: string]: any;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  themeStyle: 'glassmorphism',
  accentColor: '#3b82f6',
  theme: 'dark',
  aiModel: 'gemini-3.5-flash-lite',
  workspaces: [{ id: 'default', name: 'Default Workspace', folders: [] }],
  activeWorkspaceId: 'default',
};

export class SettingsManager {
  private configDir: string;
  private settingsPath: string;
  private legacySettingsPath: string;

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : (process.env.APPDATA || process.cwd());
    this.configDir = path.join(userData, 'config');
    this.settingsPath = path.join(this.configDir, 'settings.json');
    this.legacySettingsPath = path.join(userData, 'settings.json');
  }

  private async ensureInitialized(): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });
    // Check if legacy settings exist and migrate if target does not
    try {
      await fs.access(this.settingsPath);
    } catch {
      try {
        const legacyData = await fs.readFile(this.legacySettingsPath, 'utf-8');
        await fs.writeFile(this.settingsPath, legacyData, 'utf-8');
      } catch {
        // No legacy file, normal initial run
      }
    }
  }

  public async loadSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return DEFAULT_SETTINGS;
      }
      console.error('[SettingsManager] Error parsing settings, backing up corrupted file:', error);
      try {
        const backupPath = path.join(this.configDir, `settings.corrupted.${Date.now()}.json`);
        await fs.rename(this.settingsPath, backupPath);
      } catch {}
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const current = await this.loadSettings();
      const updated = { ...current, ...settings };
      const tempPath = path.join(this.configDir, `settings.tmp.${Date.now()}`);
      await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
      await fs.rename(tempPath, this.settingsPath);
      return true;
    } catch (error) {
      console.error('[SettingsManager] Failed atomic save:', error);
      return false;
    }
  }

  public getStorageInfo(): { settingsPath: string; configDir: string; userDataDir: string } {
    return {
      settingsPath: this.settingsPath,
      configDir: this.configDir,
      userDataDir: app.getPath('userData'),
    };
  }

  public async openSettingsFolder(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      await shell.openPath(this.configDir);
      return true;
    } catch (err) {
      console.error('[SettingsManager] Failed to open config folder:', err);
      return false;
    }
  }
}

export const settingsManager = new SettingsManager();
