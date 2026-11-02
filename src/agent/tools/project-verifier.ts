import fs from 'fs';
import path from 'path';
import { CommandRunner } from './command-runner';
import { ProjectVerificationResult } from '../types';

export class ProjectVerifier {
  private workspaceRoot: string;
  private commandRunner: CommandRunner;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.commandRunner = new CommandRunner(workspaceRoot);
  }

  public async verify(customCommand?: string): Promise<ProjectVerificationResult> {
    if (customCommand && customCommand.trim()) {
      const res = await this.commandRunner.run(customCommand.trim(), 45000);
      return {
        success: res.exitCode === 0,
        errors: res.exitCode === 0 ? '' : res.stderr || res.stdout,
        commandUsed: customCommand.trim(),
        toolchain: 'npm-script'
      };
    }

    // Priority 1: TypeScript Project
    const tsconfigPath = path.join(this.workspaceRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const cmd = 'npx tsc --noEmit';
      const res = await this.commandRunner.run(cmd, 45000);
      return {
        success: res.exitCode === 0,
        errors: res.exitCode === 0 ? '' : res.stdout || res.stderr,
        commandUsed: cmd,
        toolchain: 'typescript'
      };
    }

    // Priority 2: Next.js Project
    const hasNextConfig = ['next.config.js', 'next.config.mjs', 'next.config.ts'].some((file) =>
      fs.existsSync(path.join(this.workspaceRoot, file))
    );
    if (hasNextConfig) {
      const cmd = 'npm run lint';
      const res = await this.commandRunner.run(cmd, 45000);
      return {
        success: res.exitCode === 0,
        errors: res.exitCode === 0 ? '' : res.stderr || res.stdout,
        commandUsed: cmd,
        toolchain: 'nextjs'
      };
    }

    // Priority 3: General package.json lint or typecheck script
    const pkgPath = path.join(this.workspaceRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg.scripts || {};
        if (scripts.typecheck) {
          const cmd = 'npm run typecheck';
          const res = await this.commandRunner.run(cmd, 45000);
          return { success: res.exitCode === 0, errors: res.exitCode === 0 ? '' : res.stderr || res.stdout, commandUsed: cmd, toolchain: 'npm-script' };
        }
        if (scripts.lint) {
          const cmd = 'npm run lint';
          const res = await this.commandRunner.run(cmd, 45000);
          return { success: res.exitCode === 0, errors: res.exitCode === 0 ? '' : res.stderr || res.stdout, commandUsed: cmd, toolchain: 'npm-script' };
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Priority 4: No static verification tools detected
    return {
      success: true,
      errors: '',
      commandUsed: 'none',
      toolchain: 'none'
    };
  }
}
