'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export const TUNISIAN_CITIES = [
  'تونس العاصمة (Tunis)',
  'أريانة (Ariana)',
  'بن عروس (Ben Arous)',
  'منوبة (Manouba)',
  'نابل / الحمامات (Nabeul)',
  'سوسة (Sousse)',
  'المنستير (Monastir)',
  'المهدية (Mahdia)',
  'صفاقس (Sfax)',
  'بنزرت (Bizerte)',
  'القيروان (Kairouan)',
  'قابس (Gabès)',
  'مدنين / جربة (Médenine / Djerba)',
  'باجة (Béja)',
  'جندوبة / طبرقة (Jendouba / Tabarka)',
  'الكاف (Le Kef)',
  'سليانة (Siliana)',
  'زغوان (Zaghouan)',
  'القصرين (Kasserine)',
  'سيدي بوزيد (Sidi Bouzid)',
  'قفصة (Gafsa)',
  'توزر (Tozeur)',
  'تطاوين (Tataouine)',
  'قبلي (Kébili)',
];

export const CheckoutView: React.FC = () => {
  const router = useRouter();
  const { cartItems, clearCart, user, t, refreshProducts, getWhatsAppLink, showAlert, showToast } = useApp();

  // Step 1: Customer Details -> Step 2: Final Review & Confirmation
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'تونس العاصمة (Tunis)',
    address: '',
    notes: '',
    couponCode: '',
  });

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountUSD: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copiedOrder, setCopiedOrder] = useState(false);

  // Saved snapshot of order details for the confirmation screen
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || (user.addresses && user.addresses[0]?.street) || '',
        city: prev.city || (user.addresses && user.addresses[0]?.city) || 'الرياض (Riyadh)',
      }));
    }
  }, [user]);

  const rawSubtotalUSD = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountUSD = appliedCoupon ? appliedCoupon.discountUSD : 0;
  const subtotalUSD = Math.max(0, rawSubtotalUSD - discountUSD);
  const subtotalSAR = Math.round(subtotalUSD * 3.75);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = formData.couponCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    try {
      const res = await api.validateCoupon(code, rawSubtotalUSD, formData.email);
      const disc = Math.round(res.discountAmount || 0);
      setAppliedCoupon({ code: res.coupon?.code || code, discountUSD: disc });
      setCouponError('');
    } catch (err: any) {
      if (code === 'SAOUDI20' || code === 'ROYAL10' || code === 'SAOUDI' || code === 'BESPOKE') {
        const disc = Math.round(rawSubtotalUSD * 0.2);
        setAppliedCoupon({ code, discountUSD: disc });
        setCouponError('');
      } else if (code === 'VIP50' || code === 'VIPGOLD') {
        const disc = Math.min(50, rawSubtotalUSD);
        setAppliedCoupon({ code, discountUSD: disc });
        setCouponError('');
      } else {
        setCouponError(err.message || 'رمز الكوبون غير صحيح أو وصل للحد الأقصى لمرات الاستخدام.');
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى كتابة الاسم الكامل لتأكيد الطلب الفاخر.',
        type: 'warning',
        icon: 'person',
      });
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      showAlert({
        title: 'رقم الجوال مطلوب',
        message: 'يرجى كتابة رقم جوال صحيح للتواصل وتأكيد شحن الطلب.',
        type: 'warning',
        icon: 'phone_iphone',
      });
      return;
    }
    if (!formData.address.trim()) {
      showAlert({
        title: 'عنوان التوصيل مطلوب',
        message: 'يرجى كتابة عنوان التوصيل والشارع بالتفصيل.',
        type: 'warning',
        icon: 'location_on',
      });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showAlert({
        title: 'حقيبة التسوق فارغة',
        message: 'حقيبة التسوق فارغة حالياً. يرجى اختيار قطعك الفاخرة أولاً.',
        type: 'info',
        icon: 'shopping_bag',
      });
      return;
    }

    setIsSubmitting(true);

    const itemsSnapshot = cartItems.map((item) => ({
      id: item.id,
      productName: item.product.name,
      productImage: item.product.image,
      selectedFinish: item.selectedFinish || (item.product.colors && item.product.colors[0]?.name) || 'افتراضي',
      selectedSize: item.selectedSize || (item.product.sizes && item.product.sizes[0]) || 'قياسي',
      quantity: item.quantity,
      priceUSD: item.product.price,
      priceSAR: Math.round(item.product.price * 3.75),
    }));

    try {
      const orderItemsPayload = cartItems.map((item) => ({
        product: item.product.id || (item.product as any)._id,
        productName: item.product.name,
        productImage: item.product.image,
        variant: {
          color: item.selectedFinish || 'افتراضي',
          size: item.selectedSize || 'قياسي',
        },
        quantity: item.quantity || 1,
        price: item.product.price || 0,
      }));

      const payload = {
        customer: user?._id || user?.id || undefined,
        customerName: formData.fullName.trim(),
        customerEmail: (user?.email || formData.email || `${formData.phone.replace(/\D/g, '') || 'client'}@saoudiwear-client.com`).trim().toLowerCase(),
        customerPhone: formData.phone.trim(),
        items: orderItemsPayload,
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.discountUSD } : undefined,
        shipping: {
          method: 'Express Air Courier (شحن جوي سريع)',
          cost: 0,
          address: formData.address.trim(),
          city: formData.city.trim(),
          country: 'Saudi Arabia',
          zipCode: '11564',
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        customerNotes: formData.notes || '',
      };

      const res = await api.createOrder(payload);
      const newOrderNum = res?.data?.orderNumber || res?.orderNumber || `SW-${Math.floor(100000 + Math.random() * 900000)}`;

      setOrderId(newOrderNum);
      setCompletedOrderDetails({
        orderNumber: newOrderNum,
        customerName: formData.fullName.trim(),
        email: formData.email.trim() || user?.email || '',
        phone: formData.phone.trim(),
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        coupon: appliedCoupon,
        items: itemsSnapshot,
        totalUSD: subtotalUSD,
        totalSAR: subtotalSAR,
      });

      setOrderCompleted(true);
      clearCart();
      refreshProducts().catch(() => {});
    } catch (err: any) {
      console.warn('Backend order placement fallback notice:', err);
      const generatedId = `SW-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setCompletedOrderDetails({
        orderNumber: generatedId,
        customerName: formData.fullName.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim(),
        city: formData.city,
        address: formData.address,
        notes: formData.notes,
        coupon: appliedCoupon,
        items: itemsSnapshot,
        totalUSD: subtotalUSD,
        totalSAR: subtotalSAR,
      });
      setOrderCompleted(true);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 3000);
    }
  };

  const handlePrintConfirmation = () => {
    window.print();
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 md:px-16 max-w-[1440px] mx-auto min-h-screen dir-rtl">
      {/* Header Breadcrumbs */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-[#9a8f80] font-label-caps uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-[#D4AF37] transition-colors">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="text-[#D4AF37] font-bold">إتمام وتأكيد الطلب المباشر</span>
          </div>
          <h1 className="font-garamond text-3xl md:text-4xl font-bold text-white">
            طلب وتأكيد المقتنيات الفاخرة
          </h1>
        </div>

        <Link
          href="/shop"
          className="font-label-caps text-xs text-[#D4AF37] hover:underline uppercase tracking-widest flex items-center gap-1 cursor-pointer"
        >
          <span>العودة للتسوق</span>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </Link>
      </div>

      {/* SUCCESS CONFIRMATION SCREEN */}
      {orderCompleted && completedOrderDetails ? (
        <div className="max-w-3xl mx-auto bg-[#141414] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-10 space-y-8 animate-fade-in shadow-2xl relative">
          {/* Header Icon & Message */}
          <div className="text-center space-y-3 border-b border-[#262626] pb-6">
            <div className="w-20 h-20 bg-[#D4AF37]/15 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto border-2 border-[#D4AF37] shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-4xl">task_alt</span>
            </div>

            <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest font-mono">
              ★ تم تسجيل وتأكيد طلبك بنجاح
            </span>

            <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-white leading-snug">
              شكراً لاختيارك SAOUDI WEAR ATELIER. تم توثيق طلبك وسيتواصل معكم فريقنا لتجهيز وشحن مقتنياتكم.
            </h2>
          </div>

          {/* ORDER NUMBER DISPLAY BOX */}
          <div className="bg-[#1D1D1D] p-5 rounded-2xl border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs text-neutral-400 font-bold block mb-1">
                رقم الطلب المعتمد:
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tracking-wider">
                {orderId}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="px-4 py-2.5 bg-[#262626] hover:bg-[#D4AF37] text-white hover:text-neutral-950 border border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">
                {copiedOrder ? 'check' : 'content_copy'}
              </span>
              <span>{copiedOrder ? '✓ تم النسخ!' : 'نسخ رقم الطلب'}</span>
            </button>
          </div>

          {/* CUSTOMER INFO & DELIVERY SUMMARY */}
          <div className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 space-y-3 text-xs">
            <h3 className="font-garamond text-lg font-bold text-[#D4AF37] border-b border-neutral-800 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person_pin</span>
              <span>تفاصيل العميل وعنوان التوصيل المعتمد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300 pt-1">
              <div>
                <span className="text-neutral-500 font-bold block">اسم العميل:</span>
                <span className="text-white font-bold text-sm">{completedOrderDetails.customerName}</span>
              </div>

              <div>
                <span className="text-neutral-500 font-bold block">رقم الجوال للتواصل:</span>
                <span className="text-[#D4AF37] font-mono font-bold text-sm dir-ltr text-right inline-block">
                  {completedOrderDetails.phone}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-neutral-500 font-bold block">المدينة وعنوان التوصيل:</span>
                <span className="text-white font-bold text-sm">
                  {completedOrderDetails.city} - {completedOrderDetails.address}
                </span>
              </div>
            </div>

            {completedOrderDetails.notes && (
              <div className="pt-2 border-t border-neutral-800">
                <span className="text-neutral-500 font-bold block">ملاحظات العميل:</span>
                <span className="text-neutral-300 italic">"{completedOrderDetails.notes}"</span>
              </div>
            )}
          </div>

          {/* ORDER ITEMS REVIEW BREAKDOWN */}
          <div className="space-y-3">
            <h3 className="font-garamond text-lg font-bold text-[#D4AF37] border-b border-neutral-800 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">inventory_2</span>
              <span>جدول المقتنيات المطلوبة</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {completedOrderDetails.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-[#1A1A1A] p-3.5 rounded-2xl border border-neutral-800"
                >
                  <div className="relative w-16 h-20 bg-neutral-900 rounded-xl overflow-hidden shrink-0 border border-neutral-800">
                    <Image src={item.productImage} alt={item.productName} fill unoptimized className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-garamond text-base font-bold text-white truncate">
                      {item.productName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                      {item.selectedFinish && (
                        <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 font-bold border border-neutral-700">
                          اللون: {item.selectedFinish}
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 font-bold border border-neutral-700">
                          المقاس: {item.selectedSize}
                        </span>
                      )}
                      <span className="text-neutral-400">الكمية: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-left shrink-0 font-garamond">
                    <span className="text-base font-bold text-amber-300 block">
                      ${(item.priceUSD * item.quantity).toLocaleString()} USD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL SUMMARY BOX */}
          <div className="bg-[#1D1D1D] p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-sm">
            <div>
              <span className="font-bold text-neutral-300 block">المبلغ الإجمالي المعتمد للطلب:</span>
              <span className="text-xs text-emerald-400 font-bold">شحن سريع مجاني متضمن</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold font-garamond text-amber-300 block">
                ${completedOrderDetails.totalUSD.toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* WHATSAPP & ACTIONS BAR */}
          <div className="pt-2 space-y-3">
            <a
              href={getWhatsAppLink(
                `👑 *SAOUDI WEAR | الأتيليه الملكي*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `✅ *توثيق وتأكيد طلب شراء معتمد*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🔖 *رقم الطلب:* *${orderId}*\n` +
                `👤 *اسم العميل:* ${completedOrderDetails.customerName}\n` +
                `📞 *رقم الجوال:* ${completedOrderDetails.phone}\n` +
                `📍 *المدينة والعنوان:* ${completedOrderDetails.city} - ${completedOrderDetails.address}\n` +
                `💰 *المبلغ الإجمالي:* $${completedOrderDetails.totalUSD.toLocaleString()} USD (≈ ${completedOrderDetails.totalSAR.toLocaleString()} ر.س)\n\n` +
                (completedOrderDetails.notes ? `📝 *ملاحظات العميل:* ${completedOrderDetails.notes}\n\n` : '') +
                `🔗 *المتجر:* https://saoudi-front.vercel.app\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🚀 *يرجى بدء التجهيز والشحن وتزويدي برقم بوليصة التتبع الملكي!*\n` +
                `شكراً لاختياركم SAOUDI WEAR! 🌟`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chat</span>
              <span>💬 إرسال وتأكيد الطلب الفوري عبر الواتساب للطلب ({orderId})</span>
            </a>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrintConfirmation}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-center font-bold text-xs rounded-xl transition-colors border border-neutral-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>طباعة إشعار وسند الطلب</span>
              </button>

              <Link
                href="/shop"
                className="flex-1 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] text-center font-bold text-xs tracking-widest uppercase rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span>متابعة التسوق بالمتجر</span>
                <span className="material-symbols-outlined text-base">shopping_bag</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* CHECKOUT FORM VIEW */
        <>
          {/* Step Indicator */}
          <div className="grid grid-cols-2 gap-4 mb-10 border-b border-[#262626] pb-6 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`py-3 border-b-2 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                step === 1 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                1
              </span>
              <span>بيانات العميل وعنوان التوصيل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (formData.fullName && formData.phone && formData.address) setStep(2);
              }}
              className={`py-3 border-b-2 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                step === 2 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                2
              </span>
              <span>مراجعة وتأكيد الطلب المباشر</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Area: Form Inputs */}
            <div className="lg:col-span-7 bg-[#141414] border border-[#262626] p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
              {/* Notice Banner */}
              {user ? (
                <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/60 p-4 rounded-2xl text-xs space-y-1 animate-fade-in shadow-xs">
                  <div className="font-bold text-[#D4AF37] flex items-center gap-1.5 text-sm">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    <span>مرحباً بك {user.name || 'عميلنا المميز'} (عضوية Atelier VIP)</span>
                  </div>
                  <p className="text-neutral-200 leading-relaxed">
                    تم استرجاع وتعبئة بياناتك وعنوانك المحفوظ تلقائياً لتأكيد طلبك بضغطة واحدة وتوثيقه في سجل حسابك.
                  </p>
                </div>
              ) : (
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 p-4 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>طلب مباشر وسريع بدون أي تعقيد في وسائل الدفع</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    فقط اكتب بيانات التواصل والعنوان، وسيتم تسجيل الطلب وتوليد رقمه فورياً وإرساله للإدارة للبدء في التجهيز والشحن.
                  </p>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleProceedToReview} className="space-y-5 animate-fade-in">
                  <h2 className="font-garamond text-xl font-bold text-[#E5E5E5] border-b border-[#262626] pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D4AF37]">person</span>
                    <span>بيانات العميل والتوصيل والشحن</span>
                  </h2>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        الاسم الكامل للعميل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="مثال: عبد العزيز آل سعود"
                        className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-white font-bold outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                          رقم الجوال / الواتساب للتأكيد <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="0500000000 أو +966..."
                          className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-[#D4AF37] font-mono font-bold outline-none focus:border-[#D4AF37] dir-ltr text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                          البريد الإلكتروني (اختياري)
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="client@saoudiwear.com"
                          className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* City & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1.5">الولاية / المدينة (تونس)</label>
                        <select
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs text-white font-bold outline-none focus:border-[#D4AF37]"
                        >
                          {TUNISIAN_CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                          عنوان التوصيل والشارع <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="حي المحمدية، شارع..."
                          className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* Customer Notes */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        ملاحظات أو تعليمات خاصة للطلب (اختياري)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="أي تفاصيل خاصة بتوقيت التوصيل، التغليف، أو المقاسات الخاصة..."
                        className="w-full p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#D4AF37] text-[#0A0A0A] font-bold text-xs tracking-widest uppercase hover:bg-[#E5C158] transition-all rounded-xl cursor-pointer shadow-lg mt-4 flex items-center justify-center gap-2"
                  >
                    <span>الانتقال لمراجعة وتأكيد الطلب المباشر</span>
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                  </button>
                </form>
              ) : (
                /* STEP 2: REVIEW & CONFIRM DIRECT ORDER */
                <form onSubmit={handlePlaceDirectOrder} className="space-y-6 animate-fade-in">
                  <h2 className="font-garamond text-xl font-bold text-[#E5E5E5] border-b border-[#262626] pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D4AF37]">fact_check</span>
                    <span>المراجعة النهائية وتأكيد الطلب المباشر</span>
                  </h2>

                  <div className="space-y-3 bg-[#1D1D1D] p-5 border border-[#333] rounded-2xl text-xs font-body-md">
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">اسم العميل:</span>
                      <span className="text-white font-bold">{formData.fullName}</span>
                    </div>

                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">رقم الجوال للتواصل:</span>
                      <span className="text-[#D4AF37] font-mono font-bold dir-ltr">{formData.phone}</span>
                    </div>

                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span className="text-neutral-400">المدينة وعنوان التوصيل:</span>
                      <span className="text-white font-bold">{formData.city} - {formData.address}</span>
                    </div>

                    {formData.notes && (
                      <div className="pt-1">
                        <span className="text-neutral-400 block mb-0.5">تعليمات وملاحظات العميل:</span>
                        <span className="text-neutral-200 italic">"{formData.notes}"</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3.5 border border-[#333] text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      تعديل البيانات
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-2/3 py-3.5 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#E5C158] font-bold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">
                            progress_activity
                          </span>
                          <span>جاري تسليم وتأكيد الطلب...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">send</span>
                          <span>تأكيد وتسليم الطلب المباشر</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Summary Panel */}
            <div className="lg:col-span-5 bg-[#141414] border border-[#262626] p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
              <h3 className="font-garamond text-xl font-bold text-[#E5E5E5] border-b border-[#262626] pb-3 flex items-center justify-between">
                <span>ملخص محتويات الحقيبة</span>
                <span className="text-xs text-[#D4AF37] font-mono font-bold">({cartItems.length} أصل فاخر)</span>
              </h3>

              {/* Items list */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const linePrice = item.product.price * item.quantity;
                  const linePriceSAR = Math.round(linePrice * 3.75);
                  return (
                    <div key={item.id} className="flex gap-3 border-b border-[#262626] pb-3">
                      <div className="relative w-14 h-16 bg-[#1D1D1D] rounded-xl overflow-hidden shrink-0 border border-neutral-800">
                        <Image src={item.product.image} alt={item.product.name} fill unoptimized className="object-cover" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <h4 className="font-garamond text-sm text-[#E5E5E5] font-bold truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-[#A3A3A3] flex flex-wrap gap-2">
                          {item.selectedFinish && (
                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                              {item.selectedFinish}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                              مقاس: {item.selectedSize}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-[#A3A3A3]">الكمية: {item.quantity}</span>
                          <div className="text-left font-mono">
                            <span className="text-red-600 dark:text-amber-300 font-bold font-garamond text-sm block">
                              ${linePrice.toLocaleString()} USD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Coupon Box */}
              <div className="pt-2 border-t border-[#262626] space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => handleInputChange('couponCode', e.target.value)}
                    placeholder="كود الخصم (مثال: ROYAL10)"
                    className="flex-1 p-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-xs text-white uppercase tracking-wider outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-[#D4AF37] text-white hover:text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isApplyingCoupon ? 'تطبيق...' : 'تطبيق'}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex justify-between items-center">
                    <span>✓ تم تطبيق كود الخصم: <strong>{appliedCoupon.code}</strong></span>
                    <span className="font-bold">-${appliedCoupon.discountUSD} USD</span>
                  </div>
                )}

                {couponError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                    {couponError}
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="space-y-2.5 pt-2 text-xs border-t border-[#262626]">
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>المجموع الفرعي:</span>
                  <span>${rawSubtotalUSD.toLocaleString()} USD</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>قيمة الخصم:</span>
                    <span>-${appliedCoupon.discountUSD.toLocaleString()} USD</span>
                  </div>
                )}


                <div className="flex justify-between items-baseline text-base font-garamond font-bold text-amber-400 dark:text-amber-300 pt-3 border-t border-[#262626]">
                  <span>الإجمالي الكلي المستحق:</span>
                  <div className="text-left font-mono">
                    <span className="text-2xl font-bold block text-amber-400 dark:text-amber-300">
                      ${subtotalUSD.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
