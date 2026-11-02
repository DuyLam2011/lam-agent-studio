export interface PatchEngineResult {
  updatedContent: string;
  linesAdded: number;
  linesRemoved: number;
  matchType: 'exact' | 'normalized';
}

export class PatchEngine {
  public static applyPatch(original: string, target: string, replacement: string, filePath: string): PatchEngineResult {
    if (!target) {
      throw new Error(`Target content cannot be empty for patch on ${filePath}`);
    }

    const isCRLF = original.includes('\r\n');
    const newline = isCRLF ? '\r\n' : '\n';

    // 1. Exact match attempt
    const firstIdx = original.indexOf(target);
    if (firstIdx !== -1) {
      const secondIdx = original.indexOf(target, firstIdx + 1);
      if (secondIdx !== -1) {
        throw new Error(
          `[AMBIGUOUS MATCH] Target code matches multiple locations in '${filePath}'. Include more surrounding lines in oldContent to make it unique.`
        );
      }
      const updated = original.substring(0, firstIdx) + replacement + original.substring(firstIdx + target.length);
      return {
        updatedContent: updated,
        linesAdded: replacement ? replacement.split('\n').length : 0,
        linesRemoved: target.split('\n').length,
        matchType: 'exact'
      };
    }

    // 2. Line-ending & trailing whitespace normalized matching
    const normOrig = original.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = replacement.replace(/\r\n/g, newline);

    const origLines = normOrig.split('\n');
    const targetLines = normTarget.split('\n').map((l) => l.trimEnd());

    let matchLineIdx = -1;
    let matchCount = 0;

    for (let i = 0; i <= origLines.length - targetLines.length; i++) {
      let matched = true;
      for (let j = 0; j < targetLines.length; j++) {
        if (origLines[i + j].trimEnd() !== targetLines[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        matchCount++;
        matchLineIdx = i;
      }
    }

    if (matchCount === 0) {
      throw new Error(
        `[NOT FOUND] Target code block not found in '${filePath}'. Verify the exact lines and indentation using read_file before patching.`
      );
    }

    if (matchCount > 1) {
      throw new Error(
        `[AMBIGUOUS MATCH] Target code block matched ${matchCount} separate locations in '${filePath}'. Provide more surrounding context lines.`
      );
    }

    const beforeLines = origLines.slice(0, matchLineIdx);
    const afterLines = origLines.slice(matchLineIdx + targetLines.length);

    const reconstructed = [...beforeLines, normReplacement, ...afterLines].join(newline);

    return {
      updatedContent: reconstructed,
      linesAdded: replacement ? replacement.split('\n').length : 0,
      linesRemoved: targetLines.length,
      matchType: 'normalized'
    };
  }
}
