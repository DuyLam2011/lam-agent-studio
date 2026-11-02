/** Tool output fed back to the model; larger payloads waste context budget. */
export const MODEL_OUTPUT_LIMIT = 24_000;
/** Tool output sent to the renderer and persisted in conversation history. */
export const UI_OUTPUT_LIMIT = 6_000;

export const stringifyOutput = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

export const clipText = (text: string, limit: number): string => {
  if (text.length <= limit) return text;
  const head = Math.floor(limit * 0.7);
  const tail = limit - head;
  const omitted = text.length - limit;
  return `${text.slice(0, head)}\n\n… [${omitted} characters truncated] …\n\n${text.slice(-tail)}`;
};
