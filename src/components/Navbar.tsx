'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { LOGO_URL } from '../types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    cartItems,
    wishlistIds,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    theme,
    toggleTheme,
    lang,
    toggleLanguage,
    user,
    isAdmin,
    setIsAuthOpen,
    setIsProfileOpen,
    t,
    getWhatsAppLink,
    isLoadingProducts,
  } = useApp();

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistIds.length;
  const isDark = theme === 'dark';

  return (
    <>
      {/* Main Glass Navbar */}
      <nav
        id="main-nav"
        className="sticky top-0 w-full z-50 bg-white/95 dark:bg-[#0A0A0A]/92 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300"
      >
        <div className="flex justify-between items-center px-3 sm:px-6 md:px-12 lg:px-16 py-2.5 sm:py-3 md:py-3.5 w-full max-w-[1480px] mx-auto min-h-[56px] sm:min-h-[60px]">
          {/* Start Section: Menu Button + Brand Logo & SW */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl text-neutral-800 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer flex items-center justify-center active:scale-95"
              aria-label="Open Mobile Menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Mobile Brand Name with Golden Shimmer (Full Name without Logo) */}
            <Link
              href="/"
              className="flex md:hidden items-center cursor-pointer group py-1 select-none px-0.5"
              aria-label={t.brandName || 'SAOUDI WEAR'}
            >
              <span className="gold-shine-text font-garamond font-bold tracking-[0.2em] sm:tracking-[0.24em] text-[15px] sm:text-lg uppercase leading-none transition-transform duration-300 group-hover:scale-105">
                {t.brandName || 'SAOUDI WEAR'}
              </span>
            </Link>

            {/* Desktop Brand Logo & Title */}
            <Link
              href="/"
              className="hidden md:flex cursor-pointer flex-shrink-0 items-center gap-3 sm:gap-3.5 group transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="relative h-9 w-20 sm:h-10 sm:w-24 md:h-11 md:w-28 drop-shadow-md">
                <Image
                  src={LOGO_URL}
                  alt="SAOUDI WEAR Logo"
                  fill
                  unoptimized
                  className="object-contain logo-img transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-headline-md text-base sm:text-xl md:text-2xl tracking-[0.18em] text-neutral-900 dark:text-[#D4AF37] uppercase font-garamond font-bold leading-tight">
                  {t.brandName || 'SAOUDI WEAR'}
                </span>
                <span className="text-[9px] font-label-caps tracking-[0.32em] text-[#9A7B1C] dark:text-neutral-400 uppercase font-semibold">
                  {lang === 'ar' ? 'الأتيليه الملكي' : 'ATELIER DE LUXE'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links with Bright Luxury Pills */}
          {isLoadingProducts ? (
            <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse bg-neutral-100/70 dark:bg-[#141414]/90 p-1.5 rounded-full border border-neutral-200/70 dark:border-neutral-800/90 backdrop-blur-md">
              <div className="w-20 h-7 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 luxury-skeleton animate-pulse" />
              <div className="w-20 h-7 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 luxury-skeleton animate-pulse" />
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-1.5 rtl:space-x-reverse bg-neutral-100/70 dark:bg-[#141414]/90 p-1 rounded-full border border-neutral-200/70 dark:border-neutral-800/90 backdrop-blur-md">
              <Link
                href="/"
                className={`px-4 py-2 rounded-full text-xs font-button tracking-[0.2em] uppercase font-bold transition-all duration-300 ${
                  pathname === '/'
                    ? 'bg-amber-100 text-amber-950 border border-amber-300/80 shadow-xs dark:bg-gradient-to-r dark:from-[#D4AF37] dark:via-[#E5C158] dark:to-[#D4AF37] dark:text-neutral-950 dark:border-transparent dark:shadow-md dark:shadow-[#D4AF37]/20 scale-105'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                {t.home || (lang === 'ar' ? 'الرئيسية' : 'Home')}
              </Link>

              <Link
                href="/shop"
                className={`px-4 py-2 rounded-full text-xs font-button tracking-[0.2em] uppercase font-bold transition-all duration-300 ${
                  pathname.startsWith('/shop')
                    ? 'bg-amber-100 text-amber-950 border border-amber-300/80 shadow-xs dark:bg-gradient-to-r dark:from-[#D4AF37] dark:via-[#E5C158] dark:to-[#D4AF37] dark:text-neutral-950 dark:border-transparent dark:shadow-md dark:shadow-[#D4AF37]/20 scale-105'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-neutral-800/60'
                }`}
              >
                {t.shop || (lang === 'ar' ? 'الكتالوج' : 'Catalog')}
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-full text-xs font-button tracking-[0.2em] uppercase font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-100 text-amber-950 border border-amber-300/80 shadow-xs dark:bg-gradient-to-r dark:from-[#D4AF37] dark:via-[#E5C158] dark:to-[#D4AF37] dark:text-neutral-950 dark:border-transparent dark:shadow-md dark:shadow-[#D4AF37]/20 scale-105'
                      : 'text-amber-800 dark:text-[#D4AF37] hover:bg-white/80 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                  <span>Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* End Action Controls (Transparent by default in Light Mode) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse">
            {/* Language Switcher Button (Desktop) */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:border-[#D4AF37] transition-all cursor-pointer text-xs font-button font-bold"
              title={lang === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch to English'}
              aria-label="Toggle Language"
            >
              <span className="material-symbols-outlined text-base">language</span>
              <span className="uppercase text-[11px] font-mono tracking-wider font-bold">
                {lang === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>

            {/* Theme Switcher Button (Desktop) */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-900/80 hover:border-[#D4AF37] transition-all cursor-pointer text-xs font-button font-bold"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined text-base">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden lg:inline uppercase text-[10px] tracking-wider font-bold">
                {theme === 'dark' ? (lang === 'ar' ? 'فاتح' : 'Light') : (lang === 'ar' ? 'ليلي' : 'Dark')}
              </span>
            </button>

            {/* Distinctive Luxury Theme Switcher (Prominent on Mobile) */}
            <button
              onClick={toggleTheme}
              className={`flex sm:hidden w-9 h-9 rounded-full items-center justify-center transition-all cursor-pointer relative active:scale-90 hover:scale-105 shadow-xs border ${
                theme === 'dark'
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/25 shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                  : 'bg-neutral-900 border-neutral-700 text-amber-300 hover:bg-neutral-800 shadow-sm'
              }`}
              title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي الملكي'}
              aria-label="Toggle Theme Mobile"
            >
              <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${theme === 'dark' ? 'rotate-0' : '-rotate-45'}`}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer active:scale-95 hover:scale-105"
              title={t.search}
              aria-label="Search items"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
            </button>

            {/* Favorites / Wishlist (Desktop Only in Top Bar, Available in Drawer for Mobile) */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center text-neutral-800 dark:text-[#D4AF37] hover:bg-rose-50 dark:hover:bg-neutral-800/80 hover:text-rose-600 transition-all relative cursor-pointer active:scale-95 hover:scale-105"
              title={t.wishlist}
              aria-label="View Wishlist"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">favorite</span>
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-rose-600 text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Bag / Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-[#D4AF37] hover:bg-amber-50 dark:hover:bg-neutral-800/80 hover:text-amber-800 transition-all relative cursor-pointer active:scale-95 hover:scale-105"
              title={t.bag}
              aria-label="View Cart"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#D4AF37] text-neutral-950 text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold shadow-md animate-bounce font-mono">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Button */}
            <button
              onClick={() => (user ? setIsProfileOpen(true) : setIsAuthOpen(true))}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer relative active:scale-95 hover:scale-105"
              title={user ? `حسابي: ${user.name}` : 'تسجيل الدخول / إنشاء حساب'}
              aria-label="Account"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">
                {user ? 'account_circle' : 'person'}
              </span>
              {user && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Modern Luxury Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Drawer Content */}
          <div
            className={`relative w-[85%] max-w-sm h-full shadow-2xl flex flex-col justify-between p-6 z-10 transition-transform duration-300 border-l ${
              isDark
                ? 'bg-[#121212] text-white border-neutral-800'
                : 'bg-white text-neutral-900 border-neutral-200'
            }`}
          >
            {/* Top Bar inside Drawer */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-7 w-12">
                    <Image
                      src={LOGO_URL}
                      alt="SW Logo"
                      fill
                      unoptimized
                      className="object-contain logo-img"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-garamond font-bold text-base text-neutral-900 dark:text-[#D4AF37] leading-tight">
                      SAOUDI WEAR
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono tracking-widest uppercase">
                      {lang === 'ar' ? 'الأتيليه الملكي الفاخر' : 'ROYAL LUXURY ATELIER'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
                  title="إغلاق القائمة"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* User Status Card */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) setIsProfileOpen(true);
                  else setIsAuthOpen(true);
                }}
                className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  user
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-neutral-900 dark:text-[#D4AF37]'
                    : isDark
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-[#D4AF37]/50'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-[#D4AF37]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-neutral-950 font-garamond font-bold text-base flex items-center justify-center shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : <span className="material-symbols-outlined text-lg">person</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs truncate max-w-[170px]">
                      {user?.name || (lang === 'ar' ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register')}
                    </h4>
                    <p className="text-[11px] opacity-75 font-mono">
                      {user ? 'عضوية Atelier VIP • اضغط للبروفايل' : 'حفظ بياناتك وتتبع طلباتك فورياً'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-lg rtl:rotate-180">chevron_right</span>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 space-y-2 text-sm font-bold">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    pathname === '/'
                      ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                      : isDark
                      ? 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">home</span>
                  <span>{lang === 'ar' ? 'الرئيسية (Home)' : 'Home'}</span>
                </Link>

                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    pathname.startsWith('/shop')
                      ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                      : isDark
                      ? 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">storefront</span>
                  <span>{lang === 'ar' ? 'الكتالوج الفاخر (Shop Catalog)' : 'Shop Catalog'}</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsWishlistOpen(true);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    isDark
                      ? 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-rose-500">favorite</span>
                    <span>{lang === 'ar' ? 'المفضلات (Wishlist)' : 'Wishlist'}</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#D4AF37] text-neutral-950 rounded-full text-xs font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (user) {
                      setIsProfileOpen(true);
                    } else {
                      setIsAuthOpen(true);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                    isDark
                      ? 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-[#9A7B1C] dark:text-[#D4AF37]">travel_explore</span>
                  <span>{lang === 'ar' ? 'سجل وتتبع الطلبات الحية' : 'Track Order History'}</span>
                </button>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-amber-800 dark:text-[#D4AF37] ${
                      pathname.startsWith('/admin')
                        ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                        : isDark
                        ? 'hover:bg-neutral-900'
                        : 'hover:bg-amber-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                    <span>{lang === 'ar' ? 'لوحة الإدارة (Admin Panel)' : 'Admin Panel'}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Controls inside Drawer */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              {/* Quick Language & Theme Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={toggleLanguage}
                  className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800/30 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#D4AF37]"
                >
                  <span className="material-symbols-outlined text-base">language</span>
                  <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800/30 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#D4AF37]"
                >
                  <span className="material-symbols-outlined text-base">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}</span>
                </button>
              </div>

              {/* Concierge WhatsApp Support */}
              <a
                href={getWhatsAppLink(
                  lang === 'ar' ? 'مرحباً SAOUDI WEAR أود الاستفسار' : 'Hello SAOUDI WEAR I would like to inquire'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>{lang === 'ar' ? 'خدمة كونسيرج واتساب الفاخرة' : 'VIP WhatsApp Concierge'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
