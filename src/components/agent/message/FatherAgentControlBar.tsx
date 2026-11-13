import React from 'react';
import { ShieldCheck, Square, Compass, FileSearch, GitBranch, ShieldAlert, Network } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { cancelActiveRun } from '../../../services/agent-chat/agentRunService';

interface FatherAgentControlBarProps {
  isLive: boolean;
  model?: string;
}

export const FatherAgentControlBar: React.FC<FatherAgentControlBarProps> = ({ isLive, model }) => {
  const { setPendingChatPrompt, addToast } = useAgentStore();

  const handleSteer = (directive: string) => {
    setPendingChatPrompt(`[Father Agent Steer]: ${directive}`);
    addToast(`Đã nạp chỉ thị điều hướng Father Agent: ${directive}`, 'info');
  };

  const handleStop = async () => {
    await cancelActiveRun();
    addToast('Đã dừng phiên thực thi của Agent', 'info');
  };

  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/[0.12] p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
          <span className="text-[10.5px] font-bold text-emerald-300">Father Agent Supervisor</span>
          <span className="text-[9.5px] text-gray-400 font-mono">({model || 'Active Engine'})</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Isolated Context Distillation
          </span>
        </div>

        {isLive && (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition-colors"
            title="Dừng khẩn cấp tiến trình agent đang chạy"
          >
            <Square size={9} fill="currentColor" />
            <span>Dừng tác vụ</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap text-[9.5px]">
        <span className="text-app-muted flex items-center gap-1 shrink-0 select-none">
          <Compass size={10} className="text-emerald-400" />
          <span>Điều phối:</span>
        </span>

        <button
          type="button"
          onClick={() => handleSteer('Kích hoạt Father Agent DAG: Phân rã mục tiêu thành các Task Contract độc lập cho Subagents')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors"
        >
          <Network size={9} />
          <span>Điều phối Subagents (DAG)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Dừng suy đoán, hãy dùng read_file đọc chính xác nội dung file trên đĩa')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
        >
          <FileSearch size={9} />
          <span>Đọc file thực tế</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Kiểm tra git diff và chạy lệnh test để thẩm định')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
        >
          <GitBranch size={9} />
          <span>Kiểm tra Git & Tests</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer('Tuân thủ nghiêm ngặt Rule 4: Tách hàm modular, đảm bảo file ≤ 150 dòng')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
        >
          <ShieldAlert size={9} />
          <span>Ép chuẩn Rule 4 (≤150 dòng)</span>
        </button>
      </div>
    </div>
  );
};
