'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../../context/AppContext';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { CartDrawer } from '../CartDrawer';
import { WishlistDrawer } from '../WishlistDrawer';
import { QuickViewModal } from '../QuickViewModal';
import { SearchModal } from '../SearchModal';
import { LookbookModal } from '../LookbookModal';
import { SizeGuideModal } from '../SizeGuideModal';
import { View360Modal } from '../View360Modal';
import { AuthModal } from '../AuthModal';
import { CustomerProfileModal } from '../CustomerProfileModal';
import { FloatingWhatsApp } from '../FloatingWhatsApp';
import { LuxuryModalAlert } from '../ui/LuxuryModalAlert';

const ToastPopup: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const type = toast.type || 'success';
  const getToastStyle = () => {
    switch (type) {
      case 'error':
        return {
          border: 'border-rose-500/40',
          text: 'text-rose-600 dark:text-rose-400',
          icon: 'error',
          badge: 'bg-rose-500/10 text-rose-500',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40',
          text: 'text-amber-600 dark:text-amber-400',
          icon: 'warning',
          badge: 'bg-amber-500/10 text-amber-500',
        };
      case 'info':
        return {
          border: 'border-sky-500/40',
          text: 'text-sky-600 dark:text-sky-400',
          icon: 'info',
          badge: 'bg-sky-500/10 text-sky-500',
        };
      case 'success':
      default:
        return {
          border: 'border-[#D4AF37]/50',
          text: 'text-[#B8860B] dark:text-[#D4AF37]',
          icon: 'verified',
          badge: 'bg-[#D4AF37]/15 text-[#D4AF37]',
        };
    }
  };

  const style = getToastStyle();

  return (
    <div className={`fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-[9998] bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl border ${style.border} px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/40 flex items-center space-x-3 rtl:space-x-reverse animate-fade-up max-w-sm`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${style.badge}`}>
        <span className="material-symbols-outlined text-lg">{style.icon}</span>
      </div>
      <div className="flex-1">
        <span className={`text-xs font-bold leading-snug block ${style.text}`}>{toast.message}</span>
      </div>
    </div>
  );
};

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-[#E5E5E5] flex flex-col justify-between selection:bg-[#D4AF37]/30 selection:text-[#D4AF37] transition-colors duration-300">
      <ToastPopup />
      {!isAdmin && <Navbar />}

      <main className="flex-grow">{children}</main>

      {!isAdmin && <Footer />}
      {!isAdmin && <FloatingWhatsApp />}

      {/* Drawers & Modals */}
      <LuxuryModalAlert />
      <CartDrawer />
      <WishlistDrawer />
      <QuickViewModal />
      <SearchModal />
      <LookbookModal />
      <SizeGuideModal />
      <View360Modal />
      <AuthModal />
      <CustomerProfileModal />
    </div>
  );
};

export const ClientLayoutContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <LayoutContent>{children}</LayoutContent>
    </AppProvider>
  );
};
