import fs from 'fs/promises';
import path from 'path';
import { app, shell } from 'electron';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeStyle = 'glassmorphism' | 'minimalism' | 'paper-ink';

export interface AppearanceConfig {
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  accentColor: string;
  activePreset?: string;
  updatedAt: number;
  version: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  themeStyle: ThemeStyle;
  themeMode: ThemeMode;
  accentColor: string;
}

const DEFAULT_APPEARANCE: AppearanceConfig = {
  themeMode: 'dark',
  themeStyle: 'glassmorphism',
  accentColor: '#3b82f6',
  activePreset: 'glassmorphism',
  updatedAt: Date.now(),
  version: '1.0.0'
};

const BUILTIN_PRESETS: ThemePreset[] = [
  { id: 'glassmorphism', name: 'Glassmorphism Prime', description: 'Frosted glass translucency, specular glow, and ambient depth.', themeStyle: 'glassmorphism', themeMode: 'dark', accentColor: '#3b82f6' },
  { id: 'minimalism', name: 'Minimalism Swiss Solid', description: 'High-contrast flat surfaces, razor-sharp 1px borders, zero blur.', themeStyle: 'minimalism', themeMode: 'dark', accentColor: '#3b82f6' },
  { id: 'paper-ink', name: 'Paper & Ink Editorial', description: 'Tactile parchment, deckle-edge elevation, and deep letterpress ink.', themeStyle: 'paper-ink', themeMode: 'dark', accentColor: '#854d0e' },
];

export class ThemeStorageManager {
  private themesDir: string;
  private appearancePath: string;
  private presetsDir: string;

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : (process.env.APPDATA || process.cwd());
    this.themesDir = path.join(userData, 'config', 'themes');
    this.appearancePath = path.join(this.themesDir, 'appearance.json');
    this.presetsDir = path.join(this.themesDir, 'presets');
  }

  public async ensureInitialized(): Promise<void> {
    await fs.mkdir(this.presetsDir, { recursive: true });
    try { await fs.access(this.appearancePath); } catch {
      await fs.writeFile(this.appearancePath, JSON.stringify(DEFAULT_APPEARANCE, null, 2), 'utf-8');
    }
    for (const preset of BUILTIN_PRESETS) {
      const presetFile = path.join(this.presetsDir, `${preset.id}.json`);
      try { await fs.access(presetFile); } catch {
        await fs.writeFile(presetFile, JSON.stringify(preset, null, 2), 'utf-8');
      }
    }
  }

  public async loadAppearance(): Promise<AppearanceConfig> {
    await this.ensureInitialized();
    try {
      const data = await fs.readFile(this.appearancePath, 'utf-8');
      return { ...DEFAULT_APPEARANCE, ...JSON.parse(data) };
    } catch {
      return DEFAULT_APPEARANCE;
    }
  }

  public async saveAppearance(config: Partial<AppearanceConfig>): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const current = await this.loadAppearance();
      const updated = { ...current, ...config, updatedAt: Date.now() };
      const tempPath = path.join(this.themesDir, `appearance.tmp.${Date.now()}`);
      await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
      await fs.rename(tempPath, this.appearancePath);
      return true;
    } catch (err) {
      console.error('[ThemeStorageManager] Failed to save appearance:', err);
      return false;
    }
  }

  public async listPresets(): Promise<ThemePreset[]> {
    await this.ensureInitialized();
    try {
      const files = await fs.readdir(this.presetsDir);
      const presets: ThemePreset[] = [];
      for (const f of files.filter(x => x.endsWith('.json'))) {
        try {
          const raw = await fs.readFile(path.join(this.presetsDir, f), 'utf-8');
          presets.push(JSON.parse(raw));
        } catch {}
      }
      return presets.length > 0 ? presets : BUILTIN_PRESETS;
    } catch {
      return BUILTIN_PRESETS;
    }
  }

  public async savePreset(id: string, preset: Partial<ThemePreset>): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const target = path.join(this.presetsDir, `${id}.json`);
      const payload: ThemePreset = {
        id,
        name: preset.name || id,
        description: preset.description || '',
        themeStyle: preset.themeStyle || 'glassmorphism',
        themeMode: preset.themeMode || 'dark',
        accentColor: preset.accentColor || '#3b82f6',
      };
      await fs.writeFile(target, JSON.stringify(payload, null, 2), 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  public getStorageInfo(): { themesDir: string; appearancePath: string; presetsDir: string } {
    return { themesDir: this.themesDir, appearancePath: this.appearancePath, presetsDir: this.presetsDir };
  }

  public async openThemesFolder(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      await shell.openPath(this.themesDir);
      return true;
    } catch {
      return false;
    }
  }
}

export const themeStorageManager = new ThemeStorageManager();
