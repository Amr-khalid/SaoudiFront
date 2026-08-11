'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LOGO_URL } from '../../types';
import { api } from '../../lib/api';

interface AdminLoginGateProps {
  children: React.ReactNode;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('admin@saoudiwear.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('saoudi_token') : null;
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const user = await api.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await api.adminLogin(email, password);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.warn('Backend login error:', err);
      setErrorMessage(err.message || 'فشلت عملية المصادقة. يرجى التحقق من بيانات الدخول.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await api.adminLogin('admin@saoudiwear.com', 'AdminPassword123!');
      setIsAuthenticated(true);
    } catch (err: any) {
      console.warn('Demo login notice:', err);
      setErrorMessage(err.message || 'تعذر الحصول على توكن الإدارة.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-garamond text-[#D4AF37] tracking-widest uppercase">
            SAOUDI WEAR ATELIER SECURITY GATE
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 relative overflow-hidden dir-rtl">
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto">
              <Image src={LOGO_URL} alt="SAOUDI WEAR" fill unoptimized className="object-contain" />
            </div>

            <div>
              <span className="text-[11px] font-label-caps text-[#D4AF37] tracking-[0.2em] uppercase font-bold">
                لوحة تحكم الأدمن والمدراء
              </span>
              <h1 className="font-garamond text-2xl font-bold text-white mt-1">
                تسجيل الدخول إلى SAOUDI WEAR
              </h1>
              <p className="text-xs text-neutral-400 font-light mt-1">
                أدخل بيانات الاعتماد الخاصة بحساب مدير Atelier للوصول إلى النُظم الحية.
              </p>
            </div>
          </div>

          {/* Quick Demo Login Chip */}
          <div className="p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl text-center space-y-1.5">
            <div className="text-xs font-bold text-[#D4AF37]">💡 تسجيل الدخول التلقائي بالنظام</div>
            <div className="text-[11px] text-neutral-300">
              تسجيل الدخول ببيانات مدير النظام المعتمدة والحصول على توكن JWT موثوق:
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="mt-2 w-full py-2.5 bg-[#D4AF37] hover:bg-[#b8952c] text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              <span>دخول مباشر كمدير النظام (Super Admin JWT Token)</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl text-center">
              {errorMessage}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                البريد الإلكتروني للإدارة (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@saoudiwear.com"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                كلمة المرور (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-white text-neutral-950 hover:bg-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>جاري اصدار التوكن والتحقق...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  <span>تسجيل الدخول والنفاذ</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono">
            SAOUDI WEAR ATELIER ENTERPRISE SYSTEM v2.4.0
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
