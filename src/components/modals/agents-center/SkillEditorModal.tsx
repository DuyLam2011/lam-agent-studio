import React from 'react';
import { AgentSkill } from '../../../types/skills';
import { SkillStudioModal } from './skills/SkillStudioModal';

export interface SkillEditorModalProps {
  skill: AgentSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SkillEditorModal: React.FC<SkillEditorModalProps> = ({ skill, isOpen, onClose }) => {
  return <SkillStudioModal skill={skill} isOpen={isOpen} onClose={onClose} />;
};
