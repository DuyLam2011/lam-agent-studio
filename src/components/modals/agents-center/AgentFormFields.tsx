import React, { useState } from 'react';
import { SubagentPersona } from '../../../types/subagents';
import { useAgentStore } from '../../../store/useAgentStore';
import { getPackageAwareModelOptions } from '../../../services/subagents/subagentPackageResolver';
import { RefreshCw, Sparkles, Edit3 } from 'lucide-react';

interface AgentFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  reasoningEffort: SubagentPersona['reasoningEffort'];
  setReasoningEffort: (v: SubagentPersona['reasoningEffort']) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
}

export const AgentFormFields: React.FC<AgentFormFieldsProps> = ({
  name, setName, role, setRole, model, setModel, reasoningEffort, setReasoningEffort, systemPrompt, setSystemPrompt
}) => {
  const store = useAgentStore();
  const { isFetchingLiveModels, fetchLiveModels } = store;
  const [manualModelInput, setManualModelInput] = useState(false);
  const modelOptions = getPackageAwareModelOptions(store);

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-300 mb-1">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gemini Code Reviewer"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-300 mb-1">Role / Persona Title</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Code Auditor"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
              <Sparkles size={11} className="text-cyan-400" /> AI Model
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLiveModels()}
                disabled={isFetchingLiveModels}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                title="Fetch live available models from Gemini API"
              >
                <RefreshCw size={10} className={isFetchingLiveModels ? "animate-spin" : ""} />
                <span>{isFetchingLiveModels ? 'Fetching...' : 'Fetch Live'}</span>
              </button>
              <button
                type="button"
                onClick={() => setManualModelInput(!manualModelInput)}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5"
                title="Toggle manual text input for any custom model ID"
              >
                <Edit3 size={10} />
                <span>{manualModelInput ? 'Select' : 'Custom'}</span>
              </button>
            </div>
          </div>

          {manualModelInput ? (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gemini-2.5-flash, gpt-4o, or auto-smart-router"
              className="w-full bg-neutral-900 border border-cyan-400/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 truncate"
            >
              {modelOptions.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-300 mb-1">Reasoning Effort</label>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
            {(['high', 'medium', 'low'] as const).map(effort => (
              <button
                key={effort}
                type="button"
                onClick={() => setReasoningEffort(effort)}
                className={`flex-1 py-1 text-[11px] rounded-lg font-semibold uppercase transition-all ${
                  reasoningEffort === effort ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {effort}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-300 mb-1">
          System Directives (Prompt Guidelines)
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          placeholder="Specify exact instructions, coding conventions, review standards, and safety boundaries..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 custom-scrollbar font-mono resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
