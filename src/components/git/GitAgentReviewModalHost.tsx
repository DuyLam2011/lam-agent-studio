import React from 'react';
import { useAgentActivityStore } from '../../store/useAgentActivityStore';
import { GitAgentReviewModal } from './GitAgentReviewModal';

export const GitAgentReviewModalHost: React.FC = () => {
  const { isReviewModalOpen, reviewModalTarget, closeReviewModal } = useAgentActivityStore();

  if (!isReviewModalOpen || !reviewModalTarget) return null;

  return (
    <GitAgentReviewModal
      isOpen={isReviewModalOpen}
      onClose={closeReviewModal}
      repoPath={reviewModalTarget.repoPath}
      filePath={reviewModalTarget.filePath}
    />
  );
};
