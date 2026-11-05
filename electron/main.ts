import { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { simpleGit, SimpleGit } from 'simple-git';
import { WebSocketServer } from 'ws';
import { settingsManager } from './services/SettingsManager';
import { themeStorageManager } from './services/ThemeStorageManager';
import { resourceBenchmarkManager } from './services/ResourceBenchmarkManager';
import { agentEngine } from './services/AgentEngine';
import { agentRunRegistry } from './agent/AgentRunRegistry';
import type { AgentPromptOptions } from './agent/types';
import type { AgentStreamEvent } from '../src/types/agent-stream';
import { panelWindowManager } from './services/PanelWindowManager';
import { terminalService } from './services/TerminalService';
import { securityHarnessService } from './services/SecurityHarnessService';
import { ollamaDeploymentService } from './services/OllamaDeploymentService';
import { cloudKeyValidator } from './services/CloudKeyValidator';
import { contextBatchEngine } from './services/ContextBatchEngine';
import { localPersistenceService } from './services/LocalPersistenceService';
import { browserInspectionService } from './services/BrowserInspectionService';
import { googleAccountService } from './services/GoogleAccountService';
import { codexAccountService } from './services/CodexAccountService';
import { claudeAccountService } from './services/ClaudeAccountService';
import { URL } from 'url';

// Suppress standard dev-only protocol warnings
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Set uniform application name for userData storage across dev and production
app.name = 'lam-agent-studio';

// Force single instance lock in production
if (app.isPackaged) {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    process.exit(0);
  }
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

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0b10',
    ...(process.platform === 'win32' ? { backgroundMaterial: 'acrylic' as const } : {}),
    ...(process.platform === 'darwin' ? { vibrancy: 'under-window' as const } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  panelWindowManager.setMainWindow(mainWindow);
  terminalService.setWebContents(mainWindow.webContents);

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

  ipcMain.handle('fs:listWorkspaceFiles', async (_, rootDir: string, maxFiles: number = 800) => {
    try {
      const results: Array<{ path: string; relativePath: string; name: string }> = [];
      const folders: Array<{ path: string; relativePath: string; name: string }> = [];
      const ignored = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'build', '.next', '.vscode', '.cache', 'coverage']);

      const scan = async (dir: string) => {
        if (results.length >= maxFiles) return;
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= maxFiles) return;
          if (entry.name.startsWith('.') && entry.name !== '.env') continue;
          if (ignored.has(entry.name)) continue;

          const fullPath = path.join(dir, entry.name);
          const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          if (entry.isDirectory()) {
            folders.push({ path: fullPath, relativePath: rel, name: entry.name });
            await scan(fullPath);
          } else {
            results.push({
              path: fullPath,
              relativePath: rel,
              name: entry.name
            });
          }
        }
      };

      await scan(rootDir);
      return { success: true, files: results, folders };
    } catch (error: any) {
      return { success: false, error: error.message, files: [], folders: [] };
    }
  });

  ipcMain.handle('fs:packFolderContext', async (_, folderPath: string, maxFiles: number = 30) => {
    try {
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) {
        return { success: false, error: 'Target path is not a directory' };
      }

      const folderName = path.basename(folderPath);
      const ignored = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'build', '.next', '.vscode', '.cache', 'coverage']);
      const skipExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.wav', '.exe', '.dll', '.bin', '.iso', '.woff', '.woff2', '.ttf', '.eot', '.lock']);

      const scannedFiles: Array<{ relPath: string; fullPath: string; size: number }> = [];
      const treeLines: string[] = [];

      const walk = async (currentDir: string, prefix: string = '') => {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        const visible = entries.filter(e => !ignored.has(e.name) && (!e.name.startsWith('.') || e.name === '.env'));

        for (let i = 0; i < visible.length; i++) {
          const entry = visible[i];
          const isLast = i === visible.length - 1;
          const marker = isLast ? '└── ' : '├── ';
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          const fullPath = path.join(currentDir, entry.name);
          const relPath = path.relative(folderPath, fullPath).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            treeLines.push(`${prefix}${marker}${entry.name}/`);
            await walk(fullPath, nextPrefix);
          } else {
            treeLines.push(`${prefix}${marker}${entry.name}`);
            const ext = path.extname(entry.name).toLowerCase();
            if (!skipExts.has(ext)) {
              try {
                const s = await fs.stat(fullPath);
                if (s.size < 500000) {
                  scannedFiles.push({ relPath, fullPath, size: s.size });
                }
              } catch {}
            }
          }
        }
      };

      await walk(folderPath);

      const filesToRead = scannedFiles.slice(0, maxFiles);
      const fileContents: string[] = [];

      for (const f of filesToRead) {
        try {
          const raw = await fs.readFile(f.fullPath, 'utf-8');
          const preview = raw.length > 5000 ? raw.slice(0, 5000) + '\n... [content truncated]' : raw;
          fileContents.push(`--- File: ${f.relPath} ---\n\`\`\`\n${preview}\n\`\`\``);
        } catch {}
      }

      const snippet = `### 📁 FOLDER CONTEXT: ${folderName}/
Absolute Path: ${folderPath}
Total Files: ${scannedFiles.length}

#### Structure:
\`\`\`
${folderName}/
${treeLines.slice(0, 100).join('\n')}${treeLines.length > 100 ? '\n... (truncated)' : ''}
\`\`\`

#### File Contents Preview (${filesToRead.length} files included):
${fileContents.join('\n\n')}`;

      const tokenEstimate = Math.max(250, Math.ceil(snippet.length / 3.8));

      return {
        success: true,
        name: `${folderName}/`,
        path: folderPath,
        type: 'folder',
        totalFiles: scannedFiles.length,
        tokenEstimate,
        snippet
      };
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

  ipcMain.handle('fs:saveFile', async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
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

  ipcMain.handle('git:diff', async (_, repoPath: string, filePath?: string) => {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = (filePath && filePath.trim() !== '') ? await git.diff([filePath]) : await git.diff();
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
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });

  // Settings
  ipcMain.handle('settings:load', async () => {
    return await settingsManager.loadSettings();
  });

  ipcMain.handle('settings:save', async (_, data) => {
    return await settingsManager.saveSettings(data);
  });

  ipcMain.handle('settings:getStorageInfo', async () => {
    return settingsManager.getStorageInfo();
  });

  ipcMain.handle('settings:openSettingsFolder', async () => {
    return await settingsManager.openSettingsFolder();
  });

  // Dedicated Theme & Appearance Storage Handlers
  ipcMain.handle('theme:loadConfig', async () => {
    return await themeStorageManager.loadAppearance();
  });

  ipcMain.handle('theme:saveConfig', async (_, data) => {
    const success = await themeStorageManager.saveAppearance(data);
    if (success) {
      await settingsManager.saveSettings({
        themeMode: data.themeMode,
        themeStyle: data.themeStyle,
        accentColor: data.accentColor,
        theme: data.themeMode
      });
    }
    return success;
  });

  ipcMain.handle('theme:getStorageInfo', async () => {
    return themeStorageManager.getStorageInfo();
  });

  ipcMain.handle('theme:openFolder', async () => {
    return await themeStorageManager.openThemesFolder();
  });

  ipcMain.handle('theme:listPresets', async () => {
    return await themeStorageManager.listPresets();
  });

  ipcMain.handle('theme:savePreset', async (_, id, preset) => {
    return await themeStorageManager.savePreset(id, preset);
  });

  // Resource & Benchmark Engine Telemetry
  ipcMain.handle('system:getMetrics', async () => {
    return resourceBenchmarkManager.getSystemMetrics();
  });

  ipcMain.handle('system:runBenchmark', async () => {
    return await resourceBenchmarkManager.runBenchmark();
  });

  ipcMain.handle('system:optimizeResources', async () => {
    return resourceBenchmarkManager.optimizeResources();
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

  // Log renderer console messages and load failures to terminal stdout
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Renderer Fail Load] ${errorCode}: ${errorDescription} on ${validatedURL}`);
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer Console L${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[Renderer Gone] reason=${details.reason}, exitCode=${details.exitCode}`);
  });

  // Load the React app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Register shortcut to toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow?.webContents.toggleDevTools();
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
app.on('second-instance', (_event, commandLine, _workingDirectory) => {
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

ipcMain.handle('rules:scanRepoRules', async (_, repoPath: string) => {
  try {
    const candidates = ['GEMINI.md', 'CLAUDE.md', '.cursorrules', '.windsurfrules', '.rules', '.agentrules', 'RULES.md'];
    const found: any[] = [];
    for (const name of candidates) {
      const fullPath = path.join(repoPath, name);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          const content = await fs.readFile(fullPath, 'utf-8');
          found.push({
            name,
            filePath: fullPath,
            content,
            size: stat.size
          });
        }
      } catch {
        // file does not exist, continue
      }
    }
    return { success: true, data: found };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rules:saveRule', async (_, targetRepoPath: string, fileName: string, content: string) => {
  try {
    const cleanFileName = fileName?.trim() || 'GEMINI.md';
    const targetFilePath = path.isAbsolute(cleanFileName) ? cleanFileName : path.join(targetRepoPath, cleanFileName);
    await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fs.writeFile(targetFilePath, content, 'utf-8');
    return { success: true, filePath: targetFilePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('skills:scanRepoSkills', async (_, repoPath: string) => {
  try {
    const candidateDirs = [
      path.join(repoPath, '.agents', 'skills'),
      path.join(repoPath, '.gemini', 'skills'),
      path.join(repoPath, '.cursor', 'skills'),
      path.join(repoPath, '.skills'),
      path.join(repoPath, 'skills'),
    ];
    const found: any[] = [];

    for (const baseDir of candidateDirs) {
      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillFilePath = path.join(baseDir, entry.name, 'SKILL.md');
            try {
              const stat = await fs.stat(skillFilePath);
              if (stat.isFile()) {
                const content = await fs.readFile(skillFilePath, 'utf-8');
                let skillName = entry.name;
                let description = '';
                const match = content.match(/^---\s*([\s\S]*?)\s*---/);
                if (match) {
                  const frontmatter = match[1];
                  const nameMatch = frontmatter.match(/name:\s*([^\r\n]+)/);
                  if (nameMatch) skillName = nameMatch[1].trim();
                  const descMatch = frontmatter.match(/description:\s*([^\r\n]+)/);
                  if (descMatch) description = descMatch[1].trim();
                }

                const alreadyFound = found.some(
                  (f) =>
                    f.folderName.toLowerCase() === entry.name.toLowerCase() ||
                    f.filePath.replace(/\\/g, '/').toLowerCase() === skillFilePath.replace(/\\/g, '/').toLowerCase()
                );
                if (!alreadyFound) {
                  found.push({
                    name: skillName,
                    folderName: entry.name,
                    description: description || `Skill: ${skillName}`,
                    filePath: skillFilePath,
                    content,
                    size: stat.size,
                    repoPath
                  });
                }
              }
            } catch {
              // no SKILL.md in this folder
            }
          }
        }
      } catch {
        // baseDir does not exist
      }
    }
    return { success: true, data: found };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('skills:saveSkill', async (_, targetRepoPath: string, folderName: string, content: string) => {
  try {
    const cleanFolderName = folderName.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
    const targetDir = path.join(targetRepoPath, '.agents', 'skills', cleanFolderName);
    await fs.mkdir(targetDir, { recursive: true });
    const targetFilePath = path.join(targetDir, 'SKILL.md');
    await fs.writeFile(targetFilePath, content, 'utf-8');
    return { success: true, filePath: targetFilePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import:fetchGithub', async (_, url: string) => {
  try {
    let targetUrl = url.trim();
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    } else if (targetUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/)) {
      const match = targetUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/)!;
      targetUrl = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/main/README.md`;
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      if (targetUrl.includes('/main/')) {
        const altUrl = targetUrl.replace('/main/', '/master/');
        const altRes = await fetch(altUrl);
        if (altRes.ok) {
          const content = await altRes.text();
          return { success: true, content, sourceUrl: altUrl };
        }
      }
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const content = await res.text();
    return { success: true, content, sourceUrl: targetUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch GitHub URL' };
  }
});

ipcMain.handle('import:pickLocalFile', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Agent Configurations & Documents', extensions: ['md', 'rules', 'json', 'yaml', 'yml', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    return { success: true, filePath, fileName, content };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

export type AIPromptOptions = Omit<AgentPromptOptions, 'signal' | 'onEvent'>;

ipcMain.handle('ai:sendPrompt', async (event, text: string, options?: AIPromptOptions) => {
  const trimmed = text.trim();
  const runId = options?.runId || `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sender = event.sender;
  let seq = 0;
  const emit = (agentEvent: AgentStreamEvent) => {
    if (!sender.isDestroyed()) sender.send('ai:agentEvent', { ...agentEvent, runId, seq: seq++, at: Date.now() });
  };

  // 1. Explicit Slash Commands in Studio
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('/caveman')) {
      mainWindow?.webContents.send('ai-tool-call', { name: 'aiSetCommunicationTone', args: { tone: 'caveman', verbosity: 'terse' } });
      return {
        text: "🪨 **Caveman Mode Active**: Tone set to ultra-compressed. Verbosity: terse (~75% token reduction). Fluff removed.",
        thinking: "User engaged /caveman command. Switched tone to caveman and verbosity to terse for maximum token efficiency.",
        toolCalls: [
          { id: 'tc-caveman', name: 'engine:set_tone', args: { tone: 'caveman', verbosity: 'terse' }, status: 'success', executionTimeMs: 10, autoApproved: true }
        ]
      };
    }

    if (trimmed.startsWith('/terminal')) {
      mainWindow?.webContents.send('ai-tool-call', { name: 'aiSetSkillActive', args: { skillName: 'Terminal Access', active: true } });
      return {
        text: "⚡ Terminal Bash execution skill has been enabled.",
        thinking: "User requested shell execution privileges. Dispatched aiSetSkillActive with status active: true.",
        toolCalls: [
          { id: 'tc-term', name: 'skill:activate', args: { skill: 'Terminal Access' }, status: 'success', executionTimeMs: 45, autoApproved: true }
        ]
      };
    }

    if (trimmed.startsWith('/navigate') || trimmed.startsWith('/goto')) {
      const parts = trimmed.split(/\s+/);
      let target = parts[1]?.toLowerCase() || 'explorer';
      if (!['explorer', 'git', 'search', 'debug', 'extensions', 'settings'].includes(target)) target = 'explorer';
      mainWindow?.webContents.send('ai-tool-call', { name: 'aiNavigate', args: { target } });
      return {
        text: `Navigated to **${target.toUpperCase()}** view.`,
        thinking: `Dispatched client navigation event to activeSidebarTab: ${target}`,
        toolCalls: [
          { id: 'tc-nav', name: 'ide:navigate', args: { target }, status: 'success', executionTimeMs: 18, autoApproved: true }
        ]
      };
    }
  }

  // 2. Real Autonomous Agent Execution via AgentEngine (streamed to the calling window)
  const controller = agentRunRegistry.start(runId);
  try {
    const settings = await settingsManager.loadSettings();
    const effectiveApiKey = options?.apiKey || settings.aiApiKey || process.env.GEMINI_API_KEY || '';
    const effectiveProvider = options?.provider || settings.aiProvider || (effectiveApiKey ? 'gemini' : 'offline');

    const result = await agentEngine.processPrompt(text, {
      ...options,
      apiKey: effectiveApiKey,
      provider: effectiveProvider,
      baseUrl: options?.baseUrl || settings.aiBaseUrl,
      signal: controller.signal,
      onEvent: emit
    });

    emit({ type: 'run_finished', status: result.status || 'completed' });
    return { ...result, runId };
  } catch (error: any) {
    console.error('AgentEngine processing error:', error);
    const message = error?.message || 'Failed to process prompt.';
    emit({ type: 'run_finished', status: 'failed', error: message });
    return {
      runId,
      status: 'failed',
      text: `⚠️ **Agent Execution Notice**: ${message}`,
      toolCalls: [
        { id: 'tc-err', name: 'agent:error', args: { error: message }, status: 'failed', result: message }
      ]
    };
  } finally {
    agentRunRegistry.finish(runId, controller);
  }
});

ipcMain.handle('ai:cancelRun', async (_, runId: string) => agentRunRegistry.cancel(runId));

ipcMain.handle('ai:executeTool', async (_, toolName: string, args: any, securityMode?: string) => {
  return agentEngine.executeTool(toolName, args, securityMode);
});

ipcMain.handle('contextBatch:getUnifiedBatch', async (_, workspaceRoot: string) => {
  return await contextBatchEngine.getUnifiedBatch(workspaceRoot || process.cwd());
});

ipcMain.handle('contextBatch:publishReview', async (_, reviewData: any) => {
  contextBatchEngine.publishBackendReview(reviewData);
  return { success: true };
});

// Browser Preview & UI Inspection IPC (Agent-First Web/DOM Bridge)
ipcMain.handle('browser:navigate', async (_, url: string) => {
  return await browserInspectionService.navigate(url);
});
ipcMain.handle('browser:inspectElement', async (_, selector: string) => {
  return await browserInspectionService.inspectElement(selector);
});
ipcMain.handle('browser:getConsoleLogs', async () => {
  return browserInspectionService.getConsoleLogs();
});
ipcMain.handle('browser:captureScreenshot', async () => {
  return await browserInspectionService.captureScreenshot();
});
ipcMain.handle('browser:evalScript', async (_, code: string) => {
  return await browserInspectionService.evaluateScript(code);
});

// High-Performance Sharded Local Persistence IPC (Antigravity/Claude Code Architecture)
ipcMain.handle('storage:listConversations', async () => {
  return await localPersistenceService.listConversations();
});
ipcMain.handle('storage:getConversation', async (_, id: string) => {
  return await localPersistenceService.getConversation(id);
});
ipcMain.handle('storage:saveConversation', async (_, conv: any) => {
  return await localPersistenceService.saveConversation(conv);
});
ipcMain.handle('storage:deleteConversation', async (_, id: string) => {
  return await localPersistenceService.deleteConversation(id);
});
ipcMain.handle('storage:loadMemories', async (_, workspacePath?: string) => {
  return await localPersistenceService.loadMemories(workspacePath);
});
ipcMain.handle('storage:saveMemories', async (_, memories: any[], workspacePath?: string) => {
  return await localPersistenceService.saveMemories(memories, workspacePath);
});

// Panel Management IPC
ipcMain.handle('panel:detach', async (_, panelId: string) => {
  return { success: panelWindowManager.detachPanel(panelId) };
});

ipcMain.handle('panel:redock', async (_, panelId: string) => {
  return { success: panelWindowManager.redockPanel(panelId) };
});

ipcMain.handle('panel:close', async (_, panelId: string) => {
  return { success: panelWindowManager.closeDetachedPanel(panelId) };
});

// Terminal IPC
ipcMain.handle('terminal:spawn', async (_, id: string, cwd?: string, cols?: number, rows?: number, shellPath?: string) => {
  const success = terminalService.spawn(id, cwd, cols, rows, shellPath);
  return { success };
});

ipcMain.handle('terminal:getAvailableShells', async () => {
  return terminalService.getAvailableShells();
});

ipcMain.handle('terminal:write', async (_, id: string, data: string) => {
  terminalService.write(id, data);
  return { success: true };
});

ipcMain.handle('terminal:resize', async (_, id: string, cols: number, rows: number) => {
  terminalService.resize(id, cols, rows);
  return { success: true };
});

ipcMain.handle('terminal:kill', async (_, id: string) => {
  terminalService.kill(id);
  return { success: true };
});

ipcMain.handle('terminal:getBuffer', async (_, id: string) => {
  return terminalService.getBuffer(id);
});

// Security Harness IPC
ipcMain.handle('security:auditItem', async (_, name: string, type: 'rule' | 'skill' | 'mcp' | 'prompt', content: string) => {
  return securityHarnessService.auditItem(name, type, content);
});

ipcMain.handle('security:auditBatch', async (_, items: any[]) => {
  return securityHarnessService.auditBatch(items);
});

app.whenReady().then(() => {
  setupWebSocketServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        await shell.openExternal(url);
        return { success: true };
      }
      return { success: false, error: 'Invalid URL scheme' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ollama:checkStatus', async (_, baseUrl?: string) => {
    const rawHost = (baseUrl || 'http://localhost:11434').trim();
    const host = rawHost.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${host}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return { running: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json() as any;
      const models = Array.isArray(data?.models) ? data.models.map((m: any) => m.name) : [];
      return {
        running: true,
        baseUrl: host,
        models
      };
    } catch (err: any) {
      return { running: false, error: err.message || 'Cannot connect to Ollama service' };
    }
  });

  ipcMain.handle('ollama:getEnvironment', async () => {
    return ollamaDeploymentService.checkEnvironment();
  });

  ipcMain.handle('ollama:downloadInstaller', async () => {
    try {
      const installerPath = await ollamaDeploymentService.downloadWindowsInstaller((p) => {
        mainWindow?.webContents.send('ollama:downloadProgress', p);
      });
      await ollamaDeploymentService.launchInstaller(installerPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ollama:pullModel', async (_, modelName: string) => {
    try {
      await ollamaDeploymentService.pullModelStream(modelName, (p) => {
        mainWindow?.webContents.send('ollama:pullProgress', p);
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('cloud:validateKey', async (_, provider: any, apiKey: string, baseUrl?: string) => {
    return cloudKeyValidator.validateKey(provider, apiKey, baseUrl);
  });

  ipcMain.handle('cloud:getModels', async (_, provider: any, apiKey: string, baseUrl?: string) => {
    if (provider === 'antigravity') {
      const status = await googleAccountService.getStatus();
      return status.models;
    }
    if (provider === 'codex') {
      const status = await codexAccountService.getStatus();
      return status.models;
    }
    if (provider === 'claudecode') {
      const status = await claudeAccountService.getStatus();
      return status.models;
    }
    return cloudKeyValidator.fetchModels(provider, apiKey, baseUrl);
  });

  ipcMain.handle('google:getStatus', async () => {
    return googleAccountService.getStatus();
  });

  ipcMain.handle('google:login', async () => {
    return googleAccountService.login();
  });

  ipcMain.handle('google:disconnect', async () => {
    return googleAccountService.disconnect();
  });

  ipcMain.handle('codex:getStatus', async () => {
    return codexAccountService.getStatus();
  });

  ipcMain.handle('codex:login', async () => {
    return codexAccountService.login();
  });

  ipcMain.handle('codex:disconnect', async () => {
    return codexAccountService.disconnect();
  });

  ipcMain.handle('claude:getStatus', async () => {
    return claudeAccountService.getStatus();
  });

  ipcMain.handle('claude:login', async () => {
    return claudeAccountService.login();
  });

  ipcMain.handle('claude:disconnect', async () => {
    return claudeAccountService.disconnect();
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
  panelWindowManager.closeAll();
  terminalService.killAll();
  globalShortcut.unregisterAll();
});
