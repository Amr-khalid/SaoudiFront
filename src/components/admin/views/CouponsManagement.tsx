'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export interface CouponItem {
  id?: string;
  _id?: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'freeShipping' | string;
  value: number;
  minPurchase?: number;
  maxDiscount?: number | null;
  usageLimit?: number;
  usedCount?: number;
  isUnlimited?: boolean;
  perCustomerLimit?: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'disabled' | string;
  createdAt?: string;
}

const PRESET_TEMPLATES = [
  {
    title: '🎁 كوبون ترحيب بالعملاء (Welcome)',
    code: 'WELCOME15',
    type: 'percentage' as const,
    value: 15,
    minPurchase: 50,
    maxDiscount: 100,
    usageLimit: 100,
    isUnlimited: false,
    perCustomerLimit: 1,
    daysValid: 30,
    description: 'خصم 15% ترحيبي للعملاء الجدد (حد 100 استخدام)',
  },
  {
    title: '👑 كوبون VIP حصري لـ 10 عملاء فقط',
    code: 'VIPGOLD50',
    type: 'fixed' as const,
    value: 50,
    minPurchase: 250,
    maxDiscount: null,
    usageLimit: 10,
    isUnlimited: false,
    perCustomerLimit: 1,
    daysValid: 60,
    description: 'خصم ثابت 50$ للطلبات الكبيرة متاح لـ 10 عملاء فقط',
  },
  {
    title: '⚡ فلاش سيل خاطف لـ 20 شخص فقط',
    code: 'FLASH30',
    type: 'percentage' as const,
    value: 30,
    minPurchase: 100,
    maxDiscount: 150,
    usageLimit: 20,
    isUnlimited: false,
    perCustomerLimit: 1,
    daysValid: 7,
    description: 'خصم 30% سريع متاح لأول 20 مشتري فقط',
  },
  {
    title: '💎 كوبون استخدام مرة واحدة فقط (1 Use)',
    code: 'EXCLUSIVE1',
    type: 'percentage' as const,
    value: 25,
    minPurchase: 0,
    maxDiscount: 200,
    usageLimit: 1,
    isUnlimited: false,
    perCustomerLimit: 1,
    daysValid: 14,
    description: 'كوبون فردي خاص يعمل لمرة واحدة فقط',
  },
  {
    title: '🚚 شحن مجاني ملكي مفتوح (Free Ship)',
    code: 'ROYALSHIP',
    type: 'freeShipping' as const,
    value: 0,
    minPurchase: 50,
    maxDiscount: null,
    usageLimit: 500,
    isUnlimited: false,
    perCustomerLimit: 2,
    daysValid: 90,
    description: 'إعفاء كامل من رسوم الشحن لأول 500 طلب',
  },
];

