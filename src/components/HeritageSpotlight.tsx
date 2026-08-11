'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';

export interface HeritageData {
  subtitle?: string;
  title?: string;
  description?: string;
  image?: { url?: string } | string;
  link?: string;
  stat1Number?: string;
  stat1Label?: string;
  stat2Number?: string;
  stat2Label?: string;
  stat3Number?: string;
  stat3Label?: string;
}

interface HeritageSpotlightProps {
  heritage?: HeritageData;
}

export const HeritageSpotlight: React.FC<HeritageSpotlightProps> = ({ heritage }) => {
  const { setIsLookbookOpen, t, lang } = useApp();

  const getImageSrc = (img: any): string => {
    if (!img) return "https://lh3.googleusercontent.com/aida-public/AB6AXuCorFP6Jzi5zYfw7wL74jaZVInGYR1C8JWSQX3s4TMMjahW3-tGKIAddxA56hXqwvoMzhU2oG_eLDKEPCCLcTiYXToqcOXYc7cFlFglQge9zCcapFyGuC7M6_zJj9qI1CGivyD3QQHOz4wKJ-KpK1xc64edh_zY7yZZfUshMdlh2cR67hyjCFxgKCoK5mbyBUHGDreVrSdLgaNeH0y7v4ryM3jzcb88p87LC5aCN0ow4EE7X-NSAMI";
    if (typeof img === 'string') return img;
    return img.url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCorFP6Jzi5zYfw7wL74jaZVInGYR1C8JWSQX3s4TMMjahW3-tGKIAddxA56hXqwvoMzhU2oG_eLDKEPCCLcTiYXToqcOXYc7cFlFglQge9zCcapFyGuC7M6_zJj9qI1CGivyD3QQHOz4wKJ-KpK1xc64edh_zY7yZZfUshMdlh2cR67hyjCFxgKCoK5mbyBUHGDreVrSdLgaNeH0y7v4ryM3jzcb88p87LC5aCN0ow4EE7X-NSAMI";
  };

  const subtitle = heritage?.subtitle || t.heritageSubtitle || (lang === 'ar' ? 'أصالة وحرفية الأتليه' : 'ATELIER HERITAGE & COUTURE');
  const title = heritage?.title || t.heritageTitle || (lang === 'ar' ? 'إتقان لا يساوم منذ عام 1994' : 'Uncompromising Craftsmanship Since 1994');
  const description = heritage?.description || t.heritageDesc || (lang === 'ar' ? 'كل قطعة من SAOUDI WEAR هي مزيج فريد بين الدقة السويسرية في صناعة الساعات والبراعة الإيطالية في التفصيل الملكي. صُنعت للقادة الذين يفرضون هيبتهم بصمت.' : 'Every SAOUDI WEAR creation is an amalgamation of Swiss horological precision and Italian bespoke sartorial mastery. Forged for modern leaders who command the room in silence.');
  const imgSrc = getImageSrc(heritage?.image);
  const link = heritage?.link || '/shop';

  const stat1Number = heritage?.stat1Number || t.heritageStat1Number || '30+';
  const stat1Label = heritage?.stat1Label || t.heritageStat1Label || (lang === 'ar' ? 'عاماً من الأصالة' : 'Years Heritage');
  const stat2Number = heritage?.stat2Number || t.heritageStat2Number || '100%';
  const stat2Label = heritage?.stat2Label || t.heritageStat2Label || (lang === 'ar' ? 'حرفية يدوية معتمدة' : 'Swiss & Italian Craft');
  const stat3Number = heritage?.stat3Number || t.heritageStat3Number || '150s';
  const stat3Label = heritage?.stat3Label || t.heritageStat3Label || (lang === 'ar' ? 'صوف بييلا الإيطالي الخالص' : 'Biella Virgin Wool');

  return (
    <section className="py-24 bg-white dark:bg-[#141414] border-y border-neutral-200 dark:border-[#262626] relative overflow-hidden transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left Side: Editorial Image Container */}
        <div className="md:col-span-6 relative">
          <div className="relative z-10 rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl h-[540px]">
            <Image
              src={imgSrc}
              alt={title}
              fill
              unoptimized
              className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
            />
          </div>
          {/* Decorative gold frame overlay */}
          <div className="absolute -bottom-5 -right-5 rtl:-right-auto rtl:-left-5 w-full h-full border border-[#D4AF37]/40 rounded-xl z-0 hidden sm:block pointer-events-none" />
        </div>

        {/* Right Side: Editorial Narrative */}
        <div className="md:col-span-6 space-y-8 pl-0 md:pl-8 rtl:pl-0 rtl:md:pr-8">
          <div className="space-y-3">
            <span className="font-label-caps text-xs text-[#D4AF37] tracking-[0.25em] uppercase font-bold block">
              {subtitle}
            </span>
            <h2 className="font-headline-lg text-4xl md:text-5xl font-garamond text-neutral-900 dark:text-[#E5E5E5] leading-tight">
              {title}
            </h2>
            <div className="w-16 h-[2px] bg-[#D4AF37] rounded-full" />
          </div>

          <p className="font-body-lg text-base md:text-lg text-neutral-600 dark:text-[#A3A3A3] leading-relaxed font-light">
            {description}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="border-l border-[#D4AF37]/50 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 pl-4 space-y-1">
              <span className="font-headline-md text-2xl sm:text-3xl text-[#B8860B] dark:text-[#D4AF37] font-garamond font-bold">
                {stat1Number}
              </span>
              <p className="font-label-caps text-[11px] text-neutral-500 dark:text-[#A3A3A3] tracking-widest uppercase font-semibold">
                {stat1Label}
              </p>
            </div>
            <div className="border-l border-[#D4AF37]/50 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 pl-4 space-y-1">
              <span className="font-headline-md text-2xl sm:text-3xl text-[#B8860B] dark:text-[#D4AF37] font-garamond font-bold">
                {stat2Number}
              </span>
              <p className="font-label-caps text-[11px] text-neutral-500 dark:text-[#A3A3A3] tracking-widest uppercase font-semibold">
                {stat2Label}
              </p>
            </div>
            <div className="border-l border-[#D4AF37]/50 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 pl-4 space-y-1">
              <span className="font-headline-md text-2xl sm:text-3xl text-[#B8860B] dark:text-[#D4AF37] font-garamond font-bold">
                {stat3Number}
              </span>
              <p className="font-label-caps text-[11px] text-neutral-500 dark:text-[#A3A3A3] tracking-widest uppercase font-semibold">
                {stat3Label}
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap gap-4">
            <button
              onClick={() => setIsLookbookOpen(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-950 hover:brightness-110 font-button text-xs tracking-widest uppercase font-bold transition-all shadow-md cursor-pointer rounded-sm"
            >
              {t.lookbook || (lang === 'ar' ? 'كتالوج الإطلالات الملكية (LOOKBOOK)' : 'ATELIER LOOKBOOK')}
            </button>
            <Link
              href={link}
              className="px-8 py-3.5 border border-[#D4AF37]/60 text-[#B8860B] dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-button text-xs tracking-widest uppercase transition-all cursor-pointer inline-block text-center rounded-sm font-bold shadow-xs hover:shadow-md"
            >
              {t.bookAppointment || (lang === 'ar' ? 'استكشف التراث والقطع' : 'DISCOVER HERITAGE')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
