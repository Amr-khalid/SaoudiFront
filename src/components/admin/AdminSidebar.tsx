'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LOGO_URL } from '../../types';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'homepage'
  | 'coupons'
  | 'reviews'
  | 'profile'
  | 'analytics'
  | 'staff'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) => {
  const menuGroups = [
    {
      groupTitle: 'العمليات والمبيعات (Operations)',
      items: [
        { id: 'dashboard' as AdminTab, label: 'لوحة التحكم (Dashboard)', icon: 'dashboard' },
        {
          id: 'orders' as AdminTab,
          label: 'الطلبات والشحن والأرشيف',
          icon: 'shopping_bag',
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        },
        { id: 'products' as AdminTab, label: 'إدارة كتالوج المنتجات', icon: 'apparel' },
        { id: 'categories' as AdminTab, label: 'الأقسام والتصنيفات', icon: 'category' },
        {
          id: 'inventory' as AdminTab,
          label: 'المخزون ومصفوفة المقاسات',
          icon: 'inventory_2',
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        },
        { id: 'customers' as AdminTab, label: 'العملاء وقاعدة البيانات', icon: 'group' },
      ],
    },
    {
      groupTitle: 'التسويق والواجهة (Marketing & CMS)',
      items: [
        { id: 'homepage' as AdminTab, label: 'تخصيص الواجهة والعروض (CMS)', icon: 'view_carousel' },
        { id: 'coupons' as AdminTab, label: 'كوبونات الخصم والعروض', icon: 'local_offer' },
        { id: 'reviews' as AdminTab, label: 'التقييمات وآراء العملاء', icon: 'star' },
      ],
    },
   
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-[#0E0E0E] text-neutral-200 border-r border-neutral-800/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800/80 flex items-center justify-between bg-[#141414]">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-amber-500/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">diamond</span>
            </div>
            <div>
              <span className="font-garamond text-lg font-extrabold tracking-widest text-white block uppercase leading-none">
                SAOUDI WEAR
              </span>
              <span className="text-[10px] font-label-caps tracking-[0.25em] text-[#D4AF37] uppercase font-bold block mt-1">
                ATELIER ADMIN
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6 custom-scrollbar">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-label-caps uppercase tracking-widest text-[#D4AF37]/70 font-extrabold flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                <span>{group.groupTitle}</span>
              </div>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-body-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent text-[#D4AF37] font-bold border-l-4 border-[#D4AF37] shadow-xs'
                        : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-xl ${
                          isActive ? 'text-[#D4AF37]' : 'text-neutral-500'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          item.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Admin Profile & Store Link at Bottom */}
        <div className="p-4 border-t border-neutral-800 bg-[#141414] space-y-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl transition-all cursor-pointer border text-right ${
              activeTab === 'profile'
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 shadow-xs'
                : 'bg-neutral-900/60 border-neutral-800/80 hover:border-[#D4AF37]/40 hover:bg-neutral-900'
            }`}
            title="تعديل بيانات الحساب وكلمة المرور"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] text-neutral-950 flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white truncate block">
                  بيانات حساب الأدمن
                </span>
                <span className="text-[10px] text-[#D4AF37] font-mono block">
                  ⚙️ تعديل الحساب والأمان
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-base text-neutral-400">
              chevron_left
            </span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-700/80 rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 hover:border-[#D4AF37] transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>عرض المتجر المباشر (Live Store)</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
