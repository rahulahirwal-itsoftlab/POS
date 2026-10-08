import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Enterprise Application Error Boundary
 * Catches render-time JavaScript exceptions and displays a graceful Sandstone recovery UI
 * preventing blank white screens.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('POS Application ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#FAF7F2] flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-white border border-[#E5D8C6] rounded-3xl p-8 shadow-[0_10px_35px_-5px_rgba(41,35,31,0.08)] text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-[#92400E] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-[#1F2937] tracking-tight">
              Something went wrong loading your workspace.
            </h2>

            <p className="text-xs text-[#5B6470] mt-2 leading-relaxed">
              An unexpected error occurred while rendering this view. Your session and operational data remain safe.
            </p>

            {this.state.error?.message && (
              <div className="mt-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#E5D8C6] text-left text-[11px] font-mono text-[#78350F] max-h-28 overflow-y-auto break-words">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#92400E] hover:bg-[#78350F] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Station</span>
              </button>

              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] border border-[#E5D8C6] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Default Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
