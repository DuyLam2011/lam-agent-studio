import React from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAgentStore();

  return (
    <div className="fixed bottom-4 right-4 z-[999999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "pointer-events-auto w-80 p-3 rounded-xl backdrop-blur-xl shadow-2xl border flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-right-4 fade-in",
            {
              'bg-green-500/10 border-green-500/20 text-green-100': toast.type === 'success',
              'bg-red-500/10 border-red-500/20 text-red-100': toast.type === 'error',
              'bg-blue-500/10 border-blue-500/20 text-blue-100': toast.type === 'info',
            }
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle size={16} className="text-green-400" />}
            {toast.type === 'error' && <AlertTriangle size={16} className="text-red-400" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400" />}
          </div>
          
          <div className="flex-1 text-xs leading-relaxed break-words pr-2">
            {toast.message}
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
