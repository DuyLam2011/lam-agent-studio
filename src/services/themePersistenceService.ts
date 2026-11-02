import { ThemeMode, ThemeStyle } from '../utils/themeManager';

export interface ThemeStorageInfo {
  themesDir: string;
  appearancePath: string;
  presetsDir: string;
}

export const saveAppearanceSettings = async (
  themeMode: ThemeMode,
  themeStyle: ThemeStyle,
  accentColor: string
): Promise<boolean> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lam_theme_mode', themeMode);
      localStorage.setItem('lam_theme_style', themeStyle);
      localStorage.setItem('lam_accent_color', accentColor);
    }

    // @ts-ignore
    if (window.lamApi?.themeAPI?.saveConfig) {
      // @ts-ignore
      await window.lamApi.themeAPI.saveConfig({ themeMode, themeStyle, accentColor });
      return true;
    }

    // @ts-ignore
    if (window.lamApi?.settingsAPI?.saveSettings) {
      // @ts-ignore
      await window.lamApi.settingsAPI.saveSettings({ themeMode, themeStyle, accentColor });
      return true;
    }
  } catch (err) {
    console.error('[ThemePersistenceService] Error persisting theme settings:', err);
  }
  return false;
};

export const fetchThemeStorageInfo = async (): Promise<ThemeStorageInfo | null> => {
  try {
    // @ts-ignore
    if (window.lamApi?.themeAPI?.getStorageInfo) {
      // @ts-ignore
      return await window.lamApi.themeAPI.getStorageInfo();
    }
    // @ts-ignore
    if (window.lamApi?.settingsAPI?.getStorageInfo) {
      // @ts-ignore
      const info = await window.lamApi.settingsAPI.getStorageInfo();
      return {
        themesDir: `${info.configDir}/themes`,
        appearancePath: `${info.configDir}/themes/appearance.json`,
        presetsDir: `${info.configDir}/themes/presets`,
      };
    }
  } catch (err) {
    console.error('[ThemePersistenceService] Error fetching storage info:', err);
  }
  return null;
};

export const openThemesStorageFolder = async (): Promise<boolean> => {
  try {
    // @ts-ignore
    if (window.lamApi?.themeAPI?.openFolder) {
      // @ts-ignore
      return await window.lamApi.themeAPI.openFolder();
    }
    // @ts-ignore
    if (window.lamApi?.settingsAPI?.openSettingsFolder) {
      // @ts-ignore
      return await window.lamApi.settingsAPI.openSettingsFolder();
    }
  } catch (err) {
    console.error('[ThemePersistenceService] Error opening themes folder:', err);
  }
  return false;
};
