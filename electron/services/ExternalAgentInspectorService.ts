import os from 'os';
import path from 'path';
import { ApiGatewayClient } from './ApiGatewayClient';
import {
  NativeGatewayWatcherBridge,
  ExternalAgentScanReport
} from './NativeGatewayWatcherBridge';

export class ExternalAgentInspectorService {
  private static lastReport: ExternalAgentScanReport | null = null;
  private static lastScanAt = 0;

  public static scanExternalAgents(maxPerProvider = 5, force = false): ExternalAgentScanReport {
    if (!force && this.lastReport && Date.now() - this.lastScanAt < 4000) {
      return this.lastReport;
    }
    const home = os.homedir();
    const claudeDir = path.join(home, '.claude');
    const codexDir = path.join(home, '.codex');
    const agyDir = path.join(home, '.gemini', 'antigravity');

    const report = NativeGatewayWatcherBridge.scanExternalAgentSessions(
      claudeDir,
      codexDir,
      agyDir,
      maxPerProvider
    );
    this.lastReport = report;
    this.lastScanAt = Date.now();
    return report;
  }

  public static buildFatherContextPacket(maxPerProvider = 4): {
    markdown: string;
    sessionsCount: number;
    commandsCount: number;
    report: ExternalAgentScanReport;
  } {
    const report = this.scanExternalAgents(maxPerProvider, true);
    const lines: string[] = [report.father_context_markdown.trim()];

    if (report.captured_commands.length > 0) {
      lines.push('\n#### Captured Commands Available for Reuse or Verification');
      for (const c of report.captured_commands.slice(0, 12)) {
        lines.push(`- [${c.provider.toUpperCase()}] \`${c.command}\` *(cwd: \`${c.cwd || 'workspace'}\`)*`);
      }
    }

    return {
      markdown: lines.join('\n'),
      sessionsCount: report.sessions.length,
      commandsCount: report.captured_commands.length,
      report
    };
  }

  public static async pushSnapshotToGateway(workspaceRoot?: string): Promise<void> {
    const packet = this.buildFatherContextPacket(4);
    await ApiGatewayClient.emitCallback('external-context', {
      provider: 'external-agent-watcher',
      workspaceRoot: workspaceRoot || process.cwd(),
      sessionsCount: packet.sessionsCount,
      commandsCount: packet.commandsCount,
      sessions: packet.report.sessions.slice(0, 8).map((s) => ({
        id: s.id,
        provider: s.provider,
        title: s.title,
        cwd: s.cwd,
        model: s.model,
        recentCommands: s.recent_commands
      }))
    });
  }
}
