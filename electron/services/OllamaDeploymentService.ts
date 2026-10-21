import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DownloadProgress {
  percent: number;
  downloadedMb: number;
  totalMb: number;
  status: string;
}

export class OllamaDeploymentService {
  public async checkEnvironment(): Promise<{ hasWsl: boolean; isWindows: boolean; wslDistro?: string }> {
    const isWindows = process.platform === 'win32';
    if (!isWindows) return { hasWsl: false, isWindows: false };

    return new Promise((resolve) => {
      exec('wsl -l -q', (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ hasWsl: false, isWindows: true });
        } else {
          const distros = stdout.replace(/\0/g, '').trim().split(/\r?\n/).filter(Boolean);
          resolve({ hasWsl: true, isWindows: true, wslDistro: distros[0] || 'WSL' });
        }
      });
    });
  }

  public async downloadWindowsInstaller(onProgress: (p: DownloadProgress) => void): Promise<string> {
    const downloadUrl = 'https://ollama.com/download/OllamaSetup.exe';
    const destPath = path.join(os.tmpdir(), 'OllamaSetup.exe');

    onProgress({ percent: 0, downloadedMb: 0, totalMb: 0, status: 'Connecting...' });
    const res = await fetch(downloadUrl);
    if (!res.ok || !res.body) throw new Error(`Download failed: HTTP ${res.status}`);

    const totalBytes = Number(res.headers.get('content-length') || 0);
    const totalMb = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
    let downloadedBytes = 0;

    const fileStream = fs.createWriteStream(destPath);
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
        const downloadedMb = Math.round((downloadedBytes / (1024 * 1024)) * 10) / 10;
        onProgress({ percent, downloadedMb, totalMb, status: `Downloading: ${percent}%` });
      }
    }
    fileStream.end();
    onProgress({ percent: 100, downloadedMb: totalMb, totalMb, status: 'Download complete. Launching installer...' });
    return destPath;
  }

  public launchInstaller(installerPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(installerPath, [], { detached: true, stdio: 'ignore' });
      child.unref();
      resolve(true);
    });
  }

  public pullModelStream(
    modelName: string,
    onProgress: (data: { status: string; completed?: number; total?: number; percent?: number }) => void
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch('http://localhost:11434/api/pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: modelName, stream: true })
        });

        if (!res.ok || !res.body) {
          throw new Error(`Ollama returned error: HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              let percent = undefined;
              if (json.total && json.completed) {
                percent = Math.min(100, Math.round((json.completed / json.total) * 100));
              }
              onProgress({ status: json.status, completed: json.completed, total: json.total, percent });
            } catch {}
          }
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const ollamaDeploymentService = new OllamaDeploymentService();
