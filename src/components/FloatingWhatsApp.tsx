'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const FloatingWhatsApp: React.FC = () => {
  const { getWhatsAppLink, lang, whatsappPhone } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  if (!whatsappPhone) return null;

  const defaultGreeting =
    lang === 'ar'
      ? 'مرحباً SAOUDI WEAR ATELIER 💎\nأود الاستفسار والحصول على استشارة خاصة حول أزياء ومقتنيات المتجر.'
      : 'Hello SAOUDI WEAR ATELIER 💎\nI would like to inquire about your luxury bespoke collections.';

  const whatsappUrl = getWhatsAppLink(defaultGreeting);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group">
      {/* Expanding Tooltip Pill on Hover */}
      <div
        className={`hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#141414] border border-[#D4AF37]/50 rounded-full shadow-2xl transition-all duration-300 text-xs font-bold text-neutral-900 dark:text-white pointer-events-none ${
          isHovered
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-3 scale-95'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{lang === 'ar' ? 'تواصل فوري عبر الواتساب' : 'Chat on WhatsApp'}</span>
        {whatsappPhone && (
          <span className="text-[10px] font-mono text-[#D4AF37]">({whatsappPhone})</span>
        )}
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-[#D4AF37] hover:scale-110 active:scale-95 text-white flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.45)] border-2 border-white/40 transition-all duration-300 cursor-pointer"
        aria-label="Contact on WhatsApp"
        title="تواصل عبر الواتساب"
      >
        {/* Pulsing Backlight Ripple */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 fill-current z-10"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 1.761.819 2.796.819 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.297l-7.092 1.859 1.89-6.903c-.908-1.517-1.428-3.29-1.428-5.187 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
        </svg>
      </a>
    </div>
  );
};
