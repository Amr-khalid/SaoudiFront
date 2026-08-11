'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Newsletter: React.FC = () => {
  const { showToast, t, lang } = useApp();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast(lang === 'ar' ? 'الرجاء إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    showToast(lang === 'ar' ? 'أهلاً بك في الدائرة الخاصة لـ SAOUDI WEAR' : 'Welcome to SAOUDI WEAR Private Circle.');
  };

  return (
    <section className="py-24 px-5 md:px-16 max-w-[1040px] mx-auto text-center">
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#262626] p-8 sm:p-16 rounded-2xl space-y-6 relative overflow-hidden shadow-xl hover:border-[#D4AF37]/50 transition-all duration-300">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#B8860B] dark:text-[#D4AF37] text-[11px] font-label-caps tracking-[0.25em] uppercase font-bold">
            <span>✦</span>
            <span>PRIVÉ CIRCLE</span>
            <span>✦</span>
          </div>

          <h2 className="font-headline-lg text-3xl md:text-4xl font-garamond text-neutral-900 dark:text-[#E5E5E5]">
            {t.newsletterTitle}
          </h2>
          <p className="font-body-md text-sm md:text-base text-neutral-600 dark:text-[#A3A3A3] max-w-lg mx-auto font-light leading-relaxed">
            {t.newsletterSubtitle}
          </p>
        </div>

        {subscribed ? (
          <div className="p-6 bg-amber-50 dark:bg-[#1D1D1D] border border-[#D4AF37] text-[#B8860B] dark:text-[#D4AF37] font-body-md text-sm max-w-md mx-auto rounded-xl animate-fade-up shadow-md">
            <span className="material-symbols-outlined text-4xl block mb-2 text-[#D4AF37]">verified</span>
            <p className="font-bold">{t.orderSuccessDesc || (lang === 'ar' ? 'تم اشتراكك بنجاح في الدائرة الملكية الخاصة.' : 'Successfully subscribed to the Atelier Private Circle.')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2 relative z-10">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailInputPlaceholder}
              className="w-full px-5 py-3.5 bg-neutral-50 dark:bg-[#1D1D1D] border border-neutral-300 dark:border-[#262626] focus:border-[#D4AF37] rounded-lg text-sm text-neutral-900 dark:text-[#E5E5E5] placeholder-neutral-400 dark:placeholder-[#A3A3A3] outline-none transition-all shadow-inner"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 hover:brightness-110 font-button text-xs tracking-widest uppercase font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg shadow-md hover:shadow-xl"
            >
              {t.subscribeBtn || (lang === 'ar' ? 'اشترك الآن' : 'SUBSCRIBE')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
