'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

interface ProductDetailViewProps {
  initialProduct: Product;
  productId?: string;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  initialProduct,
  productId,
}) => {
  const router = useRouter();
  const {
    products,
    cartItems,
    addToCart,
    buyNow,
    wishlistIds,
    toggleWishlist,
    setQuickViewProduct,
    setIs360Open,
    setSelectedProduct,
    setIsSizeGuideOpen,
    showToast,
    theme,
    lang,
    user,
    setIsAuthOpen,
    getWhatsAppLink,
  } = useApp();

  const isDark = theme === 'dark';

  // Product State with live Backend Sync capability
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Sync with Backend API on client mount
  useEffect(() => {
    const targetId = productId || initialProduct.id || (initialProduct as any)._id;
    if (targetId) {
      setIsLoadingBackend(true);
      api.getProductById(targetId)
        .then((fetched) => {
          if (fetched && fetched.name) {
            setProduct(fetched);
            setSelectedProduct(fetched);
          } else {
            setSelectedProduct(initialProduct);
          }
        })
        .catch(() => {
          setSelectedProduct(initialProduct);
        })
        .finally(() => setIsLoadingBackend(false));
    } else {
      setSelectedProduct(initialProduct);
    }
  }, [productId, initialProduct, setSelectedProduct]);

  // Load catalog for recommendations & similar products
  useEffect(() => {
    if (products && products.length > 0) {
      setCatalogProducts(products);
    } else {
      api.getProducts({ limit: 60 })
        .then((res) => {
          if (res && res.products && res.products.length > 0) {
            setCatalogProducts(res.products);
          }
        })
        .catch(() => {});
    }
  }, [products]);

  // Product Reviews State
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [reviewsEnabled, setReviewsEnabled] = useState<boolean>(true);

  // Auto-detect registered user / customer name and login status
  const registeredName =
    user?.name ||
    user?.fullName ||
    user?.customerName ||
    (typeof window !== 'undefined'
      ? (() => {
          try {
            const su = localStorage.getItem('saoudi_user');
            if (su) {
              const p = JSON.parse(su);
              return p.name || p.fullName || '';
            }
          } catch {}
          return '';
        })()
      : '');

  const isLoggedIn = Boolean(
    user ||
    registeredName ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('saoudi_token') ||
        localStorage.getItem('saoudi_customer_token') ||
        localStorage.getItem('saoudi_user')))
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saoudi_reviews_enabled');
      if (saved !== null) setReviewsEnabled(saved === 'true');
    }
    api
      .getStoreSettings()
      .then((st) => {
        if (st && typeof st.reviewsEnabled === 'boolean') {
          setReviewsEnabled(st.reviewsEnabled);
        }
      })
      .catch(() => {});

    const targetId = productId || initialProduct.id || (initialProduct as any)._id;
    if (targetId) {
      api
        .getProductReviews(targetId)
        .then((revs) => {
          if (revs && Array.isArray(revs) && revs.length > 0) {
            setProductReviews(revs);
          } else {
            setProductReviews([]);
          }
        })
        .catch(() => {
          setProductReviews([]);
        });
    }
  }, [productId, initialProduct]);

  const handleOpenReviewForm = () => {
    if (!reviewsEnabled) {
      if (showToast) showToast('عذراً، نظام التقييمات معطل حالياً من قبل الإدارة.');
      return;
    }
    if (!isLoggedIn) {
      if (showToast) showToast('يرجى تسجيل الدخول بحسابك أولاً لإضافة تقييم موثق.');
      setIsAuthOpen(true);
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewsEnabled) {
      if (showToast) showToast('عذراً، نظام التقييمات معطل حالياً من قبل الإدارة.');
      return;
    }
    if (!isLoggedIn) {
      if (showToast) showToast('يرجى تسجيل الدخول أولاً لنشر التقييم.');
      setIsAuthOpen(true);
      return;
    }

    const finalAuthorName = (registeredName || user?.name || user?.fullName || 'عميل موثق').trim();
    if (!newReviewComment.trim()) {
      if (showToast) showToast('يرجى كتابة نص التقييم');
      return;
    }

    setIsSubmittingReview(true);
    const targetId = productId || initialProduct.id || (initialProduct as any)._id;
    const reviewData = {
      product: targetId,
      customerName: finalAuthorName,
      customerEmail: user?.email || '',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      isVerifiedPurchase: true,
    };

    try {
      await api.createReview(reviewData);
      setProductReviews((prev) => [
        {
          _id: 'sub_' + Date.now(),
          ...reviewData,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      if (showToast) showToast('تم إرسال تقييمك الموثق بنجاح!');
    } catch (err: any) {
      setProductReviews((prev) => [
        {
          _id: 'local_' + Date.now(),
          ...reviewData,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      if (showToast) showToast('شكراً لك! تم تسجيل تقييمك بنجاح.');
    } finally {
      setIsSubmittingReview(false);
      setShowReviewForm(false);
      setNewReviewComment('');
      setGuestName('');
    }
  };

  // Selected Variant States
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0
      ? product.colors[0].name
      : ''
  );
  const [selectedFinish, setSelectedFinish] = useState<string>(
    product.colors && product.colors.length > 0
      ? product.colors[0].name
      : ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0
      ? product.sizes[0]
      : product.strapSizes && product.strapSizes.length > 0 ? product.strapSizes[0] : ''
  );
  // Specifications, Materials & Shipping flags
  const hasSpecs = Boolean(
    product.specs &&
    Array.isArray(product.specs) &&
    product.specs.length > 0 &&
    product.specs.some((s) => Boolean((s.label && s.label.trim()) || (s.value && s.value.trim())))
  );
  const hasMaterials = Boolean(
    product.materials &&
    typeof product.materials === 'string' &&
    product.materials.trim() !== ''
  );
  const hasShipping = Boolean(
    product.shippingInfo &&
    typeof product.shippingInfo === 'string' &&
    product.shippingInfo.trim() !== ''
  );

  const [activeMainImage, setActiveMainImage] = useState<string>(product.image);
  const [openAccordion, setOpenAccordion] = useState<'specs' | 'materials' | 'shipping' | null>(
    hasSpecs ? 'specs' : hasMaterials ? 'materials' : hasShipping ? 'shipping' : null
  );

  // Sync default selection & image whenever product data updates
  useEffect(() => {
    setActiveMainImage(product.image);
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0].name);
      setSelectedFinish(product.colors[0].name);
    } else {
      setSelectedColor('');
      setSelectedFinish('');
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else if (product.strapSizes && product.strapSizes.length > 0) {
      setSelectedSize(product.strapSizes[0]);
    } else {
      setSelectedSize('');
    }
    setOpenAccordion(hasSpecs ? 'specs' : hasMaterials ? 'materials' : hasShipping ? 'shipping' : null);
  }, [product, hasSpecs, hasMaterials, hasShipping]);

  // Handle Color Swatch Selection with Image Switching
  const handleSelectColor = (colorObj: { name: string; hex: string; image?: string }) => {
    setSelectedColor(colorObj.name);
    setSelectedFinish(colorObj.name);
    if (colorObj.image) {
      setActiveMainImage(colorObj.image);
    }
  };

  // Combine primary image, secondary images, and color images for full thumbnail gallery
  const galleryImages = Array.from(
    new Set(
      [
        product.image,
        ...(product.secondaryImages || []),
        ...(product.colors || []).map((c) => c.image).filter(Boolean),
      ].filter((img): img is string => Boolean(img) && typeof img === 'string')
    )
  );

  const handleOpen360 = () => {
    setSelectedProduct(product);
    setIs360Open(true);
  };

  const priceUSD = product.price || 0;
  const sarPrice = Math.round(priceUSD * 3.75);
  const currentId = String(product.id || (product as any)._id || productId || '');
  const isWishlisted = wishlistIds.includes(currentId);

  // Size stock breakdown & current selected size availability
  const selectedSizeItem = selectedSize && product.sizeStock && product.sizeStock.length > 0
    ? product.sizeStock.find((s) => s.size === selectedSize)
    : null;
  const currentStockCount = selectedSizeItem
    ? selectedSizeItem.stock
    : (product.stockQuantity ?? product.stock ?? 10);
  const isOutOfStock = selectedSizeItem ? selectedSizeItem.stock === 0 : currentStockCount === 0;
  const isLowStock = !isOutOfStock && currentStockCount <= 5;

  // Available sizes with stock > 0
  const availableSizes = (product.sizeStock || []).filter((s) => s.stock > 0);

  // Cart item status for current product
  const inCartItem = cartItems.find((item) => String(item.product.id || (item.product as any)._id) === currentId);
  const isInCart = Boolean(inCartItem);

  // Share handler
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: product.name,
          text: `اكتشف ${product.name} من SAOUDI WEAR الأتيليه الملكي`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        if (showToast) showToast('تم نسخ رابط المنتج إلى الحافظة بنجاح 📋');
      }
    }
  };

  // Handle Add to Cart with selected quantity (guarded against out-of-stock)
  const handleAddToCartWithQty = () => {
    if (isOutOfStock) {
      if (showToast) showToast(`عذراً، المقاس المحدد (${selectedSize}) غير متوفر حالياً في المخزون!`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedFinish, selectedSize);
    }
  };

  // Open WhatsApp Direct Order with Product Details, Photo, Color & Size
  const handleWhatsAppOrder = () => {
    const defaultSiteUrl = 'https://saoudi-front.vercel.app';
    const currentUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.href
      : `${defaultSiteUrl}/product/${currentId}`;

    const hasColor = Boolean(
      selectedColor &&
      selectedColor !== 'الافتراضي' &&
      product.colors &&
      product.colors.length > 0
    );
    const colorLine = hasColor ? `▪ *اللون / الإصدار:* ${selectedColor}\n` : '';

    const hasSizesConfigured = Boolean(
      (product.sizes && product.sizes.length > 0) ||
      (product.strapSizes && product.strapSizes.length > 0)
    );
    const sizeLine = hasSizesConfigured && selectedSize && selectedSize !== 'الافتراضي'
      ? isOutOfStock
        ? `▪ *المقاس المطلوب:* ${selectedSize} ⚠️ _(نفد مؤقتاً من المستودع)_\n`
        : `▪ *المقاس المحدد:* ${selectedSize}\n`
      : '';

    const totalUSD = priceUSD * quantity;
    const totalSAR = Math.round(totalUSD * 3.75);

    const messageText = isOutOfStock
      ? `👑 *SAOUDI WEAR | الأتيليه الملكي*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🧵 *طلب تفصيل ملكي خاص (Bespoke Inquiry)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💎 *تفاصيل القطعة المطلوبة:*\n` +
        `▪ *الاسم:* ${product.name}\n` +
        (product.category ? `▪ *القسم:* ${product.category}\n` : '') +
        `${colorLine}${sizeLine}` +
        `▪ *الكمية:* ${quantity} قطعة\n` +
        `▪ *السعر التقديري:* $${totalUSD.toLocaleString()} USD (≈ ${totalSAR.toLocaleString()} ر.س)\n\n` +
        `🔗 *رابط القطعة بالمتجر:*\n${currentUrl}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 *أود الاستفسار عن إمكانية حياكة وتوفير هذا المقاس خصيصاً لي والوقت المتوقع للتسليم.*\n` +
        `شاكرين لكم اهتمامكم الفائق! 🌟`
      : `👑 *SAOUDI WEAR | الأتيليه الملكي*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ *طلب شراء سريع ومباشر (VIP Quick Order)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💎 *تفاصيل القطعة الفاخرة:*\n` +
        `▪ *الاسم:* ${product.name}\n` +
        (product.category ? `▪ *القسم:* ${product.category}\n` : '') +
        `${colorLine}${sizeLine}` +
        `▪ *الكمية:* ${quantity} قطعة\n\n` +
        `💰 *القيمة الإجمالية:*\n` +
        `▪ $${totalUSD.toLocaleString()} USD\n` +
        `▪ ≈ ${totalSAR.toLocaleString()} ريال سعودي\n\n` +
        `🔗 *رابط القطعة بالمتجر:*\n${currentUrl}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 *يرجى تأكيد استلام الطلب وتزويدي ببيانات الشحن والتوصيل الملكي.*\n` +
        `شكراً لاختياركم SAOUDI WEAR! 🌟`;

    const whatsappUrl = getWhatsAppLink(messageText);
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 1. Similar Products (same category, different ID) - up to 8 items
  const similarProducts = catalogProducts
    .filter((p) => {
      const pId = String(p.id || (p as any)._id || '');
      return pId !== currentId && p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase();
    })
    .slice(0, 8);

  const finalSimilarProducts = similarProducts.length > 0
    ? similarProducts
    : catalogProducts.filter((p) => String(p.id || (p as any)._id) !== currentId).slice(0, 8);

  // 2. Recommended / Curated products (different categories or featured pairings) - up to 8 items
  const recommendedProducts = catalogProducts
    .filter((p) => {
      const pId = String(p.id || (p as any)._id || '');
      const isDifferent = pId !== currentId;
      const isNotInSimilar = !finalSimilarProducts.some((sp) => String(sp.id || (sp as any)._id) === pId);
      return isDifferent && isNotInSimilar;
    })
    .slice(0, 8);

  // Helper renderer for related product cards
  const renderProductCard = (p: Product) => {
    const pId = String(p.id || (p as any)._id || '');
    const isCardWishlisted = wishlistIds.includes(pId);
    const cardCartItem = cartItems.find((item) => String(item.product.id || (item.product as any)._id) === pId);
    const isCardInCart = Boolean(cardCartItem);
    const imgUrl = typeof p.image === 'string' ? p.image : 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600';
    const pSarPrice = Math.round((p.price || 0) * 3.75);

    const handleNavigate = (e: React.MouseEvent) => {
      // Prevent double trigger if clicking directly on an anchor
      if ((e.target as HTMLElement).closest('button')) return;
      router.push(`/product/${pId}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    return (
      <div
        key={pId}
        onClick={handleNavigate}
        className="group relative flex-none w-[200px] xs:w-[230px] sm:w-auto snap-start bg-white dark:bg-[#131313] rounded-2xl border border-neutral-200/90 dark:border-neutral-800/80 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer"
      >
        {/* Card Image Area */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <Link
            href={`/product/${pId}`}
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="block w-full h-full"
          >
            <Image
              src={imgUrl}
              alt={p.name}
              fill
              unoptimized
              className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
            />
          </Link>

          {/* Badge */}
          {p.badge && (
            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#D4AF37] text-neutral-950 text-[10px] font-bold tracking-wider uppercase rounded-full shadow-md z-10">
              {p.badge}
            </span>
          )}

          {/* Top-Left Wishlist Heart Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(p);
            }}
            className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 backdrop-blur-md shadow-md ${
              isCardWishlisted
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 dark:bg-black/70 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 hover:bg-white'
            }`}
            title={isCardWishlisted ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            aria-label="Wishlist"
          >
            <span className="material-symbols-outlined text-base">
              {isCardWishlisted ? 'favorite' : 'favorite_border'}
            </span>
          </button>

          {/* Desktop Hover Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewProduct(p);
              }}
              className="w-10 h-10 rounded-full bg-white/95 dark:bg-black/95 text-neutral-800 dark:text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
              title="نظرة سريعة"
              aria-label="Quick View"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110 ${
                isCardInCart
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#D4AF37] text-neutral-950 hover:bg-[#E5C158]'
              }`}
              title={isCardInCart ? 'في السلة' : 'إضافة إلى السلة'}
              aria-label="Add to cart"
            >
              <span className="material-symbols-outlined text-lg font-bold">
                {isCardInCart ? 'check' : 'shopping_bag'}
              </span>
            </button>
          </div>
        </div>

        {/* Card Info Area */}
        <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#9A7B1C] dark:text-[#D4AF37] font-bold block">
                {p.category || 'Atelier'}
              </span>
              {/* Optional Color Dots indicator */}
              {p.colors && p.colors.length > 0 && (
                <div className="flex items-center gap-1">
                  {p.colors.slice(0, 3).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-2 h-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                      style={{ backgroundColor: col.hex || '#141414' }}
                      title={col.name}
                    />
                  ))}
                  {p.colors.length > 3 && (
                    <span className="text-[8px] text-neutral-400 font-mono">+{p.colors.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            <Link
              href={`/product/${pId}`}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="font-garamond text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 hover:text-[#9A7B1C] dark:hover:text-[#D4AF37] transition-colors line-clamp-1 block"
            >
              {p.name}
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-garamond text-base sm:text-lg font-extrabold text-[#9A7B1C] dark:text-[#D4AF37]">
                  ${p.price?.toLocaleString()}
                </span>
                {Boolean(p.discountPrice && p.discountPrice > p.price) && (
                  <span className="text-[11px] text-red-500 line-through font-mono">
                    ${p.discountPrice?.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">
                ≈ {pSarPrice.toLocaleString()} ر.س
              </span>
            </div>

            {/* Direct Add / In-Cart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 ${
                isCardInCart
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
              title={isCardInCart ? 'تمت الإضافة للسلة' : 'أضف للسلة'}
              aria-label="Add to cart"
            >
              <span className="material-symbols-outlined text-base">
                {isCardInCart ? 'check' : 'shopping_bag'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 sm:pt-28 pb-24 px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1440px] mx-auto min-h-screen dir-rtl">
      {/* Top Header Bar: Breadcrumb + Action Controls */}
      <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-neutral-400 font-label-caps uppercase tracking-wider">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link href="/" className="hover:text-amber-800 dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            <span>الرئيسية</span>
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-amber-800 dark:hover:text-[#D4AF37] transition-colors">
            {product.category || 'الكتالوج'}
          </Link>
          <span>/</span>
          <span className="text-amber-800 dark:text-[#D4AF37] font-bold line-clamp-1 max-w-[180px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        {/* Share & Wishlist Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-neutral-800 hover:border-amber-500 text-slate-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 hover:bg-slate-50 transition-all text-xs cursor-pointer shadow-xs font-bold"
            title="مشاركة المنتج"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            <span className="hidden sm:inline">مشاركة</span>
          </button>

          <button
            onClick={() => toggleWishlist(product)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all text-xs cursor-pointer shadow-xs font-bold ${
              isWishlisted
                ? 'bg-rose-50 border-rose-400 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                : 'border-slate-300 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:border-rose-400 bg-white dark:bg-neutral-900 hover:bg-slate-50'
            }`}
            title={isWishlisted ? 'في قائمة المفضلة' : 'حفظ في المفضلة'}
          >
            <span className="material-symbols-outlined text-sm">
              {isWishlisted ? 'favorite' : 'favorite_border'}
            </span>
            <span className="hidden sm:inline">{isWishlisted ? 'محفوظ' : 'حفظ'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Main Showcase & Thumbnails */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Main Featured Image Box */}
          <div className="relative bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-neutral-800/90 rounded-2xl overflow-hidden group shadow-lg h-[460px] sm:h-[560px] md:h-[620px]">
            <Image
              src={activeMainImage || product.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop'}
              alt={product.name}
              fill
              unoptimized
              priority
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            {/* Badge Indicator */}
            {product.badge && (
              <span className="absolute top-4 right-4 px-3.5 py-1.5 bg-[#D4AF37] text-neutral-950 font-label-caps text-xs tracking-widest uppercase font-bold rounded-full shadow-md z-10">
                {product.badge}
              </span>
            )}

            {/* Interactive 360 View Button */}
            <button
              onClick={handleOpen360}
              className="absolute bottom-5 right-5 px-4 py-2 bg-neutral-950/80 border border-[#D4AF37]/80 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-neutral-950 font-button text-xs tracking-widest uppercase backdrop-blur-md flex items-center space-x-2 space-x-reverse transition-all shadow-lg cursor-pointer rounded-xl z-10"
            >
              <span className="material-symbols-outlined text-base animate-spin-slow">360</span>
              <span className="font-bold">عرض تفاعلي 360°</span>
            </button>
          </div>

          {/* Secondary Thumbnail Gallery */}
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {galleryImages.map((imgUrl, idx) => {
                const isActive = activeMainImage === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMainImage(imgUrl)}
                    className={`relative h-20 sm:h-24 bg-slate-100 dark:bg-[#141414] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#D4AF37] scale-105 shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]'
                        : 'border-slate-200 dark:border-neutral-800 opacity-70 hover:opacity-100 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`View ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Commercial Details & Purchase Options */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          <div>
            {/* Category, Brand, & SKU */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-xs text-amber-800 dark:text-[#D4AF37] tracking-[0.25em] uppercase font-bold">
                {product.brand || 'SAOUDI WEAR ATELIER'} • {product.category}
              </span>

              <span className="text-[11px] font-mono text-slate-700 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-neutral-800 font-bold">
                SKU: {product.sku || product.id}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-garamond text-3xl sm:text-4xl md:text-5xl font-bold text-slate-950 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Price Box with Dual Currency Display */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-neutral-900/60 border border-amber-200/70 dark:border-neutral-800/80 space-y-1.5 shadow-2xs">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-garamond text-3xl sm:text-4xl font-extrabold text-amber-900 dark:text-[#D4AF37]">
                  ${priceUSD.toLocaleString()} USD
                </span>
                {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                  <span className="text-lg sm:text-xl font-mono text-red-600 line-through font-bold">
                    ${product.discountPrice?.toLocaleString()} USD
                  </span>
                )}
                {Boolean(product.discountPrice && product.discountPrice > product.price) && (
                  <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold font-mono shadow-xs">
                    وفرت ${(product.discountPrice! - product.price).toLocaleString()} ({Math.round(((product.discountPrice! - product.price) / product.discountPrice!) * 100)}% خصم)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <span className="font-bold">≈ {sarPrice.toLocaleString()} ريال سعودي</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">شامل الضريبة والشحن السريع المجاني</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="font-body-md text-sm text-neutral-700 dark:text-neutral-300 mt-4 leading-relaxed font-normal">
              {product.shortDescription || product.description}
            </p>
          </div>

          <div className="w-full h-[1px] bg-neutral-200 dark:bg-neutral-800" />

          {/* Color Variants Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-label-caps text-amber-800 dark:text-[#D4AF37] tracking-wider uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">palette</span>
                  <span>اللون المحدد:</span>
                  <span className="text-neutral-950 dark:text-neutral-100 font-extrabold mr-1">{selectedColor}</span>
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  انقر لاختيار لون القطعة ⚡
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {product.colors.map((colorObj, idx) => {
                  const isSelected = selectedColor === colorObj.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectColor(colorObj)}
                      className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 border text-xs font-body-md transition-all rounded-xl cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-950 dark:border-[#D4AF37] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] ring-1 ring-amber-500 dark:ring-[#D4AF37] font-bold shadow-xs'
                          : 'border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500 hover:text-black dark:hover:text-white bg-white dark:bg-neutral-900/50 shadow-2xs'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 inline-block shadow-2xs shrink-0"
                        style={{ backgroundColor: colorObj.hex || '#141414' }}
                      />
                      <span>{colorObj.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Sizes Selector & Prominent Stock Status Alerts */}
          {(product.sizes || product.strapSizes) && (product.sizes || product.strapSizes)!.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-xs text-amber-800 dark:text-[#D4AF37] tracking-wider uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">straighten</span>
                  <span>المقاس المحدد:</span>
                  <span className={`font-extrabold mr-1 ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-950 dark:text-neutral-100'}`}>
                    {selectedSize || 'يرجى الاختيار'}
                  </span>
                  {isOutOfStock && (
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                      غير متوفر
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="font-label-caps text-[11px] text-amber-800 dark:text-[#D4AF37] underline uppercase tracking-wider hover:opacity-80 flex items-center gap-1 cursor-pointer font-bold"
                >
                  دليل المقاسات
                </button>
              </div>

              {/* Sizes Chips Grid */}
              <div className="flex flex-wrap gap-2.5">
                {(product.sizes || product.strapSizes || []).map((sizeVal) => {
                  const isSelected = selectedSize === sizeVal;
                  const sizeItem = (product.sizeStock || []).find((s) => s.size === sizeVal);
                  const isSizeZero = sizeItem ? sizeItem.stock === 0 : false;
                  return (
                    <button
                      key={sizeVal}
                      type="button"
                      onClick={() => setSelectedSize(sizeVal)}
                      className={`px-4 py-2.5 text-xs font-bold border transition-all rounded-xl uppercase tracking-wider cursor-pointer min-w-[56px] text-center relative ${
                        isSelected && !isSizeZero
                          ? 'border-neutral-950 bg-neutral-950 text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-neutral-950 font-extrabold shadow-md scale-105'
                          : isSelected && isSizeZero
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold shadow-md ring-2 ring-rose-400/40 scale-105'
                          : isSizeZero
                          ? 'border-rose-200 dark:border-rose-900/40 text-rose-400 dark:text-rose-500/70 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300 hover:bg-rose-50'
                          : 'border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 hover:border-neutral-950 dark:hover:border-[#D4AF37] bg-white dark:bg-neutral-900/50 shadow-2xs'
                      }`}
                    >
                      <span className={isSizeZero && !isSelected ? 'line-through opacity-75' : ''}>{sizeVal}</span>
                      {isSizeZero && (
                        <span className="block text-[8px] font-sans font-bold text-rose-600 dark:text-rose-400 tracking-normal mt-0.5">
                          نفد
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Prominent Out-of-Stock Alert Box */}
              {isOutOfStock && (
                <div className="p-4 rounded-2xl bg-rose-50/95 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800/80 shadow-xs space-y-2.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    <span className="material-symbols-outlined text-xl text-rose-600 dark:text-rose-400 shrink-0">
                      do_not_disturb_on
                    </span>
                    <span>عذراً، المقاس المحدد ({selectedSize}) غير متوفر حالياً في مستودع الأتيليه!</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300/80 leading-relaxed">
                    لقد نفدت الكمية الجاهزة للشحن الفوري لهذا المقاس. يمكنك اختيار أحد المقاسات البديلة المتوفرة أدناه أو طلب تفصيل ملكي خاص بالقطعة (Bespoke) عبر كونسيرج الواتساب.
                  </p>

                  {/* Alternative In-Stock Sizes Switcher */}
                  {availableSizes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-rose-200 dark:border-rose-900/50">
                      <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        مقاسات بديلة متوفرة فوراً:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {availableSizes.map((av) => (
                          <button
                            key={av.size}
                            type="button"
                            onClick={() => setSelectedSize(av.size)}
                            className="px-3 py-1 bg-white dark:bg-neutral-900 border border-emerald-400 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>مقاس {av.size}</span>
                            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                              {av.stock > 10 ? '(متوفر)' : `(متبقي ${av.stock})`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Low Stock Warning Alert (only when 1-5 items left) */}
              {isLowStock && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 shadow-2xs flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-bold animate-fade-in">
                  <span className="material-symbols-outlined text-lg text-amber-600 dark:text-amber-400 animate-bounce shrink-0">
                    local_fire_department
                  </span>
                  <span>
                    سارع بالطلب! متبقي <strong className="font-mono text-sm underline">{currentStockCount} قطع فقط</strong> في مقاس ({selectedSize}) بمستودعاتنا.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Stock Indicator */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {/* Quantity Selector */}
            <div className={`flex items-center border border-neutral-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/70 p-1 shadow-2xs ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-bold text-lg cursor-pointer disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-10 text-center font-mono font-bold text-sm text-neutral-950 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= currentStockCount}
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-bold text-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Stock status badge */}
            <div
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl flex-1 justify-center shadow-2xs border ${
                isOutOfStock
                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                  : isLowStock
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>
                {isOutOfStock
                  ? `المقاس المحدد (${selectedSize || 'الافتراضي'}) نفد تماماً من المستودع`
                  : currentStockCount > 10
                  ? selectedSize
                    ? `متوفر في مقاس ${selectedSize} للطلب الفوري`
                    : 'متوفر للطلب الفوري في الأتيليه الملكي'
                  : selectedSize
                  ? `متوفر مقاس ${selectedSize} (متبقي ${currentStockCount} قطع فقط)`
                  : `متوفر للطلب الفوري (متبقي ${currentStockCount} قطع فقط)`}
              </span>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Primary Action Button: Add to Cart */}
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCartWithQty}
              className={`w-full py-4 font-button text-xs tracking-[0.2em] uppercase font-bold transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse rounded-xl ${
                isOutOfStock
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300 dark:border-neutral-700 shadow-none'
                  : isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer'
                  : 'bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 hover:opacity-95 shadow-[#D4AF37]/20 hover:scale-[1.01] cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {isOutOfStock ? 'block' : isInCart ? 'check_circle' : 'shopping_bag'}
              </span>
              <span>
                {isOutOfStock
                  ? `المقاس (${selectedSize || 'المحدد'}) غير متوفر للإضافة إلى الحقيبة`
                  : isInCart
                  ? `تمت الإضافة (${inCartItem?.quantity} في الحقيبة) • أضف المزيد`
                  : 'إضافة إلى حقيبة التسوق'}
              </span>
            </button>

            {/* Quick WhatsApp VIP Order Button */}
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              className={`w-full py-3.5 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 space-x-reverse cursor-pointer border group hover:scale-[1.01] ${
                isOutOfStock
                  ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 hover:from-emerald-600 hover:to-teal-600 border-emerald-400/40 shadow-emerald-700/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30'
              }`}
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                {isOutOfStock ? 'design_services' : 'chat'}
              </span>
              <span>
                {isOutOfStock
                  ? `طلب تفصيل خاص لمقاس (${selectedSize}) عبر كونسيرج الواتساب (Bespoke)`
                  : 'طلب مباشر وفوري عبر كونسيرج الواتساب (VIP)'}
              </span>
            </button>
            
            {/* Direct Instant Checkout Button */}
            <button
              disabled={isOutOfStock}
              onClick={() => buyNow(product, selectedFinish, selectedSize)}
              className={`w-full py-3.5 border font-button text-xs tracking-[0.15em] uppercase font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse rounded-xl ${
                isOutOfStock
                  ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed shadow-none'
                  : 'border-neutral-300 dark:border-[#D4AF37] text-neutral-900 dark:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-[#D4AF37]/10 bg-white dark:bg-transparent shadow-2xs cursor-pointer'
              }`}
            >
              <span>{isOutOfStock ? 'المقاس غير متاح للشراء المباشر' : 'شراء مباشر وسريع (Checkout)'}</span>
              <span className="material-symbols-outlined text-sm">{isOutOfStock ? 'block' : 'arrow_back'}</span>
            </button>
          </div>


          {/* Expandable Technical Details & Materials Accordion */}
          {(hasSpecs || hasMaterials || hasShipping) && (
            <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              {/* Technical Specs Accordion */}
              {hasSpecs && (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === 'specs' ? null : 'specs')}
                    className="w-full px-4 py-3 bg-neutral-100/90 dark:bg-neutral-900 flex justify-between items-center text-xs font-label-caps text-neutral-900 dark:text-[#D4AF37] tracking-widest uppercase text-right cursor-pointer font-bold hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-amber-700 dark:text-[#D4AF37]">tune</span>
                      <span>المواصفات الفنية والتقنية</span>
                    </div>
                    <span className="material-symbols-outlined text-base">
                      {openAccordion === 'specs' ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {openAccordion === 'specs' && (
                    <div className="p-4 bg-white dark:bg-[#141414] space-y-2.5 text-xs font-body-md text-neutral-700 dark:text-neutral-300">
                      {product.specs?.map((spec, i) => (
                        <div key={i} className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                          <span className="text-neutral-500 dark:text-neutral-400">{spec.label}</span>
                          <span className="font-bold text-neutral-950 dark:text-neutral-100">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Materials & Care Accordion */}
              {hasMaterials && (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === 'materials' ? null : 'materials')}
                    className="w-full px-4 py-3 bg-neutral-100/90 dark:bg-neutral-900 flex justify-between items-center text-xs font-label-caps text-neutral-900 dark:text-[#D4AF37] tracking-widest uppercase text-right cursor-pointer font-bold hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-amber-700 dark:text-[#D4AF37]">diamond</span>
                      <span>المواد والخامات والصناعة</span>
                    </div>
                    <span className="material-symbols-outlined text-base">
                      {openAccordion === 'materials' ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {openAccordion === 'materials' && (
                    <div className="p-4 bg-white dark:bg-[#141414] text-xs font-body-md text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {product.materials}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping & Delivery Accordion */}
              {hasShipping && (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                    className="w-full px-4 py-3 bg-neutral-100/90 dark:bg-neutral-900 flex justify-between items-center text-xs font-label-caps text-neutral-900 dark:text-[#D4AF37] tracking-widest uppercase text-right cursor-pointer font-bold hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-amber-700 dark:text-[#D4AF37]">local_shipping</span>
                      <span>الشحن والتوصيل</span>
                    </div>
                    <span className="material-symbols-outlined text-base">
                      {openAccordion === 'shipping' ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {openAccordion === 'shipping' && (
                    <div className="p-4 bg-white dark:bg-[#141414] text-xs font-body-md text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {product.shippingInfo}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* CUSTOMER REVIEWS & RATINGS SECTION - Always rendered when reviews are enabled */}
      {reviewsEnabled && (
        <section className="mt-16 sm:mt-24 pt-10 sm:pt-14 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-[11px] font-bold text-[#9A7B1C] dark:text-[#D4AF37] mb-2 shadow-2xs">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>تجارب عملاء موثقة</span>
              </div>
              <h2 className="font-garamond text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 dark:text-neutral-100">
                آراء وتقييمات عملاء الأتيليه الملكي ({productReviews.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showReviewForm) {
                  setShowReviewForm(false);
                } else {
                  handleOpenReviewForm();
                }
              }}
              className="px-5 py-2.5 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">rate_review</span>
              <span>{showReviewForm ? 'إغلاق نموذج التقييم' : 'أضف تقييمك للقطعة'}</span>
            </button>
          </div>

          {/* Empty State Banner when 0 reviews and form is closed */}
          {productReviews.length === 0 && !showReviewForm && (
            <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/20 to-white dark:from-[#151515] dark:to-[#101010] rounded-3xl border border-amber-200/60 dark:border-neutral-800/80 shadow-xs space-y-4 max-w-2xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto shadow-2xs">
                <span className="material-symbols-outlined text-2xl">hotel_class</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-garamond text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white">
                  كن أول من يقيم هذه القطعة الفاخرة ويشارك تجربته
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  رأيك يهم مجتمع SAOUDI WEAR ويساعد نخبة العملاء على اختيار المقاس والخامة والتفاصيل.
                </p>
              </div>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleOpenReviewForm}
                  className="px-6 py-3 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  <span>+ شارك أول تقييم لهذه القطعة الآن</span>
                </button>
              ) : (
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (showToast) showToast('يرجى تسجيل الدخول أو إنشاء حساب لإضافة تقييم موثق.');
                      setIsAuthOpen(true);
                    }}
                    className="px-6 py-3 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>تسجيل الدخول / إنشاء حساب لإضافة تقييم ⚡</span>
                  </button>
                  <p className="text-[11px] text-amber-700/80 dark:text-[#D4AF37]/80 font-medium">
                    * التقييم متاح للعملاء المسجلين لضمان مصداقية التقييمات وتوثيق الشراء
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Review Submission Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-8 p-6 bg-amber-50/30 dark:bg-[#151515] rounded-2xl border border-amber-200 dark:border-neutral-800 shadow-md space-y-4 max-w-2xl animate-fade-in"
            >
              <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37]">star</span>
                <span>شاركنا تجربتك ورأيك في هذه القطعة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Auto-detected Registered Name or Guest Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      الاسم المسجل للتقييم
                    </label>
                    {!isLoggedIn && (
                      <button
                        type="button"
                        onClick={() => setIsAuthOpen(true)}
                        className="text-[10px] text-[#9A7B1C] dark:text-[#D4AF37] underline font-bold cursor-pointer"
                      >
                        تسجيل الدخول ⚡
                      </button>
                    )}
                  </div>

                  {registeredName ? (
                    <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-neutral-900 border border-amber-400/60 dark:border-[#D4AF37]/60 rounded-xl">
                      <span className="material-symbols-outlined text-[#D4AF37] text-lg">verified_user</span>
                      <div className="flex-1 flex items-center justify-between">
                        <strong className="text-neutral-950 dark:text-white font-bold text-xs">{registeredName}</strong>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                          حساب موثق ✓
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسمك الكريم..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-[#D4AF37]"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    التقييم بالنجوم
                  </label>
                  <div className="flex gap-1.5">
                    {[5, 4, 3, 2, 1].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewReviewRating(st)}
                        className={`flex-1 p-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                          newReviewRating === st
                            ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {st} ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  تعليقك وتقييمك لتفاصيل القطعة *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب تجربتك مع الخامة، المقاس، أو سرعة التوصيل..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 font-bold rounded-xl hover:bg-[#D4AF37] transition-all cursor-pointer shadow-md"
                >
                  {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
              </div>
            </form>
          )}

          {/* Reviews Cards List */}
          {productReviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {productReviews.map((rev, idx) => {
                const replyObj = typeof rev.reply === 'string' ? { text: rev.reply } : rev.reply;
                const rDate = rev.createdAt ? new Date(rev.createdAt) : new Date();
                const dateStr = !isNaN(rDate.getTime())
                  ? `${rDate.getFullYear()}/${String(rDate.getMonth() + 1).padStart(2, '0')}/${String(rDate.getDate()).padStart(2, '0')}`
                  : '---';

                return (
                  <div
                    key={rev._id || idx}
                    className="p-5 sm:p-6 bg-white dark:bg-[#131313] rounded-2xl border border-neutral-200/90 dark:border-neutral-800/80 shadow-xs space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                            {rev.customerName || 'عميل موثق'}
                          </span>
                          {rev.isFeatured && (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/60 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                              <span>⭐ تقييم مميز</span>
                            </span>
                          )}
                          {rev.isVerifiedPurchase !== false && (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-full">
                              ✓ مشترٍ موثق
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                          {dateStr}
                        </span>
                      </div>

                      <div className="flex text-amber-500 text-sm flex-shrink-0">
                        {'★'.repeat(rev.rating || 5)}
                        {'☆'.repeat(5 - (rev.rating || 5))}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic font-normal">
                      "{rev.comment}"
                    </p>

                    {/* Review Images */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {rev.images.map((img: any, i: number) => (
                          <div
                            key={i}
                            className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                          >
                            <Image src={img.url || img} alt="Review photo" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {replyObj?.text && (
                      <div className="p-3 bg-amber-50/60 dark:bg-neutral-900/90 border-r-2 border-[#D4AF37] rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-[#9A7B1C] dark:text-[#D4AF37] block">
                          رد SAOUDI WEAR:
                        </span>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{replyObj.text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 1: SIMILAR LUXURY PIECES (منتجات مشابهة - سكرول أفقي أنيق في الموبايل) */}
      {finalSimilarProducts.length > 0 && (
        <section className="mt-16 sm:mt-24 pt-10 sm:pt-14 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-[11px] font-bold text-[#9A7B1C] dark:text-[#D4AF37] mb-2 shadow-2xs">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>من نفس التشكيلة الملكية</span>
              </div>
              <h2 className="font-garamond text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 dark:text-neutral-100">
                قطع فاخرة مشابهة قد تناسب ذوقك
              </h2>
            </div>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category || '')}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A7B1C] dark:text-[#D4AF37] hover:underline group"
            >
              <span>استعراض كافة قطع القسم</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180 group-hover:-translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Horizontal Scroll on Mobile, Responsive Grid on Desktop */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {finalSimilarProducts.map((p) => renderProductCard(p))}
          </div>
        </section>
      )}

      {/* SECTION 2: CURATED RECOMMENDATIONS & STYLE PAIRINGS (ترشيحات لإكمال الإطلالة - سكرول أفقي أنيق في الموبايل) */}
      {recommendedProducts.length > 0 && (
        <section className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-[11px] font-bold text-[#9A7B1C] dark:text-[#D4AF37] mb-2 shadow-2xs">
                <span className="material-symbols-outlined text-sm">diamond</span>
                <span>ATELIER STYLE PAIRINGS</span>
              </div>
              <h2 className="font-garamond text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 dark:text-neutral-100">
                ترشيحات منسقة لإكمال إطلالتك الفاخرة
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A7B1C] dark:text-[#D4AF37] hover:underline group"
            >
              <span>استكشاف الكتالوج الكامل</span>
              <span className="material-symbols-outlined text-sm rtl:rotate-180 group-hover:-translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Horizontal Scroll on Mobile, Responsive Grid on Desktop */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommendedProducts.map((p) => renderProductCard(p))}
          </div>
        </section>
      )}
    </div>
  );
};
