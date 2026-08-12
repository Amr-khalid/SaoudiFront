'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

export interface ProductImageSwiperProps {
  images: string[];
  alt: string;
  aspectRatioClassName?: string;
  onCardClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
  discountBadge?: React.ReactNode;
  wishlistButton?: React.ReactNode;
  hoverOverlay?: React.ReactNode;
  isDark?: boolean;
  sizes?: string;
  priority?: boolean;
}

export const ProductImageSwiper: React.FC<ProductImageSwiperProps> = ({
  images,
  alt,
  aspectRatioClassName = 'aspect-[3/4] sm:aspect-[4/5]',
  onCardClick,
  className = '',
  badge,
  discountBadge,
  wishlistButton,
  hoverOverlay,
  isDark = true,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch tracking refs for robust swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const isHorizontalGesture = useRef<boolean>(false);
  const justSwipedTimer = useRef<NodeJS.Timeout | null>(null);
  const justSwiped = useRef<boolean>(false);

  // Clean image list (filter empty strings)
  const validImages = Array.from(new Set(images.filter((img) => typeof img === 'string' && img.trim() !== '')));
  const finalImages = validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80'];
  const hasMultipleImages = finalImages.length > 1;
  const currentImgSrc = finalImages[currentIndex % finalImages.length];

  const handleNext = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!hasMultipleImages) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % finalImages.length);
    setTimeout(() => setIsTransitioning(false), 250);
  }, [hasMultipleImages, finalImages.length]);

  const handlePrev = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!hasMultipleImages) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + finalImages.length) % finalImages.length);
    setTimeout(() => setIsTransitioning(false), 250);
  }, [hasMultipleImages, finalImages.length]);

  const handleDotClick = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    e.stopPropagation();
    if (idx === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsTransitioning(false), 250);
  };

  // Touch Handlers for Mobile Swiping
  const onTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
    isHorizontalGesture.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Check if horizontal intent is clearly detected
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      isSwiping.current = true;
      isHorizontalGesture.current = true;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current === null || touchStartY.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Trigger swipe if horizontal displacement exceeds threshold (> 25px) and was primarily horizontal
    if ((isSwiping.current || Math.abs(deltaX) >= 25) && Math.abs(deltaX) > Math.abs(deltaY)) {
      justSwiped.current = true;
      if (justSwipedTimer.current) clearTimeout(justSwipedTimer.current);
      justSwipedTimer.current = setTimeout(() => {
        justSwiped.current = false;
      }, 400);

      if (deltaX < -25) {
        // Swiped Left -> Next Image
        handleNext(e);
      } else if (deltaX > 25) {
        // Swiped Right -> Prev Image
        handlePrev(e);
      }
    }
  };

  // Safe Card Click: only navigates if user was not swiping
  const handleContainerClick = (e: React.MouseEvent) => {
    if (justSwiped.current || isSwiping.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    onCardClick?.();
  };

  return (
    <div
      onClick={handleContainerClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full overflow-hidden cursor-pointer select-none ${aspectRatioClassName} ${
        isDark ? 'bg-[#181818]' : 'bg-slate-50'
      } ${className}`}
      style={{ touchAction: hasMultipleImages ? 'pan-y' : 'auto' }}
    >
      {/* Product Image with smooth crossfade */}
      <Image
        src={currentImgSrc}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className={`object-cover object-center transition-all duration-500 ease-out group-hover:scale-108 ${
          isTransitioning ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      />

      {/* Badges Overlay (Top-Start) */}
      <div className="absolute top-1.5 left-1.5 rtl:left-auto rtl:right-1.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {badge}
        {discountBadge}
      </div>

      {/* Wishlist Button (Top-End) */}
      {wishlistButton && (
        <div className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 z-10">
          {wishlistButton}
        </div>
      )}

      {/* Multi-Image Indicator Badge on Mobile & Desktop */}
      {hasMultipleImages && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-1.5 py-0.5 rounded-full bg-black/70 border border-white/10 text-white/90 font-mono text-[9px] font-medium backdrop-blur-md shadow-xs">
            {currentIndex + 1} / {finalImages.length}
          </span>
        </div>
      )}

      {/* Desktop Navigation Arrows (Visible on Hover) */}
      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-[#D4AF37] border border-white/10 items-center justify-center transition-all cursor-pointer z-20 opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow-md hover:scale-110 active:scale-95"
            title="الصورة السابقة (Previous)"
            aria-label="Previous image"
          >
            <span className="material-symbols-outlined text-xs sm:text-sm font-bold">chevron_left</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-[#D4AF37] border border-white/10 items-center justify-center transition-all cursor-pointer z-20 opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow-md hover:scale-110 active:scale-95"
            title="الصورة التالية (Next)"
            aria-label="Next image"
          >
            <span className="material-symbols-outlined text-xs sm:text-sm font-bold">chevron_right</span>
          </button>

          {/* Luxury Interactive Navigation Dots */}
          <div
            className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-1.5 z-20 px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-xs">
              {finalImages.map((_, dotIdx) => {
                const isActive = currentIndex === dotIdx;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => handleDotClick(e, dotIdx)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] w-3.5 h-1.5 shadow-[0_0_8px_rgba(212,175,55,0.7)]'
                        : 'bg-white/40 hover:bg-white/90 w-1.5 h-1.5'
                    }`}
                    aria-label={`Go to image ${dotIdx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Desktop Actions Hover Overlay */}
      {hoverOverlay}
    </div>
  );
};
