import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useAgentStore } from '../../store/useAgentStore';

interface TerminalViewProps {
  terminalId?: string;
  selectedShell?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ terminalId = 'term-main', selectedShell }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { setTerminalAgent, systemContext } = useAgentStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Consolas, "Fira Code", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#e4e4e7',
        cursor: '#10b981',
        selectionBackground: 'rgba(16, 185, 129, 0.3)',
        black: '#18181b',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f4f4f5',
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // @ts-ignore
    const api = window.lamApi?.terminal;
    if (api) {
      const activeWs = systemContext?.workspaces?.find(w => w.id === systemContext.activeWorkspaceId);
      const cwd = activeWs?.folders?.[0] || systemContext?.cwd;
      api.spawn(terminalId, cwd, term.cols, term.rows, selectedShell);

      const removeDataListener = api.onData(({ id, data }: { id: string; data: string }) => {
        if (id === terminalId) {
          term.write(data);
          if (/(error|failed|fatal|exception|command not found)/i.test(data) && !data.includes('node_modules')) {
            const cleanText = data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
            const firstLine = cleanText.split('\n')[0]?.slice(0, 80);
            if (firstLine) {
              setTerminalAgent({
                lastDetectedError: { text: firstLine, suggestion: firstLine }
              });
            }
          }
        }
      });

      term.onData((input) => api.write(terminalId, input));

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          api.resize(terminalId, term.cols, term.rows);
        } catch {}
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        removeDataListener();
        resizeObserver.disconnect();
        term.dispose();
      };
    }

    return () => term.dispose();
  }, [terminalId, selectedShell]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full overflow-hidden p-2 bg-[#0a0a0a]/90 select-text"
    />
  );
};
