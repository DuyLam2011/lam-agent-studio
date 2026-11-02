import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[AppErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSettings = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl text-slate-100 font-sans select-none">
        <div className="w-full max-w-xl p-6 rounded-2xl border border-red-500/30 bg-slate-900/80 shadow-2xl shadow-red-950/50 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-red-400">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">
                L.A.M Agent Studio - Đã phát hiện lỗi giao diện
              </h1>
              <p className="text-xs text-slate-400">
                Một thành phần giao diện gặp lỗi ngoài dự kiến và đã được chặn an toàn.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs font-mono text-red-200 overflow-x-auto break-all">
            {error?.toString() || 'Unknown runtime error occurred.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải lại giao diện
            </button>
            <button
              type="button"
              onClick={this.handleResetSettings}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
              title="Xóa cache giao diện & tải lại"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              Khôi phục mặc định
            </button>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={this.toggleDetails}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDetails ? 'Ẩn chi tiết ngăn xếp (Stack trace)' : 'Xem chi tiết ngăn xếp lỗi'}
            </button>
            {showDetails && errorInfo && (
              <pre className="mt-2 p-3 rounded-lg bg-black/50 border border-slate-800 text-[10px] text-slate-400 overflow-auto max-h-48 font-mono">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
}
