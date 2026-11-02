import React, { useState } from 'react';
import { Building2, Compass, Zap, Wrench, BookOpen, Sparkles, ChevronDown, ChevronUp, Star, LucideIcon } from 'lucide-react';
import { AgentClassType, AGENT_CLASS_REGISTRY } from '../../../types/agent-class';
import { matchSkillsAndRulesForClass } from '../../../services/agentClassRouter';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface AgentClassSkillRulePickerProps {
  agentClass: AgentClassType;
  setAgentClass: (cls: AgentClassType) => void;
  allowedSkills: string[];
  setAllowedSkills: (skills: string[]) => void;
  allowedRules: string[];
  setAllowedRules: (rules: string[]) => void;
}

const CLASS_ICONS: Record<AgentClassType, LucideIcon> = {
  architecture: Building2,
  planner: Compass,
  executor: Zap
};

export const AgentClassSkillRulePicker: React.FC<AgentClassSkillRulePickerProps> = ({
  agentClass, setAgentClass, allowedSkills, setAllowedSkills, allowedRules, setAllowedRules
}) => {
  const { agentSkills, agentRules, addToast } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const classes: AgentClassType[] = ['architecture', 'planner', 'executor'];

  const rec = matchSkillsAndRulesForClass(agentClass, agentSkills.map(s => s.folderName), agentRules.map(r => r.id));

  const handleClassChange = (newClass: AgentClassType) => {
    setAgentClass(newClass);
    const newRec = matchSkillsAndRulesForClass(newClass, agentSkills.map(s => s.folderName), agentRules.map(r => r.id));
    setAllowedSkills(newRec.recommendedSkills);
    setAllowedRules(newRec.matchedRules);
    addToast(`Selected ${newClass} & loaded recommended skills & rules`, 'info');
  };

  const toggleSkill = (sk: string) => setAllowedSkills(allowedSkills.includes(sk) ? allowedSkills.filter(s => s !== sk) : [...allowedSkills, sk]);
  const toggleRule = (rid: string) => setAllowedRules(allowedRules.includes(rid) ? allowedRules.filter(r => r !== rid) : [...allowedRules, rid]);

  return (
    <div className="space-y-2 pt-1 border-t border-white/5">
      <div>
        <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1"><Sparkles size={11} className="text-pink-400" /> Specialization Class</span>
          <span className="text-[10px] text-gray-400">Class guides orchestration</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {classes.map((cls) => {
            const meta = AGENT_CLASS_REGISTRY[cls];
            const isSelected = agentClass === cls;
            const Icon = CLASS_ICONS[cls];
            return (
              <button
                key={cls}
                type="button"
                onClick={() => handleClassChange(cls)}
                className={clsx(
                  "p-2 rounded-xl border text-left flex items-center gap-2 transition-all",
                  isSelected ? "bg-white/10 border-white/30 shadow-md ring-1 ring-white/20" : "bg-white/5 border-white/5 hover:border-white/15 opacity-70 hover:opacity-100"
                )}
                style={isSelected ? { borderColor: meta.themeColor } : undefined}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.themeColor}25`, color: meta.themeColor }}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{meta.name}</div>
                  <div className="text-[9px] text-gray-400 truncate">{meta.badgeLabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-cyan-300 font-medium text-[11px]"><Wrench size={11} /> {allowedSkills.length} Skills</span>
            <span className="flex items-center gap-1 text-purple-300 font-medium text-[11px]"><BookOpen size={11} /> {allowedRules.length} Rules</span>
          </div>
          <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/5">
            <span>{isExpanded ? 'Collapse' : 'Customize Skills & Rules'}</span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center justify-between">
                <span>Select Skills:</span>
                <button type="button" onClick={() => setAllowedSkills(rec.recommendedSkills)} className="text-[9px] text-cyan-400 hover:underline">Defaults</button>
              </div>
              <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                {agentSkills.map((sk) => (
                  <button key={sk.id} type="button" onClick={() => toggleSkill(sk.folderName)} className={clsx("px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-colors flex items-center gap-1", allowedSkills.includes(sk.folderName) ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-black/30 text-gray-400 border-white/5 hover:border-white/20")}>
                    {rec.recommendedSkills.includes(sk.folderName) && <Star size={8} className="fill-amber-300 text-amber-300" />}
                    <span>{sk.folderName}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center justify-between">
                <span>Select Rules:</span>
                <button type="button" onClick={() => setAllowedRules(rec.matchedRules)} className="text-[9px] text-purple-400 hover:underline">Defaults</button>
              </div>
              <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                {agentRules.map((r) => (
                  <button key={r.id} type="button" onClick={() => toggleRule(r.id)} className={clsx("px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-colors flex items-center gap-1", allowedRules.includes(r.id) ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-black/30 text-gray-400 border-white/5 hover:border-white/20")}>
                    {rec.matchedRules.some(x => r.id.includes(x)) && <Star size={8} className="fill-amber-300 text-amber-300" />}
                    <span>{r.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
