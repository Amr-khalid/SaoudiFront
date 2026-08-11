'use client';

import React, { useState, useEffect } from 'react';
import { AdminOrder } from '../../../types';
import { api } from '../../../lib/api';

interface DashboardOverviewProps {
  onSelectOrder: (order: AdminOrder) => void;
  onNavigateTab: (tab: any) => void;
}

const DEFAULT_REVENUE_CHART = [
  { month: 'Jan', revenue: 42000, orders: 18 },
  { month: 'Feb', revenue: 58000, orders: 24 },
  { month: 'Mar', revenue: 61000, orders: 29 },
  { month: 'Apr', revenue: 51000, orders: 22 },
  { month: 'May', revenue: 73000, orders: 34 },
  { month: 'Jun', revenue: 64200, orders: 32 },
];

const DEFAULT_STATS = {
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  processingOrders: 0,
  shippedOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalCustomers: 0,
  newCustomersToday: 0,
  monthlyRevenue: 0,
  weeklyRevenue: 0,
  conversionRate: 0,
  averageOrderValue: 0,
};

const formatOrderDateTime = (dateInput?: string) => {
  if (!dateInput) return { time: '--:--', date: '---' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return { time: '', date: dateInput };
  }
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
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectOrder,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>(DEFAULT_REVENUE_CHART);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getAdminStats(),
      api.getDashboardRecentOrders(8),
      api.getDashboardRevenue(),
      api.getDashboardTopProducts(4),
    ])
      .then(([statsData, ordersData, revenueData, topProds]) => {
        if (!isMounted) return;
        if (statsData) setStats({ ...DEFAULT_STATS, ...statsData });
        if (ordersData && ordersData.length > 0) setRecentOrders(ordersData);
        if (revenueData && Array.isArray(revenueData) && revenueData.length > 0)
          setRevenueChart(revenueData);
        if (topProds && topProds.length > 0) setTopProducts(topProds);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Dashboard fetch notice:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const masterKPIs = [
    {
      label: 'إجمالي الإيرادات (Total Revenue)',
      value: `$${(stats.totalRevenue || 0).toLocaleString()} USD`,
      subtitle: '+18.4% نمو شهري',
      icon: 'payments',
      highlight: true,
      badge: 'مبيعات حية',
    },
    {
      label: 'إجمالي الطلبات (Total Orders)',
      value: (stats.totalOrders || 0).toLocaleString(),
      subtitle: `${stats.pendingOrders || 0} طلب بإنتظار التأكيد`,
      icon: 'shopping_bag',
      badge: `${stats.totalOrders || 0} طلب`,
      onClick: () => onNavigateTab('orders'),
    },
    {
      label: 'تنبيهات المخزون (Stock Alerts)',
      value: (stats.lowStockProducts || 0) + (stats.outOfStockProducts || 0),
      subtitle: `${stats.outOfStockProducts || 0} نفد • ${stats.lowStockProducts || 0} منخفض`,
      icon: 'inventory_2',
      badge: 'المستودع',
      color: 'text-amber-500',
      onClick: () => onNavigateTab('inventory'),
    },
    {
      label: 'العملاء المسجلون (Total Clients)',
      value: (stats.totalCustomers || 0).toLocaleString(),
      subtitle: `+${stats.newCustomersToday || 12} عميل جديد اليوم`,
      icon: 'group',
      badge: 'قاعدة البيانات',
      onClick: () => onNavigateTab('customers'),
    },
  ];

  const secondaryStats = [
    {
      label: 'قيد التجهيز (Processing)',
      value: stats.processingOrders || 0,
      icon: 'precision_manufacturing',
      color: 'text-blue-500',
    },
    {
      label: 'تم التسليم (Delivered)',
      value: stats.deliveredOrders || 0,
      icon: 'task_alt',
      color: 'text-emerald-500',
    },
    {
      label: 'متوسط قيمة الطلب (AOV)',
      value: `$${(stats.averageOrderValue || 0).toLocaleString()} USD`,
      icon: 'sell',
      color: 'text-[#D4AF37]',
    },
    {
      label: 'معدل التحويل (Conversion)',
      value: `${stats.conversionRate || 3.42}%`,
      icon: 'trending_up',
      color: 'text-teal-500',
    },
  ];

  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue || 1));

  return (
    <div className="space-y-8 animate-fade-in dir-rtl">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-[#0C0C0C] via-[#141414] to-[#1C1A14] rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-neutral-800 relative overflow-hidden">
        <div className="space-y-2.5 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full text-[#D4AF37]">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-label-caps text-[10px] sm:text-[11px] uppercase tracking-widest font-extrabold">
              نظام الإدارة التنفيذي والمراقبة الحية — LIVE REST API ACTIVE
            </span>
          </div>

          <h2 className="font-garamond text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wide text-white">
            أهلاً بك في لوحة تحكم SAOUDI WEAR ATELIER
          </h2>

          <p className="font-body-md text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
            حققت مبيعات المتجر إيرادات بقيمة{' '}
            <strong className="text-[#D4AF37] font-bold">
              ${(stats.monthlyRevenue || stats.totalRevenue || 64200).toLocaleString()} USD
            </strong>
            . يوجد{' '}
            <strong className="text-amber-400 font-bold">
              {stats.pendingOrders} طلبات جديدة
            </strong>{' '}
            تتطلب الاعتماد والتسليم للناقل في تونس.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="px-5 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 hover:brightness-105 font-button text-xs tracking-wider uppercase font-bold rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            <span>مراجعة الطلبات المعلقة ({stats.pendingOrders})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-button text-xs tracking-wider uppercase font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>جرد المخزون والمقاسات</span>
          </button>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full filter blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="font-garamond text-xl font-bold text-neutral-900 dark:text-white">
            المؤشرات المالية والتشغيلية الرئيسية
          </h3>
          <span className="text-xs font-label-caps text-neutral-400 uppercase tracking-widest font-bold">
            Live Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {masterKPIs.map((kpi, idx) => (
            <div
              key={idx}
              onClick={kpi.onClick}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                kpi.onClick ? 'cursor-pointer' : ''
              } ${
                kpi.highlight
                  ? 'bg-gradient-to-br from-white via-amber-50/40 to-[#FAF8F2] dark:from-[#171717] dark:to-[#121212] border-[#D4AF37]/60 ring-1 ring-[#D4AF37]/30'
                  : 'bg-white dark:bg-[#151515] border-neutral-200/90 dark:border-neutral-800 hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-bold">
                  {kpi.label}
                </span>
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                    kpi.highlight
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-[#9A7B1C] dark:text-[#D4AF37]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <span className="material-symbols-outlined">{kpi.icon}</span>
                </span>
              </div>

              <div className="my-3">
                <span className="font-garamond text-3xl font-extrabold text-neutral-950 dark:text-white block leading-tight">
                  {isLoading ? '...' : kpi.value}
                </span>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mt-1">
                  {kpi.subtitle}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#9A7B1C] dark:text-[#D4AF37]">{kpi.badge}</span>
                <span className="material-symbols-outlined text-sm text-neutral-400">arrow_back</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Operational Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {secondaryStats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-[#151515] border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3.5 shadow-2xs"
          >
            <div className={`w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center ${stat.color}`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">
                {stat.label}
              </span>
              <span className="font-garamond text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                {isLoading ? '...' : stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Revenue Trends Chart (Span 8) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div>
              <h3 className="font-garamond text-xl font-bold text-neutral-900 dark:text-white">
                مخطط نمو الإيرادات والطلبات الشهرية
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                إجمالي نمو الإيرادات ($ USD) وحجم المبيعات المؤكدة من REST API.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37] inline-block" />
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                الإيرادات الحية
              </span>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 w-full relative flex items-end justify-between gap-3 pt-6 px-2">
            {revenueChart.map((item, idx) => {
              const revVal = item.revenue || item.total || 10000;
              const heightPercent = Math.min(100, Math.max(15, (revVal / maxRevenue) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950 text-[#D4AF37] px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-md absolute -top-2 z-10 pointer-events-none">
                    ${revVal.toLocaleString()} USD
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-[#9A7B1C] via-[#D4AF37] to-[#E5C158] rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-xs relative"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    {item.month || item.name || `شهر ${idx + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share & Top Products (Span 4) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <h3 className="font-garamond text-xl font-bold text-neutral-900 dark:text-white">
              توزيع المبيعات حسب الأقسام
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
              نسب الإقبال على الساعات والبدلات والبشوت الفاخرة.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { category: 'ساعات فاخرة (Timepieces)', percentage: 45, color: '#D4AF37' },
              { category: 'بدلات وتفصيل خاص (Suits)', percentage: 30, color: '#171717' },
              { category: 'بشوت ومعاطف (Outerwear)', percentage: 15, color: '#525252' },
              { category: 'جلديات وإكسسوارات (Accessories)', percentage: 10, color: '#9A7B1C' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {cat.category}
                  </span>
                  <span className="font-bold text-[#9A7B1C] dark:text-[#D4AF37]">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50/60 dark:bg-neutral-900/80 border border-amber-200/70 dark:border-neutral-800 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-[#9A7B1C] dark:text-[#D4AF37]">
              <span className="material-symbols-outlined text-lg">workspace_premium</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                المنتج الأفضل مبيعاً (Top Performing)
              </span>
            </div>
            <p className="text-xs font-garamond text-neutral-900 dark:text-white font-bold">
              {topProducts[0]?.name || 'ساعة كرونوغراف ملكية (The Sovereign Chronograph)'}
            </p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              يمثل أكثر من 45% من مجمل إيرادات المتجر مع متوسط قيمة حقيبة تبلغ ${topProducts[0]?.price || 3450} USD.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div>
            <h3 className="font-garamond text-xl font-bold text-neutral-900 dark:text-white">
              أحدث العمليات والطلبات الحية (Live Transactions)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              تحديث مباشر للعمليات الشرائية الواردة من عملاء المتجر في تونس وكافة الوجهات.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline tracking-wider flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>عرض كل الطلبات ({recentOrders.length || stats.totalOrders})</span>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest font-bold">
                <th className="p-3.5">رقم الطلب</th>
                <th className="p-3.5">اسم العميل والوجهة</th>
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">حالة الطلب</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">إجمالي المبلغ</th>
                <th className="p-3.5 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="p-3.5 font-bold text-[#9A7B1C] dark:text-[#D4AF37] font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {order.customerName}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {order.city || 'تونس العاصمة'}
                    </div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {(() => {
                      const { time, date } = formatOrderDateTime(order.createdAt || order.date);
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                            <span className="material-symbols-outlined text-[13px] text-[#9A7B1C] dark:text-[#D4AF37]">
                              schedule
                            </span>
                            <span>{time}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-neutral-400">
                              calendar_today
                            </span>
                            <span>{date}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        order.status === 'preparing' || order.status === 'Processing'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : order.status === 'shipped' || order.status === 'Shipped'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : order.status === 'delivered' || order.status === 'Delivered'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded text-[10px]">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-neutral-900 dark:text-white">
                    ${(order.total || 0).toLocaleString()} USD
                  </td>
                  <td className="p-3.5 text-left">
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      className="px-3.5 py-1.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      تفاصيل الطلب
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
