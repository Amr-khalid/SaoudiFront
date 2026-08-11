'use client';

import React, { useState } from 'react';
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

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, setUser, showToast, theme, lang } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'تونس العاصمة (Tunis)',
    address: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await api.login(formData.email.trim(), formData.password);
        const userData = res.user || res.customer || {
          name: formData.email.split('@')[0],
          email: formData.email.trim(),
        };
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('saoudi_user', JSON.stringify(userData));
        }
        if (showToast) showToast(lang === 'ar' ? `مرحباً بك مجدداً ${userData.name} في SAOUDI WEAR!` : `Welcome back, ${userData.name}!`);
      } else {
        const res = await api.register(formData.name.trim(), formData.email.trim(), formData.password, {
          phone: formData.phone.trim(),
          city: formData.city,
          address: formData.address.trim(),
        });
        const userData = res.customer || res.user || {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          city: formData.city,
          address: formData.address.trim(),
          addresses: [{ street: formData.address.trim(), city: formData.city, country: 'Tunisia', isDefault: true }],
        };
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('saoudi_user', JSON.stringify(userData));
        }
        if (showToast) showToast(lang === 'ar' ? `تم إنشاء حسابك بنجاح! مرحباً بك في عضوية الأتيليه ${userData.name} 💎` : `Welcome to SAOUDI WEAR Membership, ${userData.name}!`);
      }
      setIsAuthOpen(false);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشلت العملية. يرجى التحقق من صحة البيانات.' : 'Authentication failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/75 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-300 dir-rtl">
      {/* Clickable Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsAuthOpen(false)}
        aria-label="Close modal"
      />

      {/* Luxury Modal Container */}
      <div className="relative max-w-xl w-full p-6 sm:p-9 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-[#FAF8F5] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar z-10 transition-colors duration-300">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-800 shadow-2xs"
          title="إغلاق"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#FAF8F2]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#9A7B1C] dark:text-[#D4AF37] mx-auto shadow-2xs">
            <span className="material-symbols-outlined text-2xl">
              {mode === 'login' ? 'lock' : 'verified_user'}
            </span>
          </div>

          <div>
            <span className="font-label-caps text-[10px] text-[#9A7B1C] dark:text-[#D4AF37] tracking-[0.25em] uppercase font-extrabold block">
              SAOUDI WEAR ATELIER • TUNISIA
            </span>
            <h2 className="font-garamond text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white mt-0.5">
              {mode === 'login' ? 'تسجيل دخول العملاء' : 'إنشاء حساب وعضوية فاخرة'}
            </h2>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed max-w-md mx-auto">
            {mode === 'login'
              ? 'سجل دخولك لمتابعة شحناتك الحية وتعبئة بيانات الشحن فورياً عند إتمام الطلبات.'
              : 'أنشئ حسابك لحفظ مقاساتك وعنوانك في تونس، وتتبع مسار شحناتك الحية لحظة بلحظة.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-200/70 dark:bg-[#1A1A1A] p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 shadow-md font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>إنشاء حساب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 shadow-md font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>تسجيل الدخول</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl text-center font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  الاسم واللقب <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="مثال: يوسف الطرابلسي"
                    className="w-full pr-11 pl-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-neutral-950 dark:text-white font-medium outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors"
                  />
                </div>
              </div>

              {/* Phone & Tunisian Governorate (City) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                    رقم الهاتف الجوال (تونس) <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                      call
                    </span>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+216 00 000 000 أو 98 000 000"
                      className="w-full pr-11 pl-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-[#9A7B1C] dark:text-[#D4AF37] font-mono font-bold outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] dir-ltr text-right shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                    الولاية / المدينة (تونس) <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg pointer-events-none">
                      location_city
                    </span>
                    <select
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full pr-11 pl-8 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-neutral-950 dark:text-white font-bold outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors appearance-none cursor-pointer"
                    >
                      {TUNISIAN_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  عنوان السكن والتوصيل التفصيلي <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                    home_pin
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="مثال: شارع الحبيب بورقيبة، نهج..."
                    className="w-full pr-11 pl-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-neutral-950 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              البريد الإلكتروني <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="client@saoudiwear.com"
                className="w-full pr-11 pl-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-neutral-950 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              كلمة المرور <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full pr-11 pl-11 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700/80 rounded-xl text-xs text-neutral-950 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] shadow-2xs transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label="Toggle password visibility"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* VIP Membership Highlights in Register Mode */}
          {mode === 'register' && (
            <div className="p-3 bg-amber-50/60 dark:bg-neutral-900/60 border border-amber-200/70 dark:border-neutral-800 rounded-xl space-y-1.5 text-[11px] text-neutral-700 dark:text-neutral-300">
              <div className="font-bold text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>مزايا عضوية الأتيليه التونسي الملكي:</span>
              </div>
              <ul className="space-y-1 pr-4 list-disc text-[10px] text-neutral-600 dark:text-neutral-400">
                <li>حفظ المقاسات والعناوين لتعبئتها تلقائياً عند كل طلب.</li>
                <li>تتبع شحناتك الحية والتوصيل لكافة ولايات الجمهورية التونسية.</li>
                <li>أولوية الاستفادة من التخفيضات ودعوات الإطلاق الحصرية.</li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] hover:from-[#836817] hover:to-[#B8860B] text-neutral-950 font-bold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-4 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>جاري معالجة الطلب...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">
                  {mode === 'login' ? 'login' : 'how_to_reg'}
                </span>
                <span>{mode === 'login' ? 'تسجيل الدخول إلى حسابي' : 'تأكيد إنشاء العضوية الملكية'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="text-center pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
          {mode === 'login' ? (
            <span>
              ليس لديك حساب بعد؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline cursor-pointer mr-1"
              >
                أنشئ حساباً جديداً
              </button>
            </span>
          ) : (
            <span>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline cursor-pointer mr-1"
              >
                تسجيل الدخول
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
