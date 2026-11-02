export const sanitizeResourceContent = (raw: string): string => {
  if (!raw) return '';

  let sanitized = raw;

  // 1. Defuse dangerous destructive commands in scripts/markdown
  sanitized = sanitized.replace(
    /(rm\s+-rf\s+[/~*]|format\s+[a-z]:|drop\s+database|del\s+\/f\s+\/s\s+\/q)/gi,
    '# [LAM AUDIT DISARMED: $1]'
  );

  // 2. Defuse pipe-to-shell patterns
  sanitized = sanitized.replace(
    /((?:curl|wget)\s+[^\n|]+\|\s*(?:sh|bash|zsh|powershell))/gi,
    '# [LAM AUDIT DISARMED EXECUTION: $1]'
  );

  // 3. Neutralize classic adversarial prompt injections
  sanitized = sanitized.replace(
    /(ignore\s+(?:all\s+)?previous\s+instructions|system\s+prompt\s+override|disregard\s+(?:all\s+)?prior\s+rules)/gi,
    '[LAM AUDIT FLAGGED INJECTION: $1]'
  );

  // 4. Mask potential hardcoded private keys or tokens
  sanitized = sanitized.replace(
    /(-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----)/g,
    '# [LAM AUDIT MASKED PRIVATE KEY]'
  );

  sanitized = sanitized.replace(
    /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|sk-[a-zA-Z0-9]{48})/g,
    '# [LAM AUDIT MASKED SECRET TOKEN]'
  );

  return sanitized;
};
