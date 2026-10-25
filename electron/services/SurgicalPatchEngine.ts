export interface PatchResult {
  updatedContent: string;
  linesAdded: number;
  linesRemoved: number;
  matchType: 'exact' | 'normalized-whitespace';
}

export class SurgicalPatchEngine {
  public static applySurgicalEdit(
    original: string,
    target: string,
    replacement: string
  ): PatchResult {
    const isCRLF = original.includes('\r\n');
    const newline = isCRLF ? '\r\n' : '\n';

    // 1. Exact match attempt
    const firstIdx = original.indexOf(target);
    if (firstIdx !== -1) {
      const secondIdx = original.indexOf(target, firstIdx + 1);
      if (secondIdx !== -1) {
        throw new Error(`Target content matches multiple locations. Provide more surrounding context lines.`);
      }
      const updated = original.substring(0, firstIdx) + replacement + original.substring(firstIdx + target.length);
      return {
        updatedContent: updated,
        linesAdded: replacement ? replacement.split('\n').length : 0,
        linesRemoved: target ? target.split('\n').length : 0,
        matchType: 'exact'
      };
    }

    // 2. Line-ending & trailing-whitespace normalized match
    const normOrig = original.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = replacement.replace(/\r\n/g, newline);

    const origLines = normOrig.split('\n');
    const targetLines = normTarget.split('\n').map(l => l.trimEnd());

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
      throw new Error(`Target content not found in file. Ensure indentation and exact code match.`);
    }
    if (matchCount > 1) {
      throw new Error(`Ambiguous match: Target content found ${matchCount} times. Provide unique lines.`);
    }

    // Splice replacement lines
    const beforeLines = origLines.slice(0, matchLineIdx);
    const afterLines = origLines.slice(matchLineIdx + targetLines.length);
    const updated = [...beforeLines, normReplacement, ...afterLines].join(newline);

    return {
      updatedContent: updated,
      linesAdded: normReplacement ? normReplacement.split('\n').length : 0,
      linesRemoved: targetLines.length,
      matchType: 'normalized-whitespace'
    };
  }

  public static formatWindowedContent(
    content: string,
    startLine?: number,
    endLine?: number,
    maxLines: number = 400
  ): string {
    const rawLines = content.replace(/\r\n/g, '\n').split('\n');
    const totalLines = rawLines.length;

    let start = startLine && startLine > 0 ? startLine : 1;
    let end = endLine && endLine >= start ? endLine : totalLines;

    if (!endLine && end - start + 1 > maxLines) {
      end = start + maxLines - 1;
    }

    const startIdx = Math.max(0, start - 1);
    const endIdx = Math.min(totalLines, end);
    const selectedLines = rawLines.slice(startIdx, endIdx);

    const padLen = String(endIdx).length;
    const formatted = selectedLines
      .map((line, idx) => {
        const lineNum = String(startIdx + idx + 1).padStart(padLen, ' ');
        return `${lineNum} | ${line}`;
      })
      .join('\n');

    let header = `[File has ${totalLines} total lines`;
    if (startIdx > 0 || endIdx < totalLines) {
      header += ` | Showing lines ${startIdx + 1}-${endIdx}`;
    }
    header += `]\n`;

    return header + formatted;
  }
}
