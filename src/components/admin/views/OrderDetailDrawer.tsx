'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminOrder } from '../../../types';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

interface OrderDetailDrawerProps {
  order: AdminOrder | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

const ORDER_STEPS = [
  { key: 'pending', label: 'استلام الطلب', sub: 'Pending', icon: 'receipt_long' },
  { key: 'confirmed', label: 'مؤكد ومعتمد', sub: 'Confirmed', icon: 'check_circle' },
  { key: 'preparing', label: 'قيد التجهيز', sub: 'Preparing', icon: 'precision_manufacturing' },
  { key: 'packed', label: 'تم التغليف', sub: 'Packed', icon: 'inventory_2' },
  { key: 'shipped', label: 'تم الشحن', sub: 'Shipped', icon: 'local_shipping' },
  { key: 'delivered', label: 'تم التسليم', sub: 'Delivered', icon: 'verified' },
];

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onUpdateStatus,
}) => {
  const { showAlert, showConfirm, showToast } = useApp();
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [showRefundInput, setShowRefundInput] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (order) {
      setAdminNoteInput(order.adminNotes || order.notes || '');
      setRefundAmountInput(String(order.total || order.totalAmount || 0));
      setCurrentStatus(String(order.status || 'pending').toLowerCase());
    }
  }, [order]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const totalUSD = Number(order.total || order.totalAmount || 0);
  const totalSAR = Math.round(totalUSD * 3.75);
  const subtotalUSD = Number(order.subtotal || totalUSD);
  const subtotalSAR = Math.round(subtotalUSD * 3.75);
  const taxUSD = Number(order.taxAmount || order.taxes || 0);
  const shippingCost = Number(order.shipping?.cost || 0);
  const cleanPhone = (order.customerPhone || '').replace(/[^0-9+]/g, '');

  const formatOrderTime = (dateInput?: string) => {
    if (!dateInput) return '--:--';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatOrderDate = (dateInput?: string) => {
    if (!dateInput) return '---';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatOrderFullDateTime = (dateInput?: string) => {
    if (!dateInput) return '---';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${year}/${month}/${day} • ${time}`;
  };

  const handleUpdateStatusDirect = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const orderId = order.id || order._id || '';
      await api.updateOrderStatus(orderId, newStatus);
      setCurrentStatus(newStatus);
      onUpdateStatus(orderId, newStatus);
    } catch (err: any) {
      console.warn('Status update notice:', err);
      setCurrentStatus(newStatus);
      onUpdateStatus(order.id || order._id || '', newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendWhatsApp = () => {
    const itemsSummary = (order.items || [])
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName || it.name} (${it.quantity} قطعة) ${
            it.variantFinish ? `• لون: ${it.variantFinish}` : ''
          } ${it.variantSize ? `• مقاس: ${it.variantSize}` : ''}`
      )
      .join('\n');

    const messageText = `مرحباً بك ${order.customerName} في SAOUDI WEAR ATELIER 💎\n\nنود إفادتك ببيانات وتحديث طلبك رقم: *${order.orderNumber}*\n\n📌 الحالة الحالية: *${getStatusLabel(currentStatus)}*\n💰 إجمالي الطلب: $${totalUSD.toLocaleString()} USD (≈ ${totalSAR.toLocaleString()} ر.س)\n📍 عنوان التوصيل: ${order.shipping?.address || order.shippingAddress || ''}، ${order.shipping?.city || order.city || 'تونس'}\n🚚 رقم التتبع: ${order.trackingNumber || 'قيد الإصدار'}\n\n📦 المقتنيات المطلوبة:\n${itemsSummary}\n\nيسعدنا دائماً خدمتكم بأعلى معايير الفخامة!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const handleCopyTracking = () => {
    const trk = order.trackingNumber || `SW-TN-${order.orderNumber}`;
    navigator.clipboard.writeText(trk);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleSaveNotes = async () => {
    setIsSavingNote(true);
    try {
      await api.updateOrderNotes(order.id || order._id || '', adminNoteInput);
      showToast('تم حفظ ملاحظات الإدارة بنجاح في قاعدة البيانات!', 'success');
    } catch (err: any) {
      showAlert({
        title: 'خطأ في الحفظ',
        message: err.message || 'حدث خطأ أثناء حفظ الملاحظات.',
        type: 'danger',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleProcessRefund = async () => {
    const amt = Number(refundAmountInput) || totalUSD;
    const isConfirmed = await showConfirm({
      title: 'تأكيد الاسترداد المالي',
      message: `هل أنت متأكد من معالجة الاسترداد المالي بمبلغ $${amt} USD لهذا الطلب؟ سيتم تدوين الحركة في السجل المالي وتحديث حالة الطلب.`,
      confirmText: 'نعم، معالجة الاسترداد',
      cancelText: 'إلغاء',
      type: 'warning',
      icon: 'currency_exchange',
    });

    if (isConfirmed) {
      try {
        await api.processRefund(order.id || order._id || '', amt);
        showToast('تم تنفيذ الاسترداد وتدوين الحركة في السجل المالي!', 'success');
        setShowRefundInput(false);
        handleUpdateStatusDirect('refunded');
      } catch (err: any) {
        showAlert({
          title: 'فشل الاسترداد',
          message: err.message || 'فشلت عملية الاسترداد المالي.',
          type: 'danger',
        });
      }
    }
  };

  function getStatusLabel(status: string) {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return 'قيد الاستلام (Pending)';
      case 'confirmed':
        return 'طلب مؤكد (Confirmed)';
      case 'preparing':
      case 'processing':
        return 'قيد التجهيز (Preparing)';
      case 'packed':
        return 'تم التغليف (Packed)';
      case 'shipped':
        return 'تم الشحن والتسليم للناقل (Shipped)';
      case 'delivered':
        return 'تم التسليم للعميل (Delivered)';
      case 'cancelled':
        return 'ملغى (Cancelled)';
      case 'refunded':
        return 'مسترد مالياً (Refunded)';
      default:
        return status;
    }
  }

  function getPaymentStatusBadge(status?: string) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'paid')
      return (
        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-full font-bold text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>مدفوع بالكامل (Paid)</span>
        </span>
      );
    if (s === 'refunded')
      return (
        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700 rounded-full font-bold text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>مسترد مالياً (Refunded)</span>
        </span>
      );
    return (
      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-full font-bold text-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>الدفع عند الاستلام (COD)</span>
      </span>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((st) => st.key === currentStatus);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl overflow-hidden">
      {/* Printable Invoice Section (Visible Only in Print Mode) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[10000] text-xs dir-rtl">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-garamond uppercase tracking-widest">
              SAOUDI WEAR ATELIER
            </h1>
            <p className="text-[10px] text-neutral-600">
              فاتورة تجارية رسمية — Official Tax & Commercial Invoice
            </p>
          </div>
          <div className="text-left font-mono">
            <p className="font-bold text-sm">رقم الفاتورة: #{order.orderNumber}</p>
            <p className="text-[10px] text-neutral-600">
              التاريخ والوقت: {formatOrderFullDateTime(order.createdAt || order.date)}
            </p>
          </div>
        </div>

        <div className="my-4 grid grid-cols-2 gap-4 border-b pb-4">
          <div>
            <p className="font-bold text-neutral-800">بيانات العميل المستلم:</p>
            <p className="text-sm font-bold mt-1">{order.customerName}</p>
            <p className="font-mono">{order.customerPhone}</p>
            <p>{order.customerEmail}</p>
          </div>
          <div>
            <p className="font-bold text-neutral-800">عنوان الشحن والتوصيل:</p>
            <p className="mt-1">{order.shipping?.address || order.shippingAddress}</p>
            <p>
              {order.shipping?.city || order.city || 'تونس العاصمة'}،{' '}
              {order.shipping?.country || order.country || 'تونس'}
            </p>
          </div>
        </div>

        <table className="w-full text-right border-collapse border border-neutral-300 my-4 text-xs">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300">
              <th className="p-2 border-l">#</th>
              <th className="p-2 border-l">المنتج والمواصفات</th>
              <th className="p-2 border-l">اللون / المقاس</th>
              <th className="p-2 border-l">الكمية</th>
              <th className="p-2 border-l">سعر الوحدة (USD)</th>
              <th className="p-2">الإجمالي (USD)</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it, i) => (
              <tr key={i} className="border-b border-neutral-200">
                <td className="p-2 border-l font-mono">{i + 1}</td>
                <td className="p-2 border-l font-bold">{it.productName || it.name}</td>
                <td className="p-2 border-l">
                  {it.variantFinish || 'افتراضي'} / {it.variantSize || 'قياسي'}
                </td>
                <td className="p-2 border-l font-mono">{it.quantity}</td>
                <td className="p-2 border-l font-mono">
                  ${(it.unitPrice || it.price || 0).toLocaleString()}
                </td>
                <td className="p-2 font-mono font-bold">
                  ${((it.unitPrice || it.price || 0) * it.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end my-4">
          <div className="w-64 space-y-1 text-xs border border-neutral-300 p-3 rounded-lg bg-neutral-50 font-mono">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>${subtotalUSD.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-neutral-300 pt-1 text-black">
              <span>الإجمالي النهائي:</span>
              <span>${totalUSD.toLocaleString()} USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop Click */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Centered Luxury Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden z-10 transition-all">
        
        {/* Top Luxury Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0C0C0C] via-[#141414] to-[#0C0C0C] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-md">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-extrabold flex-wrap">
                <span className="text-[#D4AF37] font-mono">SAOUDI WEAR ATELIER</span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-300 font-mono flex items-center gap-1 bg-neutral-900/90 px-2.5 py-0.5 rounded-md border border-neutral-800">
                  <span className="material-symbols-outlined text-xs text-[#D4AF37]">calendar_today</span>
                  <span>{formatOrderDate(order.createdAt || order.date)}</span>
                </span>
                <span className="text-neutral-300 font-mono flex items-center gap-1 bg-neutral-900/90 px-2.5 py-0.5 rounded-md border border-neutral-800">
                  <span className="material-symbols-outlined text-xs text-[#D4AF37]">schedule</span>
                  <span>{formatOrderTime(order.createdAt || order.date)}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-garamond text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                    تفاصيل الطلب:
                  </span>
                  <span className="font-mono text-[#D4AF37] text-xl sm:text-2xl font-extrabold" dir="ltr">
                    #{order.orderNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  title="نسخ رقم الطلب"
                  className="px-2.5 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono border border-neutral-700 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedOrder ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedOrder ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800/90 hover:bg-[#D4AF37] hover:text-neutral-950 text-neutral-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-neutral-700 shadow-sm"
              title="طباعة الفاتورة الرسمية"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>طباعة الفاتورة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-neutral-800/90 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer border border-neutral-700"
              title="إغلاق النافذة"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar text-xs">
          
          {/* Status & Lifecycle Stepper Bar */}
          <div className="p-5 bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  الحالة التشغيلية الحالية للطلب:
                </span>
                <span className="font-extrabold text-sm text-[#9A7B1C] dark:text-[#D4AF37]">
                  {getStatusLabel(currentStatus)}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-normal">
                اضغط على أي مرحلة بالأسفل لتحديث الحالة فورياً
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              {ORDER_STEPS.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <button
                    key={st.key}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatusDirect(st.key)}
                    className={`p-3 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 font-extrabold border-[#D4AF37] shadow-md scale-[1.03]'
                        : isPassed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100'
                        : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{st.icon}</span>
                    <span className="text-[11px] font-bold leading-tight">{st.label}</span>
                    <span className="text-[9px] opacity-70 font-mono">{st.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (Cancel / Restock) */}
            <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800 flex-wrap gap-2">
              <div className="text-[11px] text-neutral-400 font-mono">
                {isUpdatingStatus ? 'جاري تحديث السجل...' : 'تحديث متزامن تلقائياً مع المخزون والخدمة'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatusDirect('cancelled')}
                  className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  <span>إلغاء الطلب (واسترجاع المخزون)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Profile & Shipping Destination Grid (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Customer Profile */}
            <div className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
                <span className="text-xs uppercase font-extrabold text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>بيانات العميل وصاحب الطلب</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">CUSTOMER PROFILE</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-neutral-400">الاسم الكامل للعميل:</div>
                  <div className="font-garamond text-xl font-bold text-neutral-950 dark:text-white mt-0.5">
                    {order.customerName}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-neutral-400 block">رقم الهاتف للتواصل:</span>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="font-mono font-bold text-[#9A7B1C] dark:text-[#D4AF37] hover:underline flex items-center gap-1 text-xs"
                      dir="ltr"
                    >
                      <span className="material-symbols-outlined text-sm">call</span>
                      <span>{order.customerPhone || 'غير مسجل'}</span>
                    </a>
                  </div>

                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-neutral-400 block">البريد الإلكتروني:</span>
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="font-mono text-neutral-700 dark:text-neutral-300 hover:underline truncate block text-xs"
                      dir="ltr"
                    >
                      {order.customerEmail || 'customer@saoudi.com'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>إرسال تفاصيل الفاتورة للعميل عبر الواتساب</span>
              </button>
            </div>

            {/* Card 2: Shipping & Courier */}
            <div className="bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
                <span className="text-xs uppercase font-extrabold text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  <span>عنوان التوصيل والوجهة (تونس)</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">DESTINATION</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-neutral-400">العنوان بالتفصيل:</div>
                  <div className="font-bold text-neutral-950 dark:text-white text-sm leading-relaxed mt-0.5">
                    {order.shipping?.address || order.shippingAddress || 'عنوان العميل المعتمد'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {order.shipping?.city || order.city || 'تونس العاصمة'} —{' '}
                    {order.shipping?.country || order.country || 'الجمهورية التونسية'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-neutral-400 block">شركة الشحن المعتمدة:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block truncate">
                      {order.courierCompany || 'أسطول SAOUDI WEAR Express'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-neutral-400 block">رقم التتبع والمتابعة:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#9A7B1C] dark:text-[#D4AF37] text-xs" dir="ltr">
                        {order.trackingNumber || `SW-TN-${order.orderNumber}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyTracking}
                        title="نسخ رقم التتبع"
                        className="text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedTracking ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Tag */}
              <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[11px] text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#D4AF37]">pin_drop</span>
                <span>توصيل معتمد داخل كافة ولايات الجمهورية التونسية</span>
              </div>
            </div>
          </div>

          {/* Customer Special Instructions / Notes */}
          {(order.customerNotes || order.notes) && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A7B1C] dark:text-[#D4AF37]">
                <span className="material-symbols-outlined text-base">sticky_note_2</span>
                <span>ملاحظات وتعليمات خاصة من العميل:</span>
              </div>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal">
                "{order.customerNotes || order.notes}"
              </p>
            </div>
          )}

          {/* Ordered Line Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37]">shopping_bag</span>
                <span>قائمة المنتجات المطلوبة ({order.items?.length || 0})</span>
              </h3>
              <span className="text-xs text-neutral-500 font-mono">
                {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)} قطع إجمالية
              </span>
            </div>

            <div className="space-y-3">
              {(order.items || []).map((item, idx) => {
                const imgUrl =
                  item.image ||
                  item.productImage ||
                  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop';
                const pName = item.productName || item.name || 'منتج فاخر';
                const uPriceUSD = Number(item.unitPrice || item.price || 0);
                const uPriceSAR = Math.round(uPriceUSD * 3.75);
                const lineTotalUSD = uPriceUSD * item.quantity;
                const lineTotalSAR = Math.round(lineTotalUSD * 3.75);

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl items-start sm:items-center justify-between hover:border-[#D4AF37]/60 transition-all shadow-2xs"
                  >
                    <div className="flex gap-3.5 items-center">
                      <div className="relative w-16 h-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                        <Image src={imgUrl} alt={pName} fill unoptimized className="object-cover" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="font-garamond text-base font-bold text-neutral-950 dark:text-white leading-tight">
                          {pName}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {item.variantFinish && (
                            <span className="px-2.5 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md font-bold text-neutral-800 dark:text-neutral-200">
                              اللون: {item.variantFinish}
                            </span>
                          )}
                          {item.variantSize && (
                            <span className="px-2.5 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md font-bold text-neutral-800 dark:text-neutral-200">
                              المقاس: {item.variantSize}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                          الكمية: <strong>{item.quantity}</strong> × ${uPriceUSD.toLocaleString()} USD (≈ {uPriceSAR.toLocaleString()} ر.س)
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono self-end sm:self-center">
                      <div className="font-garamond font-extrabold text-xl text-[#9A7B1C] dark:text-[#D4AF37]">
                        ${lineTotalUSD.toLocaleString()} USD
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                        ≈ {lineTotalSAR.toLocaleString()} ريال
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Financial Accounting Breakdown */}
          <div className="p-5 bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3.5 shadow-xs">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
              <span className="font-bold text-neutral-950 dark:text-white text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#D4AF37]">payments</span>
                <span>المحاسبة المالية والتكلفة الإجمالية</span>
              </span>
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>المبلغ الفرعي للمنتجات:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  ${subtotalUSD.toLocaleString()} USD
                </span>
              </div>

              {order.coupon?.code && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>كوبون الخصم المعتمد ({order.coupon.code}):</span>
                  <span className="font-mono">-${(order.coupon.discount || 0).toLocaleString()} USD</span>
                </div>
              )}

              {taxUSD > 0 && (
                <div className="flex justify-between">
                  <span>الضريبة المضافة:</span>
                  <span className="font-mono text-neutral-900 dark:text-white">${taxUSD.toLocaleString()} USD</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>الشحن والتوصيل:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {shippingCost === 0 ? 'مجاني بالكامل (Complimentary Express)' : `$${shippingCost.toLocaleString()} USD`}
                </span>
              </div>

              <div className="flex justify-between text-neutral-950 dark:text-white font-bold text-base border-t border-neutral-200 dark:border-neutral-800 pt-3 font-garamond">
                <span>إجمالي الطلب المستحق:</span>
                <div className="text-left font-mono">
                  <span className="text-[#9A7B1C] dark:text-[#D4AF37] font-extrabold text-2xl block">
                    ${totalUSD.toLocaleString()} USD
                  </span>
                  <span className="text-xs text-neutral-500 font-normal">
                    ≈ {totalSAR.toLocaleString()} ريال سعودي
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Administrative Staff Notes */}
          <div className="space-y-2.5 bg-neutral-50 dark:bg-[#181818] p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs">
            <label className="block text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-base">edit_note</span>
              <span>ملاحظات المشغل والإدارة الداخلية (Internal Notes)</span>
            </label>
            <textarea
              rows={2}
              value={adminNoteInput}
              onChange={(e) => setAdminNoteInput(e.target.value)}
              placeholder="اكتب أي ملاحظات خاصة بالتجهيز أو خدمة العملاء أو التعديل الداخلي..."
              className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-950 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNote}
                className="px-4 py-2 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{isSavingNote ? 'جاري الحفظ...' : 'حفظ الملاحظات'}</span>
              </button>
            </div>
          </div>

          {/* Refund Trigger Section */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {!showRefundInput ? (
              <button
                type="button"
                onClick={() => setShowRefundInput(true)}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">currency_exchange</span>
                <span>معالجة استرداد مالي للطلب (Process Refund)</span>
              </button>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                  مبلغ الاسترداد المالي ($ USD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(e.target.value)}
                    placeholder={`إجمالي الطلب: $${totalUSD}`}
                    className="flex-1 p-2.5 bg-white dark:bg-neutral-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-bold font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleProcessRefund}
                    className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800 transition-colors cursor-pointer"
                  >
                    تأكيد الاسترداد
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRefundInput(false)}
                    className="px-3 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-neutral-300 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-neutral-100 dark:bg-[#161616] border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-[#D4AF37]"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>طباعة الفاتورة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-950 dark:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 transition-colors cursor-pointer shadow-md"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
