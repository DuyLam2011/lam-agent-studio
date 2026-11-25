import fs from 'fs';
import path from 'path';

const VN_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

const TARGET_DIRS = [
  'src/components',
  'src/types',
  'src/data/subagents',
  'src/store',
];

const TARGET_FILES = [
  'electron/services/FatherDelegationService.ts',
  'crates/lam-agent-core/src/orchestration/father_delegation.rs',
  'crates/lam-agent-core/src/lib.rs',
];

// Allow purely non-visible NLP regex lines matching user input keywords in chat
const ALLOWED_REGEX_FILES = new Set([
  'src/components/agent/optimizer/useChatOptimizerActions.ts',
]);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(ts|tsx|rs)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = [
  ...TARGET_DIRS.flatMap(walk),
  ...TARGET_FILES.filter((f) => fs.existsSync(f)),
];

const violations: Array<{ file: string; line: number; text: string }> = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  lines.forEach((lineText, idx) => {
    if (!VN_REGEX.test(lineText)) return;
    if (ALLOWED_REGEX_FILES.has(file) && /\/.*\|.*\//.test(lineText)) return;
    violations.push({ file, line: idx + 1, text: lineText.trim().slice(0, 120) });
  });
}

if (violations.length > 0) {
  console.error(`❌ ENGLISH-ONLY UI/SETTINGS VALIDATION FAILED: ${violations.length} Vietnamese line(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> ${v.text}`);
  }
  process.exit(1);
}

console.log(`✅ ENGLISH-ONLY UI/SETTINGS VALIDATION PASSED (${files.length} files scanned, 0 Vietnamese UI strings found).`);
