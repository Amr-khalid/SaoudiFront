'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ProductImageSwiper } from './ui/ProductImageSwiper';

interface ProductsCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
}

export const ProductsCarousel: React.FC<ProductsCarouselProps> = ({
  title,
  subtitle,
  products,
  viewAllLink = '/shop',
}) => {
  const router = useRouter();
  const { lang, addToCart, setQuickViewProduct, theme } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 px-5 md:px-16 max-w-[1480px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
        <div className="space-y-2">
          {subtitle && (
            <span className="font-label-caps text-xs text-[#9A7B1C] dark:text-[#D4AF37] tracking-[0.25em] uppercase font-bold block">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-lg text-3xl md:text-5xl font-garamond text-slate-900 dark:text-[#E5E5E5] font-normal tracking-wide">
            {title}
          </h2>
          <div className="w-16 h-[2.5px] bg-gradient-to-r from-[#B8860B] to-[#E5C158] mt-2 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            className="w-11 h-11 rounded-full border border-slate-200 dark:border-[#262626] hover:border-[#B8860B] dark:hover:border-[#D4AF37] bg-white dark:bg-[#121212] text-slate-800 dark:text-neutral-300 hover:text-[#B8860B] dark:hover:text-[#D4AF37] flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Previous"
            aria-label="Scroll left"
          >
            <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_left</span>
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-11 h-11 rounded-full border border-slate-200 dark:border-[#262626] hover:border-[#B8860B] dark:hover:border-[#D4AF37] bg-white dark:bg-[#121212] text-slate-800 dark:text-neutral-300 hover:text-[#B8860B] dark:hover:text-[#D4AF37] flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Next"
            aria-label="Scroll right"
          >
            <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_right</span>
          </button>
          <Link
            href={viewAllLink}
            className="px-6 py-3 border border-[#B8860B]/70 dark:border-[#D4AF37]/60 text-[#9A7B1C] dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-button text-xs tracking-widest uppercase transition-all duration-300 rounded-lg ms-2 font-bold shadow-xs hover:shadow-md"
          >
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
          </Link>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const prodId = product.id || (product as any)._id;

          const productImagesList: string[] = [
            product.image,
            ...(product.secondaryImages || []),
            ...((product as any).images || []).map((img: any) => (typeof img === 'string' ? img : img?.url)),
            ...(product.colors || []).map((c: any) => c?.image),
          ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');

          const uniqueImages = Array.from(new Set(productImagesList));

          return (
            <div
              key={prodId}
              className="flex-none w-[285px] sm:w-[325px] snap-start group bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] hover:border-[#B8860B] dark:hover:border-[#D4AF37] transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_35px_rgba(184,134,11,0.12)]"
            >
              {/* Product Image Box with Touch Swiping and Desktop Chevrons */}
              <ProductImageSwiper
                images={uniqueImages}
                alt={product.name}
                aspectRatioClassName="h-80 w-full"
                onCardClick={() => router.push(`/product/${prodId}`)}
                isDark={isDark}
                badge={
                  product.badge ? (
                    <span className="px-3 py-1 bg-[#D4AF37] text-neutral-950 font-button text-[10px] font-bold uppercase tracking-widest rounded-md shadow-md">
                      {product.badge}
                    </span>
                  ) : null
                }
                hoverOverlay={
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                      className="w-11 h-11 rounded-full bg-black/85 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110"
                      title="Quick View"
                      aria-label="Quick View Product"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-11 h-11 rounded-full bg-[#D4AF37] text-black hover:bg-[#E5C158] flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110"
                      title="Add to Cart"
                      aria-label="Add product to cart"
                    >
                      <span className="material-symbols-outlined text-lg font-bold">shopping_bag</span>
                    </button>
                  </div>
                }
              />

              {/* Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-label-caps text-[#9A7B1C] dark:text-[#D4AF37] tracking-widest uppercase block mb-1 font-bold">
                    {product.category || 'Luxury Atelier Item'}
                  </span>
                  <Link
                    href={`/product/${prodId}`}
                    className="font-garamond text-xl font-medium text-slate-900 dark:text-white hover:text-[#B8860B] dark:hover:text-[#D4AF37] transition-colors line-clamp-1 block cursor-pointer"
                  >
                    {product.name}
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
                  <Link href={`/product/${prodId}`} className="flex items-baseline gap-2 cursor-pointer">
                    <span className="font-garamond text-2xl font-bold text-[#9A7B1C] dark:text-[#D4AF37]">
                      ${product.price?.toLocaleString()}
                    </span>
                    {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                      <span className="text-xs text-red-500 line-through font-mono font-bold">
                        ${product.discountPrice?.toLocaleString()}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/product/${prodId}`}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/50 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] font-button text-[11px] text-slate-800 dark:text-neutral-300 tracking-widest uppercase font-bold transition-all shadow-2xs"
                  >
                    {lang === 'ar' ? 'عرض القطعة' : 'View Item'}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
