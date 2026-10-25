import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HealthPilot ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-3">
            We encountered an unexpected error. You can reload this screen or return to the main dashboard.
          </p>
          {this.state.error?.message && (
            <div className="max-w-md p-3 mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-left font-mono text-[11px] text-red-600 dark:text-red-400 break-words">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-md flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Home className="w-3.5 h-3.5" /> Go to home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
