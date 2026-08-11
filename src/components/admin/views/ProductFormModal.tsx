'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '../../../types';
import { api } from '../../../lib/api';
import { compressImage } from '../../../lib/imageCompressor';
import { useApp } from '../../../context/AppContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (productData: any) => void;
}

// Quick Gallery Preset Images for instant visual selection
const GALLERY_PRESETS = [
  {
    label: 'ساعة فاخرة',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
  },
  {
    label: 'بشت / عباءة',
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1000&auto=format&fit=crop',
  },
  {
    label: 'بدلة رجالية',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop',
  },
  {
    label: 'محفظة جلد',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop',
  },
  {
    label: 'كنزة كشمير',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop',
  },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const { showAlert, showToast } = useApp();
  // View Mode State: 'single_page' (All-in-One Easy View) vs 'tabs' (Step-by-Step Tabs)
  const [viewMode, setViewMode] = useState<'single_page' | 'tabs'>('single_page');

  // Navigation Tabs for step-by-step view
  const [activeTab, setActiveTab] = useState<
    'general' | 'media' | 'colors' | 'sizes' | 'preview'
  >('general');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  // Image Upload & Compression State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [uploadingColorIndex, setUploadingColorIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: productToEdit?.id || `prod-${Date.now()}`,
    name: productToEdit?.name || '',
    sku: productToEdit?.id
      ? `SW-${productToEdit.id.toUpperCase()}`
      : `SW-${Math.floor(10000 + Math.random() * 90000)}`,
    brand: productToEdit?.brand || 'SAOUDI WEAR ATELIER',
    category: productToEdit?.category || 'Timepieces',
    description: productToEdit?.description || '',
    shortDescription: productToEdit?.shortDescription || '',
    materials: productToEdit?.materials || '',
    specs: productToEdit?.specs || [],
    colors: productToEdit?.colors || [],
    sizes:
      productToEdit?.sizes && productToEdit.sizes.length > 0
        ? productToEdit.sizes
        : ['S', 'M', 'L', 'XL'],
    sizeStock: productToEdit?.sizeStock || [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
    ],
    costPrice: 0,
    sellingPrice: productToEdit?.price || 0,
    discountPrice: 0,
    badge: productToEdit?.badge || '',
    status: 'active',
    featured: productToEdit?.featured ?? false,
    stockQuantity: productToEdit?.stock ?? productToEdit?.stockQuantity ?? 20,
    image: productToEdit?.image || '',
    secondaryImages: productToEdit?.secondaryImages || [],
  });

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then((cats) => {
        if (cats && cats.length > 0) setCategoriesList(cats);
      });
      api.getBrands().then((brands) => {
        if (brands && brands.length > 0) setBrandsList(brands);
      });
      if (productToEdit) {
        const loadedSizes =
          productToEdit.sizes && productToEdit.sizes.length > 0
            ? productToEdit.sizes
            : ['S', 'M', 'L', 'XL'];
        const loadedSizeStock =
          productToEdit.sizeStock && productToEdit.sizeStock.length > 0
            ? productToEdit.sizeStock
            : loadedSizes.map((sz) => ({
                size: sz,
                stock: Math.floor((productToEdit.stock || 20) / loadedSizes.length),
              }));
        const calculatedStock = loadedSizeStock.reduce(
          (acc, curr) => acc + (Number(curr.stock) || 0),
          0
        );

        setFormData({
          id: productToEdit.id,
          name: productToEdit.name,
          sku: `SW-${productToEdit.id.toUpperCase()}`,
          brand: productToEdit.brand || 'SAOUDI WEAR ATELIER',
          category: productToEdit.category,
          description: productToEdit.description || '',
          shortDescription: productToEdit.shortDescription || '',
          materials: productToEdit.materials || '',
          specs: productToEdit.specs || [],
          colors: productToEdit.colors || [],
          sizes: loadedSizes,
          sizeStock: loadedSizeStock,
          costPrice: 0,
          sellingPrice: productToEdit.price,
          discountPrice: 0,
          badge: productToEdit.badge || '',
          status: (productToEdit.status || 'active').toLowerCase(),
          featured: productToEdit.featured ?? false,
          stockQuantity: calculatedStock,
          image: productToEdit.image,
          secondaryImages: productToEdit.secondaryImages || [],
        });
      } else {
        setFormData({
          id: `prod-${Date.now()}`,
          name: '',
          sku: `SW-${Math.floor(10000 + Math.random() * 90000)}`,
          brand: 'SAOUDI WEAR ATELIER',
          category: 'Timepieces',
          description: '',
          shortDescription: '',
          materials: '',
          specs: [],
          colors: [],
          sizes: ['S', 'M', 'L', 'XL'],
          sizeStock: [
            { size: 'S', stock: 5 },
            { size: 'M', stock: 5 },
            { size: 'L', stock: 5 },
            { size: 'XL', stock: 5 },
          ],
          costPrice: 0,
          sellingPrice: 0,
          discountPrice: 0,
          badge: '',
          status: 'active',
          featured: false,
          stockQuantity: 20,
          image: '',
          secondaryImages: [],
        });
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Primary image setting
  const handleSetPrimaryImage = (targetUrl: string) => {
    if (formData.image === targetUrl) return;
    const currentSecondary = (formData.secondaryImages || []).filter(
      (img) => img !== targetUrl
    );
    if (formData.image && formData.image !== targetUrl) {
      currentSecondary.unshift(formData.image);
    }
    setFormData((prev) => ({
      ...prev,
      image: targetUrl,
      secondaryImages: currentSecondary,
    }));
  };

  // Image removal
  const handleRemoveImage = (targetUrl: string) => {
    if (formData.image === targetUrl) {
      const nextCover = (formData.secondaryImages || [])[0] || '';
      const remainingSecondary = (formData.secondaryImages || []).slice(1);
      setFormData((prev) => ({
        ...prev,
        image: nextCover,
        secondaryImages: remainingSecondary,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        secondaryImages: (prev.secondaryImages || []).filter((img) => img !== targetUrl),
      }));
    }
  };

  // Specifications Handlers
  const handleAddSpec = () => {
    setFormData((prev) => ({
      ...prev,
      specs: [...prev.specs, { label: 'الخاصية', value: 'القيمة' }],
    }));
  };

  const handleUpdateSpec = (idx: number, field: 'label' | 'value', val: string) => {
    const updated = [...formData.specs];
    updated[idx][field] = val;
    setFormData((prev) => ({ ...prev, specs: updated }));
  };

  const handleRemoveSpec = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== idx),
    }));
  };

  // Color & Variant Image Helper Handlers
  const handleAddColor = () => {
    setFormData((prev: any) => ({
      ...prev,
      colors: [
        ...(prev.colors || []),
        { name: 'لون جديد', hex: '#D4AF37', image: prev.image || '' },
      ],
    }));
  };

  const handleUpdateColor = (index: number, field: string, value: string) => {
    const updated = [...(formData.colors || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, colors: updated }));
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      colors: (prev.colors || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleUploadColorVariantImage = async (index: number, file: File) => {
    try {
      setUploadingColorIndex(index);
      const compressedFile = await compressImage(file);
      const uploadedUrl = await api.uploadSingleImage(compressedFile);
      handleUpdateColor(index, 'image', uploadedUrl);
    } catch (err) {
      console.error('Failed to upload color variant image to backend:', err);
      showAlert({
        title: 'فشل الرفع',
        message: 'فشل رفع صورة اللون للسيرفر. يرجى التأكد من اتصال الإنترنت وصيغة الصورة.',
        type: 'danger',
      });
    } finally {
      setUploadingColorIndex(null);
    }
  };

  const handleToggleSize = (sizeVal: string) => {
    const currentSizes = formData.sizes || [];
    const currentSizeStock = formData.sizeStock || [];
    let nextSizes: string[];
    let nextSizeStock: any[];

    if (currentSizes.includes(sizeVal)) {
      nextSizes = currentSizes.filter((s: string) => s !== sizeVal);
      nextSizeStock = currentSizeStock.filter((s: any) => s.size !== sizeVal);
    } else {
      nextSizes = [...currentSizes, sizeVal];
      nextSizeStock = [...currentSizeStock, { size: sizeVal, stock: 5 }];
    }

    const calculatedStock = nextSizeStock.reduce(
      (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
      0
    );
    setFormData((prev: any) => ({
      ...prev,
      sizes: nextSizes,
      sizeStock: nextSizeStock,
      stockQuantity: calculatedStock,
    }));
  };

  const handleApplyPresetSizes = (sizeArray: string[]) => {
    const nextSizeStock = sizeArray.map((s) => ({ size: s, stock: 5 }));
    const calculatedStock = nextSizeStock.reduce((acc: number, curr: any) => acc + curr.stock, 0);
    setFormData((prev: any) => ({
      ...prev,
      sizes: sizeArray,
      sizeStock: nextSizeStock,
      stockQuantity: calculatedStock,
    }));
  };

  const handleUpdateSingleSizeStock = (sizeVal: string, stockCount: number) => {
    const currentSizeStock = formData.sizeStock || [];
    const nextSizeStock = currentSizeStock.map((s: any) => {
      if (s.size === sizeVal) return { ...s, stock: Math.max(0, stockCount) };
      return s;
    });
    if (!nextSizeStock.some((s: any) => s.size === sizeVal)) {
      nextSizeStock.push({ size: sizeVal, stock: Math.max(0, stockCount) });
    }
    const calculatedStock = nextSizeStock.reduce(
      (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
      0
    );
    setFormData((prev: any) => ({
      ...prev,
      sizeStock: nextSizeStock,
      stockQuantity: calculatedStock,
    }));
  };

  // File Upload Handling with Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsCompressing(true);
    const previews: string[] = [];

    for (const file of files) {
      const compressedFile = await compressImage(file);
      previews.push(URL.createObjectURL(compressedFile));
      setSelectedFiles((prev) => [...prev, compressedFile]);
    }

    if (!formData.image) {
      setFormData((prev) => ({
        ...prev,
        image: previews[0],
        secondaryImages: [...(prev.secondaryImages || []), ...previews.slice(1)],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        secondaryImages: [...(prev.secondaryImages || []), ...previews],
      }));
    }

    setIsCompressing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert({
        title: 'حقل مطلوب',
        message: 'يرجى كتابة اسم المنتج الفاخر قبل الحفظ.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    const sanitizedColors = (formData.colors || []).filter(
      (c: any) => c && c.name && typeof c.name === 'string' && c.name.trim() !== ''
    );
    const payload = {
      ...formData,
      colors: sanitizedColors,
      price: formData.sellingPrice,
      discountPrice:
        formData.discountPrice > formData.sellingPrice
          ? formData.discountPrice
          : undefined,
      stock: formData.stockQuantity ?? 20,
      stockQuantity: formData.stockQuantity ?? 20,
      status: (formData.status || 'active').toLowerCase(),
    };

    try {
      let createdOrUpdated;
      if (productToEdit && productToEdit.id) {
        createdOrUpdated = await api.updateProduct(productToEdit.id, payload);
      } else {
        createdOrUpdated = await api.createProduct(payload);
      }

      const productId = createdOrUpdated
        ? createdOrUpdated.id || createdOrUpdated._id || ''
        : '';
      if (selectedFiles.length > 0 && productId) {
        await api.uploadProductImages(productId, selectedFiles);
      }

      onSave(payload);
      onClose();
    } catch (err: any) {
      console.warn('Backend submit fallback:', err);
      onSave(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const TABS: {
    id: 'general' | 'media' | 'colors' | 'sizes' | 'preview';
    label: string;
    icon: string;
  }[] = [
    { id: 'general', label: '1. البيانات والأسعار', icon: 'description' },
    { id: 'media', label: '2. الصور والوسائط', icon: 'photo_library' },
    { id: 'colors', label: '3. الألوان وصور الألوان', icon: 'palette' },
    { id: 'sizes', label: '4. المقاسات والمواصفات', icon: 'straighten' },
    { id: 'preview', label: '5. المعاينة المباشرة', icon: 'visibility' },
  ];

  // Helper section components
  const renderGeneralSection = () => (
    <div
      id="section-general"
      className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6 transition-colors"
    >
      <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#9A7B1C] dark:text-[#D4AF37]">
          info
        </span>
        المعلومات الأساسية والأسعار للمنتج
      </h3>

      {/* Product Name */}
      <div>
        <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          اسم المنتج (Product Name) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="مثال: ساعة كرونوغراف ملكية هيريتج"
          className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-base font-garamond font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-[#9A7B1C]/20 transition-all"
        />
      </div>

      {/* Category & Brand & Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            القسم (Category)
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-neutral-900 transition-all"
          >
            {categoriesList.length > 0 ? (
              categoriesList.map((c) => (
                <option key={c.id || c._id} value={c.name || c.title}>
                  {c.name || c.title}
                </option>
              ))
            ) : (
              <>
                <option value="Timepieces">ساعات فاخرة (Timepieces)</option>
                <option value="Suits">بدلات وتفصيل خاص (Suits)</option>
                <option value="Outerwear">معاطف وبشوت (Outerwear)</option>
                <option value="Coats & Jackets">جاكيتات وفاخرات (Coats)</option>
                <option value="Knitwear">ملابس كشمير (Knitwear)</option>
                <option value="Accessories">إكسسوارات وجلديات (Accessories)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            الماركة (Brand)
          </label>
          <select
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-neutral-900 transition-all"
          >
            <option value="SAOUDI WEAR ATELIER">SAOUDI WEAR ATELIER</option>
            {brandsList.map((b) => (
              <option key={b.id || b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            سعر البيع النهائي ($ USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.sellingPrice}
            onChange={(e) => handleChange('sellingPrice', Number(e.target.value))}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-neutral-900 transition-all"
            placeholder="مثال: 1450"
          />
          <p className="mt-1 text-[11px] font-semibold text-[#9A7B1C] dark:text-[#D4AF37]">
            ≈ {(formData.sellingPrice * 3.75).toLocaleString('en-US')} ر.س
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
              السعر قبل الخصم ($ USD - اختياري)
            </label>
            {formData.discountPrice > formData.sellingPrice && (
              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-md text-[10px] font-bold animate-pulse">
                خصم{' '}
                {Math.round(
                  ((formData.discountPrice - formData.sellingPrice) /
                    formData.discountPrice) *
                    100
                )}
                % 🔥
              </span>
            )}
          </div>
          <input
            type="number"
            min="0"
            value={formData.discountPrice || ''}
            onChange={(e) => handleChange('discountPrice', Number(e.target.value))}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-neutral-900 transition-all"
            placeholder="مثال: 1850 (سيظهر مشطوباً)"
          />
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {formData.discountPrice > formData.sellingPrice
              ? `وفرت للمشتري $${(
                  formData.discountPrice - formData.sellingPrice
                ).toLocaleString()} USD`
              : 'اتركه فارغاً إذا لم يكن هناك خصم'}
          </p>
        </div>
      </div>

      {/* Stock & Cost & Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            الكمية المتوفرة (Stock)
          </label>
          <input
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) => handleChange('stockQuantity', Number(e.target.value))}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            سعر التكلفة ($ Cost Price)
          </label>
          <input
            type="number"
            min="0"
            value={formData.costPrice}
            onChange={(e) => handleChange('costPrice', Number(e.target.value))}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            شارة المنتج (Badge)
          </label>
          <select
            value={formData.badge}
            onChange={(e) => handleChange('badge', e.target.value)}
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
          >
            <option value="">بدون شارة (No Badge)</option>
            <option value="Limited Edition">Limited Edition (إصدار محدود)</option>
            <option value="Bespoke">Bespoke (تفصيل خاص)</option>
            <option value="Bestseller">Bestseller (الأكثر مبيعاً)</option>
            <option value="New Arrival">New Arrival (وصل حديثاً)</option>
            <option value="Masterpiece">Masterpiece (تحفة فنية)</option>
          </select>
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            وصف مختصر (Short Description)
          </label>
          <input
            type="text"
            value={formData.shortDescription}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            placeholder="مثال: ساعة كرونوغراف ذهبية بآلية سويسرية فاخرة"
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            تفاصيل الوصف الكامل (Full Narrative)
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="اكتب قصة وتفاصيل صناعة المنتج..."
            className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderMediaSection = () => (
    <div
      id="section-media"
      className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#9A7B1C] dark:text-[#D4AF37]">
            photo_library
          </span>
          معرض صور المنتج والغلاف الرئيسي
        </h3>
        <button
          type="button"
          onClick={() => setShowImageGallery(!showImageGallery)}
          className="text-xs text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">collections</span>
          <span>{showImageGallery ? 'إخفاء الصور الجاهزة' : 'معرض صور فاخرة جاهزة'}</span>
        </button>
      </div>

      {/* Preset Images Gallery Picker */}
      {showImageGallery && (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-fade-in">
          <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3">
            اختر صور عالية الجودة بنقرة واحدة للمنتج:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GALLERY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!formData.image) handleChange('image', preset.url);
                  else
                    handleChange('secondaryImages', [
                      ...(formData.secondaryImages || []),
                      preset.url,
                    ]);
                }}
                className="relative h-24 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#D4AF37] transition-all cursor-pointer group shadow-xs"
              >
                <Image
                  src={preset.url}
                  alt={preset.label}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] text-center py-1 font-bold truncate">
                  {preset.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Selected Images Display Grid */}
      {[formData.image, ...(formData.secondaryImages || [])].filter(Boolean).length > 0 && (
        <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#9A7B1C] dark:text-[#D4AF37]">
                photo_camera
              </span>
              الصور المعتمدة للمنتج (
              {[formData.image, ...(formData.secondaryImages || [])].filter(Boolean).length})
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
              انقر ★ لتعيين الصورة كغلاف رئيسي
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-1">
            {[formData.image, ...(formData.secondaryImages || [])]
              .filter(Boolean)
              .map((imgUrl, idx) => {
                const isPrimary = imgUrl === formData.image;
                return (
                  <div
                    key={idx}
                    className={`relative group rounded-2xl overflow-hidden border-2 aspect-square transition-all shadow-xs ${
                      isPrimary
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Product image ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {isPrimary && (
                      <span className="absolute top-2 right-2 bg-[#D4AF37] text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        ★ الغلاف
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(imgUrl)}
                          className="px-3 py-1.5 bg-[#D4AF37] text-neutral-950 text-xs font-bold rounded-lg shadow hover:scale-105 transition-transform cursor-pointer"
                        >
                          ★ تعيين كغلاف
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgUrl)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow hover:bg-red-700 hover:scale-105 transition-transform cursor-pointer"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="p-5 bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] dark:hover:border-[#D4AF37] rounded-2xl text-center space-y-2.5 transition-colors">
        <div className="flex justify-center">
          <span className="material-symbols-outlined text-3xl text-[#9A7B1C] dark:text-[#D4AF37]">
            cloud_upload
          </span>
        </div>
        <div>
          <div className="text-xs text-neutral-800 dark:text-neutral-200 font-bold">
            ارفع صور من جهازك (يتم الضغط والتحويل إلى WebP تلقائياً)
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            يدعم JPG, PNG, WEBP بخلفية بيضاء أو داكنة
          </div>
        </div>
        <label className="inline-block px-5 py-2.5 bg-neutral-950 dark:bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] hover:text-neutral-950 transition-all cursor-pointer shadow-sm">
          + اختيار صور من الجهاز
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Direct Image URL input */}
      <div>
        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
          أو أدخل رابط صورة مباشرة (URL)
        </label>
        <input
          type="text"
          value={formData.image}
          onChange={(e) => handleChange('image', e.target.value)}
          placeholder="https://..."
          className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
        />
      </div>
    </div>
  );

  const renderColorsSection = () => (
    <div
      id="section-colors"
      className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6 transition-colors"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div>
          <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9A7B1C] dark:text-[#D4AF37]">
              palette
            </span>
            الألوان المتوفرة وصور كل لون (Colors & Variant Images)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            عند ضغط العميل على أي لون، ستتحول صورة المنتج تلقائياً إلى اللون المحدد.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddColor}
          className="px-4 py-2 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>إضافة لون جديد</span>
        </button>
      </div>

      {/* 1-Click Color Presets */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
          إضافة ألوان جاهزة بنقرة واحدة:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { name: 'أسود ملكي', hex: '#141414' },
            { name: 'ذهب وردي', hex: '#E8C177' },
            { name: 'كحلي داكن', hex: '#1B263B' },
            { name: 'أبيض عاجي', hex: '#F4F1EA' },
            { name: 'بني جلد', hex: '#6B4226' },
            { name: 'فضي لامع', hex: '#C0C0C0' },
          ].map((preset, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  colors: [
                    ...(prev.colors || []),
                    { name: preset.name, hex: preset.hex, image: prev.image || '' },
                  ],
                }));
              }}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:border-[#9A7B1C] transition-all cursor-pointer shadow-xs"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: preset.hex }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Color Inputs List */}
      <div className="space-y-4">
        {(formData.colors || []).map((colorItem: any, cIdx: number) => (
          <div
            key={cIdx}
            className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 relative shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full border border-black/30 shadow-xs inline-block"
                  style={{ backgroundColor: colorItem.hex || '#141414' }}
                />
                اللون #{cIdx + 1}: {colorItem.name || 'غير مسمى'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveColor(cIdx)}
                className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>حذف هذا اللون</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  اسم اللون (Color Name)
                </label>
                <input
                  type="text"
                  value={colorItem.name || ''}
                  onChange={(e) => handleUpdateColor(cIdx, 'name', e.target.value)}
                  placeholder="مثال: أسود ملكي / Rose Gold"
                  className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  رمز اللون (Hex Code)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorItem.hex || '#141414'}
                    onChange={(e) => handleUpdateColor(cIdx, 'hex', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={colorItem.hex || ''}
                    onChange={(e) => handleUpdateColor(cIdx, 'hex', e.target.value)}
                    placeholder="#141414"
                    className="flex-1 p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  صورة اللون (Variant Image)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colorItem.image || ''}
                    onChange={(e) => handleUpdateColor(cIdx, 'image', e.target.value)}
                    placeholder="رابط صورة اللون https://..."
                    className="flex-1 p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                  />
                  <label className="px-3.5 py-2 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] hover:text-neutral-950 transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
                    {uploadingColorIndex === cIdx ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base text-[#D4AF37]">
                          progress_activity
                        </span>
                        <span>جاري الرفع...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base text-[#D4AF37]">
                          cloud_upload
                        </span>
                        <span>رفع ⚡</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadColorVariantImage(cIdx, file);
                            }
                          }}
                        />
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSizesSection = () => (
    <div
      id="section-sizes"
      className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6 transition-colors"
    >
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#9A7B1C] dark:text-[#D4AF37]">
            straighten
          </span>
          المقاسات المتاحة والمواصفات الفنية
        </h3>
      </div>

      {/* Preset Size Selection */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
          نماذج مقاسات جاهزة بنقرة واحدة:
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyPresetSizes(['S', 'M', 'L', 'XL', 'XXL'])}
            className="px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-xs"
          >
            ملابس وأزياء: [S, M, L, XL, XXL]
          </button>

          <button
            type="button"
            onClick={() => handleApplyPresetSizes(['48', '50', '52', '54', '56'])}
            className="px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-xs"
          >
            بدلات ومعاطف: [48, 50, 52, 54, 56]
          </button>

          <button
            type="button"
            onClick={() => handleApplyPresetSizes(['38mm', '40mm', '42mm', '44mm'])}
            className="px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-[#9A7B1C] rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-xs"
          >
            أحجام ساعات: [38mm, 40mm, 42mm, 44mm]
          </button>
        </div>
      </div>

      {/* Active Sizes Toggles */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
          حدد المقاسات المفعلة للمنتج:
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {[
            'S',
            'M',
            'L',
            'XL',
            'XXL',
            '46',
            '48',
            '50',
            '52',
            '54',
            '56',
            '38mm',
            '40mm',
            '42mm',
            '44mm',
          ].map((sizeVal) => {
            const isSelected = (formData.sizes || []).includes(sizeVal);
            return (
              <button
                key={sizeVal}
                type="button"
                onClick={() => handleToggleSize(sizeVal)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer uppercase ${
                  isSelected
                    ? 'bg-[#9A7B1C] dark:bg-[#D4AF37] border-[#9A7B1C] dark:border-[#D4AF37] text-white dark:text-neutral-950 shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#9A7B1C]'
                }`}
              >
                {isSelected ? `✓ ${sizeVal}` : `+ ${sizeVal}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Size Stock Distribution Grid */}
      {(formData.sizes || []).length > 0 && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#9A7B1C] dark:text-[#D4AF37]">
                inventory_2
              </span>
              توزيع كميات المخزون على المقاسات المحددة:
            </label>
            <span className="text-xs font-bold text-[#9A7B1C] dark:text-[#D4AF37] font-mono">
              الإجمالي: {formData.stockQuantity ?? 0} قطعة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {(formData.sizes || []).map((sz: string) => {
              const matchedItem = (formData.sizeStock || []).find((s: any) => s.size === sz);
              const qty = matchedItem ? matchedItem.stock : 0;
              return (
                <div
                  key={sz}
                  className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                      {sz}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">قطع</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) =>
                      handleUpdateSingleSizeStock(sz, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full p-2 text-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Materials */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          المواد والمكونات (Materials)
        </label>
        <input
          type="text"
          value={formData.materials}
          onChange={(e) => handleChange('materials', e.target.value)}
          placeholder="18K Rose Gold, Cashmere, Italian Wool..."
          className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
        />
      </div>

      {/* Technical Specifications List */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
            المواصفات التقنية (Specifications)
          </label>
          <button
            type="button"
            onClick={handleAddSpec}
            className="text-xs text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>إضافة خاصية</span>
          </button>
        </div>

        <div className="space-y-2">
          {formData.specs.map((spec, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <input
                type="text"
                value={spec.label}
                onChange={(e) => handleUpdateSpec(idx, 'label', e.target.value)}
                placeholder="الخاصية"
                className="w-1/3 p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                placeholder="القيمة"
                className="flex-1 p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="p-2 text-red-600 hover:text-red-800 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLivePreviewCard = () => (
    <div className="bg-neutral-950 dark:bg-[#161616] text-white p-5 rounded-3xl border border-neutral-800 shadow-xl space-y-4 sticky top-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#D4AF37] text-lg">visibility</span>
          <h3 className="font-garamond text-lg font-bold text-white">المعاينة اللحظية للمنتج</h3>
        </div>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 rounded-full font-mono font-bold">
          تحديث فوري
        </span>
      </div>

      <div className="bg-white dark:bg-[#1F1F1F] text-neutral-900 dark:text-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative h-64 w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
          {formData.image ? (
            <Image
              src={formData.image}
              alt={formData.name || 'Preview'}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-400 text-xs">
              لا توجد صورة
            </div>
          )}
          {formData.badge && (
            <span className="absolute top-3 left-3 bg-neutral-950/90 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest backdrop-blur-md">
              {formData.badge}
            </span>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <span className="text-[10px] font-bold text-[#9A7B1C] dark:text-[#D4AF37] uppercase tracking-widest block">
            {formData.brand} • {formData.category}
          </span>
          <h4 className="font-garamond text-lg font-bold text-neutral-900 dark:text-white leading-tight">
            {formData.name || 'اسم المنتج سيظهر هنا'}
          </h4>

          {/* Colors Swatches Preview */}
          {formData.colors && formData.colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              {formData.colors.map((c: any, i: number) => (
                <span
                  key={i}
                  className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-xs inline-block"
                  style={{ backgroundColor: c.hex || '#141414' }}
                />
              ))}
            </div>
          )}

          {/* Sizes Preview */}
          {formData.sizes && formData.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {formData.sizes.slice(0, 5).map((s: string, i: number) => (
                <span
                  key={i}
                  className="text-[9px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700"
                >
                  {s}
                </span>
              ))}
              {formData.sizes.length > 5 && (
                <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-bold">
                  +{formData.sizes.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-base font-bold text-amber-600 dark:text-[#D4AF37] font-garamond block">
                ${(formData.sellingPrice || 0).toLocaleString()} USD
              </span>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-lg">
              متوفر ({formData.stockQuantity})
            </span>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-neutral-900 dark:bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-[11px] space-y-1.5 text-neutral-300">
        <div className="flex justify-between">
          <span className="text-neutral-400">سعر البيع:</span>
          <span className="text-[#D4AF37] font-bold">${formData.sellingPrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">التكلفة:</span>
          <span className="text-neutral-300 font-mono">${formData.costPrice}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-800 pt-1">
          <span className="text-neutral-400">هامش الربح المتوقع:</span>
          <span className="text-emerald-400 font-bold">
            ${formData.sellingPrice - formData.costPrice}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in dir-rtl">
      <div className="bg-[#FAF9F5] dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 w-full max-w-7xl h-[95vh] max-h-[960px] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100 transition-colors">
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 bg-neutral-950 text-white flex flex-wrap justify-between items-center gap-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-2xl">diamond</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="font-label-caps text-[11px] text-[#D4AF37] tracking-widest uppercase font-bold">
                  {productToEdit ? 'تعديل منتج فاخر' : 'إضافة ونشر منتج جديد'}
                </span>
              </div>
              <h2 className="font-garamond text-xl sm:text-2xl font-bold text-white mt-0.5 truncate max-w-md">
                {formData.name || 'منتج جديد بدون عنوان'}
              </h2>
            </div>
          </div>

          {/* MODE SWITCHER BUTTONS & Header Summary */}
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('single_page')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'single_page'
                    ? 'bg-[#D4AF37] text-neutral-950 shadow-md font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">view_day</span>
                <span>طريقة الصفحة الواحدة</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'tabs'
                    ? 'bg-[#D4AF37] text-neutral-950 shadow-md font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">tab</span>
                <span>عرض التبويبات</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION BAR (Tabs mode only or Quick Scroll in Single Page) */}
        {viewMode === 'tabs' ? (
          <div className="bg-white dark:bg-[#161616] border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 shadow-xs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#141414] dark:bg-[#202020] text-[#D4AF37] shadow-md border border-[#D4AF37]/40'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      isActive ? 'text-[#D4AF37]' : 'text-neutral-500'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#161616] border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto shrink-0 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <span className="text-[#9A7B1C] dark:text-[#D4AF37] font-extrabold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">bolt</span>
                التعديل المباشر:
              </span>
              <a
                href="#section-general"
                className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-800 dark:text-neutral-200"
              >
                1. البيانات والأسعار
              </a>
              <a
                href="#section-media"
                className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-800 dark:text-neutral-200"
              >
                2. الصور والوسائط
              </a>
              <a
                href="#section-colors"
                className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-800 dark:text-neutral-200"
              >
                3. الألوان وصورها
              </a>
              <a
                href="#section-sizes"
                className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-800 dark:text-neutral-200"
              >
                4. المقاسات والمواصفات
              </a>
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400 hidden md:block">
              جميع الأجزاء معروضة وتتحدث لحظياً في المعاينة الفورية ⚡
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {viewMode === 'single_page' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Sections stacked */}
              <div className="lg:col-span-8 space-y-6">
                {renderGeneralSection()}
                {renderMediaSection()}
                {renderColorsSection()}
                {renderSizesSection()}
              </div>

              {/* Right Column: Sticky Live Store Preview */}
              <div className="lg:col-span-4">{renderLivePreviewCard()}</div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'general' && renderGeneralSection()}
              {activeTab === 'media' && renderMediaSection()}
              {activeTab === 'colors' && renderColorsSection()}
              {activeTab === 'sizes' && renderSizesSection()}
              {activeTab === 'preview' && (
                <div className="max-w-xl mx-auto">{renderLivePreviewCard()}</div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION FOOTER */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#161616] border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-md">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-3">
            {viewMode === 'tabs' && (
              <>
                {activeTab !== 'general' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = TABS.findIndex((t) => t.id === activeTab);
                      if (idx > 0) setActiveTab(TABS[idx - 1].id);
                    }}
                    className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    ← الخطوة السابقة
                  </button>
                )}

                {activeTab !== 'preview' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = TABS.findIndex((t) => t.id === activeTab);
                      if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                    }}
                    className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-800 text-white hover:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    الخطوة التالية →
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs tracking-wider uppercase font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">
                    progress_activity
                  </span>
                  <span>جاري الحفظ والنشر...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">publish</span>
                  <span>حفظ ونشر المنتج الفاخر</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
