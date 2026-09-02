import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export interface SavedWorkspace {
  id: string;
  name: string;
  folders: string[];
}

export interface AppSettings {
  theme: string;
  aiModel: string;
  workspaces: SavedWorkspace[];
  activeWorkspaceId: string | null;
  [key: string]: any;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  aiModel: 'gemini-1.5-pro',
  workspaces: [{ id: 'default', name: 'Default Workspace', folders: [] }],
  activeWorkspaceId: 'default',
};

export class SettingsManager {
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }

  public async loadSettings(): Promise<AppSettings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return default settings
        return DEFAULT_SETTINGS;
      }
      console.error('Error reading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await fs.writeFile(this.settingsPath, JSON.stringify(updatedSettings, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
}

export const settingsManager = new SettingsManager();
