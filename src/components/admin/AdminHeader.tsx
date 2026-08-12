'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminTab } from './AdminSidebar';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { AdminNotificationItem } from '../../types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setIsOpenMobile: (open: boolean) => void;
  onOpenAddProductModal: () => void;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setIsOpenMobile,
  onOpenAddProductModal,
  onNavigateTab,
}) => {
  const { theme, toggleTheme, user } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.getNotifications().then((notifs) => {
      if (isMounted && notifs && notifs.length > 0) {
        setNotifications(notifs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await api.markNotificationRead(notif.id || notif._id || '');
      }
    }
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const titleMap: Record<AdminTab, { title: string; subtitle: string; icon: string; shortTitle: string }> = {
    dashboard: {
      title: 'لوحة التحكم والمؤشرات الحية (Executive Dashboard)',
      shortTitle: 'لوحة التحكم',
      subtitle: 'مراقبة المبيعات اللحظية، الطلبات المباشرة، والأداء العام للمتجر',
      icon: 'dashboard',
    },
    orders: {
      title: 'مركز إدارة الطلبات والشحن والأرشيف',
      shortTitle: 'إدارة الطلبات',
      subtitle: 'متابعة الطلبات المباشرة، أرشيف العمليات المكتملة، وتصدير الفواتير',
      icon: 'shopping_bag',
    },
    products: {
      title: 'إدارة كتالوج المنتجات الفاخرة (Products)',
      shortTitle: 'المنتجات',
      subtitle: 'إضافة وتعديل المنتجات، الأسعار، الصور، والألوان ومصفوفة المقاسات',
      icon: 'apparel',
    },
    categories: {
      title: 'الأقسام والتصنيفات (Categories & Collections)',
      shortTitle: 'التصنيفات',
      subtitle: 'تنظيم المجموعات والأقسام الرئيسية وتصنيفات الأزياء والمقتنيات',
      icon: 'category',
    },
    inventory: {
      title: 'المخزون ومستودع الأصول ومصفوفة المقاسات (Inventory)',
      shortTitle: 'المخزون',
      subtitle: 'مراقبة وتعديل كميات المقاسات، تسويات الجرد، وتنبيهات النواقص',
      icon: 'inventory_2',
    },
    customers: {
      title: 'العملاء وقاعدة البيانات (Customers Hub)',
      shortTitle: 'العملاء',
      subtitle: 'سجل حسابات العملاء، تفاصيل التواصل، والعناوين في تونس',
      icon: 'group',
    },
    homepage: {
      title: 'تخصيص الواجهة والعروض الرئيسية (CMS)',
      shortTitle: 'واجهة المتجر',
      subtitle: 'إدارة البانرات الترويجية، المنتجات المميزة، وبنرات المتجر',
      icon: 'view_carousel',
    },
    coupons: {
      title: 'كوبونات الخصم والعروض الترويجية (Coupons)',
      shortTitle: 'الكوبونات',
      subtitle: 'إنشاء وإدارة أكواد وقسائم الخصم الملكية ونسب التخفيض',
      icon: 'local_offer',
    },
    reviews: {
      title: 'التقييمات وآراء العملاء (Customer Reviews)',
      shortTitle: 'التقييمات',
      subtitle: 'مراجعة واعتماد وتثبيت تقييمات العملاء والرد عليها',
      icon: 'star',
    },
    profile: {
      title: 'بيانات حساب الأدمن وإعدادات الأمان (Admin Account)',
      shortTitle: 'حساب الأدمن',
      subtitle: 'تعديل الاسم والبريد الإلكتروني ورقم الهاتف وتغيير وتأمين كلمة المرور',
      icon: 'manage_accounts',
    },
    analytics: {
      title: 'التقارير التحليلية المتقدمة (Analytics & Reports)',
      shortTitle: 'التحليلات',
      subtitle: 'تقارير مالية تفصيلية، معدلات التحويل، وحركات المستودع',
      icon: 'analytics',
    },
    staff: {
      title: 'طاقم العمل والصلاحيات الإدارية (Staff Roles)',
      shortTitle: 'الموظفين',
      subtitle: 'إدارة حسابات الفريق وتعيين الصلاحيات والمناصب المعتمدة',
      icon: 'badge',
    },
    settings: {
      title: 'إعدادات النظام والمتجر (System & Store Settings)',
      shortTitle: 'الإعدادات',
      subtitle: 'تعديل أسعار الشحن، بوابات الدفع، وإعدادات الواتساب العامة',
      icon: 'settings',
    },
  };

  const currentInfo = titleMap[activeTab] || {
    title: 'لوحة الإدارة',
    shortTitle: 'الإدارة',
    subtitle: 'SAOUDI WEAR Atelier',
    icon: 'admin_panel_settings',
  };

  // Reusable Notifications Dropdown Component
  const renderNotificationsDropdown = () => (
    showNotifications && (
      <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-up text-neutral-900 dark:text-neutral-100">

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-80 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              لا توجد إشعارات جديدة حالياً
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id || notif._id}
                className={`p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex gap-3 ${
                  !notif.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    notif.type === 'order'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : notif.type === 'stock'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {notif.type === 'order'
                      ? 'shopping_bag'
                      : notif.type === 'stock'
                      ? 'warning'
                      : 'star'}
                  </span>
                </div>
                <div className="flex-1 text-xs text-right">
                  <div className="flex justify-between font-bold text-neutral-900 dark:text-white">
                    <span>{notif.title}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 text-center border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline cursor-pointer uppercase tracking-wider"
          >
            تعيين الكل كمقروء
          </button>
        </div>
      </div>
    )
  );

  return (
    <>
      {/* 📱 1. Dedicated Mobile Admin Navbar (Ultra-sleek & Tailored for Mobile) */}
      <header className="lg:hidden sticky top-0 z-30 w-full min-h-[56px] bg-white/95 dark:bg-[#0E0E0E]/95 backdrop-blur-xl border-b border-neutral-200/90 dark:border-neutral-800/90 px-3 py-2 flex items-center justify-between shadow-sm transition-colors dir-rtl">
        {/* Right: Hamburger Menu Button + Brand & Section Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpenMobile(true)}
            className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 text-neutral-800 dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-2xs active:scale-95 border border-neutral-200 dark:border-neutral-700/60"
            aria-label="Open Admin Menu"
            title="القائمة الرئيسية"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          <div className="min-w-0 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-garamond text-xs sm:text-sm font-extrabold text-neutral-950 dark:text-white leading-tight truncate">
                {currentInfo.shortTitle}
              </span>
              <span className="text-[9px] font-label-caps text-[#9A7B1C] dark:text-[#D4AF37] uppercase tracking-wider font-semibold leading-none">
                لوحة الإدارة
              </span>
            </div>
          </div>
        </div>

        {/* Left: Quick Mobile Controls (Add Product, Notifications, Theme, Store Link) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick Add Product Button */}
          <button
            type="button"
            onClick={onOpenAddProductModal}
            className="h-8 px-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
            title="إضافة منتج جديد"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span className="font-bold">منتج</span>
          </button>

          {/* Quick Store Link */}
          <Link
            href="/"
            target="_blank"
            className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center border border-neutral-200 dark:border-neutral-700/60 active:scale-95 shadow-2xs"
            title="معاينة المتجر"
          >
            <span className="material-symbols-outlined text-base text-[#9A7B1C] dark:text-[#D4AF37]">
              storefront
            </span>
          </Link>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center border border-neutral-200 dark:border-neutral-700/60 active:scale-95 shadow-2xs"
            title="الوضع الداكن / الفاتح"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-base">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

        </div>
      </header>

      {/* 💻 2. Full Desktop Admin Header Bar */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-6 md:px-8 py-4 items-center justify-between shadow-2xs dir-rtl transition-colors">
        {/* Right Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-label-caps text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold">
              <span>SAOUDI WEAR ATELIER</span>
              <span>•</span>
              <span className="text-[#9A7B1C] dark:text-[#D4AF37]">{activeTab}</span>
            </div>
            <h1 className="font-garamond text-xl md:text-2xl font-extrabold text-neutral-950 dark:text-white leading-tight truncate">
              {currentInfo.title}
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal hidden sm:block truncate mt-0.5">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
          {/* Quick View Store Link */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700/60 shadow-2xs"
            title="معاينة المتجر المباشر"
          >
            <span className="material-symbols-outlined text-base text-[#9A7B1C] dark:text-[#D4AF37]">
              storefront
            </span>
            <span>المتجر</span>
          </Link>

          {/* Quick Add Product Button */}
          <button
            type="button"
            onClick={onOpenAddProductModal}
            className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] hover:from-[#836817] hover:to-[#B8860B] text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>إضافة منتج جديد</span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#9A7B1C] dark:hover:text-[#D4AF37] flex items-center justify-center transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/60 shadow-2xs"
            title={theme === 'dark' ? 'التحويل للوضع الفاتح (Light Mode)' : 'التحويل للوضع الليلي الداكن (Dark Mode)'}
            aria-label="Toggle Dark/Light Mode"
          >
            <span className="material-symbols-outlined text-xl">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>


          {/* Admin Account & Profile Button */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('profile');
            }}
            className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700/60 hover:border-[#D4AF37]'
            }`}
            title="تعديل بيانات حساب الأدمن وكلمة المرور"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] text-neutral-950 flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <span className="truncate max-w-[110px]">
              {user?.name || 'حساب الأدمن'}
            </span>
            <span className="material-symbols-outlined text-base">manage_accounts</span>
          </button>
        </div>
      </header>
    </>
  );
};
