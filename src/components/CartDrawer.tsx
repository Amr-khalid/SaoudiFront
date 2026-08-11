'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeCartItem,
    clearCart,
    getWhatsAppLink,
    showConfirm,
    showToast,
  } = useApp();

  if (!isCartOpen) return null;

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalUSD = cartItems.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);
  const subtotalSAR = Math.round(subtotalUSD * 3.75);

  const handleClearAll = async () => {
    const isConfirmed = await showConfirm({
      title: 'تفريغ حقيبة التسوق',
      message: 'هل أنت متأكد من رغبتك في تفريغ ومسح كافة القطع المختارة من حقيبة التسوق؟',
      confirmText: 'نعم، تفريغ الحقيبة',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'remove_shopping_cart',
    });
    if (isConfirmed) {
      clearCart();
      showToast('تم تفريغ حقيبة التسوق بنجاح', 'info');
    }
  };

  // WhatsApp VIP Direct Cart Order
  const handleWhatsAppCheckout = () => {
    const defaultSiteUrl = 'https://saoudi-front.vercel.app';
    const itemsSummary = cartItems
      .map((item, idx) => {
        const hasSize = Boolean(
          item.selectedSize &&
          item.selectedSize !== 'الافتراضي' &&
          item.selectedSize !== 'Default'
        );
        const hasColor = Boolean(
          item.selectedFinish &&
          item.selectedFinish !== 'الافتراضي' &&
          item.selectedFinish !== 'Default'
        );
        const sizeLine = hasSize ? ` | مقاس: ${item.selectedSize}` : '';
        const colorLine = hasColor ? ` | لون: ${item.selectedFinish}` : '';
        const pTotalUSD = (item.product.price || 0) * item.quantity;
        const pTotalSAR = Math.round(pTotalUSD * 3.75);

        return `${idx + 1}️⃣ *${item.product.name}*\n   ▫ الكمية: ${item.quantity}${sizeLine}${colorLine}\n   ▫ السعر: $${pTotalUSD.toLocaleString()} USD (≈ ${pTotalSAR.toLocaleString()} ر.س)`;
      })
      .join('\n\n');

    const messageText =
      `👑 *SAOUDI WEAR | الأتيليه الملكي*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ *طلب مقتنيات الحقيبة الملكية (VIP Cart Order)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *جدول القطع المختارة:*\n` +
      `${itemsSummary}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *المجموع الإجمالي المطلوب:*\n` +
      `▪ $${subtotalUSD.toLocaleString()} USD\n` +
      `▪ ≈ ${subtotalSAR.toLocaleString()} ريال سعودي\n` +
      `🚚 *الشحن:* شحن جوي سريع مجاني متضمن\n\n` +
      `🔗 *رابط المتجر:* ${defaultSiteUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *يرجى حجز القطع والتواصل معي لتأكيد عنوان التوصيل الملكي.*\n` +
      `شكراً لاختياركم SAOUDI WEAR! 🌟`;

    const whatsappUrl = getWhatsAppLink(messageText);
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md transition-all duration-300 dir-rtl">
      {/* Clickable Backdrop overlay to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsCartOpen(false)}
        aria-label="Close cart backdrop"
      />

      {/* Cart Slide-in Panel */}
      <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 border-r md:border-r-0 md:border-l border-neutral-200 dark:border-neutral-800 h-full flex flex-col justify-between shadow-2xl z-10 transition-colors duration-300 overflow-hidden">
        {/* ========================================================================= */}
        {/* TOP HEADER BAR                                                            */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#141414] border-b border-neutral-200 dark:border-neutral-800/90 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-[#FAF8F2]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#9A7B1C] dark:text-[#D4AF37] shadow-2xs">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-garamond text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white leading-tight">
                    حقيبة التسوق
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9A7B1C] text-white shadow-2xs">
                    {totalQuantity}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-label-caps uppercase tracking-widest block mt-0.5">
                  SAOUDI WEAR ATELIER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Clear All Button */}
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-600 dark:text-neutral-400 hover:text-rose-700 dark:hover:text-rose-400 border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="تفريغ جميع المنتجات"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  <span className="hidden sm:inline">تفريغ</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-800"
                title="إغلاق الحقيبة"
                aria-label="Close cart"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CART ITEMS SCROLLABLE LIST                                                */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-3.5">
          {cartItems.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 px-4 space-y-5 flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[#9A7B1C] dark:text-[#D4AF37] shadow-lg">
                  <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#D4AF37] text-neutral-950 flex items-center justify-center text-xs font-bold shadow-md">
                  0
                </span>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h4 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
                  حقيبة التسوق فارغة حالياً
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
                  لم تقم بإضافة أي قطعة إلى حقيبتك بعد. تصفح مجموعاتنا الفاخرة واختر ما يناسب ذوقك الرفيع.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  router.push('/shop');
                }}
                className="px-7 py-3 bg-gradient-to-r from-neutral-950 to-neutral-800 dark:from-[#D4AF37] dark:via-[#E5C158] dark:to-[#D4AF37] text-white dark:text-neutral-950 font-button text-xs tracking-widest uppercase font-bold rounded-xl transition-all hover:scale-105 shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-[#D4AF37] dark:text-neutral-950">
                  diamond
                </span>
                <span>استكشف الكتالوج الفاخر</span>
              </button>
            </div>
          ) : (
            /* Items List */
            cartItems.map((item) => {
              const itemPrice = item.product.price || 0;
              const itemTotalUSD = itemPrice * item.quantity;
              const itemTotalSAR = Math.round(itemTotalUSD * 3.75);
              const pId = String(item.product.id || (item.product as any)._id || '');

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 bg-white dark:bg-[#161616] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl flex gap-3.5 sm:gap-4 items-center hover:border-[#9A7B1C]/50 dark:hover:border-[#D4AF37]/50 transition-all shadow-xs group"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/product/${pId}`}
                    onClick={() => setIsCartOpen(false)}
                    className="relative w-20 h-24 sm:w-22 sm:h-26 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex-shrink-0 cursor-pointer shadow-2xs group-hover:scale-[1.02] transition-transform"
                  >
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        unoptimized
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <span className="material-symbols-outlined text-2xl">image</span>
                      </div>
                    )}
                  </Link>

                  {/* Info Column */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-label-caps uppercase tracking-widest text-[#9A7B1C] dark:text-[#D4AF37] font-bold block">
                          {item.product.category || 'Atelier'}
                        </span>
                        <Link
                          href={`/product/${pId}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-garamond text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 hover:text-[#9A7B1C] dark:hover:text-[#D4AF37] transition-colors truncate block"
                        >
                          {item.product.name}
                        </Link>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="إزالة هذه القطعة"
                        aria-label="Remove item"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>

                    {/* Selected Options (Size, Finish) */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {item.selectedSize && (
                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-bold rounded-md border border-neutral-200 dark:border-neutral-700/60">
                          المقاس: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedFinish && (
                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-bold rounded-md border border-neutral-200 dark:border-neutral-700/60">
                          اللون: {item.selectedFinish}
                        </span>
                      )}
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                      {/* Price display */}
                      <div>
                        <div className="font-garamond text-base sm:text-lg font-extrabold text-[#9A7B1C] dark:text-[#D4AF37] leading-none">
                          ${itemTotalUSD.toLocaleString()}{' '}
                          <span className="text-[10px] font-sans font-normal text-neutral-500 dark:text-neutral-400">
                            USD
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                          ≈ {itemTotalSAR.toLocaleString()} ر.س
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-bold text-sm transition-colors cursor-pointer"
                          title="تقليل الكمية"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-neutral-950 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-bold text-sm transition-colors cursor-pointer"
                          title="زيادة الكمية"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ORDER SUMMARY & CHECKOUT ACTIONS                                    */}
        {/* ========================================================================= */}
        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#141414] border-t border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4">
            {/* Total Display */}
            <div className="flex justify-between items-center text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
              <span className="font-garamond text-lg sm:text-xl">المجموع الإجمالي:</span>
              <div className="text-left font-mono">
                <span className="font-garamond text-xl sm:text-2xl font-extrabold text-[#9A7B1C] dark:text-[#D4AF37] block leading-tight">
                  ${subtotalUSD.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                  ≈ {subtotalSAR.toLocaleString()} ريال سعودي
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Direct Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  router.push('/checkout');
                }}
                className="w-full py-4 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] hover:from-[#836817] hover:to-[#B8860B] text-neutral-950 font-button text-xs tracking-widest uppercase font-bold transition-all shadow-lg rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>إتمام وتأكيد الطلب (Checkout)</span>
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>

              {/* VIP WhatsApp Direct Checkout Button */}
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30 group hover:scale-[1.01]"
              >
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                  chat
                </span>
                <span>طلب الحقيبة مباشرة عبر كونسيرج الواتساب (VIP)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
