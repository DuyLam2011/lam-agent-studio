import path from 'path';
import fs from 'fs';
import { SurgicalPatchEngine, PatchResult } from './SurgicalPatchEngine';

export interface NativeSymbol {
  name: string;
  kind: string;
  line: number;
}

export interface NativeParsedFile {
  filePath: string;
  symbols: NativeSymbol[];
  imports: string[];
  lineCount: number;
}

export interface NativeNdjsonEvent {
  eventType: string;
  content: string;
  raw?: string;
}

export class NativeEngineBridge {
  private static nativeBinding: any = null;
  private static loaded = false;
  private static loadAttempted = false;

  public static getNative(): any {
    if (this.loadAttempted) return this.nativeBinding;
    this.loadAttempted = true;

    const candidates = [
      path.join(__dirname, '../../crates/lam-agent-core/target/release/lam_agent_core.node'),
      path.join(__dirname, '../../crates/lam-agent-core/target/debug/lam_agent_core.node'),
      path.join(__dirname, '../../crates/lam-agent-core/lam_agent_core.node'),
      path.join(__dirname, '../../crates/lam-agent-core/target/release/lam_agent_core.dll'),
      path.join(__dirname, '../../crates/lam-agent-core/target/debug/lam_agent_core.dll')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          this.nativeBinding = require(p);
          this.loaded = true;
          console.log(`[NativeEngineBridge] Loaded Rust Core Engine from ${p}`);
          break;
        } catch (e) {
          console.warn(`[NativeEngineBridge] Failed loading ${p}:`, e);
        }
      }
    }
    return this.nativeBinding;
  }

  public static isNativeAvailable(): boolean {
    this.getNative();
    return this.loaded;
  }

  public static applyPatch(original: string, target: string, replacement: string): PatchResult {
    const native = this.getNative();
    if (native?.fastApplyPatch) {
      try {
        const res = native.fastApplyPatch(original, target, replacement);
        return {
          updatedContent: res.updatedContent,
          linesAdded: res.linesAdded,
          linesRemoved: res.linesRemoved,
          matchType: res.matchType
        };
      } catch (err: any) {
        throw new Error(err.message || String(err));
      }
    }
    return SurgicalPatchEngine.applySurgicalEdit(original, target, replacement);
  }

  public static scanWorkspace(root: string, ignored: string[] = []): string[] {
    const native = this.getNative();
    if (native?.fastScanWorkspace) {
      try {
        return native.fastScanWorkspace(root, ignored);
      } catch {}
    }
    return [];
  }

  public static parseFileSymbols(filePath: string, content: string): NativeParsedFile {
    const native = this.getNative();
    if (native?.fastParseFileSymbols) {
      try {
        return native.fastParseFileSymbols(filePath, content);
      } catch {}
    }
    const lines = content.split('\n');
    return { filePath, symbols: [], imports: [], lineCount: lines.length };
  }

  public static parseWorkspaceParallel(root: string, files: string[]): NativeParsedFile[] {
    const native = this.getNative();
    if (native?.fastParseWorkspaceParallel) {
      try {
        return native.fastParseWorkspaceParallel(root, files);
      } catch {}
    }
    return [];
  }

  public static estimateTokens(text: string): number {
    const native = this.getNative();
    if (native?.fastEstimateTokens) {
      try {
        return native.fastEstimateTokens(text);
      } catch {}
    }
    return Math.ceil(text.length / 4);
  }

  public static stripAnsi(text: string): string {
    const native = this.getNative();
    if (native?.fastStripAnsi) {
      try {
        return native.fastStripAnsi(text);
      } catch {}
    }
    return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
  }
}
