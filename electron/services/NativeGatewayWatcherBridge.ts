import { NativeBridgeLoader } from './NativeBridgeLoader';

export interface ExternalSessionSummary {
  id: string;
  provider: 'claudecode' | 'codex' | 'antigravity' | string;
  title: string;
  cwd: string;
  branch: string;
  model: string;
  originator: string;
  updated_at_ms: number;
  recent_commands: string[];
  edited_files: string[];
  source_file: string;
}

export interface CapturedCommandEntry {
  provider: string;
  session_id: string;
  command: string;
  cwd: string;
  timestamp_ms: number;
}

export interface ExternalAgentScanReport {
  scanned_at_ms: number;
  sessions: ExternalSessionSummary[];
  captured_commands: CapturedCommandEntry[];
  father_context_markdown: string;
}

export class NativeGatewayWatcherBridge {
  public static sha256Hex(input: string): string | null {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastSha256Hex) {
      try {
        return native.fastSha256Hex(input);
      } catch {}
    }
    return null;
  }

  public static sha256File(filePath: string): string | null {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastSha256File) {
      try {
        return native.fastSha256File(filePath);
      } catch {}
    }
    return null;
  }

  public static scanExternalAgentSessions(
    claudeDir: string,
    codexDir: string,
    antigravityDir: string,
    maxPerProvider = 5
  ): ExternalAgentScanReport {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastScanExternalAgentSessions) {
      try {
        const raw = native.fastScanExternalAgentSessions(claudeDir, codexDir, antigravityDir, maxPerProvider);
        return JSON.parse(raw) as ExternalAgentScanReport;
      } catch {}
    }
    return {
      scanned_at_ms: Date.now(),
      sessions: [],
      captured_commands: [],
      father_context_markdown: '### External Agent Activity\n- Native Rust scanner unavailable.'
    };
  }
}
