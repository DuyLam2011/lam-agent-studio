import { ExecutionEnvironmentService } from '../electron/services/ExecutionEnvironmentService';

export async function runTerminalExecutionEnvironmentTests(): Promise<{ passed: boolean; details: string }> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  log('🧪 Starting Terminal & Multi-Environment Execution Test Suite...');

  // 1. Detection of Available Environments
  const envs = await ExecutionEnvironmentService.getAvailableEnvironments();
  if (!Array.isArray(envs) || envs.length < 3) {
    throw new Error(`Expected at least 3 environments, got ${envs.length}`);
  }

  const gitBash = envs.find((e) => e.id === 'gitbash');
  if (!gitBash || !gitBash.detected) {
    throw new Error('Git Bash not detected in environments');
  }
  log(`  ✅ Git Bash detected: ${gitBash.path} (${gitBash.badge})`);

  const wsl = envs.find((e) => e.id === 'wsl');
  if (!wsl || !wsl.detected) {
    throw new Error('WSL Linux subsystem not detected');
  }
  log(`  ✅ WSL detected: ${wsl.name} (Distros: ${wsl.versionInfo || 'Ubuntu'})`);

  const ps = envs.find((e) => e.id === 'powershell');
  if (!ps || !ps.detected) {
    throw new Error('PowerShell not detected');
  }
  log(`  ✅ PowerShell detected: ${ps.name}`);

  // 2. Command Builder Invariants
  const cwd = process.cwd();
  const gitCmd = ExecutionEnvironmentService.buildShellCommand('npm test', 'gitbash', cwd);
  if (!gitCmd.includes('bash.exe') || !gitCmd.includes('npm test')) {
    throw new Error(`Invalid Git Bash command format: ${gitCmd}`);
  }
  log('  ✅ Git Bash command format verified');

  const wslCmd = ExecutionEnvironmentService.buildShellCommand('git status', 'wsl', cwd, 'Ubuntu');
  if (!wslCmd.startsWith('wsl.exe -d Ubuntu') || !wslCmd.includes('--cd')) {
    throw new Error(`Invalid WSL command format: ${wslCmd}`);
  }
  log('  ✅ WSL Linux subsystem command format verified');

  const psCmd = ExecutionEnvironmentService.buildShellCommand('Get-Process', 'powershell', cwd);
  if (!psCmd.startsWith('powershell.exe')) {
    throw new Error(`Invalid PowerShell command format: ${psCmd}`);
  }
  log('  ✅ PowerShell command format verified');

  // 3. Live Execution: Git Bash
  const gitRun = await ExecutionEnvironmentService.executeAgentCommand({
    command: 'echo "LAM_GITBASH_VERIFIED"',
    environment: 'gitbash',
    workspaceRoot: cwd,
    streamToTerminal: false
  });
  if (gitRun.exitCode !== 0 || !gitRun.stdout.includes('LAM_GITBASH_VERIFIED')) {
    throw new Error(`Git Bash execution failed: ${JSON.stringify(gitRun)}`);
  }
  log('  ✅ Live Git Bash command execution passed');

  // 4. Live Execution: WSL Linux Subsystem
  const wslRun = await ExecutionEnvironmentService.executeAgentCommand({
    command: 'uname -s',
    environment: 'wsl',
    workspaceRoot: cwd,
    wslDistro: 'Ubuntu',
    streamToTerminal: false
  });
  if (wslRun.exitCode !== 0 || !wslRun.stdout.includes('Linux')) {
    throw new Error(`WSL execution failed: ${JSON.stringify(wslRun)}`);
  }
  log(`  ✅ Live WSL command execution passed: output "${wslRun.stdout}" (${wslRun.durationMs}ms)`);

  // 5. Audit Log Invariant
  const recent = ExecutionEnvironmentService.getRecentRuns();
  if (recent.length < 2) {
    throw new Error(`Expected at least 2 recorded runs in audit buffer, got ${recent.length}`);
  }
  log(`  ✅ Audit log records verified: ${recent.length} executions tracked`);

  return { passed: true, details: logs.join('\n') };
}

if (require.main === module) {
  runTerminalExecutionEnvironmentTests()
    .then((r) => {
      console.log(r.details);
      console.log('🎉 All Terminal & Execution Environment tests passed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Terminal test failed:', err);
      process.exit(1);
    });
}
