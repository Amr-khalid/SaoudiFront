'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { LOGO_URL } from '../types';

export const Footer: React.FC = () => {
  const { t, lang } = useApp();

  return (
    <footer className="bg-white dark:bg-[#141414] border-t border-neutral-200 dark:border-[#262626] text-neutral-600 dark:text-[#A3A3A3] pt-20 pb-12 px-5 md:px-16 mt-20 transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-24">
              <Image src={LOGO_URL} alt="SAOUDI WEAR" fill unoptimized className="object-contain logo-img" />
            </div>
            <span className="font-headline-md text-xl tracking-widest text-[#B8860B] dark:text-[#D4AF37] font-garamond font-bold">
              {t.brandName}
            </span>
          </div>
          <p className="font-body-md text-sm text-neutral-600 dark:text-[#A3A3A3] max-w-xs leading-relaxed">
            {t.footerTagline}
          </p>
          <div className="pt-2 text-xs text-[#B8860B] dark:text-[#D4AF37] font-label-caps tracking-widest font-bold">
            PARIS • MILAN • DUBAI • RIYADH • NEW YORK
          </div>
        </div>

        {/* Column 2: Client Services */}
        <div className="space-y-3">
          <h4 className="font-label-caps text-xs text-[#B8860B] dark:text-[#D4AF37] tracking-widest uppercase mb-4 font-bold">
            {t.customerCare}
          </h4>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-[#A3A3A3] font-body-md">
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.bespokeAtelier}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.atelierLocations}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.materialsAndCare}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.shippingAndReturns}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Explore */}
        <div className="space-y-3">
          <h4 className="font-label-caps text-xs text-[#B8860B] dark:text-[#D4AF37] tracking-widest uppercase mb-4 font-bold">
            {t.curatedCollectionsTitle}
          </h4>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-[#A3A3A3] font-body-md">
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.horologyTitle}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.tailoringTitle}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.outerwearTitle}
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                {t.knitwearTitle}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Private Circle */}
        <div className="space-y-4">
          <h4 className="font-label-caps text-xs text-[#B8860B] dark:text-[#D4AF37] tracking-widest uppercase font-bold">
            PRIVÉ CIRCLE
          </h4>
          <p className="font-body-md text-sm text-neutral-600 dark:text-[#A3A3A3] leading-relaxed">
            {t.newsletterSubtitle}
          </p>
          <Link
            href="/#newsletter"
            className="w-full py-3 bg-white dark:bg-[#1D1D1D] border border-neutral-300 dark:border-[#262626] text-[#B8860B] dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-button text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer block text-center rounded-sm font-bold shadow-xs hover:shadow-md"
          >
            {t.subscribeBtn}
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto pt-8 border-t border-neutral-200 dark:border-[#262626] flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 dark:text-[#A3A3A3] gap-4">
        <div>© {new Date().getFullYear()} {t.brandName}. {t.copyright}</div>
        <div className="flex space-x-6 rtl:space-x-reverse">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#D4AF37] transition-colors">
            {t.legalPrivacy}
          </a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#D4AF37] transition-colors">
            {t.termsOfService}
          </a>
        </div>
      </div>
    </footer>
  );
};
