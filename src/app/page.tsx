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

  return (
    <div className="space-y-6 md:space-y-12">
      {sectionOrder.map((sectionKey: string) => renderSection(sectionKey))}
    </div>
  );
}
