'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminOrder } from '../../../types';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { api } from '../../../lib/api';

const MAIN_ARCHIVE_TABS = [
  { id: 'all', label: 'جميع المعاملات والطلبات', icon: 'receipt_long' },
  { id: 'active', label: 'الطلبات النشطة والجارية', icon: 'pending_actions' },
  { id: 'completed', label: 'أرشيف العمليات المكتملة والمسلمة', icon: 'task_alt' },
  { id: 'cancelled', label: 'أرشيف العمليات الملغاة والمستردة', icon: 'cancel' },
];

const STATUS_PILLS = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'معلقة (Pending)' },
  { id: 'confirmed', label: 'مؤكدة (Confirmed)' },
  { id: 'preparing', label: 'قيد التجهيز (Preparing)' },
  { id: 'packed', label: 'مغلفة (Packed)' },
  { id: 'shipped', label: 'تم الشحن (Shipped)' },
  { id: 'delivered', label: 'مُسلمة (Delivered)' },
  { id: 'cancelled', label: 'ملغاة (Cancelled)' },
  { id: 'refunded', label: 'مستردة (Refunded)' },
];

export const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Search State
  const [activeArchiveTab, setActiveArchiveTab] = useState<
    'all' | 'active' | 'completed' | 'cancelled'
  >('all');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = () => {
    api
      .getAdminOrders()
      .then((liveOrders) => {
        if (liveOrders && liveOrders.length > 0) {
          setOrders(liveOrders);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const s = String(ord.status || '').toLowerCase();

      // 1. Archive Category Filter
      if (activeArchiveTab === 'active') {
        const isAct = [
          'pending',
          'confirmed',
          'preparing',
          'processing',
          'packed',
          'shipped',
          'outfordelivery',
        ].includes(s);
        if (!isAct) return false;
      } else if (activeArchiveTab === 'completed') {
        if (s !== 'delivered') return false;
      } else if (activeArchiveTab === 'cancelled') {
        const isCanc = ['cancelled', 'refunded', 'returned', 'refundrequested'].includes(s);
        if (!isCanc) return false;
      }

      // 2. Specific Status Pill Filter
      if (selectedSubStatus !== 'all' && s !== selectedSubStatus.toLowerCase()) {
        return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'all' && ord.createdAt) {
        const ordDate = new Date(ord.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          if (ordDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (ordDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          if (
            ordDate.getMonth() !== now.getMonth() ||
            ordDate.getFullYear() !== now.getFullYear()
          )
            return false;
        }
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesOrderNum = ord.orderNumber.toLowerCase().includes(q);
        const matchesName = (ord.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (ord.customerPhone || '').includes(q);
        const matchesEmail = (ord.customerEmail || '').toLowerCase().includes(q);
        const matchesCity = (ord.shipping?.city || ord.city || '').toLowerCase().includes(q);
        const matchesAddress = (ord.shipping?.address || ord.shippingAddress || '')
          .toLowerCase()
          .includes(q);
        const matchesItems = (ord.items || []).some((it) =>
          (it.productName || it.name || '').toLowerCase().includes(q)
        );

        if (
          !matchesOrderNum &&
          !matchesName &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesCity &&
          !matchesAddress &&
          !matchesItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeArchiveTab, selectedSubStatus, searchQuery, dateFilter]);

  // Statistics Metrics
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const totalRevenueUSD = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
    const activeCount = orders.filter((o) =>
      [
        'pending',
        'confirmed',
        'preparing',
        'processing',
        'packed',
        'shipped',
        'outfordelivery',
      ].includes(String(o.status).toLowerCase())
    ).length;
    const completedCount = orders.filter(
      (o) => String(o.status).toLowerCase() === 'delivered'
    ).length;
    const cancelledCount = orders.filter((o) =>
      ['cancelled', 'refunded', 'returned', 'refundrequested'].includes(
        String(o.status).toLowerCase()
      )
    ).length;

    return {
      totalOrdersCount,
      totalRevenueUSD,
      totalRevenueSAR: Math.round(totalRevenueUSD * 3.75),
      activeCount,
      completedCount,
      cancelledCount,
    };
  }, [orders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    await api.updateOrderStatus(orderId, newStatus);
    fetchOrders();
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
      const updated = await api.getAdminOrderById(orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            مُسلم ومكتمل (Delivered)
          </span>
        );
      case 'shipped':
      case 'outfordelivery':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            تم الشحن (Shipped)
          </span>
        );
      case 'packed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            تم التغليف (Packed)
          </span>
        );
      case 'preparing':
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            قيد التجهيز (Preparing)
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
            مؤكد (Confirmed)
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            ملغي (Cancelled)
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            مسترد مالياً (Refunded)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/40">
            قيد المراجعة (Pending)
          </span>
        );
    }
  };

  const handleQuickWhatsApp = (ord: AdminOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
    const text = `مرحباً ${ord.customerName}، نود إفادتك ببيانات طلبك رقم ${ord.orderNumber} في متجر SAOUDI WEAR (الحالة: ${ord.status}). شرفنا بخدمتكم دائماً!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatOrderDateTime = (createdAt?: string, dateFallback?: string) => {
    let d: Date | null = null;
    if (createdAt) {
      const parsed = new Date(createdAt);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    if (!d && dateFallback) {
      const parsed = new Date(dateFallback);
      if (!isNaN(parsed.getTime())) d = parsed;
    }

    if (d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const date = `${year}/${month}/${day}`;
      const time = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { time, date, full: `${date} • ${time}` };
    }

    return {
      time: '--:--',
      date: dateFallback || '---',
      full: dateFallback || '---',
    };
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl text-neutral-800 dark:text-neutral-200 transition-colors">
      {/* Top Header & Refresh Control */}
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
              مركز التحكم في الطلبات وأرشيف العمليات (Orders Hub)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>مباشر ومتصل</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            البحث اللحظي الشامل، أرشيف العمليات المكتملة والملغاة، وتتبع الشحنات في كامل ولايات تونس.
          </p>
        </div>

        <div className="flex gap-2.5 items-center">
          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>تحديث الطلبات</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Orders Card */}
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span>إجمالي الطلبات</span>
            <span className="material-symbols-outlined text-[#D4AF37] text-base">receipt_long</span>
          </div>
          <div className="text-2xl font-bold font-garamond text-neutral-950 dark:text-white">
            {stats.totalOrdersCount} طلب
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">
            المبيعات: ${stats.totalRevenueUSD.toLocaleString()} USD
          </div>
        </div>

        {/* Active In-Progress Orders */}
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>الطلبات النشطة الجارية</span>
            <span className="material-symbols-outlined text-amber-500 text-base">
              pending_actions
            </span>
          </div>
          <div className="text-2xl font-bold font-garamond text-amber-800 dark:text-amber-300">
            {stats.activeCount} طلب
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400">
            قيد المراجعة والتجهيز والشحن
          </div>
        </div>

        {/* Completed Delivered Archive */}
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span>العمليات المكتملة</span>
            <span className="material-symbols-outlined text-emerald-500 text-base">task_alt</span>
          </div>
          <div className="text-2xl font-bold font-garamond text-emerald-800 dark:text-emerald-300">
            {stats.completedCount} طلب
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
            تم تسليمها للعميل بنجاح 🏆
          </div>
        </div>

        {/* Cancelled & Refunded Archive */}
        <div className="bg-white dark:bg-[#151515] p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-bold">
            <span>العمليات الملغاة / المستردة</span>
            <span className="material-symbols-outlined text-rose-500 text-base">cancel</span>
          </div>
          <div className="text-2xl font-bold font-garamond text-rose-800 dark:text-rose-300">
            {stats.cancelledCount} طلب
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400">
            ملغاة أو تم استرداد قيمتها ❌
          </div>
        </div>
      </div>

      {/* Main Search & Comprehensive Filter Bar */}
      <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث فوري برقم الطلب (مثال: SW-100001)، اسم العميل، رقم الهاتف، ولاية تونس، أو اسم المنتج..."
            className="w-full pl-10 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs font-bold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-1 text-xs cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Main Archive Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          {MAIN_ARCHIVE_TABS.map((tab) => {
            const isSelected = activeArchiveTab === tab.id;
            let badgeCount = orders.length;
            if (tab.id === 'active') badgeCount = stats.activeCount;
            if (tab.id === 'completed') badgeCount = stats.completedCount;
            if (tab.id === 'cancelled') badgeCount = stats.cancelledCount;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveArchiveTab(tab.id as any);
                  setSelectedSubStatus('all');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm ring-1 ring-neutral-950 dark:ring-neutral-700'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Specific Status Pills & Date Range */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 max-w-full">
            {STATUS_PILLS.map((pill) => {
              const isSelected = selectedSubStatus === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedSubStatus(pill.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37] text-neutral-950 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 text-[11px] font-bold">الفترة:</span>
            {(['all', 'today', 'week', 'month'] as const).map((df) => (
              <button
                key={df}
                type="button"
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  dateFilter === df
                    ? 'bg-neutral-900 dark:bg-[#D4AF37] text-white dark:text-neutral-950'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {df === 'all' && 'الكل'}
                {df === 'today' && 'اليوم'}
                {df === 'week' && '7 أيام'}
                {df === 'month' && 'هذا الشهر'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="p-3.5">رقم الطلب</th>
                <th className="p-3.5">بيانات العميل والوجهة</th>
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">الحالة الحالية</th>
                <th className="p-3.5">المقتنيات المطلوبة</th>
                <th className="p-3.5">إجمالي المبلغ</th>
                <th className="p-3.5 text-left">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    <span className="material-symbols-outlined animate-spin text-2xl text-[#D4AF37] block mb-2 mx-auto">
                      progress_activity
                    </span>
                    جاري تحميل سجلات الطلبات...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-500">
                    <span className="material-symbols-outlined text-4xl text-neutral-300 dark:text-neutral-700 block mb-2 mx-auto">
                      search_off
                    </span>
                    <p className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                      لا توجد طلبات تطابق معايير البحث أو الأرشيف المحدد.
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      جرب تغيير كلمات البحث أو اختيار تبويب آخر.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const totalUSD = Number(ord.total || ord.totalAmount || 0);
                  const totalSAR = Math.round(totalUSD * 3.75);

                  return (
                    <tr
                      key={ord.id || ord._id}
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Order Number */}
                      <td className="p-3.5 font-bold text-[#9A7B1C] dark:text-[#D4AF37] font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-400 text-xs">#</span>
                          <span>{ord.orderNumber}</span>
                        </div>
                      </td>

                      {/* Customer Info & City */}
                      <td className="p-3.5">
                        <div className="font-bold text-neutral-900 dark:text-white group-hover:text-[#9A7B1C] dark:group-hover:text-[#D4AF37] transition-colors">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                          {ord.customerPhone || 'غير محدد'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {ord.shipping?.city || ord.city || 'تونس العاصمة'} -{' '}
                          {ord.shipping?.address || ord.shippingAddress || 'تونس'}
                        </div>
                      </td>

                      {/* Exact Date & Time */}
                      <td className="p-3.5 whitespace-nowrap">
                        {(() => {
                          const { time, date } = formatOrderDateTime(ord.createdAt || ord.date);
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-[#9A7B1C] dark:text-[#D4AF37]">
                                  schedule
                                </span>
                                <span>{time}</span>
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] text-neutral-400">
                                  calendar_today
                                </span>
                                <span>{date}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">{getStatusBadge(ord.status)}</td>

                      {/* Items */}
                      <td className="p-3.5 text-neutral-600 dark:text-neutral-400">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">
                          {ord.items?.length || 0} أصل فاخر
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                          {(ord.items || []).map((it) => it.productName || it.name).join('، ')}
                        </div>
                      </td>

                      {/* Financial Total */}
                      <td className="p-3.5 font-garamond whitespace-nowrap">
                        <div className="font-bold text-neutral-900 dark:text-white text-sm">
                          ${totalUSD.toLocaleString()} USD
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 font-normal">
                          ≈ {totalSAR.toLocaleString()} ر.س
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="p-3.5 text-left whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick WhatsApp Action */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickWhatsApp(ord, e)}
                            title="مراسلة واتساب فورية"
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                          </button>

                          {/* View & Update Details Drawer */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>تفاصيل الطلب</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Order Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
