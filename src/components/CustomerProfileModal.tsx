'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AdminOrder } from '../types';

const ORDER_STEPS = [
  { key: 'pending', label: 'استلام الطلب', icon: 'receipt_long' },
  { key: 'confirmed', label: 'مؤكد', icon: 'check_circle' },
  { key: 'preparing', label: 'قيد التجهيز', icon: 'precision_manufacturing' },
  { key: 'packed', label: 'تم التغليف', icon: 'inventory_2' },
  { key: 'shipped', label: 'تم الشحن', icon: 'local_shipping' },
  { key: 'delivered', label: 'تم التسليم', icon: 'verified' },
];

export const CustomerProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    user,
    setUser,
    isAdmin,
    logout,
    showToast,
    theme,
    lang,
    getWhatsAppLink,
    setIsAuthOpen,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'track' | 'profile'>('orders');
  const [myOrders, setMyOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Public Order Tracker State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<AdminOrder | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileCity(user.city || (user.addresses && user.addresses[0]?.city) || 'الرياض');
      setProfileAddress(user.address || (user.addresses && user.addresses[0]?.street) || '');
    }
  }, [user]);

  const fetchCustomerOrders = () => {
    if (!user) return;
    setLoadingOrders(true);
    api.getMyOrders().then((orders) => {
      if (orders && orders.length > 0) {
        setMyOrders(orders);
      }
      setLoadingOrders(false);
    }).catch(() => setLoadingOrders(false));
  };

  useEffect(() => {
    if (isProfileOpen && activeTab === 'orders' && user) {
      fetchCustomerOrders();
    }
  }, [isProfileOpen, activeTab, user]);

  if (!isProfileOpen) return null;

  const isDark = theme === 'dark';

  // Strict Authentication Guard: If user is not logged in, hide all order history and profile details
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in dir-rtl">
        <div
          className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl relative space-y-6 text-center transition-colors duration-300 ${
            isDark
              ? 'bg-[#141414] border-[#262626] text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsProfileOpen(false)}
            className={`absolute top-4 left-4 p-2 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="إغلاق"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          {/* Luxury Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          {/* Heading and Description */}
          <div className="space-y-2">
            <h2 className="font-garamond text-2xl sm:text-3xl font-bold">
              {lang === 'ar' ? 'سجل ومسار الطلبات الحية' : 'Track Order History'}
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {lang === 'ar'
                ? 'يتطلب الوصول إلى سجل ومسار طلباتك الحية وتتبع الشحنات تسجيل الدخول أولاً بحسابك في SAOUDI WEAR.'
                : 'Please sign in to your SAOUDI WEAR account to access and track your active orders and shipping history.'}
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setIsProfileOpen(false);
                setIsAuthOpen(true);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-950 font-button text-xs tracking-widest uppercase font-bold rounded-xl transition-all shadow-md hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span>{lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب جديد' : 'Sign In / Register'}</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(false)}
              className={`w-full py-3 border font-button text-xs tracking-widest uppercase rounded-xl transition-colors cursor-pointer font-bold ${
                isDark
                  ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {lang === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    showToast(lang === 'ar' ? `تم نسخ رقم الطلب #${orderNumber}` : `Copied Order #${orderNumber}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTrackError('');
    setTrackedOrder(null);

    try {
      const res = await api.trackOrder(trackQuery.trim());
      if (res) {
        setTrackedOrder(res);
      } else {
        setTrackError('لم يتم العثور على طلب بهذا الرقم. يرجى التأكد من كتابة رقم الطلب بالشكل الصحيح.');
      }
    } catch (err: any) {
      setTrackError(err.message || 'حدث خطأ أثناء البحث عن الطلب.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatedUser = {
        ...user,
        name: profileName.trim(),
        phone: profilePhone.trim(),
        city: profileCity.trim(),
        address: profileAddress.trim(),
        addresses: [{ street: profileAddress.trim(), city: profileCity.trim(), country: 'Saudi Arabia', isDefault: true }],
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saoudi_user', JSON.stringify(updatedUser));
      }
      if (user?._id || user?.id) {
        await api.updateCustomerProfile(user._id || user.id, updatedUser).catch(() => {});
      }
      showToast(lang === 'ar' ? 'تم حفظ وتحديث بياناتك وعنوانك بنجاح!' : 'Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSavingProfile(false);
    }
  };

  function getStepIndex(status: string) {
    const s = String(status || '').toLowerCase();
    return ORDER_STEPS.findIndex((st) => st.key === s);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in dir-rtl">
      <div
        className={`max-w-3xl w-full p-5 sm:p-8 rounded-3xl border shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar transition-colors duration-300 ${
          isDark
            ? 'bg-[#141414] border-[#262626] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsProfileOpen(false)}
          className={`absolute top-0 right-1 p-2 rounded-full transition-colors cursor-pointer ${
            isDark
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="إغلاق"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* User Profile Card Header */}
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5 ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {myOrders.length} طلبات مسجلة
                </span>
              </div>
              <h2 className={`font-garamond text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.name || 'عميل SAOUDI WEAR المميز'}
              </h2>
              <p className={`text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {user?.email || user?.phone || 'client@saoudiwear.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setIsProfileOpen(false)}
                className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b8952c] text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>لوحة الإدارة</span>
              </a>
            )}
            <button
              onClick={() => {
                logout();
                setIsProfileOpen(false);
              }}
              className={`px-3 py-1.5 border font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                isDark
                  ? 'border-rose-500/40 text-rose-300 hover:bg-rose-950'
                  : 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div
          className={`grid grid-cols-3 gap-2 p-1.5 rounded-2xl border text-xs font-bold ${
            isDark ? 'bg-[#1A1A1A] border-neutral-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#D4AF37] text-neutral-950 shadow-md font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span className="hidden sm:inline">سجل ومسار طلباتي</span>
            <span className="sm:hidden">طلباتي</span>
            <span>({myOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'track'
                ? 'bg-[#D4AF37] text-neutral-950 shadow-md font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">travel_explore</span>
            <span className="hidden sm:inline">تتبع شحنة برقم الطلب</span>
            <span className="sm:hidden">تتبع الطلب</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#D4AF37] text-neutral-950 shadow-md font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">home_pin</span>
            <span className="hidden sm:inline">بياناتي وعناوين التوصيل</span>
            <span className="sm:hidden">بياناتي</span>
          </button>
        </div>

        {/* TAB 1: MY ORDERS & LIVE TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="py-12 flex flex-col justify-center items-center text-[#D4AF37] gap-2">
                <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                <span className="text-xs font-label-caps uppercase">جاري تحميل سجل الطلبات الحية...</span>
              </div>
            ) : myOrders.length === 0 ? (
              <div
                className={`py-12 text-center space-y-3 rounded-2xl border p-6 ${
                  isDark
                    ? 'bg-[#1D1D1D] border-neutral-800 text-neutral-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-4xl text-[#D4AF37]">shopping_bag</span>
                <p className={`font-garamond text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  لا توجد طلبات سابقة مسجلة في حسابك حتى الآن.
                </p>
                <p className="text-xs">عند إتمام أي طلب، سيظهر هنا فورياً مع التايم لاين وتتبع الشحنة.</p>
              </div>
            ) : (
              myOrders.map((ord) => {
                const totalUSD = Number(ord.total || ord.totalAmount || 0);
                const totalSAR = Math.round(totalUSD * 3.75);
                const statusStr = String(ord.status || '').toLowerCase();
                const isCancelled = statusStr === 'cancelled' || statusStr === 'refunded';
                const isDelivered = statusStr === 'delivered';
                const currentStep = getStepIndex(ord.status);

                return (
                  <div
                    key={ord.id || ord._id}
                    className={`p-5 rounded-2xl space-y-4 shadow-sm border transition-all duration-300 ${
                      isCancelled
                        ? isDark
                          ? 'bg-gradient-to-b from-[#1E1114] to-[#161214] border-rose-900/60 shadow-rose-950/20'
                          : 'bg-gradient-to-b from-rose-50/80 to-rose-50/40 border-rose-300/80 shadow-rose-100'
                        : isDelivered
                        ? isDark
                          ? 'bg-gradient-to-b from-[#111A16] to-[#141414] border-emerald-900/50'
                          : 'bg-gradient-to-b from-emerald-50/80 to-white border-emerald-300/80'
                        : isDark
                        ? 'bg-[#1D1D1D] border-neutral-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Header of Order Card */}
                    <div
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3.5 ${
                        isCancelled
                          ? isDark ? 'border-rose-900/40' : 'border-rose-200'
                          : isDark ? 'border-neutral-800' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-lg font-bold flex items-center gap-1.5 ${
                              isCancelled
                                ? isDark ? 'text-rose-400 line-through opacity-80' : 'text-rose-800 line-through opacity-80'
                                : isDelivered
                                ? isDark ? 'text-emerald-400' : 'text-emerald-800'
                                : isDark ? 'text-[#D4AF37]' : 'text-amber-800'
                            }`}
                          >
                            #{ord.orderNumber}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyOrderNumber(ord.orderNumber)}
                            className={`p-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                            title="نسخ رقم الطلب"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedId === ord.orderNumber ? 'check' : 'content_copy'}
                            </span>
                          </button>

                          <span className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} dir="ltr">
                            • <span className="material-symbols-outlined text-[13px] text-[#D4AF37]">schedule</span>
                            {ord.createdAt ? `${new Date(ord.createdAt).getFullYear()}/${String(new Date(ord.createdAt).getMonth() + 1).padStart(2, '0')}/${String(new Date(ord.createdAt).getDate()).padStart(2, '0')} • ${new Date(ord.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ord.date}
                          </span>
                        </div>

                        <div className={`text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          العنوان: <strong>{ord.shipping?.city || ord.city}</strong> - {ord.shipping?.address || ord.shippingAddress}
                        </div>
                      </div>

                      {/* Status Badge with Distinct Color Identity */}
                      <div className="flex items-center gap-2">
                        {isCancelled ? (
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 shadow-xs ${
                              isDark
                                ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                                : 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            <span>{statusStr === 'refunded' ? 'مسترد مالياً (Refunded)' : 'طلب ملغي (Cancelled)'}</span>
                          </span>
                        ) : isDelivered ? (
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 shadow-xs ${
                              isDark
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">verified</span>
                            <span>تم التسليم بنجاح (Delivered)</span>
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 shadow-xs ${
                              isDark
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40'
                                : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm animate-pulse">sync</span>
                            <span>
                              {statusStr === 'pending'
                                ? 'قيد المراجعة'
                                : statusStr === 'confirmed'
                                ? 'مؤكد وجاري التجهيز'
                                : statusStr === 'preparing'
                                ? 'بالمشغل الفاخر'
                                : statusStr === 'packed'
                                ? 'تم التغليف'
                                : 'تم الشحن للتوصيل'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Stepper OR Cancellation Alert */}
                    {isCancelled ? (
                      <div
                        className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs leading-relaxed ${
                          isDark
                            ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                            : 'bg-rose-100/70 border-rose-300 text-rose-900'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl text-rose-500 shrink-0">
                          info
                        </span>
                        <div>
                          <strong className="block font-bold">تم إلغاء هذه العملية وإرجاع المنتجات إلى المخزون.</strong>
                          <span>إذا كان لديك أي استفسار أو رغبت في إعادة تفعيل الطلب، يمكنك التواصل معنا مباشرة.</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-[#141414] border-neutral-800/80' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                          {ORDER_STEPS.map((st, idx) => {
                            const isPassed = isDelivered || currentStep >= idx;
                            const isCurrent = currentStep === idx && !isDelivered;
                            return (
                              <div
                                key={st.key}
                                className={`p-1.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                                  isCurrent
                                    ? 'bg-[#D4AF37] text-neutral-950 font-bold shadow-xs'
                                    : isPassed
                                    ? isDark
                                      ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                                    : isDark
                                    ? 'text-neutral-500'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">{st.icon}</span>
                                <span className="leading-tight truncate w-full">{st.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      {(ord.items || []).map((it, i) => (
                        <div
                          key={i}
                          className={`flex justify-between items-center text-xs py-1.5 border-b ${
                            isDark ? 'border-neutral-800/40' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCancelled ? 'bg-rose-500' : isDelivered ? 'bg-emerald-500' : 'bg-[#D4AF37]'
                              }`}
                            />
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {it.productName || it.name}
                            </span>
                            <span className={`font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                              ({it.quantity} قطعة)
                            </span>
                            {it.variantFinish && (
                              <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                                • لون: {it.variantFinish}
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isCancelled
                                ? isDark ? 'text-rose-400/80 line-through' : 'text-rose-800/80 line-through'
                                : isDark ? 'text-[#D4AF37]' : 'text-amber-800'
                            }`}
                          >
                            ${((it.unitPrice || it.price || 0) * it.quantity).toLocaleString()} USD
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Action Buttons */}
                    <div
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t ${
                        isDark ? 'border-neutral-800' : 'border-slate-200'
                      }`}
                    >
                      <div className="font-mono">
                        <span className={`text-xs block font-bold ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                          المبلغ الإجمالي:
                        </span>
                        <span
                          className={`font-garamond text-lg font-bold block ${
                            isCancelled
                              ? isDark ? 'text-rose-400' : 'text-rose-800'
                              : isDelivered
                              ? isDark ? 'text-emerald-400' : 'text-emerald-800'
                              : isDark ? 'text-[#D4AF37]' : 'text-amber-900'
                          }`}
                        >
                          ${totalUSD.toLocaleString()} USD
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={getWhatsAppLink(
                            `مرحباً SAOUDI WEAR، أود الاستفسار عن حالة طلبي رقم ${ord.orderNumber}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-base">chat</span>
                          <span>مراسلة واتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PUBLIC ORDER TRACKER */}
        {activeTab === 'track' && (
          <div className="space-y-6 animate-fade-in">
            <form
              onSubmit={handleTrackSubmit}
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#1D1D1D] border-neutral-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <label className={`block text-xs font-bold ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                أدخل رقم الطلب أو رقم التتبع (مثال: SW-100001):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="SW-100001 أو أرقام الطلب..."
                  className={`flex-1 p-3 rounded-xl text-xs uppercase font-mono font-bold outline-none border transition-colors ${
                    isDark
                      ? 'bg-[#141414] border-neutral-700 text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                  }`}
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-5 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  <span>{trackingLoading ? 'جاري التتبع...' : 'تتبع الشحنة'}</span>
                </button>
              </div>
            </form>

            {trackError && (
              <div className="p-4 bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs rounded-2xl text-center font-bold">
                {trackError}
              </div>
            )}

            {trackedOrder && (
              <div
                className={`p-5 rounded-2xl border space-y-4 animate-fade-in ${
                  String(trackedOrder.status).toLowerCase() === 'cancelled'
                    ? isDark ? 'bg-[#1E1114] border-rose-800/60' : 'bg-rose-50 border-rose-300'
                    : isDark ? 'bg-[#1D1D1D] border-[#D4AF37]/50' : 'bg-white border-amber-400 shadow-md'
                }`}
              >
                <div
                  className={`flex justify-between items-center border-b pb-3 ${
                    isDark ? 'border-neutral-800' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      نتيجة التتبع للطلب:
                    </span>
                    <span className={`font-mono text-xl font-bold ${isDark ? 'text-[#D4AF37]' : 'text-amber-800'}`}>
                      #{trackedOrder.orderNumber}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-[#D4AF37] text-neutral-950 font-bold text-xs rounded-full">
                    {String(trackedOrder.status).toLowerCase() === 'cancelled' ? 'ملغي' : trackedOrder.status}
                  </span>
                </div>

                <div className={`text-xs space-y-1 pt-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  <div>العميل: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{trackedOrder.customerName}</strong></div>
                  <div>الوجهة: <strong>{trackedOrder.shipping?.city || trackedOrder.city} - {trackedOrder.shipping?.address || trackedOrder.shippingAddress}</strong></div>
                  <div>الناقل: <strong>{trackedOrder.courierCompany || 'أسطول SAOUDI WEAR Express'}</strong> (التتبع: {trackedOrder.trackingNumber || 'قيد الإصدار'})</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED ADDRESSES & PROFILE EDIT */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs animate-fade-in">
            <div>
              <label className={`block font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={`w-full p-3 rounded-xl text-xs font-bold outline-none border transition-colors ${
                  isDark
                    ? 'bg-[#1D1D1D] border-neutral-700 text-white focus:border-[#D4AF37]'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                  رقم الجوال للتواصل وتأكيد الطلب
                </label>
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs font-mono font-bold outline-none border dir-ltr text-right transition-colors ${
                    isDark
                      ? 'bg-[#1D1D1D] border-neutral-700 text-[#D4AF37] focus:border-[#D4AF37]'
                      : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                  المدينة المعتمدة
                </label>
                <input
                  type="text"
                  required
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs font-bold outline-none border transition-colors ${
                    isDark
                      ? 'bg-[#1D1D1D] border-neutral-700 text-white focus:border-[#D4AF37]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                عنوان التوصيل والشارع المعتمد للتعبئة التلقائية
              </label>
              <input
                type="text"
                required
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                placeholder="حي المحمدية، شارع..."
                className={`w-full p-3 rounded-xl text-xs outline-none border transition-colors ${
                  isDark
                    ? 'bg-[#1D1D1D] border-neutral-700 text-white focus:border-[#D4AF37]'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{savingProfile ? 'جاري الحفظ...' : 'حفظ البيانات والعنوان المعتمد'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
