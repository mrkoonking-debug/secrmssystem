
import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2">
                            เกิดข้อผิดพลาด
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            ระบบเกิดปัญหาที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                        </p>
                        {this.state.error && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-[#1c1c1e] rounded-xl px-4 py-2 mb-6 break-all">
                                {this.state.error.message}
                            </p>
                        )}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                            >
                                <RefreshCw className="w-4 h-4" /> ลองใหม่
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors"
                            >
                                กลับหน้าหลัก
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
