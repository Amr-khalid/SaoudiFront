'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';

export interface OfferItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: { url?: string } | string;
  discountPercentage?: number;
  badgeText?: string;
  link?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
}

interface OffersSectionProps {
  offers?: OfferItem[];
}

export const OffersSection: React.FC<OffersSectionProps> = ({ offers = [] }) => {
  const { lang } = useApp();

  const activeOffers = offers.filter((o) => o.isActive !== false);

  // Time remaining calculation for offers with endDate
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const offerWithTimer = activeOffers.find((o) => o.endDate);
    if (!offerWithTimer || !offerWithTimer.endDate) return;

    const targetDate = new Date(offerWithTimer.endDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeRemaining(null);
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOffers]);

  if (!activeOffers || activeOffers.length === 0) {
    return null;
  }

  const primaryOffer = activeOffers[0];
  const secondaryOffers = activeOffers.slice(1);

  const getImageSrc = (img: any): string => {
    if (!img) return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80';
    if (typeof img === 'string') return img;
    return img.url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80';
  };

  return (
<section className="mx-auto max-w-[1440px] px-5 py-20 md:px-16">
  {/* Section Header */}
  <div className="mb-14 space-y-4 text-center">
    <h2 className="font-garamond font-headline-lg text-3xl md:text-5xl tracking-wide text-neutral-900 dark:text-[#E5E5E5]">
      {lang === 'ar' ? 'عروض الموسم والتشكيلات الحصرية' : 'Seasonal Offers & Limited Editions'}
    </h2>
    <p className="font-body-md font-light mx-auto max-w-xl text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
      {lang === 'ar'
        ? 'استكشف أرقى العروض على التشكيلات الملكية والقطع النادرة المصممة بعناية فائقة.'
        : 'Explore curations featuring exclusive pricing on bespoke luxury garments and fine horology.'}
    </p>
    {/* Clean Separator */}
    <div className="mx-auto h-[1px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
  </div>

  {/* Offers Layout Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    {/* Main Hero Featured Offer Card */}
    <div
      className={`${
        secondaryOffers.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
      } group relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-[#101010] shadow-2xl transition-all duration-500 hover:border-[#D4AF37] hover:shadow-[0_12px_40px_rgba(212,175,55,0.15)]`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={getImageSrc(primaryOffer.image)}
          alt={primaryOffer.title}
          fill
          unoptimized
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
        />
        {/* Layered Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />
      </div>

      {/* Top Left Badges */}
      <div className="absolute top-6 left-6 rtl:left-auto rtl:right-6 z-10 flex flex-wrap items-center gap-2">
        {primaryOffer.badgeText && (
          <span className="rounded-md border border-[#D4AF37]/60 bg-[#D4AF37] px-3.5 py-1.5 font-button text-xs font-bold uppercase tracking-widest text-neutral-950 shadow-md">
            {primaryOffer.badgeText}
          </span>
        )}
        {primaryOffer.discountPercentage ? (
          <span className="rounded-md bg-rose-700/90 px-3 py-1.5 font-button text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-md">
            {primaryOffer.discountPercentage}% OFF
          </span>
        ) : null}
      </div>

      {/* Countdown Timer */}
      {timeRemaining && (
        <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6 z-10 flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-black/80 px-4 py-2 text-xs font-mono shadow-xl backdrop-blur-md text-white">
          <span className="material-symbols-outlined text-sm text-[#D4AF37]">
            hourglass_top
          </span>
          <div className="flex gap-1 font-bold tracking-wider tabular-nums text-neutral-200">
            <span>{String(timeRemaining.hours).padStart(2, '0')}h</span>
            <span className="text-[#D4AF37]">:</span>
            <span>{String(timeRemaining.minutes).padStart(2, '0')}m</span>
            <span className="text-[#D4AF37]">:</span>
            <span className="text-[#D4AF37]">
              {String(timeRemaining.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      )}

      {/* Primary Offer Content */}
      <div className="relative z-10 p-8 sm:p-12 space-y-4 text-white">
        {primaryOffer.subtitle && (
          <span className="block font-label-caps text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            {primaryOffer.subtitle}
          </span>
        )}
        <h3 className="font-garamond font-headline-lg text-3xl sm:text-4xl text-white leading-tight">
          {primaryOffer.title}
        </h3>
        {primaryOffer.description && (
          <p className="line-clamp-2 font-body-md font-light max-w-lg text-sm text-neutral-300 leading-relaxed">
            {primaryOffer.description}
          </p>
        )}

        <div className="pt-4">
          <Link
            href={primaryOffer.link || '/shop'}
            className="inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-[length:200%_auto] px-8 py-3.5 font-button text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 shadow-xl transition-all duration-300 hover:bg-right hover:shadow-[#D4AF37]/30"
          >
            <span>{lang === 'ar' ? 'تسوق هذا العرض الآن' : 'Shop Atelier Offer'}</span>
            <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>

    {/* Secondary Offers Column */}
    {secondaryOffers.length > 0 && (
      <div className="lg:col-span-5 flex flex-col gap-6">
        {secondaryOffers.slice(0, 2).map((offer, idx) => (
          <Link
            key={offer._id || offer.id || idx}
            href={offer.link || '/shop'}
            className="group relative flex flex-1 min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-7 shadow-lg transition-all duration-500 hover:border-[#D4AF37]/80 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={getImageSrc(offer.image)}
                alt={offer.title}
                fill
                unoptimized
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-75" />
            </div>

            {/* Badge */}
            {offer.badgeText && (
              <span className="absolute top-5 left-5 rtl:left-auto rtl:right-5 z-10 rounded-md border border-[#D4AF37]/40 bg-black/70 px-3 py-1 font-button text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] backdrop-blur-md">
                {offer.badgeText}
              </span>
            )}

            {/* Content */}
            <div className="relative z-10 space-y-2 text-white">
              {offer.subtitle && (
                <span className="block font-label-caps text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  {offer.subtitle}
                </span>
              )}
              <h4 className="font-garamond text-xl font-normal text-white sm:text-2xl transition-colors duration-300 group-hover:text-[#F3E5AB]">
                {offer.title}
              </h4>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 font-button text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  <span>{lang === 'ar' ? 'استكشف العرض' : 'Explore Offer'}</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
</section>  );
};
