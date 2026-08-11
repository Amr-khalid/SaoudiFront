'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Product, SizeStockItem, InventoryStats, InventoryMovementItem } from '../../../types';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

type InventoryTab = 'matrix' | 'movements' | 'alerts';

export const InventoryManagement: React.FC = () => {
  const { showAlert } = useApp();
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<InventoryTab>('matrix');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovementItem[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'all' | 'inStock' | 'lowStock' | 'outOfStock'
  >('all');

  // Modals State
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isSizeStockModalOpen, setIsSizeStockModalOpen] = useState(false);
  const [isQuickRestockModalOpen, setIsQuickRestockModalOpen] = useState(false);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [quickRestockSize, setQuickRestockSize] = useState<string>('');
  const [quickRestockQty, setQuickRestockQty] = useState<number>(10);
  const [quickRestockSupplier, setQuickRestockSupplier] = useState<string>(
    'مورد الأتيليه التونسي (Tunis Hub Supplier)'
  );

  // Size Stock Modal Form State
  const [modalSizeStock, setModalSizeStock] = useState<SizeStockItem[]>([]);
  const [modalReason, setModalReason] = useState<string>('توريد شحنة جديدة من المصنع');
  const [modalLocation, setModalLocation] = useState<string>(
    'مستودع تونس المركزي (Tunis Central Hub)'
  );
  const [newSizeInput, setNewSizeInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load All Inventory Data
  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const [statsData, prodsData, movementsData] = await Promise.all([
          api.getInventoryStats(),
          api.getInventoryProducts({
            category: categoryFilter !== 'All' ? categoryFilter : undefined,
            stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
          }),
          api.getInventoryMovements({
            page: movementsPage,
            limit: 30,
            type: movementTypeFilter !== 'all' ? movementTypeFilter : undefined,
          }),
        ]);

        if (statsData) setStats(statsData);
        if (prodsData) setProducts(prodsData);
        if (movementsData) {
          setMovements(movementsData.docs || []);
          setMovementsTotal(movementsData.total || 0);
        }
      } catch (err) {
        console.error('Failed to load inventory data:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [categoryFilter, stockStatusFilter, movementsPage, movementTypeFilter]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories list
  const categories = [
    'All',
    'Timepieces',
    'Suits',
    'Coats & Jackets',
    'Knitwear',
    'Accessories',
    'Outerwear',
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;

      const totalStock = p.stock ?? p.stockQuantity ?? 0;
      if (stockStatusFilter === 'inStock' && totalStock <= 5) return false;
      if (stockStatusFilter === 'lowStock' && (totalStock === 0 || totalStock > 5)) return false;
      if (stockStatusFilter === 'outOfStock' && totalStock > 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchSize = (p.sizeStock || []).some((s) => s.size.toLowerCase().includes(q));
        if (!matchName && !matchSku && !matchCat && !matchSize) return false;
      }
      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, searchQuery]);

  // Quick Inline Adjust (+1 or -1 for specific size)
  const handleQuickInlineAdjust = async (product: Product, size: string, delta: number) => {
    const currentSizeStock = product.sizeStock || [];
    const targetItem = currentSizeStock.find((s) => s.size === size);
    if (!targetItem && delta < 0) return;

    const currentQty = targetItem ? targetItem.stock : 0;
    const newQty = Math.max(0, currentQty + delta);

    // Optimistic UI Update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== product.id) return p;
        const updatedSizes = (p.sizeStock || []).map((s) => {
          if (s.size === size) return { ...s, stock: newQty };
          return s;
        });
        if (!updatedSizes.some((s) => s.size === size)) {
          updatedSizes.push({ size, stock: newQty });
        }
        const updatedTotal = updatedSizes.reduce((acc, curr) => acc + curr.stock, 0);
        return {
          ...p,
          sizeStock: updatedSizes,
          stock: updatedTotal,
          stockQuantity: updatedTotal,
          stockStatus:
            updatedTotal === 0
              ? 'Out of Stock'
              : updatedTotal <= 5
              ? 'Low Stock'
              : 'In Stock',
        };
      })
    );

    // Backend Request
    try {
      const res = await api.adjustInventoryStock({
        productId: product.id || (product as any)._id,
        size,
        quantity: Math.abs(delta),
        type: delta > 0 ? 'in' : 'out',
        newExactStock: newQty,
        reason:
          delta > 0
            ? `زيادة سريعة لمقاس ${size} (+${delta})`
            : `خصم سريع لمقاس ${size} (${delta})`,
      });

      if (res.success) {
        showToast(`تم تحديث مقاس ${size} لمنتج "${product.name}" بنجاح (${newQty} قطعة).`);
        api.getInventoryStats().then((s) => s && setStats(s));
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      showAlert({
        title: 'فشل التحديث',
        message: `فشل التحديث: ${err.message || 'حدث خطأ في الاتصال بالسيرفر'}`,
        type: 'danger',
      });
      loadData(true);
    }
  };

  // Open Size Stock Modal
  const handleOpenSizeStockModal = (product: Product) => {
    setSelectedProductForModal(product);
    const existing =
      product.sizeStock && product.sizeStock.length > 0
        ? product.sizeStock.map((s) => ({ ...s }))
        : (product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => ({
            size: sz,
            stock: Math.floor((product.stock || 20) / (product.sizes?.length || 4)),
          }));
    setModalSizeStock(existing);
    setModalReason('تسوية جرد دوري ومطابقة الكميات');
    setIsSizeStockModalOpen(true);
  };

  // Save Size Stock Modal Changes
  const handleSaveSizeStockModal = async () => {
    if (!selectedProductForModal) return;
    setIsSaving(true);

    try {
      const res = await api.updateProductSizeStock(
        selectedProductForModal.id || (selectedProductForModal as any)._id,
        modalSizeStock,
        modalReason,
        modalLocation
      );

      if (res.success && res.product) {
        showToast(`تم حفظ جرد مقاسات "${selectedProductForModal.name}" بنجاح!`);
        setIsSizeStockModalOpen(false);
        loadData(true);
      } else {
        throw new Error(res.error || 'فشلت عملية الحفظ');
      }
    } catch (err: any) {
      showAlert({
        title: 'خطأ في الحفظ',
        message: `حدث خطأ أثناء الحفظ: ${err.message}`,
        type: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Quick Restock Modal
  const handleOpenQuickRestock = (product: Product, size?: string) => {
    setQuickRestockProduct(product);
    setQuickRestockSize(size || (product.sizes && product.sizes[0]) || 'S');
    setQuickRestockQty(10);
    setQuickRestockSupplier('مورد الأتيليه التونسي (Tunis Atelier Supplier)');
    setIsQuickRestockModalOpen(true);
  };

  // Save Quick Restock
  const handleSaveQuickRestock = async () => {
    if (!quickRestockProduct) return;
    setIsSaving(true);

    try {
      const res = await api.adjustInventoryStock({
        productId: quickRestockProduct.id || (quickRestockProduct as any)._id,
        size: quickRestockSize,
        quantity: quickRestockQty,
        type: 'restock',
        reason: `توريد شحنة جديدة من ${quickRestockSupplier} (${quickRestockQty} قطعة)`,
        location: 'مستودع تونس المركزي (Tunis Central Hub)',
      });

      if (res.success) {
        showToast(`تم توريد ${quickRestockQty} قطعة لمقاس ${quickRestockSize} بنجاح!`);
        setIsQuickRestockModalOpen(false);
        loadData(true);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      showAlert({
        title: 'خطأ في التوريد',
        message: `حدث خطأ في عملية التوريد: ${err.message}`,
        type: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (products.length === 0) {
      showAlert({
        title: 'تنبيه التصدير',
        message: 'لا توجد بيانات مسجلة حالياً لتصديرها.',
        type: 'info',
      });
      return;
    }

    const headers = [
      'اسم المنتج',
      'SKU',
      'القسم',
      'إجمالي المخزون',
      'حالة التوفر',
      'تفاصيل المقاسات',
      'سعر البيع (USD)',
      'سعر التكلفة (USD)',
    ];
    const rows = products.map((p) => {
      const sizeDetails = (p.sizeStock || []).map((s) => `${s.size}:${s.stock}`).join(' | ');
      return [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.sku || ''}"`,
        `"${p.category || ''}"`,
        p.stock || p.stockQuantity || 0,
        `"${p.stockStatus || 'In Stock'}"`,
        `"${sizeDetails}"`,
        p.price || 0,
        p.costPrice || 0,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `saoudi-wear-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير تقرير الجرد بصيغة CSV بنجاح!');
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl font-sans text-neutral-900 dark:text-neutral-100 pb-12 transition-colors">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-neutral-950 dark:bg-[#1C1C1C] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#D4AF37] flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#D4AF37]">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Global Actions Bar */}
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative overflow-hidden transition-colors">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-garamond text-2xl md:text-3xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#9A7B1C] dark:text-[#D4AF37]">
                inventory_2
              </span>
              إدارة مستودعات الأتيليه الملكي وجرد المقاسات
            </h2>
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              REST API متصل
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-normal">
            تحكم فوري في كميات كل منتج ومقاساته عبر مستودعات تونس وميلانو، مع سجل كامل لحركات الوارد
            والصادر.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto z-10">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="تحديث البيانات لحظياً"
          >
            <span
              className={`material-symbols-outlined text-base ${
                isRefreshing ? 'animate-spin text-[#9A7B1C] dark:text-[#D4AF37]' : ''
              }`}
            >
              refresh
            </span>
            <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-base text-[#9A7B1C] dark:text-[#D4AF37]">
              download
            </span>
            <span>تصدير تقرير (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (products.length > 0) handleOpenQuickRestock(products[0]);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-base">add_box</span>
            <span>+ تسجيل توريد جديد</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock Units */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#9A7B1C]/40 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              إجمالي القطع في المستودعات
            </div>
            <div className="font-garamond text-2xl md:text-3xl font-extrabold text-neutral-950 dark:text-white">
              {isLoading
                ? '...'
                : (
                    stats?.totalUnits ?? products.reduce((acc, p) => acc + (p.stock || 0), 0)
                  ).toLocaleString()}{' '}
              <span className="text-xs font-sans text-neutral-500 font-normal">قطعة</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              موزعة عبر {products.length} منتج مسجل
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white shrink-0">
            <span className="material-symbols-outlined text-2xl text-[#9A7B1C] dark:text-[#D4AF37]">
              inventory
            </span>
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-[#9A7B1C]/40 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              القيمة المالية للمخزون
            </div>
            <div className="font-garamond text-2xl md:text-3xl font-extrabold text-[#9A7B1C] dark:text-[#D4AF37]">
              ${isLoading ? '...' : (stats?.totalRetailValue ?? 0).toLocaleString()}{' '}
              <span className="text-xs font-sans text-neutral-500 font-normal">USD</span>
            </div>
            <div className="text-[11px] text-neutral-500 font-normal">
              تكلفة الأصول: ${(stats?.totalCostValue ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-[#9A7B1C] shrink-0 border border-amber-200 dark:border-amber-800">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
        </div>

        {/* Card 3: Low Stock Warnings */}
        <div
          onClick={() => {
            setActiveTab('matrix');
            setStockStatusFilter('lowStock');
          }}
          className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              تنبيهات مخزون منخفض (≤ 5)
            </div>
            <div className="font-garamond text-2xl md:text-3xl font-extrabold text-amber-900 dark:text-amber-300 group-hover:scale-105 transition-transform">
              {isLoading
                ? '...'
                : (
                    stats?.lowStockCount ??
                    products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length
                  )}{' '}
              <span className="text-xs font-sans text-neutral-500 font-normal">منتج</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              اضغط لتصفية النواقص
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 shrink-0 border border-amber-200 dark:border-amber-800">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div
          onClick={() => {
            setActiveTab('matrix');
            setStockStatusFilter('outOfStock');
          }}
          className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-rose-200/80 dark:border-rose-800 shadow-xs hover:border-rose-400 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              منتجات نفدت تماماً (0)
            </div>
            <div className="font-garamond text-2xl md:text-3xl font-extrabold text-rose-900 dark:text-rose-300 group-hover:scale-105 transition-transform">
              {isLoading
                ? '...'
                : (stats?.outOfStockCount ?? products.filter((p) => (p.stock || 0) === 0).length)}{' '}
              <span className="text-xs font-sans text-neutral-500 font-normal">منتج</span>
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">do_not_disturb_on</span>
              إعادة طلب عاجلة
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200 dark:border-rose-800">
            <span className="material-symbols-outlined text-2xl">running_with_errors</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-white shadow-md'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">grid_view</span>
          <span>جرد المنتجات ومصفوفة كميات المقاسات</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'matrix'
                ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'movements'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-white shadow-md'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          <span>سجل حركات المستودع والتدقيق</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'movements'
                ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {movementsTotal || movements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-white shadow-md'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg text-amber-500">
            notifications_active
          </span>
          <span>مركز تنبيهات النواقص</span>
          {(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold animate-pulse font-mono">
              {(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCT & SIZE STOCK MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#151515] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              {/* Search Box */}
              <div className="relative flex-1 md:w-80">
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المنتج، SKU، أو المقاس..."
                  className="w-full pr-9 pl-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    القسم: {cat}
                  </option>
                ))}
              </select>

              {/* Stock Status Buttons */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'inStock', label: 'متوفر' },
                  { id: 'lowStock', label: 'منخفض (≤5)' },
                  { id: 'outOfStock', label: 'نفد (0)' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStockStatusFilter(st.id as any)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      stockStatusFilter === st.id
                        ? 'bg-white dark:bg-[#1E1E1E] text-neutral-950 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              عرض <strong>{filteredProducts.length}</strong> من إجمالي {products.length} منتج
            </div>
          </div>

          {/* Product & Size Stock Matrix Table */}
          <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4 w-72">المنتج ورمز الـ SKU</th>
                    <th className="p-4 w-28">القسم</th>
                    <th className="p-4 w-32">المخزون الإجمالي</th>
                    <th className="p-4">توزيع كميات المقاسات</th>
                    <th className="p-4 w-28">حالة التوفر</th>
                    <th className="p-4 w-44 text-left">إجراءات المستودع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-neutral-400">
                        <span className="material-symbols-outlined animate-spin text-3xl text-[#9A7B1C] dark:text-[#D4AF37] block mb-2 mx-auto">
                          progress_activity
                        </span>
                        جاري جلب جرد المستودعات ومصفوفة المقاسات الحية...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-neutral-500 font-light">
                        <span className="material-symbols-outlined text-4xl text-neutral-300 dark:text-neutral-700 block mb-2 mx-auto">
                          inventory_2
                        </span>
                        لا توجد منتجات مطابقة لخيارات البحث المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const totalStock = product.stock ?? product.stockQuantity ?? 0;
                      const sizeItems =
                        product.sizeStock && product.sizeStock.length > 0
                          ? product.sizeStock
                          : (product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => ({
                              size: sz,
                              stock: 0,
                            }));

                      return (
                        <tr
                          key={product.id || (product as any)._id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
                        >
                          {/* Product Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-14 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                    <span className="material-symbols-outlined">image</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-garamond text-sm font-bold text-neutral-950 dark:text-white leading-snug">
                                  {product.name}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                                  SKU:{' '}
                                  {product.sku || `SW-${(product.id || '').slice(0, 8).toUpperCase()}`}
                                </div>
                                <div className="text-[10px] text-[#9A7B1C] dark:text-[#D4AF37] font-semibold mt-0.5">
                                  ${(product.price || 0).toLocaleString()} USD
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                              {product.category}
                            </span>
                          </td>

                          {/* Total Stock */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold text-center inline-block ${
                                  totalStock > 5
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    : totalStock > 0
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {totalStock} قطعة
                              </span>
                              <span className="text-[9px] text-neutral-400 text-center font-mono">
                                إجمالي المقاسات
                              </span>
                            </div>
                          </td>

                          {/* Size Stock Matrix with Interactive Quick Adjust */}
                          <td className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {sizeItems.map((item, sIdx) => {
                                const isZero = item.stock === 0;
                                const isLow = item.stock > 0 && item.stock <= 5;
                                return (
                                  <div
                                    key={sIdx}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                                      isZero
                                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                                        : isLow
                                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-[#D4AF37]'
                                    }`}
                                  >
                                    <span className="font-bold text-xs uppercase tracking-wider min-w-[20px]">
                                      {item.size}:
                                    </span>
                                    <span className="font-mono font-extrabold text-xs px-1">
                                      {item.stock}
                                    </span>

                                    {/* Inline Quick +/- Buttons */}
                                    <div className="flex items-center gap-0.5 border-r border-neutral-300 dark:border-neutral-700 pr-1.5 mr-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickInlineAdjust(product, item.size, 1)
                                        }
                                        title={`إضافة قطعة لمقاس ${item.size}`}
                                        className="w-5 h-5 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        +
                                      </button>
                                      <button
                                        type="button"
                                        disabled={item.stock <= 0}
                                        onClick={() =>
                                          handleQuickInlineAdjust(product, item.size, -1)
                                        }
                                        title={`خصم قطعة من مقاس ${item.size}`}
                                        className="w-5 h-5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-600 hover:text-white disabled:opacity-30 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        -
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                totalStock > 5
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                  : totalStock > 0
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {totalStock === 0
                                ? 'Out of Stock'
                                : totalStock <= 5
                                ? 'Low Stock'
                                : 'In Stock'}
                            </span>
                          </td>

                          {/* Actions Column */}
                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenSizeStockModal(product)}
                                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-[#D4AF37] hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="تعديل تفصيلي لجرد كل مقاس"
                              >
                                <span className="material-symbols-outlined text-sm">tune</span>
                                <span>تسوية المقاسات</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenQuickRestock(product)}
                                className="p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-700 dark:text-neutral-300 rounded-xl transition-all cursor-pointer"
                                title="توريد كمية جديدة"
                              >
                                <span className="material-symbols-outlined text-base">
                                  add_shopping_cart
                                </span>
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
        </div>
      )}

      {/* TAB 2: INVENTORY MOVEMENTS AUDIT TRAIL LOG */}
      {activeTab === 'movements' && (
        <div className="space-y-4 animate-fade-in">
          {/* Movement Filters */}
          <div className="bg-white dark:bg-[#151515] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                تصفية نوع الحركة:
              </span>
              {[
                { id: 'all', label: 'جميع الحركات' },
                { id: 'in', label: 'وارد / توريد (IN)' },
                { id: 'out', label: 'صادر / مبيعات (OUT)' },
                { id: 'adjustment', label: 'تسوية جرد (ADJUST)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMovementTypeFilter(t.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    movementTypeFilter === t.id
                      ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              إجمالي الحركات المسجلة: <strong>{movementsTotal}</strong> حركة
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">التاريخ والوقت</th>
                    <th className="p-4">المنتج المتأثر</th>
                    <th className="p-4">المقاس</th>
                    <th className="p-4">نوع الحركة</th>
                    <th className="p-4">الكمية</th>
                    <th className="p-4">المخزون السابق ← الجديد</th>
                    <th className="p-4">المستودع والسبب</th>
                    <th className="p-4">المنفذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-neutral-500 font-light">
                        لا توجد حركات مخزون مسجلة مطابقة للفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => {
                      const isIncoming = mov.type === 'in' || mov.type === 'restock';
                      const isOutgoing = mov.type === 'out';
                      return (
                        <tr
                          key={mov.id || mov._id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="p-4 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                            {mov.createdAt
                              ? new Date(mov.createdAt).toLocaleString('ar-TN')
                              : 'مؤخراً'}
                          </td>

                          <td className="p-4 font-bold text-neutral-900 dark:text-white">
                            <div className="font-garamond text-sm">
                              {mov.product?.name || mov.productName || 'منتج أتيليه'}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400">
                              SKU: {mov.product?.sku || mov.sku || '-'}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                              {mov.size || 'كل المقاسات'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isIncoming
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                  : isOutgoing
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                              }`}
                            >
                              {isIncoming
                                ? 'وارد (IN)'
                                : isOutgoing
                                ? 'صادر (OUT)'
                                : 'تسوية (ADJUST)'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                isIncoming
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isOutgoing
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {isIncoming
                                ? `+${mov.quantity}`
                                : isOutgoing
                                ? `-${mov.quantity}`
                                : `±${mov.quantity}`}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            <span className="text-neutral-400">{mov.previousStock}</span>
                            <span className="mx-1.5 text-[#9A7B1C] dark:text-[#D4AF37]">→</span>
                            <span className="text-neutral-950 dark:text-white font-extrabold">
                              {mov.newStock}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              {mov.reason || 'تسوية روتينية'}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {mov.warehouseLocation || 'مستودع تونس المركزي'}
                            </div>
                          </td>

                          <td className="p-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            {mov.performedBy?.name || 'مسؤول النظام (Admin)'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESTOCK & ALERTS CENTER */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">
                notification_important
              </span>
              <div>
                <h3 className="font-garamond text-lg font-bold text-amber-950 dark:text-amber-200">
                  مركز معالجة النواقص وإعادة التوريد السريع
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  قائمة بالمنتجات والمقاسات التي انخفضت كميتها إلى الحد الأدنى (≤ 5 قطع) أو نفدت
                  بالكامل من المستودع.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => (p.stock ?? 0) <= 5)
              .map((product) => {
                const isOutOfStock = (product.stock ?? 0) === 0;
                return (
                  <div
                    key={product.id}
                    className={`bg-white dark:bg-[#151515] p-5 rounded-2xl border-2 shadow-xs space-y-4 ${
                      isOutOfStock
                        ? 'border-rose-300 dark:border-rose-800'
                        : 'border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-garamond font-bold text-sm text-neutral-950 dark:text-white leading-snug">
                            {product.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            SKU: {product.sku}
                          </div>
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[10px] font-bold text-neutral-600 dark:text-neutral-400 inline-block mt-1">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOutOfStock
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                        }`}
                      >
                        {isOutOfStock ? 'نفد (0)' : `متبقي ${product.stock} فقط`}
                      </span>
                    </div>

                    {/* Sizes Breakdown List */}
                    <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        حالة كميات المقاسات:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(product.sizeStock || []).map((sz, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border ${
                              sz.stock === 0
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : sz.stock <= 5
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {sz.size}: {sz.stock}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickRestock(product)}
                      className="w-full py-2.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base text-[#D4AF37]">
                        add_shopping_cart
                      </span>
                      <span>طلب توريد عاجل للمستودع</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL 1: SIZE STOCK MATRIX ADJUSTMENT MODAL */}
      {isSizeStockModalOpen && selectedProductForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF8F5] dark:bg-[#161616] text-neutral-900 dark:text-neutral-100 rounded-3xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-7">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-14 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0">
                  {selectedProductForModal.image && (
                    <Image
                      src={selectedProductForModal.image}
                      alt={selectedProductForModal.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                    تسوية وجرد مقاسات: {selectedProductForModal.name}
                  </h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    SKU: {selectedProductForModal.sku} • القسم:{' '}
                    {selectedProductForModal.category}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeStockModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total Stock Summary Banner */}
            <div className="bg-amber-50/60 dark:bg-neutral-900 p-4 rounded-2xl border border-amber-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  إجمالي القطع المحسوب:
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  يتم حسابه تلقائياً كمجموع لكميات المقاسات
                </div>
              </div>
              <div className="font-garamond text-3xl font-extrabold text-[#9A7B1C] dark:text-[#D4AF37]">
                {modalSizeStock.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)}{' '}
                <span className="text-xs font-sans text-neutral-500 font-normal">قطعة</span>
              </div>
            </div>

            {/* Size Stock Inputs Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  حدد كمية كل مقاس بالمخزن:
                </label>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  يمكنك تعديل الأرقام مباشرة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {modalSizeStock.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-neutral-950 dark:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 border border-neutral-700">
                        {item.size}
                      </span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        المقاس {item.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={item.stock}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setModalSizeStock((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, stock: val } : s))
                          );
                        }}
                        className="w-20 p-2 text-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setModalSizeStock((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="حذف هذا المقاس"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Custom Size */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  placeholder="أدخل مقاس جديد (مثال: XXL أو 44mm)..."
                  className="flex-1 p-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newSizeInput.trim().toUpperCase();
                    if (
                      trimmed &&
                      !modalSizeStock.some((s) => s.size.toUpperCase() === trimmed)
                    ) {
                      setModalSizeStock((prev) => [...prev, { size: trimmed, stock: 10 }]);
                      setNewSizeInput('');
                    }
                  }}
                  className="px-4 py-2.5 bg-neutral-900 dark:bg-[#D4AF37] hover:bg-[#9A7B1C] text-white dark:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  + إضافة مقاس
                </button>
              </div>
            </div>

            {/* Audit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  سبب حركة الجرد والتسوية:
                </label>
                <select
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                >
                  <option value="توريد شحنة جديدة من المصنع">توريد شحنة جديدة من المصنع</option>
                  <option value="تسوية جرد دوري ومطابقة">تسوية جرد دوري ومطابقة</option>
                  <option value="مرتجع من عميل">مرتجع من عميل</option>
                  <option value="تالف أو عينات تصوير وعرض">تالف أو عينات تصوير وعرض</option>
                  <option value="تصحيح خطأ إدخال سابق">تصحيح خطأ إدخال سابق</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  موقع المستودع المستهدف:
                </label>
                <select
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                >
                  <option value="مستودع تونس المركزي (Tunis Central Hub)">
                    مستودع تونس المركزي (Tunis Central Hub)
                  </option>
                  <option value="مستودع سوسة والساحل (Sousse Hub)">
                    مستودع سوسة والساحل (Sousse Hub)
                  </option>
                  <option value="معرض وأتيليه ميلانو (Milan Showroom)">
                    معرض وأتيليه ميلانو (Milan Showroom)
                  </option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsSizeStockModalOpen(false)}
                className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveSizeStockModal}
                className="px-6 py-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 hover:scale-[1.01]"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">
                      progress_activity
                    </span>
                    <span>جاري الحفظ في الباك إند...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>حفظ وتحديث الجرد فوراً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RESTOCK MODAL */}
      {isQuickRestockModalOpen && quickRestockProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF8F5] dark:bg-[#161616] text-neutral-900 dark:text-neutral-100 rounded-3xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9A7B1C] dark:text-[#D4AF37]">
                  add_shopping_cart
                </span>
                توريد سريع للمستودع
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickRestockModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  المنتج المستهدف:
                </label>
                <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 dark:text-white">
                  {quickRestockProduct.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  اختر المقاس:
                </label>
                <select
                  value={quickRestockSize}
                  onChange={(e) => setQuickRestockSize(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                >
                  {(quickRestockProduct.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                    <option key={sz} value={sz}>
                      المقاس: {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  الكمية الواردة (+):
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickRestockQty}
                  onChange={(e) =>
                    setQuickRestockQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  اسم المورد / الشحنة:
                </label>
                <input
                  type="text"
                  value={quickRestockSupplier}
                  onChange={(e) => setQuickRestockSupplier(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsQuickRestockModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveQuickRestock}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {isSaving ? 'جاري التوريد...' : 'تأكيد إضافة الشحنة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