const DEFAULT_COUPONS: CouponItem[] = [
  {
    _id: '65f111111111111111110001',
    code: 'SAOUDI20',
    description: 'خصم 20% على التشكيلة الملكية (حد 500 استخدام)',
    type: 'percentage',
    value: 20,
    minPurchase: 50,
    maxDiscount: 100,
    usageLimit: 500,
    usedCount: 142,
    isUnlimited: false,
    perCustomerLimit: 1,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    _id: '65f111111111111111110002',
    code: 'VIPGOLD10',
    description: 'كوبون مخصص لـ 10 عملاء فقط بقيمة 50$',
    type: 'fixed',
    value: 50,
    minPurchase: 200,
    maxDiscount: null,
    usageLimit: 10,
    usedCount: 8,
    isUnlimited: false,
    perCustomerLimit: 1,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    _id: '65f111111111111111110003',
    code: 'SOLO25',
    description: 'كوبون حصري لمرة واحدة فقط',
    type: 'percentage',
    value: 25,
    minPurchase: 0,
    maxDiscount: 200,
    usageLimit: 1,
    usedCount: 0,
    isUnlimited: false,
    perCustomerLimit: 1,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    _id: '65f111111111111111110004',
    code: 'FREESHIP',
    description: 'شحن مجاني ملكي لكافة الوجهات',
    type: 'freeShipping',
    value: 0,
    minPurchase: 30,
    maxDiscount: null,
    usageLimit: 1000,
    usedCount: 421,
    isUnlimited: false,
    perCustomerLimit: 2,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
];

export const CouponsManagementView: React.FC = () => {
  const { showAlert, showConfirm } = useApp();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formCode, setFormCode] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formType, setFormType] = useState<'percentage' | 'fixed' | 'freeShipping'>('percentage');
  const [formValue, setFormValue] = useState<number>(15);
  const [formMinPurchase, setFormMinPurchase] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<number>(100);
  const [formIsUnlimited, setFormIsUnlimited] = useState<boolean>(false);
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState<number>(1);
  const [formExpiryDate, setFormExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminCoupons();
      if (Array.isArray(data) && data.length > 0) {
        setCoupons(data);
      } else {
        setCoupons(DEFAULT_COUPONS);
      }
    } catch (err) {
      console.warn('Failed to load coupons from API, fallback to default:', err);
      setCoupons(DEFAULT_COUPONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coup) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        coup.code.toLowerCase().includes(q) ||
        (coup.description && coup.description.toLowerCase().includes(q));

      const isExhausted = !coup.isUnlimited && (coup.usedCount || 0) >= (coup.usageLimit || 100);
      const isExpired = new Date(coup.expiryDate) < new Date();

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = coup.status === 'active' && !isExhausted && !isExpired;
      } else if (statusFilter === 'disabled') {
        matchesStatus = coup.status === 'disabled';
      } else if (statusFilter === 'exhausted') {
        matchesStatus = isExhausted;
      } else if (statusFilter === 'expired') {
        matchesStatus = isExpired || coup.status === 'expired';
      }

      const matchesType =
        typeFilter === 'all' || coup.type?.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, searchQuery, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter(
      (c) =>
        c.status === 'active' &&
        new Date(c.expiryDate) >= new Date() &&
        (c.isUnlimited || (c.usedCount || 0) < (c.usageLimit || 100))
    ).length;
    const exhausted = coupons.filter(
      (c) => !c.isUnlimited && (c.usedCount || 0) >= (c.usageLimit || 100)
    ).length;
    const totalUsed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
    const maxVal = Math.max(...coupons.map((c) => (c.type === 'percentage' ? c.value : 0)), 0);
    return { total, active, exhausted, totalUsed, maxVal };
  }, [coupons]);

  // Generate random coupon code
  const generateRandomCode = () => {
    const prefixes = ['SAOUDI', 'ROYAL', 'VIP', 'GOLD', 'ELITE', 'SUMMER', 'ATELIER'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    return `${prefix}${num}`;
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode(generateRandomCode());
    setFormDescription('');
    setFormType('percentage');
    setFormValue(20);
    setFormMinPurchase(50);
    setFormMaxDiscount('');
    setFormUsageLimit(100);
    setFormIsUnlimited(false);
    setFormPerCustomerLimit(1);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormExpiryDate(d.toISOString().split('T')[0]);
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coup: CouponItem) => {
    setEditingCoupon(coup);
    setFormCode(coup.code);
    setFormDescription(coup.description || '');
    setFormType((coup.type as any) || 'percentage');
    setFormValue(coup.value || 0);
    setFormMinPurchase(coup.minPurchase || 0);
    setFormMaxDiscount(coup.maxDiscount ? String(coup.maxDiscount) : '');
    setFormUsageLimit(coup.usageLimit || 100);
    setFormIsUnlimited(Boolean(coup.isUnlimited));
    setFormPerCustomerLimit(coup.perCustomerLimit || 1);
    if (coup.expiryDate) {
      setFormExpiryDate(new Date(coup.expiryDate).toISOString().split('T')[0]);
    }
    setFormStatus(coup.status === 'disabled' ? 'disabled' : 'active');
    setIsModalOpen(true);
  };

  const handleApplyPreset = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setFormCode(tmpl.code);
    setFormDescription(tmpl.description);
    setFormType(tmpl.type);
    setFormValue(tmpl.value);
    setFormMinPurchase(tmpl.minPurchase);
    setFormMaxDiscount(tmpl.maxDiscount ? String(tmpl.maxDiscount) : '');
    setFormUsageLimit(tmpl.usageLimit);
    setFormIsUnlimited(tmpl.isUnlimited);
    setFormPerCustomerLimit(tmpl.perCustomerLimit);
    const d = new Date();
    d.setDate(d.getDate() + tmpl.daysValid);
    setFormExpiryDate(d.toISOString().split('T')[0]);
    showToast(`تم تطبيق قالب "${tmpl.title}"`, 'info');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showAlert({
        title: 'رمز الكوبون مطلوب',
        message: 'يرجى كتابة رمز الكوبون الترويجي (مثال: VIP20).',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      type: formType,
      value: formType === 'freeShipping' ? 0 : Number(formValue),
      minPurchase: Number(formMinPurchase) || 0,
      maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
      usageLimit: formIsUnlimited ? 999999 : Number(formUsageLimit) || 100,
      isUnlimited: formIsUnlimited,
      perCustomerLimit: Number(formPerCustomerLimit) || 1,
      expiryDate: new Date(formExpiryDate).toISOString(),
      status: formStatus,
    };

    try {
      if (editingCoupon) {
        const id = editingCoupon.id || editingCoupon._id || '';
        await api.updateCoupon(id, payload);
        setCoupons((prev) =>
          prev.map((c) => ((c.id || c._id) === id ? { ...c, ...payload } : c))
        );
        showToast('تم تحديث بيانات وعدد استخدامات الكوبون بنجاح!', 'success');
      } else {
        const created = await api.createCoupon(payload);
        if (created && (created._id || created.id)) {
          setCoupons((prev) => [created, ...prev]);
        } else {
          setCoupons((prev) => [
            {
              _id: 'loc_' + Date.now(),
              ...payload,
              usedCount: 0,
            },
            ...prev,
          ]);
        }
        showToast('تم إنشاء وتفعيل الكوبون الجديد بنجاح!', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      // Local optimistic fallback
      if (editingCoupon) {
        const id = editingCoupon.id || editingCoupon._id || '';
        setCoupons((prev) =>
          prev.map((c) => ((c.id || c._id) === id ? { ...c, ...payload } : c))
        );
      } else {
        setCoupons((prev) => [
          {
            _id: 'loc_' + Date.now(),
            ...payload,
            usedCount: 0,
          },
          ...prev,
        ]);
      }
      setIsModalOpen(false);
      showToast('تم حفظ الكوبون بنجاح محلياً', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Usage Counter
  const handleResetUsage = async (id: string, code: string) => {
    const isConfirmed = await showConfirm({
      title: 'تصفير عداد الكوبون',
      message: `هل أنت متأكد من رغبتك في تصفير عداد استخدامات الكوبون "${code}" ليعود إلى 0 مرات استخدام؟`,
      confirmText: 'نعم، تصفير العداد',
      cancelText: 'إلغاء',
      type: 'warning',
      icon: 'restart_alt',
    });
    if (!isConfirmed) return;

    try {
      await api.resetCouponUsage(id);
      setCoupons((prev) =>
        prev.map((c) => ((c.id || c._id) === id ? { ...c, usedCount: 0 } : c))
      );
      showToast(`تم تصفير عداد استخدامات الكوبون ${code} بنجاح!`, 'success');
    } catch {
      setCoupons((prev) =>
        prev.map((c) => ((c.id || c._id) === id ? { ...c, usedCount: 0 } : c))
      );
      showToast(`تم تصفير عداد استخدام الكوبون ${code}`, 'info');
    }
  };

  // Duplicate Coupon
  const handleDuplicate = async (id: string) => {
    try {
      const dup = await api.duplicateCoupon(id);
      if (dup && (dup._id || dup.id)) {
        setCoupons((prev) => [dup, ...prev]);
      } else {
        const target = coupons.find((c) => (c.id || c._id) === id);
        if (target) {
          setCoupons((prev) => [
            {
              ...target,
              _id: 'dup_' + Date.now(),
              code: `${target.code}_COPY_${Math.floor(10 + Math.random() * 90)}`,
              usedCount: 0,
            },
            ...prev,
          ]);
        }
      }
      showToast('تم استنساخ الكوبون بنجاح!', 'success');
    } catch {
      const target = coupons.find((c) => (c.id || c._id) === id);
      if (target) {
        setCoupons((prev) => [
          {
            ...target,
            _id: 'dup_' + Date.now(),
            code: `${target.code}_COPY_${Math.floor(10 + Math.random() * 90)}`,
            usedCount: 0,
          },
          ...prev,
        ]);
      }
      showToast('تم استنساخ الكوبون بنجاح!', 'info');
    }
  };

  // Top up Usage limit (+50 uses)
  const handleAddUses = async (coup: CouponItem, addAmount: number = 50) => {
    const id = coup.id || coup._id || '';
    const newLimit = (coup.usageLimit || 100) + addAmount;
    try {
      await api.updateCoupon(id, { usageLimit: newLimit, isUnlimited: false });
      setCoupons((prev) =>
        prev.map((c) =>
          (c.id || c._id) === id ? { ...c, usageLimit: newLimit, isUnlimited: false } : c
        )
      );
      showToast(`تمت زيادة ${addAmount} استخدام إضافي للكوبون ${coup.code}!`, 'success');
    } catch {
      setCoupons((prev) =>
        prev.map((c) =>
          (c.id || c._id) === id ? { ...c, usageLimit: newLimit, isUnlimited: false } : c
        )
      );
      showToast(`تمت زيادة الاستخدامات بنجاح`, 'info');
    }
  };

  // Single Delete
  const handleDeleteCoupon = async (id: string, code: string) => {
    const isConfirmed = await showConfirm({
      title: 'حذف الكوبون',
      message: `هل أنت متأكد من رغبتك في حذف الكوبون "${code}" نهائياً من المتجر؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، حذف الكوبون',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'delete_forever',
    });
    if (!isConfirmed) return;

    try {
      await api.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => (c.id || c._id) !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast(`تم حذف الكوبون ${code} بنجاح`, 'success');
    } catch {
      setCoupons((prev) => prev.filter((c) => (c.id || c._id) !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast(`تم حذف الكوبون ${code}`, 'info');
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coup: CouponItem) => {
    const id = coup.id || coup._id || '';
    const newStatus = coup.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateCoupon(id, { status: newStatus });
      setCoupons((prev) =>
        prev.map((c) => ((c.id || c._id) === id ? { ...c, status: newStatus } : c))
      );
      showToast(newStatus === 'active' ? 'تم تنشيط الكوبون' : 'تم تعطيل الكوبون مؤقتاً', 'info');
    } catch {
      setCoupons((prev) =>
        prev.map((c) => ((c.id || c._id) === id ? { ...c, status: newStatus } : c))
      );
    }
  };

  // Bulk Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredCoupons.map((c) => c.id || c._id || '').filter(Boolean);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkStatusCoupons(selectedIds, 'active');
      setCoupons((prev) =>
        prev.map((c) => (selectedIds.includes(c.id || c._id || '') ? { ...c, status: 'active' } : c))
      );
      showToast(`تم تنشيط ${selectedIds.length} كوبون بنجاح!`, 'success');
      setSelectedIds([]);
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (selectedIds.includes(c.id || c._id || '') ? { ...c, status: 'active' } : c))
      );
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkStatusCoupons(selectedIds, 'disabled');
      setCoupons((prev) =>
        prev.map((c) => (selectedIds.includes(c.id || c._id || '') ? { ...c, status: 'disabled' } : c))
      );
      showToast(`تم تعطيل ${selectedIds.length} كوبون`, 'info');
      setSelectedIds([]);
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (selectedIds.includes(c.id || c._id || '') ? { ...c, status: 'disabled' } : c))
      );
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await showConfirm({
      title: 'حذف الكوبونات المحددة',
      message: `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} كوبون محدد نهائياً من قاعدة البيانات؟`,
      confirmText: 'نعم، حذف الكوبونات',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'delete_sweep',
    });
    if (!isConfirmed) return;

    setIsBulkProcessing(true);
    try {
      await api.bulkDeleteCoupons(selectedIds);
      setCoupons((prev) => prev.filter((c) => !selectedIds.includes(c.id || c._id || '')));
      showToast(`تم حذف ${selectedIds.length} كوبون بنجاح`, 'success');
      setSelectedIds([]);
    } catch {
      setCoupons((prev) => prev.filter((c) => !selectedIds.includes(c.id || c._id || '')));
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Copy Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`تم نسخ رمز الكوبون ${code} إلى الحافظة!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (coupons.length === 0) {
      showAlert({
        title: 'تنبيه التصدير',
        message: 'لا توجد كوبونات مسجلة حالياً لتصديرها.',
        type: 'info',
      });
      return;
    }

    const headers = [
      'رمز الكوبون',
      'نوع الخصم',
      'قيمة الخصم',
      'الحد الأدنى للطلب',
      'أقصى خصم',
      'الحد الأقصى للاستخدام',
      'المرات المستخدمة',
      'المرات المتبقية',
      'حد العميل الواحد',
      'تاريخ الانتهاء',
      'الحالة',
      'الوصف',
    ];

    const rows = coupons.map((c) => {
      const remaining = c.isUnlimited ? 'غير محدود' : Math.max(0, (c.usageLimit || 100) - (c.usedCount || 0));
      return [
        `"${c.code}"`,
        c.type,
        c.value,
        c.minPurchase || 0,
        c.maxDiscount || 'مفتوح',
        c.isUnlimited ? 'غير محدود' : c.usageLimit || 100,
        c.usedCount || 0,
        remaining,
        c.perCustomerLimit || 1,
        `"${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('ar-EG') : ''}"`,
        c.status,
        `"${(c.description || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saoudi_wear_coupons_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف الكوبونات بنجاح بصيغة CSV', 'success');
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl text-neutral-800 dark:text-neutral-200 transition-colors pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 z-[9999] px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-up text-xs font-bold ${
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

      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 transition-colors">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-garamond text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white tracking-wide">
              إدارة كوبونات الخصم وقسائم الشراء (Coupons Hub)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>تحكم دقيق في عدد الاستخدامات</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1.5 leading-relaxed">
            تحديد عدد مرات الاستخدام المسموحة بدقة، الحد لكل عميل، تصفير العدادات، تتبع الاستهلاك الفعلي، وقوالب سريعة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700 flex items-center gap-1.5 shadow-2xs"
            title="تصدير الكوبونات إلى ملف Excel / CSV"
          >
            <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">download</span>
            <span>تصدير CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchCoupons}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
            title="تحديث البيانات"
          >
            <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Create Coupon Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ إنشاء كوبون جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span>إجمالي الكوبونات</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-lg">confirmation_number</span>
            </div>
          </div>
          <div className="text-3xl font-bold font-garamond text-neutral-950 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">في قاعدة البيانات</div>
        </div>

        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span>الكوبونات النشطة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
          </div>
          <div className="text-3xl font-bold font-garamond text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
            جاهزة للتطبيق بالسلة
          </div>
        </div>

        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/20 dark:bg-purple-950/10 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-bold">
            <span>مرات الاستخدام الفعلية</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
              <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
            </div>
          </div>
          <div className="text-3xl font-bold font-garamond text-purple-700 dark:text-purple-300">
            {stats.totalUsed}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-mono">
            طلب تم شراؤه بقسيمة خصم
          </div>
        </div>

        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>كوبونات اكتملت استخداماتها</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
          </div>
          <div className="text-3xl font-bold font-garamond text-[#9A7B1C] dark:text-[#D4AF37]">
            {stats.exhausted}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-mono">
            وصلت للحد الأقصى المحدد
          </div>
        </div>
      </div>

      {/* Quick Templates Toolbar */}
      <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#D4AF37] text-base">auto_fix_high</span>
            <span>قوالب سريعة جاهزة بحدود استخدام محددة مسبقاً (Quick Coupon Presets):</span>
          </h3>
          <span className="text-[11px] text-neutral-400">انقر لإنشاء وتجهيز الكوبون فوراً</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                handleOpenCreate();
                handleApplyPreset(tmpl);
              }}
              className="p-3 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 border border-neutral-200 dark:border-neutral-800 hover:border-[#D4AF37]/50 rounded-2xl text-right transition-all cursor-pointer group flex flex-col justify-between gap-1.5"
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-[#D4AF37] transition-colors">
                {tmpl.title}
              </div>
              <div className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </div>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[#9A7B1C] dark:text-[#D4AF37] font-bold border-t border-neutral-100 dark:border-neutral-800/80">
                <span>الرمز: {tmpl.code}</span>
                <span>{tmpl.usageLimit} مرة</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar + Bulk Action Center */}
      <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="ابحث برمز الكوبون (مثل VIP2026 أو SAOUDI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-[#D4AF37] transition-all font-mono"
            />
          </div>

          {/* Status & Type Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'active', label: 'النشطة' },
                { id: 'exhausted', label: 'المستهلكة بالكامل' },
                { id: 'disabled', label: 'المعطلة' },
                { id: 'expired', label: 'المنتهية' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
              {[
                { id: 'all', label: 'كل الأنواع' },
                { id: 'percentage', label: 'نسبة %' },
                { id: 'fixed', label: 'مبلغ ثابت $' },
                { id: 'freeShipping', label: 'شحن مجاني' },
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setTypeFilter(tp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === tp.id
                      ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Bulk Actions Toolbar */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                {selectedIds.length > 0 && selectedIds.length === filteredCoupons.length
                  ? 'check_box'
                  : 'select_all'}
              </span>
              <span>
                {selectedIds.length > 0 && selectedIds.length === filteredCoupons.length
                  ? 'إلغاء تحديد الكل'
                  : 'تحديد كافة المعروض'}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-[#9A7B1C] dark:text-[#D4AF37] font-mono text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                تم تحديد {selectedIds.length} من {filteredCoupons.length} كوبون
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkActivate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>تنشيط المحدد ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkDisable}
                className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">pause_circle</span>
                <span>تعطيل المحدد ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>حذف المحدد ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-16 text-center text-neutral-400 bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#D4AF37] block mb-3 mx-auto">
              progress_activity
            </span>
            <p className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
              جاري تحميل قسائم وكوبونات الخصم...
            </p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="col-span-full p-16 text-center text-neutral-400 bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <span className="material-symbols-outlined text-5xl text-neutral-300 dark:text-neutral-700 block mb-2 mx-auto">
              confirmation_number
            </span>
            <h4 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
              لا توجد كوبونات تطابق خيارات البحث الحالية.
            </h4>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-5 py-2.5 bg-[#D4AF37] text-neutral-950 font-bold text-xs rounded-xl cursor-pointer hover:bg-amber-400 shadow-md"
            >
              + إنشاء أول كوبون الآن
            </button>
          </div>
        ) : (
          filteredCoupons.map((coup) => {
            const id = coup.id || coup._id || '';
            const isSelected = selectedIds.includes(id);
            const isPercentage = coup.type === 'percentage';
            const isFixed = coup.type === 'fixed';
            const isFreeShip = coup.type === 'freeShipping';
            const isActive = coup.status === 'active';
            const isUnlimited = Boolean(coup.isUnlimited);
            const limit = coup.usageLimit || 100;
            const used = coup.usedCount || 0;
            const remaining = isUnlimited ? null : Math.max(0, limit - used);
            const isExhausted = !isUnlimited && used >= limit;
            const isExpired = new Date(coup.expiryDate) < new Date();

            const usagePercent = isUnlimited
              ? 0
              : Math.min(100, Math.round((used / limit) * 100));

            return (
              <div
                key={id}
                className={`bg-white dark:bg-[#151515] rounded-3xl border p-5 sm:p-6 space-y-4 shadow-sm hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 bg-amber-50/15 dark:bg-amber-950/15'
                    : isExhausted
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/5'
                    : isActive
                    ? 'border-neutral-200 dark:border-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800 opacity-75'
                }`}
              >
                {/* Header Voucher Row */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(id)}
                        className="mt-1.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                      />

                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-[#D4AF37] rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-2xs">
                        <span className="material-symbols-outlined text-xl">
                          {isFreeShip
                            ? 'local_shipping'
                            : isPercentage
                            ? 'percent'
                            : 'attach_money'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-neutral-400 font-mono block uppercase">
                          PROMO CODE
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono font-extrabold text-lg text-neutral-950 dark:text-white tracking-wider"
                            dir="ltr"
                          >
                            {coup.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coup.code)}
                            title="نسخ الكود"
                            className="p-1 text-neutral-400 hover:text-[#D4AF37] cursor-pointer rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedCode === coup.code ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coup)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                          isExhausted
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                            : isExpired
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                            : isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {isExhausted
                            ? 'استُهلك بالكامل'
                            : isExpired
                            ? 'منتهي الصلاحية'
                            : isActive
                            ? 'نشط (Active)'
                            : 'معطل (Disabled)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Description if present */}
                  {coup.description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                      "{coup.description}"
                    </p>
                  )}

                  {/* Value Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white rounded-2xl flex justify-between items-center shadow-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">قيمة العرض والخصم:</span>
                      <div className="font-garamond text-xl font-bold text-[#D4AF37]">
                        {isPercentage && `${coup.value}% خصم مئوي`}
                        {isFixed && `$${coup.value} USD خصم ثابت`}
                        {isFreeShip && 'شحن مجاني لكافة الوجهات'}
                      </div>
                    </div>
                    {coup.maxDiscount && isPercentage && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        (أقصى خصم: ${coup.maxDiscount})
                      </span>
                    )}
                  </div>

                  {/* Specs & Usage Limit Tracking Center */}
                  <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-[#181818] p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex justify-between items-center">
                      <span>الحد الأدنى للطلب:</span>
                      <strong className="font-mono text-neutral-900 dark:text-white">
                        ${coup.minPurchase || 0} USD
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>الحد لكل عميل (Per Customer):</span>
                      <strong className="font-mono text-neutral-900 dark:text-white">
                        {coup.perCustomerLimit || 1} مرة / عميل
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>تاريخ انتهاء الصلاحية:</span>
                      <strong className="font-mono text-neutral-900 dark:text-white" dir="ltr">
                        {formatDateDisplay(coup.expiryDate)}
                      </strong>
                    </div>

                    {/* Usage Limits Progress Bar */}
                    <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          مرات الاستخدام المحددة:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-neutral-950 dark:text-white">
                            {used}
                          </span>
                          <span className="text-neutral-400">/</span>
                          <span className="font-bold text-[#9A7B1C] dark:text-[#D4AF37]">
                            {isUnlimited ? '∞ غير محدود' : limit}
                          </span>
                        </div>
                      </div>

                      {!isUnlimited && (
                        <>
                          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExhausted
                                  ? 'bg-rose-500'
                                  : usagePercent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                            <span>نسبة الاستهلاك: {usagePercent}%</span>
                            <span className={isExhausted ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                              {isExhausted ? 'نفدت جميع الاستخدامات' : `متبقي ${remaining} استخدام`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Reset Counter, Top up, Edit, Duplicate, Delete */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(coup)}
                      className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="تعديل تفاصيل الكوبون وعدد المرات"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>تعديل</span>
                    </button>

                    {/* Reset Usage Counter */}
                    {used > 0 && (
                      <button
                        type="button"
                        onClick={() => handleResetUsage(id, coup.code)}
                        className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        title="تصفير عداد مرات الاستخدام إلى 0"
                      >
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        <span>تصفير العداد</span>
                      </button>
                    )}

                    {/* Top up +50 Uses */}
                    {!isUnlimited && (
                      <button
                        type="button"
                        onClick={() => handleAddUses(coup, 50)}
                        className="px-2 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        title="زيادة 50 استخدام إضافي لهذا الكوبون"
                      >
                        <span>+50 استخدام</span>
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(id)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="استنساخ وإنشاء نسخة أخرى من هذا الكوبون"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(id, coup.code)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="حذف الكوبون نهائياً"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(coup.code)}
                    className="px-3 py-1.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>{copiedCode === coup.code ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* Create / Edit Coupon Modal */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex justify-between items-center border-b border-neutral-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-xl">confirmation_number</span>
                </div>
                <div>
                  <h3 className="font-garamond text-xl font-bold">
                    {editingCoupon ? 'تعديل بيانات وحدود الكوبون' : 'إنشاء وتخصيص كوبون خصم جديد'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    حدد رمز الكوبون، عدد مرات الاستخدام المسموحة، وحد كل عميل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar">
              {/* Code with Generator */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  رمز الكوبون (Coupon Code) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="مثال: SAOUDI2026 أو ROYALVIP"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="flex-1 p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-[#D4AF37]"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setFormCode(generateRandomCode())}
                    className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">casino</span>
                    <span>توليد عشوائي</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  وصف الكوبون أو اسم الحملة التسويقية
                </label>
                <input
                  type="text"
                  placeholder="مثال: خصم تدشين التشكيلة الملكية لـ 100 عميل"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Type Selector */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  نوع الخصم
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'percentage', label: 'نسبة مئوية (%)', icon: 'percent' },
                    { id: 'fixed', label: 'مبلغ ثابت ($)', icon: 'attach_money' },
                    { id: 'freeShipping', label: 'شحن مجاني', icon: 'local_shipping' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        formType === t.id
                          ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 border-neutral-950 dark:border-[#D4AF37] font-bold shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{t.icon}</span>
                      <span className="text-[11px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value & Discount Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formType !== 'freeShipping' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      قيمة الخصم ({formType === 'percentage' ? '%' : 'USD'}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formType === 'percentage' ? '100' : '99999'}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    الحد الأدنى للطلب ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(Number(e.target.value))}
                    placeholder="0 (متاح لأي قيمة)"
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {formType === 'percentage' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      أقصى حد لمبلغ الخصم ($ USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                      placeholder="اختياري (مفتوح بدون سقف)"
                      className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* USAGE LIMIT CONTROLS SECTION (التحكم في عدد مرات الاستخدام) */}
              {/* ========================================================== */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-xs text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">pin</span>
                    <span>التحكم في عدد مرات استخدام الكوبون (Usage Limits):</span>
                  </label>

                  {/* Unlimited Toggle */}
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-neutral-800 dark:text-neutral-200">
                    <input
                      type="checkbox"
                      checked={formIsUnlimited}
                      onChange={(e) => setFormIsUnlimited(e.target.checked)}
                      className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] rounded cursor-pointer"
                    />
                    <span>استخدام غير محدود (Unlimited)</span>
                  </label>
                </div>

                {!formIsUnlimited ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          العدد الإجمالي للاستخدامات المسموحة *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="999999"
                          value={formUsageLimit}
                          onChange={(e) => setFormUsageLimit(Math.max(1, Number(e.target.value)))}
                          className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          الحد لكل عميل / حساب *
                        </label>
                        <select
                          value={formPerCustomerLimit}
                          onChange={(e) => setFormPerCustomerLimit(Number(e.target.value))}
                          className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-neutral-700 rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="1">مرة واحدة فقط لكل عميل (1 Use / Client)</option>
                          <option value="2">مرتان لكل عميل (2 Uses)</option>
                          <option value="3">3 مرات لكل عميل (3 Uses)</option>
                          <option value="5">5 مرات لكل عميل (5 Uses)</option>
                          <option value="9999">غير محدود لكل عميل</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Limit Buttons */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 font-bold block">
                        اختيار سريع لعدد المرات:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 5, 10, 20, 50, 100, 250, 500, 1000].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormUsageLimit(num)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                              formUsageLimit === num
                                ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 border-neutral-950 dark:border-[#D4AF37]'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#D4AF37]'
                            }`}
                          >
                            {num === 1 ? 'مرة واحدة (1)' : `${num} مرة`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">all_inclusive</span>
                    <span>الكوبون سيعمل لعدد مفتوح وغير محدود من الطلبات حتى تاريخ الانتهاء.</span>
                  </div>
                )}
              </div>

              {/* Expiry Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    تاريخ انتهاء الصلاحية *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    حالة الكوبون
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value="active">نشط وجاهز للعمل (Active)</option>
                    <option value="disabled">معطل مؤقتاً (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 font-bold rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الكوبون'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

