'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const LuxuryModalAlert: React.FC = () => {
  const { modalState, closeModal } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalState.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        modalState.onCancel?.();
        closeModal();
      } else if (e.key === 'Enter' && !modalState.isConfirm) {
        e.preventDefault();
        modalState.onConfirm?.();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState, closeModal]);

  if (!modalState.isOpen) return null;

  const type = modalState.type || 'info';

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: modalState.icon || 'delete_forever',
          iconBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-rose-500/20',
          confirmBtn: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/30 border-red-500/30',
          accentBorder: 'border-rose-500/20',
        };
      case 'warning':
        return {
          icon: modalState.icon || 'warning',
          iconBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/20',
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-900/30 border-amber-500/30',
          accentBorder: 'border-amber-500/20',
        };
      case 'success':
        return {
          icon: modalState.icon || 'check_circle',
          iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/20',
          confirmBtn: 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C99700] text-black font-semibold shadow-lg shadow-[#D4AF37]/25 border-[#D4AF37]/40',
          accentBorder: 'border-emerald-500/20',
        };
      case 'question':
      case 'info':
      default:
        return {
          icon: modalState.icon || (modalState.isConfirm ? 'help_outline' : 'info'),
          iconBg: 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] border-[#D4AF37]/30 shadow-[#D4AF37]/20',
          confirmBtn: 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C99700] text-black font-semibold shadow-lg shadow-[#D4AF37]/25 border-[#D4AF37]/40',
          accentBorder: 'border-[#D4AF37]/20',
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    modalState.onConfirm?.();
    closeModal();
  };

  const handleCancel = () => {
    modalState.onCancel?.();
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !modalState.isConfirm) {
          handleCancel();
        }
      }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl bg-white dark:bg-[#121212] border ${config.accentBorder} shadow-2xl shadow-black/80 overflow-hidden transform transition-all animate-scale-in`}
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Luxury Glow Bar */}
        <div
          className={`h-1.5 w-full ${
            type === 'danger'
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600'
              : type === 'warning'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
              : type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-[#D4AF37]'
              : 'bg-gradient-to-r from-[#B8860B] via-[#E5C158] to-[#B8860B]'
          }`}
        />

        <div className="p-6 sm:p-7">
          {/* Icon Header */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-lg ${config.iconBg}`}
            >
              <span className="material-symbols-outlined text-2xl font-bold">{config.icon}</span>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-wide">
                {modalState.title || (modalState.isConfirm ? 'تأكيد الإجراء' : 'تنبيه')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {modalState.isConfirm ? 'يرجى مراجعة التفاصيل قبل المتابعة' : 'إشعار من منصة SAOUDI WEAR'}
              </p>
            </div>
          </div>

          {/* Message Body */}
          <div className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-line font-medium">
              {modalState.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {modalState.isConfirm && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                {modalState.cancelText || 'إلغاء'}
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${config.confirmBtn}`}
            >
              <span>{modalState.confirmText || (modalState.isConfirm ? 'تأكيد' : 'حسناً، فهمت')}</span>
              <span className="material-symbols-outlined text-sm">
                {modalState.isConfirm ? 'done_all' : 'check'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
