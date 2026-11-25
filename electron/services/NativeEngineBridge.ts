import { NativeBridgeLoader } from './NativeBridgeLoader';
import { SurgicalPatchEngine, PatchResult } from './SurgicalPatchEngine';

export interface NativeSymbol { name: string; kind: string; line: number; }
export interface NativeParsedFile { filePath: string; symbols: NativeSymbol[]; imports: string[]; lineCount: number; }
export interface NativeSearchMatch { filePath: string; lineNumber: number; lineContent: string; }
export interface NativeSearchResult { matches: NativeSearchMatch[]; filesScanned: number; truncated: boolean; durationMs: number; }
export interface NativeDistillResult { distilledOutput: string; rawBytes: number; distilledBytes: number; estimatedTokensSaved: number; linesOriginal: number; linesRetained: number; durationMs: number; }
export interface NativeSandboxResult { allowed: boolean; resolvedPath: string; relativePath: string; reason?: string; }
export interface NativeSecurityAuditResult { score: number; level: string; findings: Array<{ findingType: string; severity: string; message: string; suggestion: string }>; sanitizedContent: string; }
export interface NativeInvariantReport { passed: boolean; violations: string[]; lineCountAudit: Record<string, number>; }
export interface NativeCleanDocResult { markdown: string; title: string; estimatedTokens: number; matchedSectionsCount: number; }

export class NativeEngineBridge {
  public static isNativeAvailable(): boolean { return NativeBridgeLoader.isLoaded(); }
  public static getNative(): any { return NativeBridgeLoader.getNative(); }

  public static applyPatch(original: string, target: string, replacement: string): PatchResult {
    const native = this.getNative();
    if (native?.fastApplyPatch) {
      try {
        const res = native.fastApplyPatch(original, target, replacement);
        return { updatedContent: res.updatedContent, linesAdded: res.linesAdded, linesRemoved: res.linesRemoved, matchType: res.matchType };
      } catch (err: any) { throw new Error(err.message || String(err)); }
    }
    return SurgicalPatchEngine.applySurgicalEdit(original, target, replacement);
  }

  public static scanWorkspace(root: string, ignored: string[] = []): string[] {
    const native = this.getNative();
    if (native?.fastScanWorkspace) {
      try { return native.fastScanWorkspace(root, ignored); } catch {}
    }
    return [];
  }

  public static parseFileSymbols(filePath: string, content: string): NativeParsedFile {
    const native = this.getNative();
    if (native?.fastParseFileSymbols) {
      try { return native.fastParseFileSymbols(filePath, content); } catch {}
    }
    return { filePath, symbols: [], imports: [], lineCount: content.split('\n').length };
  }

  public static estimateTokens(text: string): number {
    const native = this.getNative();
    if (native?.fastEstimateTokens) {
      try { return native.fastEstimateTokens(text); } catch {}
    }
    return Math.ceil(text.length / 4);
  }

  public static stripAnsi(text: string): string {
    const native = this.getNative();
    if (native?.fastStripAnsi) {
      try { return native.fastStripAnsi(text); } catch {}
    }
    return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
  }

  public static searchWorkspace(root: string, query: string, isRegex = false, maxResults = 80, ignored: string[] = []): NativeSearchResult | null {
    const native = this.getNative();
    if (native?.fastSearchWorkspace) {
      try { return native.fastSearchWorkspace(root, query, isRegex, maxResults, ignored); } catch {}
    }
    return null;
  }

  public static distillCodeModeOutput(rawText: string, maxLines = 60, pattern?: string): NativeDistillResult {
    const native = this.getNative();
    if (native?.fastCodeModeDistill) {
      try { return native.fastCodeModeDistill(rawText, maxLines, pattern); } catch {}
    }
    const lines = rawText.split('\n');
    const distilled = lines.slice(0, maxLines).join('\n');
    return {
      distilledOutput: distilled, rawBytes: rawText.length, distilledBytes: distilled.length,
      estimatedTokensSaved: Math.max(0, Math.ceil((rawText.length - distilled.length) / 3.8)),
      linesOriginal: lines.length, linesRetained: Math.min(lines.length, maxLines), durationMs: 0
    };
  }

  public static formatCodeModeEnvelope(action: string, status: string, data: string, saved: number, ms: number): string {
    const native = this.getNative();
    if (native?.fastCodeModeEnvelope) {
      try { return native.fastCodeModeEnvelope(action, status, data, saved, ms); } catch {}
    }
    return `[⚡ Code Mode: ${action} | Status: ${status} | Saved ~${saved} tokens | ${ms.toFixed(1)}ms]\n${data}`;
  }

  public static checkPathSandbox(workspaceRoot: string, inputPath: string, action: string, securityMode: string): NativeSandboxResult | null {
    const native = this.getNative();
    if (native?.checkPathSandbox) {
      try { return native.checkPathSandbox(workspaceRoot, inputPath, action, securityMode); } catch {}
    }
    return null;
  }

  public static checkCommandSecurity(command: string, securityMode: string): { allowed: boolean; reason?: string } | null {
    const native = this.getNative();
    if (native?.checkCommandSecurity) {
      try { return native.checkCommandSecurity(command, securityMode); } catch {}
    }
    return null;
  }

  public static auditSecurityContent(name: string, content: string): NativeSecurityAuditResult | null {
    const native = this.getNative();
    if (native?.auditSecurityContent) {
      try { return native.auditSecurityContent(name, content); } catch {}
    }
    return null;
  }

  public static auditInvariants(workspaceRoot: string, targetFiles: string[]): NativeInvariantReport | null {
    const native = this.getNative();
    if (native?.auditInvariantsNative) {
      try { return native.auditInvariantsNative(workspaceRoot, targetFiles); } catch {}
    }
    return null;
  }

  public static cleanHtmlToMarkdown(html: string, query?: string): NativeCleanDocResult | null {
    const native = this.getNative();
    if (native?.cleanHtmlToMarkdownNative) {
      try { return native.cleanHtmlToMarkdownNative(html, query); } catch {}
    }
    return null;
  }
}
