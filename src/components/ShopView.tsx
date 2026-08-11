'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, FilterState } from '../types';
import { ImageZoomModal } from './ImageZoomModal';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export const ShopView: React.FC = () => {
  const router = useRouter();
  const {
    products: fallbackProducts,
    addToCart,
    cartItems,
    toggleWishlist,
    wishlistIds,
    setQuickViewProduct,
    theme,
    t,
  } = useApp();

  // Dynamic Backend Categories & Brands State
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  // Per-product active image index for flipping images right on the catalog card
  const [activeImageIndexMap, setActiveImageIndexMap] = useState<Record<string, number>>({});

  // Advanced Filter State
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    color: 'All',
    size: 'All',
    priceMin: 0,
    priceMax: 5000,
    inStockOnly: false,
    searchQuery: '',
    sortBy: 'newest',
  });

  const [searchInput, setSearchInput] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);
  const itemsPerPage = 12;

  // 300ms Debounce for Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, searchQuery: searchInput }));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Categories & Brands on Mount
  useEffect(() => {
    let isMounted = true;
    api.getCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) setCategoriesList(cats);
    });
    api.getBrands().then((brands) => {
      if (isMounted && brands && brands.length > 0) setBrandsList(brands);
    });
    return () => { isMounted = false; };
  }, []);

  // Calculate dynamic minimum and maximum price from available products
  const productSource = liveProducts.length > 0 ? liveProducts : fallbackProducts;
  const allProductPrices = productSource
    .map((p) => p.price)
    .filter((p) => typeof p === 'number' && p > 0);

  const minAvailableProductPrice = allProductPrices.length > 0 ? Math.min(...allProductPrices) : 100;
  const maxAvailableProductPrice = allProductPrices.length > 0 ? Math.max(...allProductPrices) : 4500;

  // Map Sorting Modes to Backend API Fields
  const getSortString = (sortBy: FilterState['sortBy']) => {
    switch (sortBy) {
      case 'price_asc': return 'price';
      case 'price_desc': return '-price';
      case 'rating': return '-rating';
      case 'popular': return '-salesCount';
      case 'most_reviewed': return '-reviewCount';
      case 'newest':
      default:
        return '-createdAt';
    }
  };

  // Fetch Products dynamically from Backend API
  useEffect(() => {
    let isMounted = true;
    const fetchProductsViaGet = async () => {
      setIsLoading(true);

      const res = await api.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        category: filters.categories.length > 0 ? filters.categories : undefined,
        brand: filters.brands.length > 0 ? filters.brands : undefined,
        search: filters.searchQuery || undefined,
        sort: getSortString(filters.sortBy),
        minPrice: filters.priceMin > 0 ? filters.priceMin : undefined,
        maxPrice: filters.priceMax < 5000 ? filters.priceMax : undefined,
      });

      if (isMounted) {
        if (res && res.products) {
          setLiveProducts(res.products);
          setTotalItems(res.pagination?.totalDocs || res.products.length);
        } else {
          setLiveProducts(fallbackProducts);
          setTotalItems(fallbackProducts.length);
        }
        setIsLoading(false);
      }
    };

    fetchProductsViaGet();
    return () => { isMounted = false; };
  }, [currentPage, filters.categories, filters.brands, filters.searchQuery, filters.sortBy, filters.priceMin, filters.priceMax, fallbackProducts]);

  const displayProducts = liveProducts;
  const totalPages = Math.ceil((totalItems || displayProducts.length) / itemsPerPage) || 1;

  // Toggle Category Checkbox Selection
  const toggleCategory = (catName: string) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(catName);
      const newCats = exists
        ? prev.categories.filter((c) => c !== catName)
        : [...prev.categories, catName];
      return { ...prev, categories: newCats };
    });
    setCurrentPage(1);
  };

  // Select Single Category from Carousel
  const selectSingleCategory = (catName: string | null) => {
    if (!catName) {
      setFilters((prev) => ({ ...prev, categories: [] }));
    } else {
      setFilters((prev) => ({ ...prev, categories: [catName] }));
    }
    setCurrentPage(1);
  };

  // Reset All Filters
  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({
      categories: [],
      brands: [],
      color: 'All',
      size: 'All',
      priceMin: minAvailableProductPrice,
      priceMax: maxAvailableProductPrice,
      inStockOnly: false,
      searchQuery: '',
      sortBy: 'newest',
    });
    setCurrentPage(1);
  };

  // Image Flipping Handler
  const handleNextImage = (e: React.MouseEvent, productId: string, totalImages: number) => {
    e.stopPropagation();
    setActiveImageIndexMap((prev) => {
      const current = prev[productId] || 0;
      return { ...prev, [productId]: (current + 1) % totalImages };
    });
  };

  const handlePrevImage = (e: React.MouseEvent, productId: string, totalImages: number) => {
    e.stopPropagation();
    setActiveImageIndexMap((prev) => {
      const current = prev[productId] || 0;
      return { ...prev, [productId]: (current - 1 + totalImages) % totalImages };
    });
  };

  const handleSetImageIndex = (e: React.MouseEvent, productId: string, index: number) => {
    e.stopPropagation();
    setActiveImageIndexMap((prev) => ({ ...prev, [productId]: index }));
  };

  const effectiveMin = filters.priceMin > 0 ? filters.priceMin : minAvailableProductPrice;
  const effectiveMax = filters.priceMax < 5000 ? filters.priceMax : maxAvailableProductPrice;

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.searchQuery !== '' ||
    effectiveMin > minAvailableProductPrice ||
    effectiveMax < maxAvailableProductPrice;

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  // Rendered Categories List (100% Dynamic from Backend API)
  const renderedCategories: string[] = categoriesList.map((c) =>
    typeof c === 'string' ? c : (c.name || c.title || '')
  ).filter(Boolean);

  const isDark = theme === 'dark';

  return (
    <div className="pt-20 sm:pt-24 md:pt-28 pb-20 px-2.5 sm:px-6 md:px-10 lg:px-14 max-w-[1520px] mx-auto min-h-screen">
      {/* Header & Breadcrumb Banner with smooth entry animation */}
      <div className="mb-5 sm:mb-7 space-y-3 animate-fade-in">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-[#A3A3A3] font-label-caps uppercase tracking-widest">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors">{t.home}</Link>
          <span>/</span>
          <span className="text-[#D4AF37] font-bold">{t.collections}</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <h1 className={`font-headline-lg text-2xl sm:text-3xl md:text-4xl font-garamond font-bold tracking-wide transition-colors ${
              isDark ? 'text-[#E5E5E5]' : 'text-slate-900'
            }`}>
              {t.catalogTitle}
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 font-light ${isDark ? 'text-[#A3A3A3]' : 'text-slate-500'}`}>
              {isLoading ? 'جاري تحديث التشكيلة الفاخرة...' : `عرض ${totalItems || displayProducts.length} قطعة ملكية استثنائية`}
            </p>
          </div>

          {/* Mobile Quick Action Buttons (Filter + Sort) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2 border backdrop-blur-md transition-all duration-300 cursor-pointer active:scale-[0.98] group ${
                hasActiveFilters
                  ? isDark
                    ? 'bg-gradient-to-r from-[#1F190E] via-[#2D2313] to-[#1F190E] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border-amber-400 text-amber-950 shadow-sm'
                  : isDark
                  ? 'bg-[#141414]/90 border-neutral-800 hover:border-[#D4AF37]/50 text-neutral-200 hover:text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
                  : 'bg-white/95 border-slate-200/90 hover:border-amber-400 text-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#D4AF37] group-hover:rotate-45 transition-transform duration-300">
                  tune
                </span>
                <span className="tracking-wide">تصفية وفلترة</span>
              </div>
              {hasActiveFilters ? (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 font-mono text-[10px] font-black shadow-xs animate-pulse">
                  {filters.categories.length + (effectiveMin > minAvailableProductPrice || effectiveMax < maxAvailableProductPrice ? 1 : 0) + (filters.searchQuery ? 1 : 0)}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 group-hover:bg-[#D4AF37] transition-colors" />
              )}
            </button>

            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value as any });
                  setCurrentPage(1);
                }}
                className={`appearance-none py-2.5 pr-3 pl-7 text-xs rounded-xl border font-bold outline-none cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#141414]/90 border-neutral-800 text-neutral-200 hover:border-[#D4AF37]/40 focus:border-[#D4AF37]'
                    : 'bg-white/95 border-slate-200/90 text-slate-800 hover:border-amber-400 focus:border-amber-500 shadow-xs'
                }`}
              >
                <option value="newest">الأحدث</option>
                <option value="price_asc">الأقل سعراً</option>
                <option value="price_desc">الأعلى سعراً</option>
              </select>
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#D4AF37] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist High-End Luxury Category Navigation Bar */}
        <div className="relative border-b border-neutral-800/50 dark:border-neutral-800/50 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 select-none">
            {/* All Products Tab */}
            <button
              onClick={() => selectSingleCategory(null)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 ${
                filters.categories.length === 0
                  ? isDark
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.15)] font-bold'
                    : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {filters.categories.length === 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              )}
              <span>جميع المقتنيات</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                filters.categories.length === 0
                  ? isDark ? 'bg-[#D4AF37]/25 text-[#D4AF37]' : 'bg-amber-200 text-amber-950 font-bold'
                  : isDark ? 'bg-neutral-800/80 text-neutral-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalItems || fallbackProducts.length}
              </span>
            </button>

            {/* Dynamic Categories */}
            {renderedCategories.map((cat) => {
              const isSelected = filters.categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.15)] font-bold'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                      : isDark
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium'
                  }`}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Action Toolbar (Search + Smart Filter Drawer Toggle + Sort Dropdown) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Smart Search Input with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم، الخامة، اللون، أو المواصفات..."
              className={`w-full border px-4 py-2 sm:py-2.5 text-xs outline-none rounded-xl pr-9 transition-colors ${
                isDark
                  ? 'bg-[#141414] border-neutral-800 text-white placeholder-neutral-500 focus:border-[#D4AF37]'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-600 shadow-xs'
              }`}
            />
            <span className="material-symbols-outlined absolute right-3 top-2 sm:top-2.5 text-base text-[#D4AF37]">
              search
            </span>
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute left-3 top-2 sm:top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                title="مسح البحث"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Desktop Filter Trigger Button & Sort Dropdown */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Collapsible Smart Filter & Price Toggle Button */}
            <button
              onClick={() => setDesktopFilterOpen((prev) => !prev)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all duration-300 backdrop-blur-md group ${
                desktopFilterOpen || hasActiveFilters
                  ? isDark
                    ? 'bg-gradient-to-r from-[#1F190E] via-[#2D2313] to-[#1F190E] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border-amber-400 text-amber-950 shadow-sm'
                  : isDark
                  ? 'bg-[#141414]/90 border-neutral-800 text-neutral-200 hover:border-[#D4AF37]/50 hover:text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
                  : 'bg-white/95 border-slate-200/90 text-slate-800 hover:border-amber-400 shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-base text-[#D4AF37] group-hover:rotate-45 transition-transform duration-300">
                tune
              </span>
              <span>تصفية ونطاق السعر</span>
              {(filters.categories.length > 0 || effectiveMin > minAvailableProductPrice || effectiveMax < maxAvailableProductPrice) && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 font-mono text-[10px] font-black shadow-xs">
                  {filters.categories.length + (effectiveMin > minAvailableProductPrice || effectiveMax < maxAvailableProductPrice ? 1 : 0)}
                </span>
              )}
              <span className={`material-symbols-outlined text-sm text-[#D4AF37] transition-transform duration-300 ${desktopFilterOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-bold font-label-caps ${isDark ? 'text-[#A3A3A3]' : 'text-slate-500'}`}>
                {t.sortBy}:
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value as any });
                  setCurrentPage(1);
                }}
                className={`border px-3.5 py-2 text-xs font-bold rounded-xl outline-none cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#141414] border-neutral-800 text-[#E5E5E5] focus:border-[#D4AF37]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
              >
                <option value="newest"> {t.sortNewest || 'الأحدث وصولاً'}</option>
                <option value="price_asc"> {t.sortPriceAsc || 'السعر: من الأقل للأعلى'}</option>
                <option value="price_desc"> {t.sortPriceDesc || 'السعر: من الأعلى للأقل'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collapsible Smart Desktop Filter Panel (Opens horizontally above the grid without stealing column space) */}
        {desktopFilterOpen && (
          <div className={`hidden md:block p-5 rounded-2xl border transition-all animate-fade-in shadow-xl ${
            isDark ? 'bg-[#141414] border-neutral-800' : 'bg-white border-slate-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Categories Section */}
              <div className="md:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">category</span>
                    <span>الأقسام والتصنيفات</span>
                  </h4>
                  {filters.categories.length > 0 && (
                    <button
                      onClick={() => setFilters((p) => ({ ...p, categories: [] }))}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      إلغاء تحديد الأقسام
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                  {renderedCategories.map((cat) => {
                    const isSelected = filters.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? isDark
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50 font-bold shadow-xs'
                              : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : isDark
                            ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual Price Range Section */}
              <div className="md:col-span-4 space-y-3 border-x px-4 rtl:border-x rtl:border-neutral-800/60">
                <h4 className="font-bold text-xs text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span>نطاق السعر الذكي</span>
                </h4>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-400">الحد الأدنى:</span>
                    <span className="text-[#D4AF37] font-mono">${effectiveMin.toLocaleString()} USD</span>
                  </div>
                  <input
                    type="range"
                    min={minAvailableProductPrice}
                    max={Math.max(minAvailableProductPrice, effectiveMax - 50)}
                    step="50"
                    value={effectiveMin}
                    onChange={(e) => {
                      setFilters({ ...filters, priceMin: Number(e.target.value) });
                      setCurrentPage(1);
                    }}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-400">الحد الأقصى:</span>
                    <span className="text-[#D4AF37] font-mono">${effectiveMax.toLocaleString()} USD</span>
                  </div>
                  <input
                    type="range"
                    min={Math.min(effectiveMin + 50, maxAvailableProductPrice)}
                    max={maxAvailableProductPrice}
                    step="50"
                    value={effectiveMax}
                    onChange={(e) => {
                      setFilters({ ...filters, priceMax: Number(e.target.value) });
                      setCurrentPage(1);
                    }}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="md:col-span-3 space-y-2.5 self-center">
                <div className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-[#D4AF37]' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  السعر: من ${effectiveMin} إلى ${effectiveMax} USD
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-700 hover:border-neutral-500 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
                  >
                    إعادة ضبط
                  </button>
                  <button
                    onClick={() => setDesktopFilterOpen(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-colors"
                  >
                    إغلاق الفلتر
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-fade-in text-xs">
            <span className={`font-mono text-[11px] ${isDark ? 'text-[#A3A3A3]' : 'text-slate-500'}`}>
              الفلاتر النشطة:
            </span>
            {filters.categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 border text-xs font-bold rounded-full ${
                  isDark ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                {cat}
                <button onClick={() => toggleCategory(cat)} className="hover:opacity-75 cursor-pointer text-xs">✕</button>
              </span>
            ))}
            {(effectiveMin > minAvailableProductPrice || effectiveMax < maxAvailableProductPrice) && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 border text-xs font-bold rounded-full ${
                  isDark ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                السعر: ${effectiveMin} - ${effectiveMax} USD
                <button
                  onClick={() => setFilters((p) => ({ ...p, priceMin: minAvailableProductPrice, priceMax: maxAvailableProductPrice }))}
                  className="hover:opacity-75 cursor-pointer text-xs"
                >
                  ✕
                </button>
              </span>
            )}
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-full">
                بحث: &quot;{filters.searchQuery}&quot;
                <button onClick={() => setSearchInput('')} className="hover:text-white cursor-pointer text-xs">✕</button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-500 hover:underline font-bold px-2 cursor-pointer"
            >
              مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center md:hidden animate-fade-in dir-rtl">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <div
            className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[88vh] overflow-y-auto custom-scrollbar space-y-5 ${
              isDark ? 'bg-[#141414] text-white border-t border-neutral-800' : 'bg-white text-slate-900 border-t border-slate-200'
            }`}
          >
            {/* Bottom Sheet Drag Indicator */}
            <div className="w-12 h-1 bg-neutral-600/60 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex justify-between items-center pb-3 border-b border-neutral-800/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-xl">tune</span>
                <h3 className="font-garamond text-xl font-bold">تصفية الكتالوج الذكية</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Categories Pills in Mobile Sheet */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs text-[#D4AF37] uppercase tracking-wider">الأقسام والتصنيفات</h4>
              <div className="grid grid-cols-2 gap-2">
                {renderedCategories.map((cat) => {
                  const isSelected = filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`py-2 px-2.5 text-xs rounded-xl text-center font-semibold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50 font-bold shadow-xs'
                            : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : isDark
                          ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Dual Price Range Sliders in Mobile (Min and Max) */}
            <div className="space-y-3.5 pt-2 border-t border-neutral-800/40">
              <h4 className="font-bold text-xs text-[#D4AF37] uppercase tracking-wider">نطاق السعر الذكي</h4>

              {/* Slider 1: Min Price */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-400">الحد الأدنى:</span>
                  <span className="text-[#D4AF37] font-mono font-bold">${effectiveMin.toLocaleString()} USD ({Math.round(effectiveMin * 3.75)} ر.س)</span>
                </div>
                <input
                  type="range"
                  min={minAvailableProductPrice}
                  max={Math.max(minAvailableProductPrice, effectiveMax - 50)}
                  step="50"
                  value={effectiveMin}
                  onChange={(e) => {
                    setFilters({ ...filters, priceMin: Number(e.target.value) });
                    setCurrentPage(1);
                  }}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Slider 2: Max Price */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-400">الحد الأقصى:</span>
                  <span className="text-[#D4AF37] font-mono font-bold">${effectiveMax.toLocaleString()} USD ({Math.round(effectiveMax * 3.75)} ر.س)</span>
                </div>
                <input
                  type="range"
                  min={Math.min(effectiveMin + 50, maxAvailableProductPrice)}
                  max={maxAvailableProductPrice}
                  step="50"
                  value={effectiveMax}
                  onChange={(e) => {
                    setFilters({ ...filters, priceMax: Number(e.target.value) });
                    setCurrentPage(1);
                  }}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Live Range Badge in Mobile */}
              <div className={`p-2 rounded-xl border text-center text-xs font-bold ${
                isDark ? 'bg-neutral-900 border-neutral-800 text-[#D4AF37]' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                من ${effectiveMin} إلى ${effectiveMax} USD
              </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-800/40">
              <button
                onClick={clearAllFilters}
                className="py-2.5 px-4 rounded-xl border border-neutral-700 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer transition-colors"
              >
                إعادة ضبط
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-colors"
              >
                تطبيق الفلاتر ({totalItems || displayProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Full-Width Products Grid Area (4 Columns on Desktop, 2 Columns on Mobile) */}
      <main className="w-full space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div
                key={idx}
                className={`rounded-2xl border flex flex-col p-2 sm:p-3 space-y-2.5 ${
                  isDark ? 'bg-[#141414] border-neutral-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`aspect-[3/4] sm:aspect-[4/5] rounded-xl w-full ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                <div className={`h-3.5 rounded w-3/4 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border space-y-4 p-6 ${
            isDark ? 'bg-[#141414] border-neutral-800' : 'bg-white border-slate-200'
          }`}>
            <span className="material-symbols-outlined text-5xl text-[#D4AF37]">search_off</span>
            <h3 className={`font-garamond text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.noProductsFound}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              لم نتمكن من العثور على قطع تطابق بحثك الحالي. جرب تغيير خيارات التصفية أو البحث عن اسم آخر.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-[#D4AF37] text-neutral-950 font-bold text-xs tracking-widest uppercase cursor-pointer rounded-xl shadow-md hover:bg-[#E5C158] transition-colors"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4">
            {displayProducts.map((product, idx) => {
              const isWishlisted = wishlistIds.includes(product.id);
              const priceUSD = product.price || 0;
              const priceSAR = Math.round(priceUSD * 3.75);

              // Collect all images for in-card flipping
              const productImagesList: string[] = [
                product.image,
                ...(product.secondaryImages || []),
                ...((product as any).images || []).map((img: any) => typeof img === 'string' ? img : img?.url),
              ].filter(Boolean);

              const uniqueImages = Array.from(new Set(productImagesList));
              const activeImgIdx = (activeImageIndexMap[product.id] || 0) % (uniqueImages.length || 1);
              const currentImgSrc = uniqueImages[activeImgIdx] || product.image;

              // Check if product is already in cart
              const cartItem = cartItems?.find(
                (item) => item.product?.id === product.id || item.product?._id === product.id || item.id === product.id
              );
              const isInCart = Boolean(cartItem);
              const cartQuantity = cartItem?.quantity || 0;

              return (
                <div
                  key={product.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                  className={`group relative rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-500 ease-out flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1.5 animate-fade-up ${
                    isDark
                      ? 'bg-[#131313] hover:bg-[#171717] border-neutral-800/80 hover:border-[#D4AF37]/50 hover:shadow-amber-500/5'
                      : 'bg-white border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-amber-500/10'
                  }`}
                >
                  {/* Image Container with In-Card Image Flipping & Optimal Aspect Ratio */}
                  <div
                    className={`relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden cursor-pointer ${
                      isDark ? 'bg-[#191919]' : 'bg-slate-50'
                    }`}
                    onClick={() => navigateToProduct(product.id)}
                  >
                    <Image
                      src={currentImgSrc}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Badge Tags (Top-Start) */}
                    <div className="absolute top-1.5 left-1.5 rtl:left-auto rtl:right-1.5 z-10 flex flex-col gap-1 items-start">
                      {product.badge && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-black/90 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-[8px] sm:text-[10px] tracking-wider uppercase rounded-md backdrop-blur-sm shadow-md animate-scale-in">
                          {product.badge}
                        </span>
                      )}
                      {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-rose-600 text-white font-bold text-[8px] sm:text-[10px] tracking-wider uppercase rounded-md shadow-md animate-scale-in">
                          -{Math.round(((product.discountPrice! - product.price) / product.discountPrice!) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Wishlist Toggle Heart (Top-End) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className={`absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer z-10 hover:scale-115 active:scale-90 backdrop-blur-md shadow-xs ${
                        isWishlisted
                          ? isDark
                            ? 'bg-rose-950/80 border border-rose-500/60 text-rose-400'
                            : 'bg-rose-50 border border-rose-200 text-rose-600'
                          : isDark
                          ? 'bg-black/50 border border-white/15 text-white/90 hover:text-rose-400 hover:bg-black/80'
                          : 'bg-white/90 border border-slate-200/80 text-slate-700 hover:text-rose-500 hover:bg-white'
                      }`}
                      title={t.wishlist}
                    >
                      <span className={`material-symbols-outlined text-sm sm:text-base transition-transform duration-200 ${isWishlisted ? 'fill scale-110' : ''}`}>
                        favorite
                      </span>
                    </button>

                    {/* Image Flipping Navigation Arrows (Desktop Only) */}
                    {uniqueImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handlePrevImage(e, product.id, uniqueImages.length)}
                          className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/90 text-white/80 hover:text-white items-center justify-center transition-all cursor-pointer z-20 opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                          title="الصورة السابقة"
                        >
                          <span className="material-symbols-outlined text-xs">chevron_left</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleNextImage(e, product.id, uniqueImages.length)}
                          className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/90 text-white/80 hover:text-white items-center justify-center transition-all cursor-pointer z-20 opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                          title="الصورة التالية"
                        >
                          <span className="material-symbols-outlined text-xs">chevron_right</span>
                        </button>

                        {/* Subtle Dots Indicator at Bottom of Image */}
                        <div className="absolute bottom-1.5 inset-x-0 flex justify-center items-center gap-1 z-10">
                          {uniqueImages.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={(e) => handleSetImageIndex(e, product.id, dotIdx)}
                              className={`h-1 rounded-full transition-all cursor-pointer ${
                                activeImgIdx === dotIdx
                                  ? 'bg-[#D4AF37] w-3 shadow-xs'
                                  : 'bg-white/50 hover:bg-white/90 w-1'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Desktop Hover Action Overlay */}
                    <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 gap-1.5 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomProduct(product);
                        }}
                        className="p-1.5 bg-[#1D1D1D] border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all hover:scale-105 flex items-center justify-center cursor-pointer rounded-lg"
                        title={t.zoomImage}
                      >
                        <span className="material-symbols-outlined text-base">zoom_in</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                        className="flex-1 py-1.5 bg-[#1D1D1D] border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] font-button text-[10px] tracking-wider uppercase transition-all hover:scale-[1.02] cursor-pointer rounded-lg font-bold"
                      >
                        {t.quickView}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`p-1.5 transition-all flex items-center justify-center cursor-pointer rounded-lg font-bold active:scale-90 ${
                          isInCart
                            ? 'bg-[#D4AF37] text-neutral-950 shadow-sm scale-105'
                            : 'bg-[#1D1D1D] border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] hover:scale-105'
                        }`}
                        title={isInCart ? `مضاف في الحقيبة (${cartQuantity})` : t.addToBag}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isInCart ? 'check' : 'shopping_bag'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Product Card Details (Clear & High Contrast) */}
                  <div className="p-2 sm:p-2.5 space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Brand row */}
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                        <span className="truncate max-w-[110px]">{product.category}</span>
                        {product.brand && (
                          <span className="text-neutral-400 font-mono hidden sm:inline text-[9px]">{product.brand}</span>
                        )}
                      </div>

                      {/* Product Title */}
                      <h3
                        onClick={() => navigateToProduct(product.id)}
                        className={`font-garamond text-xs sm:text-sm font-bold line-clamp-1 sm:line-clamp-2 mt-0.5 cursor-pointer leading-snug transition-colors ${
                          isDark ? 'text-[#F5F5F5] group-hover:text-[#D4AF37]' : 'text-slate-900 group-hover:text-amber-800'
                        }`}
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Action Row */}
                    <div className={`pt-1.5 border-t flex items-center justify-between gap-1 ${
                      isDark ? 'border-neutral-800/80' : 'border-slate-100'
                    }`}>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-[#D4AF37] dark:text-[#D4AF37]">
                            ${priceUSD.toLocaleString()}
                          </span>
                          {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                            <span className="text-[10px] text-rose-500 line-through font-mono">
                              ${product.discountPrice?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {priceSAR.toLocaleString()} ر.س
                        </span>
                      </div>

                      {/* Professional Minimalist Add-To-Cart Icon Button with In-Cart State */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 relative ${
                          isInCart
                            ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                            : isDark
                            ? 'bg-neutral-900/50 border border-neutral-700/60 text-neutral-300 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
                            : 'bg-slate-100/90 border border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                        title={isInCart ? `مضاف في الحقيبة (${cartQuantity}) - انقر للإضافة مرة أخرى` : t.addToBag}
                      >
                        <span className={`material-symbols-outlined text-sm sm:text-base transition-all duration-300 ${
                          isInCart ? 'scale-110 font-bold' : ''
                        }`}>
                          {isInCart ? 'check' : 'shopping_bag'}
                        </span>

                        {/* Tiny badge indicator if quantity > 1 */}
                        {isInCart && cartQuantity > 1 && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#D4AF37] text-neutral-950 text-[8px] font-extrabold rounded-full flex items-center justify-center font-mono shadow-xs">
                            {cartQuantity}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border disabled:opacity-30 cursor-pointer ${
                isDark ? 'border-neutral-800 text-[#D4AF37]' : 'border-slate-300 text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm rtl:rotate-180">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 sm:w-9 sm:h-9 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    currentPage === pageNum
                      ? 'bg-[#D4AF37] text-neutral-950 shadow-xs scale-105'
                      : isDark
                      ? 'border border-neutral-800 text-white hover:border-[#D4AF37]'
                      : 'border border-slate-300 text-slate-800 hover:border-amber-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border disabled:opacity-30 cursor-pointer ${
                isDark ? 'border-neutral-800 text-[#D4AF37]' : 'border-slate-300 text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm rtl:rotate-180">chevron_right</span>
            </button>
          </div>
        )}
      </main>

      {/* Image Zoom Lightbox Modal */}
      <ImageZoomModal
        product={zoomProduct}
        onClose={() => setZoomProduct(null)}
        t={t}
      />
    </div>
  );
};
