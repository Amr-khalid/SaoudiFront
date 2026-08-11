'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export const AdminProfileSettings: React.FC = () => {
  const { user, setUser, logout, showToast: appShowToast, setWhatsappPhone, showConfirm, showAlert } = useApp();

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('superAdmin');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Local Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    if (appShowToast) appShowToast(text);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Populate data on mount or when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setRole(user.role || 'superAdmin');
    } else {
      // Fetch current admin profile from backend
      api.getCurrentUser().then((u) => {
        if (u) {
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setAvatar(u.avatar || '');
          setRole(u.role || 'superAdmin');
        }
      }).catch(() => {});
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم المدير أو المسؤول', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await api.updateAdminProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      const merged = {
        ...user,
        ...(updated || {}),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      setUser(merged);
      if (phone.trim()) {
        setWhatsappPhone(phone.trim());
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('saoudi_user', JSON.stringify(merged));
        if (phone.trim()) localStorage.setItem('saoudi_admin_phone', phone.trim());
      }
      showToast('تم حفظ وتحديث بيانات حساب الأدمن في قاعدة البيانات بنجاح!', 'success');
    } catch (err: any) {
      console.error('Save admin profile error:', err);
      showToast(err.message || 'فشل حفظ البيانات في الباك إند.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('يرجى كتابة كلمة المرور الحالية', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف أو أرقام', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      showToast('تم تغيير كلمة مرور الأدمن بنجاح! احتفظ بها في مكان آمن.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'فشل تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: 'غير محددة', color: 'bg-neutral-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { level: 1, text: 'ضعيفة', color: 'bg-rose-500', width: '30%' };
    if (score <= 4) return { level: 2, text: 'جيدة ومتوسطة', color: 'bg-amber-500', width: '70%' };
    return { level: 3, text: 'قوية ومحصنة جداً 👑', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'superAdmin':
        return 'المدير التنفيذي الأعلى (Super Admin)';
      case 'admin':
        return 'مدير النظام (Admin)';
      case 'manager':
        return 'مدير العمليات (Manager)';
      case 'warehouse':
        return 'مشرف المستودع والمخزون (Warehouse)';
      case 'customerSupport':
        return 'خدمة العملاء والدعم (Customer Support)';
      default:
        return r || 'مدير النظام';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in dir-rtl text-neutral-800 dark:text-neutral-200 transition-colors pb-16 max-w-5xl">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-up text-xs font-bold ${
            toastMessage.type === 'success'
              ? 'bg-neutral-950 dark:bg-[#151515] text-emerald-400 border-emerald-500/40 shadow-emerald-950/20'
              : toastMessage.type === 'error'
              ? 'bg-neutral-950 dark:bg-[#151515] text-rose-400 border-rose-500/40 shadow-rose-950/20'
              : 'bg-neutral-950 dark:bg-[#151515] text-[#D4AF37] border-[#D4AF37]/40 shadow-amber-950/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastMessage.type === 'success' ? 'check_circle' : toastMessage.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white tracking-wide">
              بيانات حساب الأدمن وإعدادات الأمان (Admin Account)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{getRoleLabel(role)}</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
            التحكم الكامل في اسم المشرف، البريد الإلكتروني المعتمد، رقم الهاتف، وتحديث كلمة مرور النفاذ للنظام.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const isConfirmed = await showConfirm({
              title: 'تسجيل الخروج',
              message: 'هل أنت متأكد من رغبتك في تسجيل الخروج الآمن من لوحة الإدارة؟',
              confirmText: 'تسجيل الخروج',
              cancelText: 'البقاء',
              type: 'danger',
              icon: 'logout',
            });
            if (isConfirmed) {
              logout();
              if (typeof window !== 'undefined') window.location.href = '/admin';
            }
          }}
          className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>تسجيل الخروج الآمن</span>
        </button>
      </div>

      {/* Top Profile Summary Badge */}
      <div className="bg-gradient-to-r from-[#17150E] via-[#1A1812] to-[#121212] p-6 sm:p-7 rounded-3xl border border-[#D4AF37]/30 shadow-xl flex flex-col sm:flex-row items-center gap-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar Bubble */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] text-neutral-950 flex items-center justify-center font-garamond text-3xl font-extrabold shadow-lg border-2 border-white/20">
            {name ? name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-neutral-900 flex items-center justify-center text-white text-[10px]" title="نشط ومتصل">
            ✓
          </div>
        </div>

        {/* Details Text */}
        <div className="space-y-1.5 text-center sm:text-right flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h3 className="font-garamond text-2xl font-bold text-white tracking-wide">
              {name || 'Master Atelier Director'}
            </h3>
            <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full font-bold">
              SUPER ADMIN 👑
            </span>
          </div>
          <p className="text-xs text-neutral-300 font-mono flex items-center justify-center sm:justify-start gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">mail</span>
            <span>{email || 'admin@saoudiwear.com'}</span>
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-[11px] text-neutral-400 font-mono flex-wrap">
            <span>الهاتف: {phone || 'غير مسجل'}</span>
            <span>•</span>
            <span className="text-emerald-400">حالة الحساب: مفعل بالكامل (Active)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Basic Details Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#151515] p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 transition-colors">
          <div className="border-b border-neutral-100 dark:border-neutral-800/80 pb-4 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#D4AF37] text-2xl">badge</span>
            <div>
              <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                تعديل البيانات الشخصية للمدير
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                تحديث الاسم ورقم الهاتف والبريد المعتمد للمراسلات الإدارية.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                اسم المدير / المشرف الكامل *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: Master Atelier Director"
                  className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-medium outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-lg pointer-events-none">
                  person
                </span>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                البريد الإلكتروني لتسجيل الدخول والإشعارات *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@saoudiwear.com"
                  className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-mono outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-left"
                  dir="ltr"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-lg pointer-events-none">
                  alternate_email
                </span>
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                رقم الهاتف المحمول (للتواصل السريع)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01024556910"
                  className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-mono outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-left"
                  dir="ltr"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-lg pointer-events-none">
                  phone_iphone
                </span>
              </div>
            </div>

            {/* Role & Privileges Box (Read-only) */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>الصلاحيات والامتيازات الممنوحة:</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 font-bold">
                  {role}
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                يتمتع هذا الحساب بصلاحيات وصول مطلقة تشمل تعديل وحذف المنتجات، إدارة الطلبات، التحكم في الكوبونات، مراجعة التقييمات، إعدادات المتجر، والتقارير المالية.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-3.5 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>جاري حفظ البيانات...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>حفظ التعديلات في الحساب</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (5 cols): Security & Password Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#151515] p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 transition-colors flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-100 dark:border-neutral-800/80 pb-4 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl">lock_reset</span>
              <div>
                <h3 className="font-garamond text-xl font-bold text-neutral-950 dark:text-white">
                  تغيير كلمة المرور والأمان
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  تحديث كلمة المرور لتعزيز حماية لوحة التحكم.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs mt-6">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                  كلمة المرور الحالية *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-mono outline-none focus:border-[#D4AF37] transition-all text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showCurrentPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-mono outline-none focus:border-[#D4AF37] transition-all text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="pt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                      <span>قوة كلمة المرور:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{strength.text}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    className="w-full p-3.5 pl-10 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl text-neutral-900 dark:text-white font-mono outline-none focus:border-[#D4AF37] transition-all text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-3.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSavingPassword ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>جاري تحديث كلمة المرور...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">key</span>
                    <span>تحديث كلمة المرور الآن</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Session Security Card */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500 space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span>تشفير الجلسة:</span>
              <span className="text-emerald-400 font-bold">JWT HMAC-SHA256 ✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span>حماية الـ Rate Limiting:</span>
              <span className="text-neutral-400">مفعلة (Enterprise)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
