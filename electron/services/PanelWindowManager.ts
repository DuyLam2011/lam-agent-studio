import { BrowserWindow } from 'electron';
import path from 'path';

export class PanelWindowManager {
  private detachedWindows = new Map<string, BrowserWindow>();
  private redockingPanels = new Set<string>();
  private fatherWindow: BrowserWindow | null = null;
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  private createFramelessWindow(width = 980, height = 680): BrowserWindow {
    return new BrowserWindow({
      width,
      height,
      minWidth: 420,
      minHeight: 360,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      ...(process.platform === 'win32' ? { backgroundMaterial: 'acrylic' as const } : {}),
      ...(process.platform === 'darwin' ? { vibrancy: 'under-window' as const } : {}),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
  }

  detachPanel(panelId: string): boolean {
    if (this.detachedWindows.has(panelId)) {
      this.detachedWindows.get(panelId)?.focus();
      return true;
    }

    const win = this.createFramelessWindow(980, 680);
    this.detachedWindows.set(panelId, win);

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) win.loadURL(`${devUrl}?panel=${panelId}&detached=true`);
    else win.loadFile(path.join(__dirname, '../dist/index.html'), { query: { panel: panelId, detached: 'true' } });

    win.on('closed', () => {
      this.detachedWindows.delete(panelId);
      if (this.redockingPanels.has(panelId)) {
        this.redockingPanels.delete(panelId);
        this.notifyRedock(panelId);
      } else {
        this.notifyClose(panelId);
      }
    });
    return true;
  }

  openFatherWindow(initialPrompt?: string): boolean {
    if (this.fatherWindow && !this.fatherWindow.isDestroyed()) {
      this.fatherWindow.focus();
      if (initialPrompt) this.fatherWindow.webContents.send('father:prompt', initialPrompt);
      return true;
    }

    const win = this.createFramelessWindow(960, 740);
    this.fatherWindow = win;
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    const promptParam = initialPrompt ? `&prompt=${encodeURIComponent(initialPrompt)}` : '';

    if (devUrl) {
      win.loadURL(`${devUrl}?mode=father-window&detached=true${promptParam}`);
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'), {
        query: { mode: 'father-window', detached: 'true', ...(initialPrompt ? { prompt: initialPrompt } : {}) }
      });
    }

    win.on('closed', () => { this.fatherWindow = null; });
    return true;
  }

  redockPanel(panelId: string): boolean {
    const win = this.detachedWindows.get(panelId);
    if (win) {
      this.redockingPanels.add(panelId);
      if (!win.isDestroyed()) win.close();
      return true;
    }
    this.notifyRedock(panelId);
    return true;
  }

  closeDetachedPanel(panelId: string): boolean {
    const win = this.detachedWindows.get(panelId);
    if (win && !win.isDestroyed()) {
      this.detachedWindows.delete(panelId);
      this.notifyClose(panelId);
      win.destroy();
      return true;
    }
    return false;
  }

  private notifyRedock(panelId: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('panel:redocked', panelId);
      this.mainWindow.focus();
    }
  }

  private notifyClose(panelId: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('panel:closed', panelId);
    }
  }

  closeAll() {
    for (const [, win] of this.detachedWindows) {
      if (!win.isDestroyed()) win.close();
    }
    this.detachedWindows.clear();
    if (this.fatherWindow && !this.fatherWindow.isDestroyed()) {
      this.fatherWindow.close();
    }
    this.fatherWindow = null;
  }
}

export const panelWindowManager = new PanelWindowManager();
