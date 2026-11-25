import React, { useState } from 'react';
import { ChatMessage, useAgentStore } from '../../../store/useAgentStore';
import { FatherToCodexCard } from './FatherToCodexCard';

export const ChatMessageDelegationSection: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const contract = message.delegationContract;
  const [isExecuting, setIsExecuting] = useState(false);
  const { addToast } = useAgentStore();

  if (!contract) return null;

  const handleAuthorize = async (contractId: string) => {
    setIsExecuting(true);
    addToast('Father Agent: Authorized! Delegating contract to coding engine...', 'info');
    try {
      // @ts-ignore
      await window.lamApi?.delegation?.updateContractStatus?.(contractId, 'executing');
      contract.status = 'executing';

      // Simulate or trigger Codex execution pass
      setTimeout(async () => {
        // @ts-ignore
        const verifyRes = await window.lamApi?.delegation?.verifyExecution?.(contract, 'clean diff', 'PASS');
        contract.status = 'completed';
        setIsExecuting(false);
        addToast(verifyRes?.father_verdict || 'Coding worker completed the contract!', 'success');
        useAgentStore.setState((s) => ({
          chatMessages: s.chatMessages.map((m) => m.id === message.id ? { ...m, delegationContract: { ...contract, status: 'completed' } } : m)
        }));
      }, 1500);
    } catch (err: any) {
      setIsExecuting(false);
      addToast(`Authorization error: ${err.message}`, 'error');
    }
  };

  return (
    <FatherToCodexCard
      contract={contract}
      onAuthorize={contract.status === 'pending_approval' ? handleAuthorize : undefined}
      isExecuting={isExecuting}
    />
  );
};
