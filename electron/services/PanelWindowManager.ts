import { BrowserWindow } from 'electron';
import path from 'path';

export class PanelWindowManager {
  private detachedWindows = new Map<string, BrowserWindow>();
  private redockingPanels = new Set<string>();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  detachPanel(panelId: string): boolean {
    if (this.detachedWindows.has(panelId)) {
      const existing = this.detachedWindows.get(panelId);
      existing?.focus();
      return true;
    }

    const win = new BrowserWindow({
      width: 980,
      height: 680,
      minWidth: 420,
      minHeight: 320,
      frame: false,
      transparent: true,
      backgroundColor: '#0a0a0a00',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    this.detachedWindows.set(panelId, win);

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
      win.loadURL(`${devUrl}?panel=${panelId}&detached=true`);
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'), {
        query: { panel: panelId, detached: 'true' }
      });
    }

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

  redockPanel(panelId: string): boolean {
    const win = this.detachedWindows.get(panelId);
    if (win) {
      this.redockingPanels.add(panelId);
      if (!win.isDestroyed()) {
        win.close();
      }
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
  }
}

export const panelWindowManager = new PanelWindowManager();
