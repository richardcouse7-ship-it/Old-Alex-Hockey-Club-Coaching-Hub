import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Old Alex Hub Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800 text-red-500 mx-auto flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {this.props.fallbackTitle || 'Section Recovery'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                An unexpected display issue occurred in this panel. Your schedule, coach assignments, and data remain safe.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 bg-black/60 border border-neutral-800 rounded-xl text-[11px] font-mono-data text-neutral-400 text-left truncate">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Panel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Return to Hub</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
