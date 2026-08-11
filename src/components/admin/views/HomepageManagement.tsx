'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Product } from '../../../types';

export const HomepageManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'hero' | 'offers' | 'collections' | 'heritage' | 'flash' | 'sections' | 'visibility'
  >('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Homepage CMS State
  const [homepage, setHomepage] = useState<any>({
    heroSlider: [],
    offers: [],
    bentoCollections: [],
    flashSale: { title: '', products: [], startDate: '', endDate: '' },
    featuredProducts: [],
    bestSellers: [],
    newArrivals: [],
    sectionVisibility: {
      heroSlider: true,
      offers: true,
      bentoGrid: true,
      featuredProducts: true,
      flashSale: true,
      bestSellers: true,
      newArrivals: true,
      heritage: true,
      newsletter: true,
    },
    sectionOrder: [
      'heroSlider',
      'offers',
      'bentoGrid',
      'featuredProducts',
      'flashSale',
      'bestSellers',
      'heritage',
      'newArrivals',
      'newsletter',
    ],
  });

  // Products list for selection
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const data = await api.getHomepage();
      if (data) {
        setHomepage((prev: any) => ({
          ...prev,
          ...data,
          heroSlider: data.heroSlider || [],
          offers: data.offers || [],
          bentoCollections: data.bentoCollections || [],
          heritage: data.heritage || prev.heritage,
          flashSale: data.flashSale || { title: '', products: [], startDate: '', endDate: '' },
          featuredProducts: (data.featuredProducts || []).map((p: any) => p._id || p.id || p),
          bestSellers: (data.bestSellers || []).map((p: any) => p._id || p.id || p),
          newArrivals: (data.newArrivals || []).map((p: any) => p._id || p.id || p),
          sectionVisibility: data.sectionVisibility || prev.sectionVisibility,
          sectionOrder:
            data.sectionOrder && data.sectionOrder.length > 0
              ? data.sectionOrder
              : prev.sectionOrder,
        }));
      }
      const prodsRes = await api.getProducts({ limit: 100 });
      if (prodsRes && prodsRes.products) {
        setAllProducts(prodsRes.products);
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Handlers for Hero Slider
  const handleAddHeroSlide = () => {
    setHomepage((prev: any) => ({
      ...prev,
      heroSlider: [
        ...(prev.heroSlider || []),
        {
          title: '',
          subtitle: '',
          image: {
            url: '',
          },
          link: '',
          sortOrder: (prev.heroSlider?.length || 0) + 1,
        },
      ],
    }));
  };

  const handleRemoveHeroSlide = (index: number) => {
    setHomepage((prev: any) => ({
      ...prev,
      heroSlider: (prev.heroSlider || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleHeroSlideChange = (index: number, field: string, value: any) => {
    setHomepage((prev: any) => {
      const updated = [...(prev.heroSlider || [])];
      if (field === 'imageUrl') {
        const currentImg = updated[index]?.image;
        updated[index] = {
          ...updated[index],
          image: typeof currentImg === 'object' && currentImg !== null
            ? { ...currentImg, url: value }
            : { url: value },
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, heroSlider: updated };
    });
  };

  const handleSaveHeroSlider = async () => {
    setSaving(true);
    try {
      await api.updateHeroSlider(homepage.heroSlider);
      showToast('تم حفظ السلايدر الرئيسي بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ السلايدر', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Offers Section
  const handleAddOffer = () => {
    setHomepage((prev: any) => ({
      ...prev,
      offers: [
        ...(prev.offers || []),
        {
          title: '',
          subtitle: '',
          description: '',
          image: {
            url: '',
          },
          discountPercentage: '',
          badgeText: '',
          link: '',
          isActive: true,
          sortOrder: (prev.offers?.length || 0) + 1,
        },
      ],
    }));
  };

  const handleRemoveOffer = (index: number) => {
    setHomepage((prev: any) => ({
      ...prev,
      offers: (prev.offers || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleOfferChange = (index: number, field: string, value: any) => {
    setHomepage((prev: any) => {
      const updated = [...(prev.offers || [])];
      if (field === 'imageUrl') {
        const currentImg = updated[index]?.image;
        updated[index] = {
          ...updated[index],
          image: typeof currentImg === 'object' && currentImg !== null
            ? { ...currentImg, url: value }
            : { url: value },
        };
      } else if (field === 'discountPercentage') {
        updated[index] = { ...updated[index], discountPercentage: value === '' ? '' : Number(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, offers: updated };
    });
  };

  const handleSaveOffers = async () => {
    setSaving(true);
    try {
      await api.updateOffers(homepage.offers);
      showToast('تم حفظ قسم العروض والخصومات بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ العروض', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Helper
  const handleImageFileUpload = async (
    file: File,
    key: string,
    updateStateFn: (url: string) => void
  ) => {
    setUploadingIndex(key);
    try {
      const uploaded = await api.uploadHomepageImage(file);
      if (uploaded?.url) {
        updateStateFn(uploaded.url);
        showToast('تم رفع الصورة بنجاح!');
      }
    } catch (err: any) {
      showToast(err.message || 'فشل رفع الصورة', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Handlers for Bento Collections
  const handleAddBentoCollection = () => {
    setHomepage((prev: any) => ({
      ...prev,
      bentoCollections: [
        ...(prev.bentoCollections || []),
        {
          title: '',
          subtitle: '',
          description: '',
          image: {
            url: '',
          },
          link: '',
          colSpan: 6,
          height: '460px',
          sortOrder: (prev.bentoCollections?.length || 0) + 1,
        },
      ],
    }));
  };

  const handleRemoveBentoCollection = (index: number) => {
    setHomepage((prev: any) => ({
      ...prev,
      bentoCollections: (prev.bentoCollections || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleBentoCollectionChange = (index: number, field: string, value: any) => {
    setHomepage((prev: any) => {
      const updated = [...(prev.bentoCollections || [])];
      if (field === 'imageUrl') {
        const currentImg = updated[index]?.image;
        updated[index] = {
          ...updated[index],
          image: typeof currentImg === 'object' && currentImg !== null
            ? { ...currentImg, url: value }
            : { url: value },
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, bentoCollections: updated };
    });
  };

  const handleSaveBentoCollections = async () => {
    setSaving(true);
    try {
      await api.updateBentoCollections(homepage.bentoCollections);
      showToast('تم حفظ شبكة المجموعات بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ شبكة المجموعات', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Atelier Heritage
  const handleHeritageChange = (field: string, value: any) => {
    setHomepage((prev: any) => ({
      ...prev,
      heritage: {
        ...prev.heritage,
        [field]: value,
      },
    }));
  };

  const handleSaveHeritage = async () => {
    setSaving(true);
    try {
      await api.updateHeritage(homepage.heritage);
      showToast('تم حفظ تفاصيل قسم إرث الأتليه بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ قسم الإرث', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Flash Sale
  const toggleFlashSaleProduct = (productId: string) => {
    setHomepage((prev: any) => {
      const currentProds = prev.flashSale?.products || [];
      const exists = currentProds.includes(productId);
      const newProds = exists
        ? currentProds.filter((id: string) => id !== productId)
        : [...currentProds, productId];
      return {
        ...prev,
        flashSale: {
          ...prev.flashSale,
          products: newProds,
        },
      };
    });
  };

  const handleSaveFlashSale = async () => {
    setSaving(true);
    try {
      await api.updateFlashSale(homepage.flashSale);
      showToast('تم حفظ عروض الفلاش سيل بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الفلاش سيل', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Sections Products
  const toggleSectionProduct = (
    section: 'featuredProducts' | 'bestSellers' | 'newArrivals',
    productId: string
  ) => {
    setHomepage((prev: any) => {
      const currentList = prev[section] || [];
      const exists = currentList.includes(productId);
      const updatedList = exists
        ? currentList.filter((id: string) => id !== productId)
        : [...currentList, productId];
      return {
        ...prev,
        [section]: updatedList,
      };
    });
  };

  const handleSaveSectionProducts = async (
    section: 'featuredProducts' | 'bestSellers' | 'newArrivals'
  ) => {
    setSaving(true);
    try {
      await api.updateHomepageSection(section, homepage[section]);
      showToast(`تم حفظ منتجات القسم بنجاح!`);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Visibility & Order
  const handleToggleVisibility = (sectionKey: string) => {
    setHomepage((prev: any) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [sectionKey]: !prev.sectionVisibility?.[sectionKey],
      },
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    setHomepage((prev: any) => {
      const order = [...(prev.sectionOrder || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;

      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;

      return {
        ...prev,
        sectionOrder: order,
      };
    });
  };

  const handleSaveVisibilityAndOrder = async () => {
    setSaving(true);
    try {
      await api.updateSectionVisibility(homepage.sectionVisibility);
      await api.updateSectionOrder(homepage.sectionOrder);
      showToast('تم حفظ إعدادات الرؤية والترتيب بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 bg-white dark:bg-[#151515] rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#9A7B1C] dark:text-[#D4AF37]">
            progress_activity
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            جاري تحميل إعدادات الصفحة الرئيسية...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-neutral-800 dark:text-neutral-200 transition-colors">
      {/* Toast Notification Alert */}
      {message && (
        <div
          className={`fixed top-5 left-5 z-50 px-6 py-3.5 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40'
              : 'bg-red-950 text-red-200 border border-red-500/40'
          }`}
        >
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs transition-colors">
        <div>
          <span className="text-[11px] font-label-caps text-[#9A7B1C] dark:text-[#D4AF37] tracking-widest uppercase font-semibold block mb-1">
            HOMEPAGE CMS MANAGEMENT
          </span>
          <h1 className="font-garamond text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
            التحكم الكامل في الصفحة الرئيسية والعروض
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            تعديل السلايدر، العروض والخصومات، الفلاش سيل، وأقسام المنتجات وترتيب ظهورها على المتجر.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHomepageData}
          className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] text-neutral-700 dark:text-neutral-300 hover:text-[#9A7B1C] rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>إعادة تحديث</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">view_carousel</span>
          <span>سلايدر الهيرو (Hero Slider)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'offers'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">local_offer</span>
          <span>عروض وخصومات المتجر (Offers)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'collections'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span>شبكة المجموعات (Curated Collections)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heritage')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'heritage'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          <span>إرث الأتليه (Atelier Heritage)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flash')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'flash'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
          <span>العروض الخاطفة (Flash Sale)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sections'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">grid_view</span>
          <span>أقسام المنتجات (Sections)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visibility')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'visibility'
              ? 'bg-neutral-950 dark:bg-neutral-800 text-[#D4AF37] shadow-sm'
              : 'bg-white dark:bg-[#151515] text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">visibility</span>
          <span>الترتيب والظهور (Order & Visibility)</span>
        </button>
      </div>

      {/* TAB 1: HERO SLIDER */}
      {activeTab === 'hero' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
              إدارة شرائح السلايدر الرئيسي
            </h2>
            <button
              type="button"
              onClick={handleAddHeroSlide}
              className="px-4 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>إضافة شريحة جديدة</span>
            </button>
          </div>

          <div className="space-y-6">
            {homepage.heroSlider?.map((slide: any, idx: number) => (
              <div
                key={idx}
                className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                    شريحة #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHeroSlide(idx)}
                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>حذف الشريحة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      العنوان الرئيسي
                    </label>
                    <input
                      type="text"
                      value={slide.title || ''}
                      onChange={(e) => handleHeroSlideChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="أدخل عنوان الشريحة..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      العنوان الفرعي
                    </label>
                    <input
                      type="text"
                      value={slide.subtitle || ''}
                      onChange={(e) => handleHeroSlideChange(idx, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="أدخل الوصف الفرعي للشريحة..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      صورة الخلفية (رابط أو رفع من الجهاز)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={slide.image?.url || (typeof slide.image === 'string' ? slide.image : '') || ''}
                        onChange={(e) => handleHeroSlideChange(idx, 'imageUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                        placeholder="رابط الصورة https://..."
                      />
                      <label className="px-3.5 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#D4AF37] hover:text-neutral-950 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>{uploadingIndex === `hero-${idx}` ? 'جاري...' : 'رفع'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileUpload(file, `hero-${idx}`, (url) =>
                                handleHeroSlideChange(idx, 'imageUrl', url)
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      رابط الزر (Button Link)
                    </label>
                    <input
                      type="text"
                      value={slide.link || ''}
                      onChange={(e) => handleHeroSlideChange(idx, 'link', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="رابط التوجيه (مثال: /shop)..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveHeroSlider}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ تعديلات السلايدر'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: OFFERS SECTION */}
      {activeTab === 'offers' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                إدارة قسم العروض والخصومات الرئيسية
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                هذا الجزء يظهر أعلى الصفحة الرئيسية لعرض أقوى الخصومات والتخفيضات.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddOffer}
              className="px-4 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>إضافة عرض جديد</span>
            </button>
          </div>

          <div className="space-y-6">
            {homepage.offers?.map((offer: any, idx: number) => (
              <div
                key={idx}
                className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                    عرض #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOffer(idx)}
                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>حذف العرض</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      عنوان العرض
                    </label>
                    <input
                      type="text"
                      value={offer.title || ''}
                      onChange={(e) => handleOfferChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="أدخل عنوان العرض..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      العنوان الفرعي
                    </label>
                    <input
                      type="text"
                      value={offer.subtitle || ''}
                      onChange={(e) => handleOfferChange(idx, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="أدخل العنوان الفرعي..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      نسبة الخصم %
                    </label>
                    <input
                      type="number"
                      value={offer.discountPercentage !== undefined && offer.discountPercentage !== null && offer.discountPercentage !== 0 ? offer.discountPercentage : ''}
                      onChange={(e) =>
                        handleOfferChange(idx, 'discountPercentage', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="نسبة الخصم (مثال: 20)..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      تفاصيل العرض (الوصف)
                    </label>
                    <input
                      type="text"
                      value={offer.description || ''}
                      onChange={(e) => handleOfferChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="تفاصيل ووصف العرض..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      نص الشارة (Badge Text)
                    </label>
                    <input
                      type="text"
                      value={offer.badgeText || ''}
                      onChange={(e) => handleOfferChange(idx, 'badgeText', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="نص الشارة (مثال: خصم 20%)..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      صورة العرض (رابط أو رفع من الجهاز)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={offer.image?.url || (typeof offer.image === 'string' ? offer.image : '') || ''}
                        onChange={(e) => handleOfferChange(idx, 'imageUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                        placeholder="رابط الصورة https://..."
                      />
                      <label className="px-3.5 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#D4AF37] hover:text-neutral-950 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>{uploadingIndex === `offer-${idx}` ? 'جاري...' : 'رفع'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileUpload(file, `offer-${idx}`, (url) =>
                                handleOfferChange(idx, 'imageUrl', url)
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      رابط الزر (Link)
                    </label>
                    <input
                      type="text"
                      value={offer.link || ''}
                      onChange={(e) => handleOfferChange(idx, 'link', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="رابط التوجيه (مثال: /shop)..."
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id={`offer-active-${idx}`}
                      checked={offer.isActive !== false}
                      onChange={(e) => handleOfferChange(idx, 'isActive', e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <label
                      htmlFor={`offer-active-${idx}`}
                      className="text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    >
                      تفعيل هذا العرض في المتجر
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveOffers}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ العروض والخصومات'}
            </button>
          </div>
        </div>
      )}

      {/* TAB: COLLECTIONS (BENTO GRID) */}
      {activeTab === 'collections' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                إدارة شبكة المجموعات المصممة (Curated Collections)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                رفع الصور، العناوين، الأوصاف، والروابط الخاصة بالمجموعات وتحديد حجم كل مجموعة.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBentoCollection}
              className="px-4 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>إضافة مجموعة جديدة</span>
            </button>
          </div>

          <div className="space-y-6">
            {homepage.bentoCollections?.map((col: any, idx: number) => (
              <div
                key={idx}
                className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                    مجموعة #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBentoCollection(idx)}
                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>حذف المجموعة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      العنوان الرئيسي
                    </label>
                    <input
                      type="text"
                      value={col.title || ''}
                      onChange={(e) => handleBentoCollectionChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="اسم المجموعة..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      العنوان الفرعي
                    </label>
                    <input
                      type="text"
                      value={col.subtitle || ''}
                      onChange={(e) => handleBentoCollectionChange(idx, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="العنوان الفرعي..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      عرض الكارد (Column Span)
                    </label>
                    <select
                      value={col.colSpan || 6}
                      onChange={(e) =>
                        handleBentoCollectionChange(idx, 'colSpan', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                    >
                      <option value={12}>كامل العرض (12 عمود - Full Width)</option>
                      <option value={7}>كبير (7 أعمدة)</option>
                      <option value={6}>متوسط (6 أعمدة - Half)</option>
                      <option value={4}>صغير (4 أعمدة - 1/3)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      وصف المجموعة
                    </label>
                    <input
                      type="text"
                      value={col.description || ''}
                      onChange={(e) =>
                        handleBentoCollectionChange(idx, 'description', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="وصف المجموعة..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      رابط التنقل (Link)
                    </label>
                    <input
                      type="text"
                      value={col.link || ''}
                      onChange={(e) => handleBentoCollectionChange(idx, 'link', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                      placeholder="رابط التوجيه (مثال: /shop)..."
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      صورة المجموعة (رابط أو رفع من الجهاز)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={col.image?.url || (typeof col.image === 'string' ? col.image : '') || ''}
                        onChange={(e) => handleBentoCollectionChange(idx, 'imageUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                        placeholder="رابط الصورة https://..."
                      />
                      <label className="px-4 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#D4AF37] hover:text-neutral-950 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>
                          {uploadingIndex === `bento-${idx}` ? 'جاري الرفع...' : 'رفع صورة'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileUpload(file, `bento-${idx}`, (url) =>
                                handleBentoCollectionChange(idx, 'imageUrl', url)
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveBentoCollections}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ مجموعات Bento'}
            </button>
          </div>
        </div>
      )}

      {/* TAB: ATELIER HERITAGE */}
      {activeTab === 'heritage' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                إدارة قسم إرث الأتليه (ATELIER HERITAGE)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                تعديل نصوص، صور، وإحصائيات قصة الإرث والحرفية اليدوية في الصفحة الرئيسية.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveHeritage}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ تعديلات الإرث'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                العنوان الفرعي (Subtitle)
              </label>
              <input
                type="text"
                value={homepage.heritage?.subtitle || ''}
                onChange={(e) => handleHeritageChange('subtitle', e.target.value)}
                placeholder="العنوان الفرعي (مثال: إرث الأتليه)..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                العنوان الرئيسي (Main Title)
              </label>
              <input
                type="text"
                value={homepage.heritage?.title || ''}
                onChange={(e) => handleHeritageChange('title', e.target.value)}
                placeholder="العنوان الرئيسي..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                وصف الإرث والقصة (Description)
              </label>
              <textarea
                rows={4}
                value={homepage.heritage?.description || ''}
                onChange={(e) => handleHeritageChange('description', e.target.value)}
                placeholder="اكتب وصف الإرث والحرفية اليدوية..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                صورة الإرث الرئيسية
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homepage.heritage?.image?.url || (typeof homepage.heritage?.image === 'string' ? homepage.heritage?.image : '') || ''}
                  onChange={(e) => handleHeritageChange('image', { url: e.target.value })}
                  placeholder="رابط الصورة https://..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                />
                <label className="px-4 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#D4AF37] hover:text-neutral-950 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  <span>{uploadingIndex === 'heritage' ? 'جاري الرفع...' : 'رفع صورة'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageFileUpload(file, 'heritage', (url) =>
                          handleHeritageChange('image', { url })
                        );
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                رابط الزر (Button Link)
              </label>
              <input
                type="text"
                value={homepage.heritage?.link || ''}
                onChange={(e) => handleHeritageChange('link', e.target.value)}
                placeholder="رابط التوجيه (مثال: /shop)..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLASH SALE */}
      {activeTab === 'flash' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
            إدارة عروض الفلاش سيل (Flash Sale)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                عنوان الفلاش سيل
              </label>
              <input
                type="text"
                value={homepage.flashSale?.title || ''}
                onChange={(e) =>
                  setHomepage((prev: any) => ({
                    ...prev,
                    flashSale: { ...prev.flashSale, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
                placeholder="عنوان الفلاش سيل..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                تاريخ انتهاء الفلاش سيل (العداد التنازلي)
              </label>
              <input
                type="datetime-local"
                value={
                  homepage.flashSale?.endDate
                    ? new Date(homepage.flashSale.endDate).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setHomepage((prev: any) => ({
                    ...prev,
                    flashSale: { ...prev.flashSale, endDate: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:border-[#9A7B1C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              اختر منتجات الفلاش سيل
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/60">
              {allProducts.map((prod) => {
                const prodId = prod._id || prod.id;
                const isSelected = (homepage.flashSale?.products || []).includes(prodId);
                return (
                  <div
                    key={prodId}
                    onClick={() => toggleFlashSaleProduct(prodId)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D4AF37] text-[#9A7B1C] dark:text-[#D4AF37] font-bold'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <span className="line-clamp-1">{prod.name}</span>
                    <span className="font-mono text-[11px] font-bold">${prod.price}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveFlashSale}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الفلاش سيل'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SECTIONS PRODUCTS */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Featured Products */}
          <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white">
                1. المنتجات المميزة (Featured Products)
              </h3>
              <button
                type="button"
                onClick={() => handleSaveSectionProducts('featuredProducts')}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                حفظ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/60">
              {allProducts.map((prod) => {
                const prodId = prod._id || prod.id;
                const isSelected = (homepage.featuredProducts || []).includes(prodId);
                return (
                  <div
                    key={prodId}
                    onClick={() => toggleSectionProduct('featuredProducts', prodId)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D4AF37] text-[#9A7B1C] dark:text-[#D4AF37] font-bold'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="line-clamp-1">{prod.name}</span>
                    <span className="font-mono font-bold">${prod.price}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Sellers */}
          <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white">
                2. الأكثر مبيعاً (Best Sellers)
              </h3>
              <button
                type="button"
                onClick={() => handleSaveSectionProducts('bestSellers')}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                حفظ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/60">
              {allProducts.map((prod) => {
                const prodId = prod._id || prod.id;
                const isSelected = (homepage.bestSellers || []).includes(prodId);
                return (
                  <div
                    key={prodId}
                    onClick={() => toggleSectionProduct('bestSellers', prodId)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D4AF37] text-[#9A7B1C] dark:text-[#D4AF37] font-bold'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="line-clamp-1">{prod.name}</span>
                    <span className="font-mono font-bold">${prod.price}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Arrivals */}
          <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white">
                3. وصل حديثاً (New Arrivals)
              </h3>
              <button
                type="button"
                onClick={() => handleSaveSectionProducts('newArrivals')}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                حفظ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/60">
              {allProducts.map((prod) => {
                const prodId = prod._id || prod.id;
                const isSelected = (homepage.newArrivals || []).includes(prodId);
                return (
                  <div
                    key={prodId}
                    onClick={() => toggleSectionProduct('newArrivals', prodId)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-[#D4AF37] text-[#9A7B1C] dark:text-[#D4AF37] font-bold'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="line-clamp-1">{prod.name}</span>
                    <span className="font-mono font-bold">${prod.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VISIBILITY & ORDER */}
      {activeTab === 'visibility' && (
        <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs transition-colors">
          <div>
            <h2 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
              إظهار/إخفاء وترتيب أقسام الصفحة الرئيسية
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
              تحكم في أي الأقسام التي تظهر لعملاء الموقع وبأي ترتيب.
            </p>
          </div>

          <div className="space-y-3">
            {homepage.sectionOrder?.map((sectionKey: string, idx: number) => {
              const labels: Record<string, string> = {
                heroSlider: 'السلايدر الرئيسي (Hero Slider)',
                offers: 'قسم العروض والخصومات (Offers Section)',
                bentoGrid: 'شبكة المجموعات المصممة (Bento Grid)',
                featuredProducts: 'المنتجات المميزة (Featured Products)',
                flashSale: 'عروض الفلاش سيل (Flash Sale)',
                bestSellers: 'الأكثر مبيعاً (Best Sellers)',
                heritage: 'إضاءة على التراث (Heritage Spotlight)',
                newArrivals: 'وصل حديثاً (New Arrivals)',
                newsletter: 'النشرة البريدية (Newsletter)',
              };

              const isVisible = homepage.sectionVisibility?.[sectionKey] !== false;

              return (
                <div
                  key={sectionKey}
                  className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                      {labels[sectionKey] || sectionKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(sectionKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        isVisible
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {isVisible ? 'ظاهر' : 'مخفي'}
                    </button>

                    {/* Up / Down arrows */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        title="أعلى"
                      >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === homepage.sectionOrder.length - 1}
                        className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        title="أسفل"
                      >
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveVisibilityAndOrder}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 hover:scale-[1.02]"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الترتيب والظهور'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
