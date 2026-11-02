import path from 'path';

export interface FileSecurityCheckResult {
  allowed: boolean;
  resolvedPath: string;
  relativePath: string;
  reason?: string;
}

export class FileSecurityHarness {
  private static SENSITIVE_PATTERNS = [
    /(?:^|[\\/])\.env(?:\.[a-zA-Z0-9_\-]+)?$/i,
    /(?:^|[\\/])\.git[\\/](?:config|credentials|HEAD|objects)/i,
    /(?:^|[\\/])id_(?:rsa|ed25519|ecdsa|dsa)(?:\.pub)?$/i,
    /(?:^|[\\/])\.aws[\\/](?:credentials|config)/i,
    /(?:^|[\\/])\.npmrc$/i,
    /(?:^|[\\/])id_rsa$/i,
  ];

  public static normalizePath(workspaceRoot: string, inputPath: string): { resolved: string; relative: string; inSandbox: boolean } {
    const cleanWorkspace = path.resolve(workspaceRoot);
    const rootBaseName = path.basename(cleanWorkspace).toLowerCase();

    // Strip redundant leading repository prefix if input starts with the workspace folder's name
    let sanitizedInput = inputPath.replace(/^[/\\]+/, '');
    const normInput = sanitizedInput.replace(/\\/g, '/');
    if (!path.isAbsolute(sanitizedInput) && rootBaseName && (normInput.toLowerCase().startsWith(`${rootBaseName}/`))) {
      sanitizedInput = sanitizedInput.slice(rootBaseName.length + 1);
    }

    const resolved = path.isAbsolute(sanitizedInput)
      ? path.resolve(sanitizedInput)
      : path.resolve(cleanWorkspace, sanitizedInput);

    // On Windows, compare lowercased drive letters and normalized separators
    const normResolved = path.normalize(resolved).toLowerCase();
    const normRoot = path.normalize(cleanWorkspace).toLowerCase();
    const rootWithSep = normRoot.endsWith(path.sep) ? normRoot : normRoot + path.sep;
    const inSandbox = normResolved === normRoot || normResolved.startsWith(rootWithSep);
    const relative = path.relative(cleanWorkspace, resolved);

    return { resolved, relative, inSandbox };
  }

  public static validatePath(
    workspaceRoot: string,
    inputPath: string,
    action: 'read' | 'write' | 'delete',
    securityMode: 'restricted' | 'guarded' | 'turbo' = 'guarded'
  ): FileSecurityCheckResult {
    const { resolved, relative, inSandbox } = this.normalizePath(workspaceRoot, inputPath);

    if (!inSandbox) {
      return {
        allowed: false,
        resolvedPath: resolved,
        relativePath: relative,
        reason: `[SANDBOX VIOLATION] Access to path '${inputPath}' outside workspace root is strictly blocked.`
      };
    }

    if (securityMode === 'restricted' && (action === 'write' || action === 'delete')) {
      return {
        allowed: false,
        resolvedPath: resolved,
        relativePath: relative,
        reason: `[RESTRICTED MODE] File modifications (${action}) are blocked. Switch to Guarded or Turbo mode.`
      };
    }

    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(relative) || pattern.test(resolved)) {
        if (action !== 'read' || securityMode === 'restricted') {
          return {
            allowed: false,
            resolvedPath: resolved,
            relativePath: relative,
            reason: `[SECURITY GUARD] Access to sensitive file '${relative}' blocked under policy.`
          };
        }
      }
    }

    return { allowed: true, resolvedPath: resolved, relativePath: relative };
  }

  public static checkCommandPermission(
    command: string,
    securityMode: 'restricted' | 'guarded' | 'turbo' = 'guarded'
  ): { allowed: boolean; reason?: string } {
    if (securityMode === 'restricted') {
      return {
        allowed: false,
        reason: `[RESTRICTED MODE] Terminal execution blocked. Switch to Guarded or Turbo mode.`
      };
    }

    const dangerousShell = [
      /rm\s+-rf\s+[\/~]/i,
      /(?:format\s+[a-z]:|mkfs\.)/i,
      /del\s+\/[fq]\s+[a-z]:\\/i,
      /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
      /(?:curl|wget)\s+[^\n|]+\|\s*(?:sh|bash|powershell|cmd)/i,
    ];

    for (const pat of dangerousShell) {
      if (pat.test(command)) {
        return {
          allowed: false,
          reason: `[SECURITY HARNESS] Command rejected: matched critical destructive pattern.`
        };
      }
    }

    return { allowed: true };
  }
}
