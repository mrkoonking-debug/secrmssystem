
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const AUTH_TIMEOUT_MS = 10000; // 10 seconds

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Timeout fallback — if auth takes > 10s, show error
    const timer = setTimeout(() => {
      if (!cancelled && !authReady) {
        setTimedOut(true);
      }
    }, AUTH_TIMEOUT_MS);

    MockDb.waitForAuth().then(() => {
      if (!cancelled) {
        setIsAuthenticated(MockDb.isAuthenticated());
        setAuthReady(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Timeout / Error fallback
  if (timedOut && !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">
            เชื่อมต่อไม่สำเร็จ
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            ไม่สามารถเชื่อมต่อกับ Firebase ได้ — อาจเป็นเพราะเน็ตช้าหรือ Server มีปัญหา
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              <RefreshCw className="w-4 h-4" /> ลองใหม่
            </button>
            <Link
              to="/login"
              className="w-full py-3 bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-300 rounded-xl font-medium text-center hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors"
            >
              กลับหน้า Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading spinner while waiting for Firebase Auth
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
          <span className="text-sm text-gray-400">กำลังตรวจสอบสิทธิ์...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
