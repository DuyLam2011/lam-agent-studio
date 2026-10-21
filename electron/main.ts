import { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { simpleGit, SimpleGit } from 'simple-git';
import { WebSocketServer } from 'ws';
import { settingsManager } from './services/SettingsManager';
import { agentEngine } from './services/AgentEngine';
import { panelWindowManager } from './services/PanelWindowManager';
import { terminalService } from './services/TerminalService';
import { securityHarnessService } from './services/SecurityHarnessService';
import { ollamaDeploymentService } from './services/OllamaDeploymentService';
import { cloudKeyValidator } from './services/CloudKeyValidator';
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

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
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

export interface AIPromptOptions {
  model?: string;
  mode?: string;
  persona?: string;
  autonomyLevel?: string;
  apiKey?: string;
  provider?: 'gemini' | 'openai' | 'ollama' | 'offline';
  baseUrl?: string;
  activeFilePath?: string;
  workspacePath?: string;
  rules?: Array<{ name: string; scope: string; content: string; filePath?: string }>;
  skills?: Array<{ name: string; folderName?: string; scope: string; description: string; content: string }>;
  workflows?: Array<{ name: string; description: string; steps: any[] }>;
  plugins?: Array<{ name: string; description: string; toolsExposed: string[] }>;
  subagents?: Array<{ name: string; role: string; systemPrompt: string }>;
  memories?: Array<{ title: string; category: string; content: string }>;
  systemPrompt?: string;
  temperature?: number;
}

ipcMain.handle('ai:sendPrompt', async (_, text: string, options?: AIPromptOptions) => {
  const trimmed = text.trim();

  // 1. Explicit Slash Commands in Studio
  if (trimmed.startsWith('/')) {
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

  // 2. Real Autonomous Agent Execution via AgentEngine
  try {
    const settings = await settingsManager.loadSettings();
    const effectiveApiKey = options?.apiKey || settings.aiApiKey || process.env.GEMINI_API_KEY || '';
    const effectiveProvider = options?.provider || settings.aiProvider || (effectiveApiKey ? 'gemini' : 'offline');

    const result = await agentEngine.processPrompt(text, {
      ...options,
      apiKey: effectiveApiKey,
      provider: effectiveProvider,
      baseUrl: options?.baseUrl || settings.aiBaseUrl
    });

    return result;
  } catch (error: any) {
    console.error('AgentEngine processing error:', error);
    return {
      text: `⚠️ **Agent Execution Notice**: ${error.message || 'Failed to process prompt.'}`,
      thinking: `Agent encountered an error: ${error.stack || error.message}`,
      toolCalls: [
        { id: 'tc-err', name: 'agent:error', args: { error: error.message }, status: 'failed', result: error.message }
      ]
    };
  }
});

ipcMain.handle('ai:executeTool', async (_, toolName: string, args: any) => {
  return agentEngine.executeTool(toolName, args);
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
    return cloudKeyValidator.fetchModels(provider, apiKey, baseUrl);
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
