'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export const QuickViewModal: React.FC = () => {
  const router = useRouter();
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    lang,
    t,
  } = useApp();

  // Increment backend view count when quick view opens
  useEffect(() => {
    if (quickViewProduct?.id) {
      api.getProductById(quickViewProduct.id).catch(() => {});
    }
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 dark:bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#262626] max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2 animate-fade-up text-neutral-900 dark:text-white">
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2 text-neutral-700 dark:text-[#D4AF37] bg-white/90 dark:bg-[#141414]/90 rounded-full hover:bg-[#D4AF37] hover:text-black transition-colors cursor-pointer shadow-md"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Left Image */}
        <div
          onClick={() => {
            const prodId = quickViewProduct.id;
            setQuickViewProduct(null);
            router.push(`/product/${prodId}`);
          }}
          className="h-72 md:h-full bg-neutral-100 dark:bg-[#1D1D1D] relative min-h-[300px] cursor-pointer group"
        >
          <Image src={quickViewProduct.image} alt={quickViewProduct.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
          {quickViewProduct.badge && (
            <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 bg-black/80 border border-[#D4AF37]/50 text-[#D4AF37] font-label-caps text-[10px] tracking-widest uppercase z-10 rounded-sm font-bold shadow-md">
              {quickViewProduct.badge}
            </span>
          )}
        </div>

        {/* Right Info */}
        <div className="p-6 md:p-8 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="font-label-caps text-xs text-[#B8860B] dark:text-[#D4AF37] uppercase tracking-widest font-bold">
              {quickViewProduct.category}
            </span>
            <h3
              onClick={() => {
                const prodId = quickViewProduct.id;
                setQuickViewProduct(null);
                router.push(`/product/${prodId}`);
              }}
              className="font-headline-md text-2xl font-garamond text-neutral-900 dark:text-[#E5E5E5] hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              {quickViewProduct.name}
            </h3>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-headline-md text-2xl sm:text-3xl text-[#9A7B1C] dark:text-[#D4AF37] font-garamond font-bold">
                ${quickViewProduct.price.toLocaleString()} USD
              </span>
              {Boolean(quickViewProduct.discountPrice && quickViewProduct.discountPrice > quickViewProduct.price) && (
                <span className="text-base font-mono text-red-500 line-through font-bold">
                  ${quickViewProduct.discountPrice?.toLocaleString()}
                </span>
              )}
              {Boolean(quickViewProduct.discountPrice && quickViewProduct.discountPrice > quickViewProduct.price) && (
                <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold font-mono">
                  -{Math.round(((quickViewProduct.discountPrice! - quickViewProduct.price) / quickViewProduct.discountPrice!) * 100)}%
                </span>
              )}
            </div>
            <p className="font-body-md text-xs text-neutral-600 dark:text-[#A3A3A3] font-light leading-relaxed">
              {quickViewProduct.description}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                addToCart(quickViewProduct);
                setQuickViewProduct(null);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 hover:brightness-110 font-button text-xs tracking-widest uppercase font-bold transition-all cursor-pointer rounded-lg shadow-md hover:shadow-xl"
            >
              {lang === 'ar' ? 'إضافة إلى حقيبة التسوق' : 'Add to Shopping Bag'}
            </button>
            <button
              onClick={() => {
                const prodId = quickViewProduct.id;
                setQuickViewProduct(null);
                router.push(`/product/${prodId}`);
              }}
              className="w-full py-3.5 border border-neutral-300 dark:border-[#262626] text-[#B8860B] dark:text-[#D4AF37] hover:bg-[#D4AF37]/10 font-button text-xs tracking-widest uppercase transition-colors cursor-pointer rounded-lg font-bold"
            >
              {lang === 'ar' ? 'عرض التفاصيل والمواصفات الكاملة' : 'View Full Specifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
