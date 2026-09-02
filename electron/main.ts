import { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { simpleGit, SimpleGit } from 'simple-git';
import { WebSocketServer } from 'ws';
import { settingsManager } from './services/SettingsManager';
import { URL } from 'url';

// Force single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Register custom protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('lam-studio', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('lam-studio');
}

try {
  // @ts-ignore
  require('dotenv').config();
} catch (e) {
  // ignore
}

const gitignoreCache: Record<string, RegExp[]> = {};

const checkIsIgnored = async (targetPath: string): Promise<boolean> => {
  if (targetPath.includes('node_modules') || targetPath.includes('.git')) return true;

  let currentDir = path.dirname(targetPath);
  let depth = 0;

  while (depth < 5) {
    const gitignorePath = path.join(currentDir, '.gitignore');

    if (!gitignoreCache[gitignorePath]) {
      try {
        const content = await fs.readFile(gitignorePath, 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        gitignoreCache[gitignorePath] = lines.map(line => {
          let pattern = line.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
          return new RegExp('(^|/)' + pattern + '($|/)');
        });
      } catch (e) {
        gitignoreCache[gitignorePath] = [];
      }
    }

    const rules = gitignoreCache[gitignorePath];
    for (const rule of rules) {
      if (rule.test(targetPath)) return true;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
    depth++;
  }

  return false;
};

// Set up WebSocket server
const setupWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server on port 8080');

    ws.on('message', (message) => {
      console.log('Received message from client:', message.toString());
      // Here we would handle commands from the IDE extensions
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    // Notify client of connection success
    ws.send(JSON.stringify({ status: 'connected', message: 'Welcome to L.A.M Agent Studio Server' }));
  });

  console.log('WebSocket Server running on ws://localhost:8080');
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Handle IPC calls securely
  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const processedFiles = await Promise.all(files.map(async f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        isIgnored: await checkIsIgnored(path.join(dirPath, f.name))
      })));

      const sortedFiles = processedFiles.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      return { success: true, data: sortedFiles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:createFile', async (_, filePath: string) => {
    try {
      await fs.writeFile(filePath, '', 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:createFolder', async (_, folderPath: string) => {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:delete', async (_, targetPath: string) => {
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:replace', async (_, filePath: string, query: string, replacement: string, options?: { matchCase?: boolean, wholeWord?: boolean }) => {
    try {
      const { matchCase, wholeWord } = options || {};
      const flags = matchCase ? 'g' : 'gi';

      let searchRegex: RegExp;
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        searchRegex = new RegExp(`\\b${escapedQuery}\\b`, flags);
      } else {
        searchRegex = new RegExp(escapedQuery, flags);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const newContent = content.replace(searchRegex, replacement);
      await fs.writeFile(filePath, newContent, 'utf-8');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Git Endpoints
  ipcMain.handle('git:status', async (_, repoPath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const status = await git.status();
      // Serialize to plain JSON to prevent Electron IPC "object could not be cloned" error
      return { success: true, data: JSON.parse(JSON.stringify(status)) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:diff', async (_, repoPath: string, filePath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = await git.diff([filePath]);
      return { success: true, data: diff };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:add', async (_, repoPath: string, filePath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.add(filePath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:unstage', async (_, repoPath: string, filePath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.reset(['HEAD', filePath]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:commit', async (_, repoPath: string, message: string, options?: any) => {
    try {
      const git = simpleGit(repoPath);

      const commitArgs: string[] = [];
      if (options?.amend) commitArgs.push('--amend');
      if (options?.noVerify) commitArgs.push('--no-verify');
      if (options?.signoff) commitArgs.push('--signoff');
      if (options?.allowEmpty) commitArgs.push('--allow-empty');

      if (commitArgs.length > 0) {
        await git.commit(message, commitArgs);
      } else {
        await git.commit(message);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:discard', async (_, repoPath: string, filePath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.checkout([filePath]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:push', async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      await git.push();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:pull', async (_, repoPath: string, branchName?: string) => {
    try {
      const git = simpleGit(repoPath);
      if (branchName) {
        // Strip remote prefix if present, we just want the pure branch name, simple-git uses 'origin' by default if we pass it
        let cleanName = branchName.replace(/^remotes\/origin\//, '').replace(/^origin\//, '');
        await git.pull('origin', cleanName);
      } else {
        await git.pull();
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:fetch', async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      await git.fetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:branch', async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      const branches = await git.branch();
      return { success: true, data: JSON.parse(JSON.stringify(branches)) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:checkout', async (_, repoPath: string, branchName: string) => {
    try {
      const git = simpleGit(repoPath);
      await git.checkout(branchName);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:clone', async (_, url: string, localPath: string) => {
    try {
      const git = simpleGit();
      await git.clone(url, localPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:getFileContent', async (_, repoPath: string, filePath: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      // If filePath is absolute, make it relative. Otherwise, it's already relative.
      const relativePath = path.isAbsolute(filePath) ? path.relative(repoPath, filePath) : filePath;
      // Ensure path uses forward slashes for git show
      const normalizedPath = relativePath.replace(/\\/g, '/');
      const content = await git.show([`HEAD:${normalizedPath}`]);
      return { success: true, data: content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Window Controls
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    win?.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    win?.close();
  });

  // Settings
  ipcMain.handle('settings:load', async () => {
    return await settingsManager.loadSettings();
  });

  ipcMain.handle('settings:save', async (_, data) => {
    return await settingsManager.saveSettings(data);
  });

  // Dialogs & Workspace
  ipcMain.handle('dialog:pickDirectory', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { canceled: true };

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return { canceled: false, folderPath: result.filePaths[0] };
  });

  ipcMain.handle('dialog:openDirectory', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { canceled: true };

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const folderPath = result.filePaths[0];
    try {
      const dirFiles = await fs.readdir(folderPath, { withFileTypes: true });
      const processedFiles = await Promise.all(dirFiles.map(async f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        isIgnored: await checkIsIgnored(path.join(folderPath, f.name))
      })));

      const sortedFiles = processedFiles.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      return { canceled: false, folderPath, files: sortedFiles };
    } catch (error: any) {
      return { canceled: false, error: error.message };
    }
  });

  // Recursive search endpoint
  ipcMain.handle('fs:search', async (_, query: string, dirPath: string, options?: { matchCase?: boolean, wholeWord?: boolean, filePattern?: string }) => {
    const results: any[] = [];
    if ((!query || !query.trim()) && (!options?.filePattern || !options.filePattern.trim())) {
      return { success: true, data: results };
    }

    let searchRegex: RegExp | null = null;
    if (query && query.trim()) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let flags = 'g';
      if (!options?.matchCase) flags += 'i';

      if (options?.wholeWord) {
        searchRegex = new RegExp(`\\b${escapedQuery}\\b`, flags);
      } else {
        searchRegex = new RegExp(escapedQuery, flags);
      }
    }

    const searchRecursive = async (currentPath: string) => {
      if (results.length >= 500) return;
      try {
        if (await checkIsIgnored(currentPath)) return;

        const stat = await fs.stat(currentPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(currentPath);
          for (const f of files) {
            if (results.length >= 500) return;
            if (f.startsWith('.')) continue; // Skip hidden/system files
            await searchRecursive(path.join(currentPath, f));
          }
        } else if (stat.isFile()) {
          if (options?.filePattern) {
            const fileName = path.basename(currentPath);
            const lowerPattern = options.filePattern.toLowerCase();
            if (!fileName.toLowerCase().includes(lowerPattern)) {
              return;
            }
          }

          // Skip known binaries/assets based on extension
          const ext = path.extname(currentPath).toLowerCase();
          const skipExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.wav', '.exe', '.dll'];
          if (skipExts.includes(ext)) return;

          if (!searchRegex) {
            // Only searching by file name!
            results.push({
              file: currentPath,
              line: 1,
              content: ''
            });
          } else {
            const content = await fs.readFile(currentPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (results.length >= 500) return;
              if (searchRegex!.test(line)) {
                results.push({
                  file: currentPath,
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
          }
        }
      } catch (e) {
        // Skip inaccessible files
      }
    };

    try {
      await searchRecursive(dirPath);
      // Sort results alphabetically by file name
      results.sort((a, b) => a.file.localeCompare(b.file));
      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Load the React app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Removed automatic openDevTools() to fix Chromium Autofill error spam
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Register shortcut to toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.toggleDevTools();
  });
};

// Global variable to hold the resolver for the auth deep link
let authDeepLinkResolver: ((value: any) => void) | null = null;

// Handle deep links (macOS)
app.on('open-url', (event, urlStr) => {
  event.preventDefault();
  handleAuthDeepLink(urlStr);
});

// Handle deep links (Windows/Linux)
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
  
  // Find the argument that matches our custom protocol
  const urlStr = commandLine.find(arg => arg.startsWith('lam-studio://'));
  
  if (urlStr) {
    handleAuthDeepLink(urlStr);
  }
});

function handleAuthDeepLink(urlStr: string) {
  try {
    const urlObj = new URL(urlStr);
    if (urlObj.protocol === 'lam-studio:') {
      const token = urlObj.searchParams.get('token');
      if (token && authDeepLinkResolver) {
        authDeepLinkResolver({ success: true, token });
        authDeepLinkResolver = null;
      }
    }
  } catch (e) {
    console.error("Failed to parse deep link", e);
  }
}

app.whenReady().then(() => {
  setupWebSocketServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  ipcMain.handle('github:login', async () => {
    return new Promise((resolve) => {
      // 1. Open browser to the proxy server
      const proxyUrl = process.env.AUTH_PROXY_URL || 'http://localhost:3000';
      shell.openExternal(`${proxyUrl}/auth/github`);

      // 2. Set up the resolver for the deep link to call
      authDeepLinkResolver = resolve;

      // 3. Timeout after 5 minutes
      setTimeout(() => {
        if (authDeepLinkResolver === resolve) {
          authDeepLinkResolver = null;
          resolve({ success: false, error: 'Login timed out waiting for browser redirect' });
        }
      }, 5 * 60 * 1000);
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
