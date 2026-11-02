import React from 'react';
import { ChevronRight, CheckCheck, Square } from 'lucide-react';
import clsx from 'clsx';
import { AgentSkill } from '../../../types/skills';
import { SkillSelectorItem } from './SkillSelectorItem';

interface SkillAccordionGroupProps {
  groupId: string;
  title: string;
  tagBadge?: string;
  icon: React.ReactNode;
  skills: AgentSkill[];
  activeSkillIds: string[];
  isExpanded: boolean;
  onToggleExpand: (groupId: string) => void;
  onToggleSkill: (name: string) => void;
  onToggleGroupAll: (skills: AgentSkill[], activate: boolean) => void;
}

export const SkillAccordionGroup: React.FC<SkillAccordionGroupProps> = ({
  groupId,
  title,
  tagBadge,
  icon,
  skills,
  activeSkillIds,
  isExpanded,
  onToggleExpand,
  onToggleSkill,
  onToggleGroupAll,
}) => {
  const activeCount = skills.filter((s) =>
    activeSkillIds.includes(s.name) ||
    activeSkillIds.includes(s.id) ||
    (!!s.folderName && activeSkillIds.includes(s.folderName))
  ).length;

  const isAllActive = skills.length > 0 && activeCount === skills.length;

  const handleGroupToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGroupAll(skills, !isAllActive);
  };

  return (
    <div className="rounded-xl border border-subtle surface-card overflow-hidden transition-all duration-200">
      {/* Accordion Header */}
      <div
        onClick={() => onToggleExpand(groupId)}
        className="flex items-center justify-between px-3 py-2.5 surface-header hover:brightness-105 cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            size={13}
            className={clsx(
              "text-app-muted transition-transform duration-200 shrink-0",
              isExpanded && "rotate-90 text-primary"
            )}
          />
          <div className="shrink-0">{icon}</div>
          <span className="text-xs font-semibold text-app-text truncate">{title}</span>
          {tagBadge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
              {tagBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={clsx(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border",
              activeCount > 0
                ? "bg-primary/15 border-primary/30 text-primary font-semibold"
                : "border-subtle surface-input text-app-muted"
            )}
          >
            {activeCount}/{skills.length}
          </span>

          {skills.length > 0 && (
            <button
              type="button"
              onClick={handleGroupToggleClick}
              title={isAllActive ? "Deselect group" : "Select all in group"}
              className="p-1 rounded text-app-sub hover:text-app-text hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
            >
              {isAllActive ? <Square size={12} className="text-primary" /> : <CheckCheck size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 border-t border-subtle surface-card/40">
          {skills.length === 0 ? (
            <div className="p-3 text-center text-[11px] text-app-muted italic">
              No custom skills detected in this repository.
            </div>
          ) : (
            skills.map((skill) => {
              const isSkillActive =
                activeSkillIds.includes(skill.name) ||
                activeSkillIds.includes(skill.id) ||
                (!!skill.folderName && activeSkillIds.includes(skill.folderName));

              return (
                <SkillSelectorItem
                  key={skill.id || skill.name}
                  skill={skill}
                  isActive={isSkillActive}
                  onToggle={onToggleSkill}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};