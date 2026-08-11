'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '../context/AppContext';

export interface HeroSlide {
  title?: string;
  subtitle?: string;
  image?: { url?: string } | string;
  link?: string;
  badge?: string;
}

interface HeroProps {
  slides?: HeroSlide[];
}

export const Hero: React.FC<HeroProps> = ({ slides }) => {
  const { t, lang } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultSlides: HeroSlide[] = [
    {
      title: lang === 'ar' ? 'كرونوغراف الأوبسيديان الملكي' : 'THE OBSIDIAN CHRONOGRAPH',
      subtitle: lang === 'ar' ? 'ساعة أوتوماتيكية بعيار SW500 بطلاء الذهب الوردي وزجاج سافير مقوس' : 'Automatic Caliber SW500 in 42mm Rose Gold PVD & Domed Sapphire',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdfkqeHwK78EKhDX94IkeB6MMm3j5BALCT7tvYLF2I_BFzrKqY4hKwvEO55sXKgj0qbDENcQgFkOj-s0mVnT9cyIi_u5fCfH_90iz567aesfkp0G15bgn3n8q-p-tymErQNek0G029aXX8rHit69fkWdcGW1xPfGO_JUcJnxpXoLfzqHdOxmdEY3oVuoO0ENtOzYUFKjCc9HFIU52_2YJ5jg-ai7W2zWv_K3SQGjrzcLHa0A-PX1M",
      link: "/product/obsidian-chronograph",
      badge: lang === 'ar' ? 'إصدار محدود • ساعات نادرة' : 'LIMITED ATELIER EDITION • HAUTE HOROLOGY',
    },
    {
      title: lang === 'ar' ? 'بدلات الصوف الفاخر Super 150s' : 'SUPER 150s BESPOKE TAILORING',
      subtitle: lang === 'ar' ? 'قصات ملكية من صوف بييلا الإيطالي بتفاصيل مخيطة يدوياً' : 'Precision cut from Biella wool with hand-stitched pick detailing',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwf9ON1PecxF3MW9QmEtdNmSxDlhjc9DBw-dAxiQDEnMzhj9vI8AujBmzluXwSCkeZPS5aqB0jLPWLfMQkvnp8KviQXhBL7L_IhCYdL8pyq2XeR2FzaSHCWAPTuUAEgsiPTyrjJnQLnvCHHeEicoHaOpWPk-OgV0jYvGpnTrz1Duj5Vm_R4GNtz9RHZk5zAfmk82pn06rvMPAG5YZOYIBebe1MmIwVjCYHWHUiv-uJ8gd2SX6VUGI",
      link: "/product/bespoke-charcoal-suit",
      badge: lang === 'ar' ? 'خياطة فاخرة • صوف إيطالي' : 'BESPOKE TAILORING • ITALIAN BIELLA WOOL',
    },
    {
      title: lang === 'ar' ? 'معاطف الصوف والكشمير الإيطالي' : 'ITALIAN WOOL & CASHMERE OVERCOATS',
      subtitle: lang === 'ar' ? 'معاطف الجوخ الفاخرة بقصات حادة مفعمة بالأناقة والوقار' : 'Structured shoulders with notch lapels draped over a tailored silhouette',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBN95w58zxTxcr5DpTVD5hknLn1Xl3F38if7eQovvf-HuwQDzlsC0Vmp2rE2oW9EKA6xXRH7CB6_9DVraVUYS7MFGaWl65ADGuQbnDzQjVNkLfIWOB_r5_aORCa9u4LAw_jD1UfmDPos4As1FFZjyK57Zqf6poHNCQVPSUq3YdU9aap92q0XyVHhsX3_60s7-24SNExevxZGsax2Q-pSFsA4vKSfjhNNygm1x8w395KT5Fr-9hsU-o",
      link: "/product/charcoal-tailored-overcoat",
      badge: lang === 'ar' ? 'تشكيلة الشتاء الملكية' : 'WINTER ATELIER COLLECTION • CASHMERE BLEND',
    }
  ];

  const activeSlides = (Array.isArray(slides) && slides.length > 0) ? slides : defaultSlides;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [activeSlides.length, handleNext, currentIndex]);

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const getImageSrc = (img: any): string => {
    if (!img) return defaultSlides[0].image as string;
    if (typeof img === 'string') return img;
    return img.url || (defaultSlides[0].image as string);
  };

  return (
    <section className="relative w-full h-[80vh] sm:h-[85vh] lg:h-screen min-h-[520px] max-h-[950px] bg-[#09090b] text-white overflow-hidden select-none flex items-end pb-8 sm:pb-12 lg:pb-16">
      {/* 1. Clear & Bright Background Image */}
      {activeSlides.map((item, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={idx}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={getImageSrc(item.image)}
              alt={item.title || 'Hero Slide'}
              fill
              unoptimized
              priority={idx === 0}
              className={`object-cover object-center transition-transform duration-[8000ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* 💡 Light Gradient: Bottom-only subtle vignette for text readability without darkening the image */}
            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
          </div>
        );
      })}

      {/* 2. Sleek Top Progress Line */}
      {activeSlides.length > 1 && (
        <div className="absolute top-0 inset-x-0 h-[3px] bg-white/10 z-30">
          <div
            key={currentIndex}
            className="h-full bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"
            style={{
              animation: 'heroProgress 6000ms linear forwards',
            }}
          />
        </div>
      )}

      {/* 3. Floating Content Card (High Contrast & Clear Images Behind) */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto sm:mx-0 text-center sm:rtl:text-right sm:ltr:text-left space-y-3 sm:space-y-5 p-4 sm:p-0">
          
          {/* Badge */}
          {currentSlide?.badge && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D4AF37]/60 bg-black/50 backdrop-blur-md shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="font-label-caps text-[10px] sm:text-xs text-[#D4AF37] tracking-[0.2em] uppercase font-bold">
                {currentSlide.badge}
              </span>
            </div>
          )}

          {/* Title */}
          {currentSlide?.title && (
            <h1 className="font-garamond text-3xl sm:text-5xl md:text-6xl tracking-wide text-white font-normal leading-[1.12] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              {currentSlide.title}
            </h1>
          )}

          {/* Subtitle */}
          {currentSlide?.subtitle && (
            <p className="line-clamp-2 sm:line-clamp-none font-body-lg text-xs sm:text-base md:text-lg text-neutral-200 font-light leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {currentSlide.subtitle}
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
            <Link
              href={currentSlide?.link || '/shop'}
              className="w-full sm:w-auto px-7 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-button text-[11px] sm:text-xs tracking-[0.18em] uppercase font-bold transition-all duration-300 shadow-lg shadow-black/40 rounded-md inline-flex items-center justify-center gap-2"
            >
              <span>{t?.discoverWatch || (lang === 'ar' ? 'استكشف التشكيلة' : 'Explore Collection')}</span>
              <span className="material-symbols-outlined text-sm transition-transform duration-300 rtl:rotate-180">
                arrow_forward
              </span>
            </Link>

            <Link
              href="/bespoke"
              className="w-full sm:w-auto px-7 py-3 border border-white/40 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] font-button text-[11px] sm:text-xs tracking-[0.18em] uppercase font-bold transition-all duration-300 backdrop-blur-md bg-black/30 rounded-md inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">straighten</span>
              <span>{t?.exploreBespoke || (lang === 'ar' ? 'حجز تفصيل خاص' : 'Private Bespoke')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Desktop Navigation Controls */}
      {activeSlides.length > 1 && (
        <div className="hidden md:flex absolute bottom-8 rtl:left-12 rtl:right-auto ltr:right-12 ltr:left-auto z-20 items-center gap-3">
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="w-10 h-10 rounded-full border border-white/30 bg-black/30 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg rtl:rotate-180">chevron_left</span>
          </button>

          {/* Minimal Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-xs font-mono">
            <span className="text-[#D4AF37] font-bold">0{currentIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">0{activeSlides.length}</span>
          </div>

          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="w-10 h-10 rounded-full border border-white/30 bg-black/30 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg rtl:rotate-180">chevron_right</span>
          </button>
        </div>
      )}

      {/* Mobile Slide Dots */}
      {activeSlides.length > 1 && (
        <div className="md:hidden absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes heroProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};