'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

// Export dedicated components
export { ReviewsManagementView } from './ReviewsManagement';
export { CouponsManagementView } from './CouponsManagement';

// ANALYTICS & REPORTS VIEW
export const AnalyticsReportsView: React.FC = () => {
  const { showToast } = useApp();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl dir-rtl transition-colors">
      <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
            التقارير المالية والتدقيق الأسبوعي والشهري
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            تحميل تقارير المبيعات والأرباح والضرائب بصيغة PDF و Excel مباشرة.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => showToast('جاري تحضير وتنزيل التقرير المالي الشامل PDF...', 'info')}
            className="px-4 py-2.5 bg-neutral-950 dark:bg-neutral-800 text-white hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            تنزيل التقرير المالي PDF
          </button>
          <button
            type="button"
            onClick={() => showToast('جاري تصدير جداول البيانات بصيغة Excel...', 'info')}
            className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            تصدير ملفات Excel
          </button>
        </div>
      </div>
    </div>
  );
};

// STAFF & ROLES VIEW
export const StaffRolesView: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.getAdminStaff().then((liveStaff) => {
      if (isMounted && liveStaff && liveStaff.length > 0) {
        setStaff(liveStaff);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatRole = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return 'مدير النظام التنفيذي (Super Admin)';
      case 'admin':
        return 'مدير Atelier (Admin)';
      case 'manager':
        return 'مدير قسم (Manager)';
      case 'warehouse':
        return 'مسؤول مستودع (Warehouse)';
      case 'customerSupport':
        return 'دعم عملاء (Support)';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl transition-colors">
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex justify-between items-center transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
              إدارة فريق العمل والصلاحيات (Staff & Roles)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              متصل لحظياً
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            إدارة أفراد الفريق والتأكد من الصلاحيات الإدارية والمستودعات ({staff.length} عضو).
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
              <th className="p-3.5">عضو الفريق</th>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">الدور والصلاحية</th>
              <th className="p-3.5">الحالة</th>
              <th className="p-3.5 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
            {staff.map((member) => (
              <tr
                key={member.id || (member as any)._id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <td className="p-3.5 font-bold text-neutral-900 dark:text-white">{member.name}</td>
                <td className="p-3.5 text-neutral-500 dark:text-neutral-400 font-mono">
                  {member.email}
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 font-bold rounded-lg text-[10px] text-neutral-800 dark:text-neutral-200">
                    {formatRole(member.role)}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold rounded-full text-[10px]">
                    {member.status || 'Active'}
                  </span>
                </td>
                <td className="p-3.5 text-left">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                  >
                    تعديل الصلاحيات
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// SETTINGS VIEW
export const SettingsView: React.FC = () => {
  const { showAlert, showToast } = useApp();
  const [storeName, setStoreName] = useState('SAOUDI WEAR');
  const [supportEmail, setSupportEmail] = useState('concierge@saoudiwear.com');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [gateways, setGateways] = useState('الدفع عند الاستلام، البطاقات البنكية');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getStoreSettings().then((s) => {
      if (s) {
        if (s.name || s.storeName) setStoreName(s.name || s.storeName);
        if (s.email) setSupportEmail(s.email);
        if (s.phone) setPhone(s.phone);
        if (s.whatsappPhone) setWhatsappPhone(s.whatsappPhone);
        if (s.currency) setCurrency(s.currency);
      }
    });
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.updateStoreSettings({
        name: storeName,
        storeName,
        email: supportEmail,
        phone,
        whatsappPhone,
        currency,
      });
      if (typeof window !== 'undefined' && whatsappPhone) {
        localStorage.setItem('saoudi_admin_phone', whatsappPhone);
      }
      showToast('تم حفظ إعدادات المتجر ورقم الواتساب بنجاح!', 'success');
    } catch (err: any) {
      showAlert({
        title: 'خطأ في الحفظ',
        message: err.message || 'حدث خطأ أثناء حفظ الإعدادات',
        type: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl dir-rtl transition-colors">
      <div className="bg-white dark:bg-[#151515] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
            إعدادات العلامة التجارية والمتجر (Atelier Settings)
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            ضبط الخيارات الأساسية، رقم الواتساب المعتمد للطلبات، البريد، والعملات.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              اسم المتجر / العلامة
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              بريد خدمة العملاء الفاخر
            </label>
            <input
              type="text"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              رقم هاتف الواتساب المعتمد لطلبات واستفسارات العملاء 💬
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => {
                setWhatsappPhone(e.target.value);
                setPhone(e.target.value);
              }}
              placeholder="01024556910"
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] font-mono text-left"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              العملة الافتراضية للمتجر
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              بوابات وطرق الدفع المتاحة
            </label>
            <input
              type="text"
              value={gateways}
              onChange={(e) => setGateways(e.target.value)}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.01]"
        >
          {isSaving ? 'جاري حفظ الإعدادات...' : 'حفظ إعدادات المتجر والواتساب'}
        </button>
      </div>
    </div>
  );
};

// CATEGORIES MANAGEMENT VIEW
export const CategoriesManagementView: React.FC = () => {
  const { showAlert, showConfirm, showToast } = useApp();
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const cats = await api.getCategories();
    if (cats) setCategories(cats);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (cat: any) => {
    const catId = cat.id || cat._id;
    const isConfirmed = await showConfirm({
      title: 'تأكيد حذف القسم',
      message: `هل أنت متأكد من رغبتك في حذف القسم "${cat.name}" نهائياً من الكتالوج؟ لن يتأثر الكتالوج إلا بالمنتجات التابعة له.`,
      confirmText: 'نعم، حذف القسم',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'category',
    });

    if (isConfirmed) {
      try {
        await api.deleteCategory(catId);
        fetchCategories();
        showToast('تم حذف القسم بنجاح من قاعدة البيانات!', 'success');
      } catch (err: any) {
        showAlert({
          title: 'فشل حذف القسم',
          message: err.message || 'فشلت عملية حذف القسم',
          type: 'danger',
        });
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى إدخال اسم القسم قبل المتابعة.',
        type: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        const catId = editingCategory.id || editingCategory._id;
        await api.updateCategory(catId, { name, description });
        showToast('تم تعديل بيانات القسم بنجاح!', 'success');
      } else {
        await api.createCategory({ name, description });
        showToast('تم إنشاء القسم الفاخر بنجاح في قاعدة البيانات!', 'success');
      }
      setName('');
      setDescription('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showAlert({
        title: 'فشل حفظ القسم',
        message: err.message || 'فشلت عملية حفظ القسم',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl transition-colors">
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
              أقسام ومجموعات الكتالوج (Categories)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              متصل لحظياً
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            إدارة أقسام المتجر، التعديل والحذف وإنشاء المجموعات الجديدة ({categories.length} قسم متاح).
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>+ إضافة قسم جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-neutral-500 dark:text-neutral-400 bg-white dark:bg-[#151515] rounded-2xl border border-neutral-200 dark:border-neutral-800 font-light">
            لا توجد أقسام مسجلة حالياً. اضغط على إضافة قسم جديد للبدء.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id || cat._id}
              className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3 flex flex-col justify-between hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white">
                    {cat.name}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase rounded-full">
                    نشط
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {cat.description || 'قسم فاخر مخصص لمجموعات المتجر.'}
                </p>
                {cat.slug && (
                  <div className="text-[10px] font-mono text-neutral-400">
                    Slug: {cat.slug}
                  </div>
                )}
              </div>

              {/* Edit & Delete Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cat)}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="تعديل القسم"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-600 hover:text-white text-neutral-600 dark:text-neutral-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="حذف القسم"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] dark:bg-[#161616] text-neutral-900 dark:text-neutral-100 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
              {editingCategory ? 'تعديل بيانات القسم' : 'إضافة قسم جديد لكتالوج المتجر'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  اسم القسم *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: جلديات إيطالية، ساعات فاخرة..."
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  الوصف
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف القسم والتفاصيل الفاخرة..."
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] h-24"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] text-neutral-950 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                {loading
                  ? 'جاري التحديث...'
                  : editingCategory
                  ? 'تحديث وتعديل القسم'
                  : 'حفظ ونشر القسم'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
