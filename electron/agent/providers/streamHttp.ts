import { AgentCancelledError } from '../types';

/** Reasoning models may think for minutes before the first byte; users can always press Stop. */
const FIRST_BYTE_TIMEOUT_MS = 180_000;
const IDLE_TIMEOUT_MS = 120_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [1_500, 4_000];

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
  const onAbort = () => { clearTimeout(timer); reject(new AgentCancelledError()); };
  signal.addEventListener('abort', onAbort, { once: true });
});

export interface StreamingRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  signal: AbortSignal;
  label: string;
}

/**
 * Open a streaming request, retrying transient provider overload responses
 * (rate limits, 5xx) with backoff before any output has been streamed.
 */
export const openStream = async (req: StreamingRequest) => {
  for (let attempt = 0; ; attempt++) {
    const stream = await openStreamOnce(req);
    if (stream.res.ok || !RETRYABLE_STATUS.has(stream.res.status) || attempt >= RETRY_DELAYS_MS.length) return stream;
    await stream.readAll().catch(() => '');
    await sleep(RETRY_DELAYS_MS[attempt], req.signal);
  }
};

/**
 * POST a streaming request whose lifetime is bound to the caller's signal plus
 * first-byte/idle watchdogs. Returns the response and a reader of SSE `data:`
 * payloads; the watchdog keeps running while the body is consumed.
 */
const openStreamOnce = async ({ url, headers, body, signal, label }: StreamingRequest) => {
  if (signal.aborted) throw new AgentCancelledError();
  const controller = new AbortController();
  let timedOut = false;
  let timer: NodeJS.Timeout | undefined;
  const arm = (ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timedOut = true; controller.abort(); }, ms);
  };
  const onOuterAbort = () => controller.abort();
  signal.addEventListener('abort', onOuterAbort, { once: true });
  const dispose = () => {
    if (timer) clearTimeout(timer);
    signal.removeEventListener('abort', onOuterAbort);
  };
  const translate = (err: any): Error => {
    if (signal.aborted) return new AgentCancelledError();
    if (timedOut) return new Error(`${label} stopped responding (timeout). Try again or switch to a faster model.`);
    return err instanceof Error ? err : new Error(String(err));
  };

  arm(FIRST_BYTE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
  } catch (err) {
    dispose();
    throw translate(err);
  }

  async function* events(): AsyncGenerator<string> {
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const boundary = /\r?\n\r?\n/;
    try {
      while (true) {
        arm(IDLE_TIMEOUT_MS);
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let match: RegExpExecArray | null;
        while ((match = boundary.exec(buffer))) {
          const raw = buffer.slice(0, match.index);
          buffer = buffer.slice(match.index + match[0].length);
          const data = extractData(raw);
          if (data) yield data;
        }
      }
      const tail = extractData(buffer + decoder.decode());
      if (tail) yield tail;
    } catch (err) {
      throw translate(err);
    } finally {
      dispose();
    }
  }

  const readAll = async (): Promise<string> => {
    try {
      return await res.text();
    } catch (err) {
      throw translate(err);
    } finally {
      dispose();
    }
  };

  return { res, events, readAll };
};

const extractData = (raw: string): string =>
  raw
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();
