'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';

export interface BentoCollectionItem {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: { url?: string } | string;
  link?: string;
  badge?: string;
  colSpan?: number;
  rowSpan?: number;
  height?: string;
  price?: number;
  category?: string;
  isSpecialCard?: boolean;
}

interface BentoGridProps {
  collections?: BentoCollectionItem[];
}

export const BentoGrid: React.FC<BentoGridProps> = ({ collections }) => {
  const { t, products, lang } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const bespokeSuit = products.find((p) => p.id === 'bespoke-charcoal-suit' || p.category === 'Suits') || products[0];
  const chronograph = products.find((p) => p.id === 'obsidian-chronograph' || p.category === 'Timepieces') || products[0];
  const overcoat = products.find((p) => p.id === 'charcoal-tailored-overcoat' || p.category === 'Coats & Jackets' || p.category === 'Outerwear') || products[0];
  const turtleneck = products.find((p) => p.id === 'cashmere-turtleneck' || p.category === 'Knitwear') || products[0];
  const derbys = products.find((p) => p.id === 'onyx-leather-derbys' || p.category === 'Accessories') || products[0];

  const defaultItems: BentoCollectionItem[] = [
    // Card 1: Haute Horology - Portrait Tall Hero Card (5 cols, Spans 2 rows on desktop)
    {
      id: 'haute-horology',
      category: 'horology',
      title: t.horologyTitle || 'The Obsidian Chronograph',
      subtitle: t.horologyCategory || 'Haute Horology',
      description: t.horologyDesc || 'Automatic Caliber SW500 with 42mm Rose Gold PVD case & domed sapphire crystal.',
      badge: lang === 'ar' ? 'ساعات فاخرة نادرة' : 'HAUTE HOROLOGY',
      image: chronograph?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBdfkqeHwK78EKhDX94IkeB6MMm3j5BALCT7tvYLF2I_BFzrKqY4hKwvEO55sXKgj0qbDENcQgFkOj-s0mVnT9cyIi_u5fCfH_90iz567aesfkp0G15bgn3n8q-p-tymErQNek0G029aXX8rHit69fkWdcGW1xPfGO_JUcJnxpXoLfzqHdOxmdEY3oVuoO0ENtOzYUFKjCc9HFIU52_2YJ5jg-ai7W2zWv_K3SQGjrzcLHa0A-PX1M",
      link: `/product/${chronograph?.id || 'obsidian-chronograph'}`,
      price: chronograph?.price || 2450,
      colSpan: 5,
      rowSpan: 2,
      height: 'min-h-[520px] lg:min-h-[640px]',
    },
    // Card 2: Bespoke Tailoring - Landscape Hero Card (7 cols)
    {
      id: 'bespoke-tailoring',
      category: 'tailoring',
      title: t.tailoringTitle || 'Super 150s Double-Breasted Suit',
      subtitle: t.tailoringCategory || 'Bespoke Tailoring',
      description: t.tailoringDesc || 'Precision cut from Biella wool with hand-stitched pick detailing and carved horn buttons.',
      badge: lang === 'ar' ? 'تفصيل ملكي إيطالي' : 'ATELIER BESPOKE',
      image: bespokeSuit?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCwf9ON1PecxF3MW9QmEtdNmSxDlhjc9DBw-dAxiQDEnMzhj9vI8AujBmzluXwSCkeZPS5aqB0jLPWLfMQkvnp8KviQXhBL7L_IhCYdL8pyq2XeR2FzaSHCWAPTuUAEgsiPTyrjJnQLnvCHHeEicoHaOpWPk-OgV0jYvGpnTrz1Duj5Vm_R4GNtz9RHZk5zAfmk82pn06rvMPAG5YZOYIBebe1MmIwVjCYHWHUiv-uJ8gd2SX6VUGI",
      link: `/product/${bespokeSuit?.id || 'bespoke-charcoal-suit'}`,
      price: bespokeSuit?.price || 2100,
      colSpan: 7,
      rowSpan: 1,
      height: 'min-h-[320px] lg:min-h-[340px]',
    },
    // Card 3: Outerwear - Medium Card (4 cols)
    {
      id: 'outerwear',
      category: 'outerwear',
      title: t.outerwearTitle || 'Italian Wool-Cashmere Overcoats',
      subtitle: t.outerwearCategory || 'Outerwear',
      description: t.outerwearDesc || (lang === 'ar' ? 'معاطف كلاسيكية مصممة ببراعة من مزيج الصوف والكشمير الإيطالي.' : 'Tailored outerwear in Italian wool cashmere blend.'),
      badge: lang === 'ar' ? 'صوف وكشمير' : 'ITALIAN WOOL',
      image: overcoat?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBN95w58zxTxcr5DpTVD5hknLn1Xl3F38if7eQovvf-HuwQDzlsC0Vmp2rE2oW9EKA6xXRH7CB6_9DVraVUYS7MFGaWl65ADGuQbnDzQjVNkLfIWOB_r5_aORCa9u4LAw_jD1UfmDPos4As1FFZjyK57Zqf6poHNCQVPSUq3YdU9aap92q0XyVHhsX3_60s7-24SNExevxZGsax2Q-pSFsA4vKSfjhNNygm1x8w395KT5Fr-9hsU-o",
      link: `/product/${overcoat?.id || 'charcoal-tailored-overcoat'}`,
      price: overcoat?.price || 1250,
      colSpan: 4,
      rowSpan: 1,
      height: 'min-h-[280px]',
    },
    // Card 4: Knitwear - Compact Slim Card (3 cols)
    {
      id: 'knitwear',
      category: 'knitwear',
      title: t.knitwearTitle || 'Mongolian Cashmere Turtlenecks',
      subtitle: t.knitwearCategory || 'Knitwear',
      description: t.knitwearDesc || (lang === 'ar' ? 'حياكة فاخرة من صوف الكشمير المنغولي الصافي فائق النعومة.' : 'Grade-A Mongolian cashmere knitted for soft weightless warmth.'),
      badge: lang === 'ar' ? 'كشمير خالص' : 'PURE CASHMERE',
      image: turtleneck?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuA7B7zPVGqDdB7ilOiDWYxJY6kCUUIrMzANoZjQhBVkfw0Fb9mjjmNOod699XcjmaR4ZSIiL40EO7d5QkY0rDx2Q3LrZTHsI6oYGyO4__QOKrBgx0Ncc40GU6WLxPJOuQF9w4wVywJfNlsKqAO28NLf6BF0ZKED5DwvmPftWicSKlOxYYSuhwpJYpajUjZEIUOsjJAYtPy6KpSc4QpYuhOJKua6MriflS8pQOfP8AQ8tc_qkIXPxKI",
      link: `/product/${turtleneck?.id || 'cashmere-turtleneck'}`,
      price: turtleneck?.price || 495,
      colSpan: 3,
      rowSpan: 1,
      height: 'min-h-[280px]',
    },
    // Card 5: Leather Derbys - Wide Banner Card (8 cols)
    {
      id: 'accessories',
      category: 'accessories',
      title: t.accessoriesTitle || 'Florentine Full-Grain Leather Derbys',
      subtitle: t.accessoriesCategory || 'Leather & Accessories',
      description: t.accessoriesDesc || (lang === 'ar' ? 'أحذية وإكسسوارات جلود فاخرة مصنوعة يدوياً بخياطة بليك في فلورنسا.' : 'Handcrafted Blake-stitched derbys forged in Florence.'),
      badge: lang === 'ar' ? 'جلد فلورنسي' : 'FLORENTINE LEATHER',
      image: derbys?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuArORIdNhHy_NBx-HWri5XLVOGsRoyqX8pTNdq3McUQPLLoxqDcXtTLqYYWBJ924yoTzBC9zWzbB6Y2xhywPMM_eQ39Pdn4_bJnjeO6wgh1qUz-vvpWXbfRTAnIlIPQgIh3OTodChctaHlQ6z0e79bILZqdIN-vrvmDbtHvCQtt1FUoVji_JKsU9nma29mushpI-aePoGInBFS-Ddb9wBnhK0vjZAt0EGSG8LBHGOhtiP26qXfpjVg",
      link: `/product/${derbys?.id || 'onyx-leather-derbys'}`,
      price: derbys?.price || 450,
      colSpan: 8,
      rowSpan: 1,
      height: 'min-h-[300px]',
    },
    // Card 6: Special Gold Glass Card - Bespoke Concierge (4 cols)
    {
      id: 'private-concierge',
      category: 'tailoring',
      title: t.privateConciergeTitle || 'Bespoke Concierge & Private Trunk Shows',
      subtitle: t.privateConciergeCategory || 'Private Atelier',
      description: t.privateConciergeDesc || (lang === 'ar' ? 'احجز جلسة قياس خاصة مع خياطي الأتليه وصناع الساعات في جناحك الخاص.' : 'Request a private trunk show appointment with our master craftsmen.'),
      badge: lang === 'ar' ? 'خدمة ملكية خاصة' : 'VIP CONCIERGE',
      isSpecialCard: true,
      link: '/bespoke',
      colSpan: 4,
      rowSpan: 1,
      height: 'min-h-[300px]',
    },
  ];

  const itemsToDisplay = collections && collections.length > 0 ? collections : defaultItems;

  const filteredItems = activeCategory === 'all'
    ? itemsToDisplay
    : itemsToDisplay.filter((item) => item.category === activeCategory || (item.subtitle && item.subtitle.toLowerCase().includes(activeCategory)));

  const getImageSrc = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img.url || '';
  };

  const getGridClasses = (item: BentoCollectionItem, index: number) => {
    if (item.colSpan && item.rowSpan && item.rowSpan > 1) {
      return `col-span-12 lg:col-span-${item.colSpan} lg:row-span-${item.rowSpan}`;
    }

    if (item.colSpan && item.colSpan !== 6) {
      switch (item.colSpan) {
        case 12:
          return 'col-span-12';
        case 8:
          return 'col-span-12 lg:col-span-8';
        case 7:
          return 'col-span-12 lg:col-span-7';
        case 5:
          return 'col-span-12 lg:col-span-5';
        case 4:
          return 'col-span-12 sm:col-span-6 lg:col-span-4';
        case 3:
          return 'col-span-12 sm:col-span-6 lg:col-span-3';
        default:
          return `col-span-12 md:col-span-${item.colSpan}`;
      }
    }

    switch (index) {
      case 0:
        return 'col-span-12 lg:col-span-5 lg:row-span-2';
      case 1:
        return 'col-span-12 lg:col-span-7';
      case 2:
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 3:
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
      case 4:
        return 'col-span-12 lg:col-span-8';
      case 5:
        return 'col-span-12 lg:col-span-4';
      default:
        return `col-span-12 md:col-span-${item.colSpan || 6}`;
    }
  };

  const categoriesList = [
    { id: 'all', label: lang === 'ar' ? 'جميع تشكيلات الأتليه' : 'All Atelier Collections' },
    { id: 'horology', label: lang === 'ar' ? 'الساعات الفاخرة' : 'Haute Horology' },
    { id: 'tailoring', label: lang === 'ar' ? 'الخياطة الملكية' : 'Bespoke Tailoring' },
    { id: 'outerwear', label: lang === 'ar' ? 'المعاطف الفاخرة' : 'Outerwear' },
    { id: 'accessories', label: lang === 'ar' ? 'الجلود والإكسسوارات' : 'Leathercraft' },
  ];

  return (
    <section className="py-20 px-4 sm:px-8 lg:px-16 max-w-[1480px] mx-auto">
      {/* Section Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-[#161616] border border-[#D4AF37]/40 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="font-label-caps text-[11px] text-[#D4AF37] tracking-[0.28em] uppercase font-bold">
            {t.curatedCollectionsTitle || 'HAUTE HOROLOGY & BESPOKE TAILORING'}
          </span>
        </div>

        <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-garamond text-neutral-900 dark:text-[#F8F8F8] tracking-wide">
          {t.curatedCollectionsSubtitle || 'Curated Atelier Collections'}
        </h2>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <span className="text-[#D4AF37] text-sm font-serif">✦</span>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      </div>

      {/* Filter Tabs */}
      {/* <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
        {categoriesList.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-button tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-neutral-950 font-bold shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-105'
                  : 'bg-white dark:bg-[#121212] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:border-[#D4AF37]/50 shadow-xs'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
 */}
      {/* Asymmetric Bento Grid Layout */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 auto-rows-[380px]">
  {filteredItems.map((item, idx) => {
    const gridPosClass = getGridClasses(item, idx);
    const imgSrc = getImageSrc(item.image);

    // Special Gold Callout Card (e.g. VIP Concierge)
    if (item.isSpecialCard) {
      return (
        <Link
          key={item.id || idx}
          href={item.link || '/bespoke'}
          className={`${gridPosClass} group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#1A160D] via-[#121212] to-[#0A0A0A] p-8 transition-all duration-500 hover:border-[#D4AF37] hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)]`}
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl transition-all duration-700 group-hover:bg-[#D4AF37]/20" />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between">
            {item.badge && (
              <span className="rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 px-3 py-1 font-label-caps text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] backdrop-blur-md">
                {item.badge}
              </span>
            )}
            <span className="font-serif text-2xl text-[#D4AF37]">♔</span>
          </div>

          {/* Body Content */}
          <div className="relative z-10 my-auto space-y-3 py-6">
            {item.subtitle && (
              <span className="block font-label-caps text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {item.subtitle}
              </span>
            )}
            <h3 className="font-garamond text-2xl font-normal tracking-wide text-white transition-colors duration-300 group-hover:text-[#F3E5AB] sm:text-3xl">
              {item.title}
            </h3>
            {item.description && (
              <p className="line-clamp-3 font-body-md text-xs font-light leading-relaxed text-neutral-300 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>

          {/* Footer Action */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#D4AF37]/20 pt-4">
            <span className="inline-flex items-center gap-2 font-button text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              {lang === 'ar' ? 'حجز موعد أتليه خاص' : 'Book Private Appointment'}
              <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
                arrow_forward
              </span>
            </span>
          </div>
        </Link>
      );
    }

    // Standard Image Collection Card
    return (
      <Link
        key={item.id || idx}
        href={item.link || '/shop'}
        className={`${gridPosClass} group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E0E] transition-all duration-500 hover:border-[#D4AF37]/80 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8)]`}
      >
        {/* Background Image & Zoom Effect */}
        {imgSrc && (
          <div className="absolute inset-0">
            <Image
              src={imgSrc}
              alt={item.title || 'Collection'}
              fill
              unoptimized
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Single Clean Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-70" />
          </div>
        )}

        {/* Top Badges & Pricing */}
        <div className="absolute inset-x-5 top-5 z-20 flex items-center justify-between gap-2">
          {item.badge ? (
            <span className="rounded-full border border-[#D4AF37]/40 bg-black/60 px-3 py-1 font-label-caps text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] backdrop-blur-md shadow-lg">
              {item.badge}
            </span>
          ) : <div />}

          {item.price && (
            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 font-serif text-xs font-bold tracking-wider text-[#D4AF37] backdrop-blur-md shadow-lg">
              ${item.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Floating Content Box */}
        <div className="relative z-10 p-6 sm:p-8 space-y-2">
          {item.subtitle && (
            <span className="block font-label-caps text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              {item.subtitle}
            </span>
          )}

          {item.title && (
            <h3 className="font-garamond text-2xl font-normal tracking-wide text-white transition-colors duration-300 group-hover:text-[#F3E5AB] sm:text-3xl">
              {item.title}
            </h3>
          )}

          {item.description && (
            <p className="line-clamp-2 font-body-md text-xs font-light leading-relaxed text-neutral-300 sm:text-sm">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-white/15 pt-4 mt-4">
            <span className="inline-flex items-center gap-2 font-button text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              {t?.exploreCollection || (lang === 'ar' ? 'استكشف التشكيلة' : 'Explore Collection')}
              <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
                arrow_forward
              </span>
            </span>
          </div>
        </div>
      </Link>
    );
  })}
</div>    </section>
  );
};
