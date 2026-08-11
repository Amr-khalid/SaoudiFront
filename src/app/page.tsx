'use client';

import React, { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { OffersSection } from '../components/OffersSection';
import { BentoGrid } from '../components/BentoGrid';
import { FlashSaleSection } from '../components/FlashSaleSection';
import { ProductsCarousel } from '../components/ProductsCarousel';
import { HeritageSpotlight } from '../components/HeritageSpotlight';
import { Newsletter } from '../components/Newsletter';
import { api, normalizeProduct } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { lang, products: globalProducts } = useApp();
  const [homepageData, setHomepageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHomepage = async () => {
      try {
        const data = await api.getHomepage();
        if (isMounted && data) {
          setHomepageData(data);
        }
      } catch (err) {
        console.warn('Failed to fetch homepage data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHomepage();
    return () => {
      isMounted = false;
    };
  }, []);

  const visibility = homepageData?.sectionVisibility;

  // Helper to strictly check if a section is visible
  const isSectionVisible = (sectionKey: string): boolean => {
    if (!visibility) return true;

    // Check direct key and possible aliases
    const aliases: Record<string, string[]> = {
      heroSlider: ['heroSlider', 'hero'],
      offers: ['offers', 'offersSection'],
      bentoGrid: ['bentoGrid', 'bentoCollections'],
      featuredProducts: ['featuredProducts', 'featured'],
      flashSale: ['flashSale'],
      bestSellers: ['bestSellers'],
      heritage: ['heritage', 'heritageSpotlight'],
      newArrivals: ['newArrivals'],
      newsletter: ['newsletter'],
    };

    const keysToCheck = aliases[sectionKey] || [sectionKey];
    for (const k of keysToCheck) {
      if (k in visibility) {
        const val = visibility[k];
        if (val === false || val === 'false' || val === 0 || val === '0' || val === null) {
          return false;
        }
      }
    }
    return true;
  };

  // Helper to normalize array of products from backend
  const getProductsList = (sectionList: any[]) => {
    if (!sectionList || sectionList.length === 0) return [];
    return sectionList.map((p) => (typeof p === 'object' && p.name ? normalizeProduct(p) : p)).filter(Boolean);
  };

  const featuredList = getProductsList(homepageData?.featuredProducts);
  const bestSellersList = getProductsList(homepageData?.bestSellers);
  const newArrivalsList = getProductsList(homepageData?.newArrivals);
  const flashSaleData = homepageData?.flashSale
    ? {
        ...homepageData.flashSale,
        products: getProductsList(homepageData.flashSale.products),
      }
    : undefined;

  // Fallbacks using global products if backend sections are empty
  const displayFeatured = featuredList.length > 0 ? featuredList : globalProducts.slice(0, 6);
  const displayBestSellers = bestSellersList.length > 0 ? bestSellersList : globalProducts.slice(2, 8);
  const displayNewArrivals = newArrivalsList.length > 0 ? newArrivalsList : globalProducts.slice(0, 6);

  // Section Order map
  const defaultOrder = [
    'heroSlider',
    'offers',
    'bentoGrid',
    'featuredProducts',
    'flashSale',
    'bestSellers',
    'heritage',
    'newArrivals',
    'newsletter',
  ];

  const sectionOrder = homepageData?.sectionOrder && homepageData.sectionOrder.length > 0
    ? homepageData.sectionOrder
    : defaultOrder;

  const renderSection = (sectionKey: string) => {
    if (!isSectionVisible(sectionKey)) {
      return null;
    }

    switch (sectionKey) {
      case 'heroSlider':
        // Show nothing while loading
        if (loading) {
          return (
            <div
              key="heroSlider-skeleton"
              className="relative w-full h-[80vh] sm:h-[85vh] lg:h-screen min-h-[520px] max-h-[950px] bg-[#09090b] animate-pulse"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]" />
              {/* Subtle centered logo placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-30">
                <div className="w-20 h-[1px] bg-[#D4AF37]" />
                <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50" />
                <div className="w-20 h-[1px] bg-[#D4AF37]" />
              </div>
            </div>
          );
        }
        return (
          <div
            key="heroSlider"
            className="animate-fade-in"
            style={{ animationDuration: '0.8s' }}
          >
            <Hero slides={homepageData?.heroSlider} />
          </div>
        );

      case 'offers':
        return <OffersSection key="offers" offers={homepageData?.offers} />;

      case 'bentoGrid':
        return <BentoGrid key="bentoGrid" collections={homepageData?.bentoCollections} />;

      case 'featuredProducts':
        return (
          <ProductsCarousel
            key="featuredProducts"
            title={lang === 'ar' ? 'المنتجات المميزة' : 'Featured Creations'}
            subtitle={lang === 'ar' ? 'اختيارات الاتيليه الخاص' : 'ATELIER SELECTIONS'}
            products={displayFeatured}
          />
        );

      case 'flashSale':
        return <FlashSaleSection key="flashSale" flashSale={flashSaleData} />;

      case 'bestSellers':
        return (
          <ProductsCarousel
            key="bestSellers"
            title={lang === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers & Icons'}
            subtitle={lang === 'ar' ? 'الأكثر طلباً هذا الموسم' : 'MOST COVETED'}
            products={displayBestSellers}
          />
        );

      case 'heritage':
        return <HeritageSpotlight key="heritage" heritage={homepageData?.heritage} />;

      case 'newArrivals':
        return (
          <ProductsCarousel
            key="newArrivals"
            title={lang === 'ar' ? 'وصل حديثاً' : 'New Arrivals'}
            subtitle={lang === 'ar' ? 'أحدث الإبداعات' : 'FRESH FROM ATELIER'}
            products={displayNewArrivals}
          />
        );

      case 'newsletter':
        return (
          <div id="newsletter" key="newsletter">
            <Newsletter />
          </div>
        );

      default:
        return null;
    }
  };

  // Full-Page Luxury Skeleton Loader while fetching homepage & products
  if (loading && (!homepageData || globalProducts.length === 0)) {
    return (
      <div className="space-y-12 md:space-y-24 animate-fade-in pb-16">
        {/* 1. Hero Slider Skeleton */}
        <div className="relative w-full h-[80vh] sm:h-[85vh] lg:h-screen min-h-[540px] max-h-[920px] bg-[#09090b] border-b border-neutral-800/80 luxury-skeleton flex flex-col justify-end p-6 sm:p-12 md:p-20">
          <div className="max-w-3xl space-y-4">
            <div className="w-36 h-6 rounded-full bg-white/10 luxury-skeleton" />
            <div className="w-4/5 max-w-xl h-10 sm:h-14 md:h-16 rounded-2xl bg-white/10 luxury-skeleton" />
            <div className="w-3/5 max-w-md h-10 sm:h-14 md:h-16 rounded-2xl bg-white/10 luxury-skeleton" />
            <div className="w-2/3 max-w-lg h-4 rounded-md bg-white/5 luxury-skeleton pt-1" />
            <div className="flex gap-4 pt-4">
              <div className="w-40 h-12 rounded-xl bg-[#D4AF37]/25 border border-[#D4AF37]/40 luxury-skeleton" />
              <div className="w-36 h-12 rounded-xl bg-white/10 border border-white/10 luxury-skeleton" />
            </div>
          </div>
        </div>

        {/* 2. Offers Banner Skeleton */}
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between luxury-skeleton"
            >
              <div className="space-y-2">
                <div className="w-20 h-5 rounded-full bg-[#D4AF37]/20 luxury-skeleton" />
                <div className="w-3/4 h-6 rounded-lg bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
              </div>
              <div className="w-1/2 h-4 rounded bg-neutral-200 dark:bg-white/5 luxury-skeleton" />
            </div>
          ))}
        </div>

        {/* 3. Bento Grid Skeleton */}
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 md:px-12 space-y-6">
          <div className="space-y-2 text-center max-w-md mx-auto">
            <div className="w-28 h-4 rounded-full bg-[#D4AF37]/20 mx-auto luxury-skeleton" />
            <div className="w-48 h-8 rounded-xl bg-neutral-300 dark:bg-white/10 mx-auto luxury-skeleton" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[460px]">
            <div className="md:col-span-2 md:row-span-2 h-72 md:h-[480px] rounded-3xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col justify-end luxury-skeleton">
              <div className="space-y-3">
                <div className="w-24 h-5 rounded-full bg-[#D4AF37]/20 luxury-skeleton" />
                <div className="w-64 h-8 rounded-xl bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
              </div>
            </div>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-56 md:h-auto rounded-3xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-end luxury-skeleton"
              >
                <div className="space-y-2">
                  <div className="w-20 h-4 rounded-full bg-[#D4AF37]/20 luxury-skeleton" />
                  <div className="w-40 h-6 rounded-lg bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Featured Carousel Skeleton */}
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 md:px-12 space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="w-32 h-4 rounded-full bg-[#D4AF37]/20 luxury-skeleton" />
              <div className="w-56 h-8 rounded-xl bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 luxury-skeleton" />
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 luxury-skeleton" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 overflow-hidden space-y-4 p-4 luxury-skeleton"
              >
                <div className="w-full h-72 rounded-2xl bg-neutral-200 dark:bg-neutral-800/80 luxury-skeleton" />
                <div className="space-y-2 pt-1">
                  <div className="w-20 h-3 rounded bg-[#D4AF37]/20 luxury-skeleton" />
                  <div className="w-44 h-5 rounded bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-24 h-6 rounded bg-[#D4AF37]/20 luxury-skeleton" />
                    <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 luxury-skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Heritage Spotlight Skeleton */}
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="rounded-3xl bg-neutral-100 dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 p-8 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center luxury-skeleton">
            <div className="w-full h-80 md:h-96 rounded-2xl bg-neutral-200 dark:bg-neutral-800 luxury-skeleton" />
            <div className="space-y-5">
              <div className="w-28 h-4 rounded-full bg-[#D4AF37]/20 luxury-skeleton" />
              <div className="w-3/4 h-10 rounded-xl bg-neutral-300 dark:bg-white/10 luxury-skeleton" />
              <div className="space-y-2">
                <div className="w-full h-4 rounded bg-neutral-200 dark:bg-white/5 luxury-skeleton" />
                <div className="w-5/6 h-4 rounded bg-neutral-200 dark:bg-white/5 luxury-skeleton" />
                <div className="w-4/6 h-4 rounded bg-neutral-200 dark:bg-white/5 luxury-skeleton" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="h-20 rounded-xl bg-neutral-200/80 dark:bg-neutral-800/80 luxury-skeleton p-3" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12">
      {sectionOrder.map((sectionKey: string) => renderSection(sectionKey))}
    </div>
  );
}
