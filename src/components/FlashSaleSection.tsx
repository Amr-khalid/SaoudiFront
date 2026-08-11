'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

interface FlashSaleSectionProps {
  flashSale?: {
    title?: string;
    products?: Product[];
    startDate?: string;
    endDate?: string;
  };
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({ flashSale }) => {
  const { lang, addToCart, setQuickViewProduct } = useApp();

  const products = flashSale?.products || [];
  const title = flashSale?.title || (lang === 'ar' ? 'عروض التصفية الخاطفة - FLASH SALE' : 'FLASH SALE - LIMITED EDITION');
  const endDate = flashSale?.endDate;

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!endDate) {
      // Default 12 hours countdown for showcase
      const dummyEnd = new Date(Date.now() + 12 * 60 * 60 * 1000).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = dummyEnd - now;
        if (diff <= 0) return clearInterval(interval);
        setTimeLeft({
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    const targetDate = new Date(endDate).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        setTimeLeft({
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 px-5 md:px-16 max-w-[1440px] mx-auto">
      <div className="bg-neutral-900/90 dark:bg-[#121212] border border-[#D4AF37]/50 p-8 md:p-12 rounded-2xl relative overflow-hidden shadow-2xl text-white">
        {/* Background glow overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full filter blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-700/60 mb-8">
          <div>
            <span className="font-label-caps text-xs text-[#D4AF37] tracking-[0.25em] uppercase font-bold block mb-1">
              {lang === 'ar' ? 'عروض لفترة محدودة جداً' : 'LIMITED TIME ATELIER PRIVILEGE'}
            </span>
            <h2 className="font-headline-lg text-2xl md:text-4xl font-garamond text-white">
              {title}
            </h2>
          </div>

          {/* Countdown Clock */}
          {timeLeft && (
            <div className="flex items-center space-x-3 rtl:space-x-reverse bg-black/80 border border-[#D4AF37]/50 px-5 py-3 rounded-xl shadow-xl">
              <span className="material-symbols-outlined text-[#D4AF37] text-xl animate-pulse">schedule</span>
              <span className="text-xs font-label-caps text-neutral-300 uppercase tracking-widest me-2 font-bold">
                {lang === 'ar' ? 'ينتهي خلال:' : 'ENDS IN:'}
              </span>
              <div className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[#D4AF37] border border-white/10 shadow-inner">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span>:</span>
                <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[#D4AF37] border border-white/10 shadow-inner">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span>:</span>
                <div className="bg-[#1E1E1E] px-3 py-1 rounded text-[#D4AF37] border border-white/10 shadow-inner">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => {
            const prodId = product.id || (product as any)._id;
            const imageSrc =
              typeof product.image === 'string'
                ? product.image
                : (product as any).thumbnail?.url || (product as any).images?.[0]?.url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80';

            return (
              <div
                key={prodId}
                className="group relative bg-[#181818] border border-neutral-700/80 hover:border-[#D4AF37] transition-all duration-300 rounded-xl flex flex-col overflow-hidden shadow-lg hover:shadow-2xl"
              >
                {/* Product Image Link */}
                <Link
                  href={`/product/${prodId}`}
                  className="relative h-64 w-full bg-[#0D0D0D] overflow-hidden block cursor-pointer"
                >
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover object-center group-hover:scale-108 transition-transform duration-700"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 bg-[#D4AF37] text-neutral-950 font-button text-[10px] font-bold uppercase tracking-wider rounded-sm z-10 shadow-md">
                      {product.badge}
                    </span>
                  )}
                  {/* Action Buttons overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                      className="w-10 h-10 rounded-full bg-black/85 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110"
                      title="Quick View"
                      aria-label="Quick view"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-10 h-10 rounded-full bg-[#D4AF37] text-black hover:bg-[#E5C158] flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110"
                      title="Add to Cart"
                      aria-label="Add to cart"
                    >
                      <span className="material-symbols-outlined text-lg font-bold">shopping_bag</span>
                    </button>
                  </div>
                </Link>

                {/* Product Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3 text-white">
                  <div>
                    <span className="text-[11px] font-label-caps text-[#D4AF37] tracking-widest uppercase block mb-1 font-bold">
                      {product.category || 'Atelier'}
                    </span>
                    <Link
                      href={`/product/${prodId}`}
                      className="font-garamond text-lg font-normal text-white line-clamp-1 group-hover:text-[#D4AF37] transition-colors block cursor-pointer"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <Link href={`/product/${prodId}`} className="flex items-baseline gap-2 cursor-pointer">
                      <span className="font-garamond text-xl font-bold text-[#D4AF37]">
                        ${product.price?.toLocaleString()}
                      </span>
                      {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                        <span className="text-xs text-red-500 font-mono line-through font-bold">
                          ${product.discountPrice?.toLocaleString()}
                        </span>
                      )}
                    </Link>
                    <Link
                      href={`/product/${prodId}`}
                      className="text-xs font-button text-neutral-300 hover:text-[#D4AF37] uppercase tracking-wider font-bold"
                    >
                      {lang === 'ar' ? 'التفاصيل' : 'Details'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
