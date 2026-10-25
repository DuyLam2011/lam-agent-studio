import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  workspaceId?: string;
  workspacePath?: string;
  model: string;
  securityMode: string;
  messageCount: number;
  lastPreview: string;
}

export class LocalPersistenceService {
  private convDir: string;
  private indexFile: string;
  private memoriesDir: string;
  private globalMemoriesFile: string;
  private writeDebounceTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : (process.env.APPDATA || process.cwd());
    this.convDir = path.join(userData, 'conversations');
    this.indexFile = path.join(this.convDir, 'index.json');
    this.memoriesDir = path.join(userData, 'memories');
    this.globalMemoriesFile = path.join(this.memoriesDir, 'global_memories.json');
  }

  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.convDir, { recursive: true });
    await fs.mkdir(this.memoriesDir, { recursive: true });
  }

  private async atomicWriteJson(targetPath: string, data: any): Promise<void> {
    const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmpPath, targetPath);
  }

  public async listConversations(): Promise<ConversationMeta[]> {
    await this.ensureDirs();
    try {
      const raw = await fs.readFile(this.indexFile, 'utf-8');
      return JSON.parse(raw);
    } catch { return []; }
  }

  public async getConversation(id: string): Promise<any | null> {
    await this.ensureDirs();
    try {
      const raw = await fs.readFile(path.join(this.convDir, `${id}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch { return null; }
  }

  public async saveConversation(conv: any): Promise<void> {
    await this.ensureDirs();
    const existing = this.writeDebounceTimers.get(conv.id);
    if (existing) clearTimeout(existing);

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          await this.atomicWriteJson(path.join(this.convDir, `${conv.id}.json`), conv);
          const index = await this.listConversations();
          const msgs = conv.messages || [];
          const lastMsg = msgs[msgs.length - 1]?.text || '';
          const meta: ConversationMeta = {
            id: conv.id,
            title: conv.title || 'New Chat',
            createdAt: conv.createdAt || Date.now(),
            updatedAt: Date.now(),
            workspaceId: conv.workspaceId,
            workspacePath: conv.workspacePath,
            model: conv.model || 'gemini-3.5-flash-lite',
            securityMode: conv.securityMode || 'guarded',
            messageCount: msgs.length,
            lastPreview: lastMsg.slice(0, 60).replace(/\n/g, ' ')
          };
          await this.atomicWriteJson(this.indexFile, [meta, ...index.filter(i => i.id !== conv.id)]);
        } catch (err) {
          console.error('[LocalPersistence] Save error:', err);
        } finally {
          this.writeDebounceTimers.delete(conv.id);
          resolve();
        }
      }, 150);
      this.writeDebounceTimers.set(conv.id, timer);
    });
  }

  public async deleteConversation(id: string): Promise<void> {
    await this.ensureDirs();
    try {
      await fs.unlink(path.join(this.convDir, `${id}.json`)).catch(() => {});
      const index = await this.listConversations();
      await this.atomicWriteJson(this.indexFile, index.filter(i => i.id !== id));
    } catch (err) {
      console.error('[LocalPersistence] Delete error:', err);
    }
  }

  public async loadMemories(workspacePath?: string): Promise<{ global: any[]; workspace: any[] }> {
    await this.ensureDirs();
    let global: any[] = [];
    let workspace: any[] = [];
    try {
      global = JSON.parse(await fs.readFile(this.globalMemoriesFile, 'utf-8'));
    } catch {}

    if (workspacePath) {
      try {
        workspace = JSON.parse(await fs.readFile(path.join(workspacePath, '.lam', 'memories.json'), 'utf-8'));
      } catch {}
    }
    return { global, workspace };
  }

  public async saveMemories(memories: any[], workspacePath?: string): Promise<void> {
    await this.ensureDirs();
    await this.atomicWriteJson(this.globalMemoriesFile, memories.filter(m => m.scope !== 'workspace'));
    if (workspacePath) {
      const wsDir = path.join(workspacePath, '.lam');
      await fs.mkdir(wsDir, { recursive: true });
      await this.atomicWriteJson(path.join(wsDir, 'memories.json'), memories.filter(m => m.scope === 'workspace'));
    }
  }
}

export const localPersistenceService = new LocalPersistenceService();
