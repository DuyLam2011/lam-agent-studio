import React from 'react';
import { Code2, ArrowRight, ShieldAlert, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAgentActivityStore } from '../../../store/useAgentActivityStore';

interface ContextBatchReviewCardProps {
  backendReview?: any;
  onSendToMainAgent: (review: any) => void;
}

export const ContextBatchReviewCard: React.FC<ContextBatchReviewCardProps> = ({
  backendReview,
  onSendToMainAgent
}) => {
  const { setInspectorOpen } = useAgentActivityStore();

  if (!backendReview) {
    return (
      <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-sky-400" />
          <span>Backend Review Specialist: Standby (ready to inspect diffs).</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Idle</span>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <ShieldAlert size={12} className="text-rose-400 shrink-0" />;
      case 'high': return <AlertTriangle size={12} className="text-amber-400 shrink-0" />;
      default: return <CheckCircle size={12} className="text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Code2 size={14} />
          </div>
          <div>
            <div className="text-xs font-bold text-sky-200">Backend Review Intelligence</div>
            <div className="text-[10px] text-gray-400">
              Reviewed by <span className="text-sky-300 font-medium">{backendReview.agentName}</span> on <span className="font-mono text-gray-300">{backendReview.target}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {backendReview.findingsCount} Issues
          </span>
          {backendReview.criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              {backendReview.criticalCount} Critical
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5 font-sans">
        {backendReview.summary}
      </p>

      {/* Findings Preview List */}
      {backendReview.findings && backendReview.findings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {backendReview.findings.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2 text-xs">
              {getSeverityIcon(item.severity)}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-200 truncate">{item.title}</div>
                <div className="text-[10px] text-gray-400 truncate">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-sky-500/10 gap-2">
        <button
          onClick={() => setInspectorOpen(true)}
          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ExternalLink size={11} /> View Raw Stream
        </button>

        <button
          onClick={() => onSendToMainAgent(backendReview)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-primary hover:from-sky-400 hover:to-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
          title="Send findings to Father Agent to automatically patch the code"
        >
          <span>Gửi cho Agent chính sửa code</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
