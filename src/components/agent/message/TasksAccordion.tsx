import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { AgentTraceItem } from '../../../types/agent-stream';
import type { ToolCallItem } from '../../../store/useAgentStore';
import { ToolCallCard } from '../ToolCallCard';

interface TasksAccordionProps {
  toolItems: Extract<AgentTraceItem, { kind: 'tool' }>[];
  toolsById: Map<string, ToolCallItem>;
  isLive: boolean;
  defaultOpen?: boolean;
}

export const TasksAccordion: React.FC<TasksAccordionProps> = ({
  toolItems,
  toolsById,
  isLive,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (toolItems.length === 0) return null;

  const tools = toolItems.map((t) => toolsById.get(t.toolCallId)).filter(Boolean) as ToolCallItem[];
  const runningCount = tools.filter((t) => t.status === 'running').length;
  const failedCount = tools.filter((t) => t.status === 'failed').length;
  const successCount = tools.filter((t) => t.status === 'success').length;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/[0.12] overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10.5px] hover:bg-amber-500/10 transition-colors select-none text-left"
        title={isOpen ? "Collapse task executions" : "Expand task executions"}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Wrench size={12} className={runningCount > 0 ? "text-amber-400 animate-spin" : "text-amber-300/80"} />
          <span className="font-semibold text-amber-200 truncate">
            {isLive && runningCount > 0 ? `Executing tasks (${toolItems.length})...` : `Task Executions (${toolItems.length} actions)`}
          </span>
          <div className="flex items-center gap-1 text-[9px] font-mono shrink-0">
            {successCount > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-500/30">
                <CheckCircle2 size={9} /> {successCount}
              </span>
            )}
            {runningCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-300 bg-amber-950/40 px-1 py-0.2 rounded border border-amber-500/30">
                <Loader2 size={9} className="animate-spin" /> {runningCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-0.5 text-rose-400 bg-rose-950/40 px-1 py-0.2 rounded border border-rose-500/30">
                <AlertCircle size={9} /> {failedCount}
              </span>
            )}
          </div>
        </span>

        <span className="flex items-center gap-1 shrink-0 text-amber-400/70">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-amber-500/15 p-2 space-y-1.5 bg-black/20">
          {toolItems.map((item, idx) => {
            const toolCall = toolsById.get(item.toolCallId);
            return toolCall ? <ToolCallCard key={item.id} toolCall={toolCall} stepNumber={idx + 1} /> : null;
          })}
        </div>
      )}
    </div>
  );
};
