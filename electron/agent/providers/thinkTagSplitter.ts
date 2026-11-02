const OPEN = '<think>';
const CLOSE = '</think>';

/**
 * Splits streamed content into answer text and `<think>…</think>` reasoning,
 * holding back a partial tag that may be split across chunks.
 */
export class ThinkTagSplitter {
  private buffer = '';
  private inThink = false;

  public feed(chunk: string): { text: string; thinking: string } {
    this.buffer += chunk;
    let text = '';
    let thinking = '';

    while (this.buffer.length > 0) {
      const tag = this.inThink ? CLOSE : OPEN;
      const idx = this.buffer.indexOf(tag);
      if (idx >= 0) {
        const before = this.buffer.slice(0, idx);
        if (this.inThink) thinking += before; else text += before;
        this.buffer = this.buffer.slice(idx + tag.length);
        this.inThink = !this.inThink;
        continue;
      }
      const hold = partialSuffix(this.buffer, tag);
      const emit = this.buffer.slice(0, this.buffer.length - hold);
      if (this.inThink) thinking += emit; else text += emit;
      this.buffer = this.buffer.slice(this.buffer.length - hold);
      break;
    }
    return { text, thinking };
  }

  public flush(): { text: string; thinking: string } {
    const rest = this.buffer;
    this.buffer = '';
    return this.inThink ? { text: '', thinking: rest } : { text: rest, thinking: '' };
  }
}

const partialSuffix = (value: string, tag: string): number => {
  for (let len = Math.min(tag.length - 1, value.length); len > 0; len--) {
    if (tag.startsWith(value.slice(-len))) return len;
  }
  return 0;
};
