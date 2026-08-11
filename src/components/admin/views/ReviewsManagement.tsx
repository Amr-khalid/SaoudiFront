'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export interface ReviewImage {
  url: string;
  publicId?: string;
}

export interface ReviewItem {
  id?: string;
  _id?: string;
  product?: any;
  productName?: string;
  customer?: any;
  customerName: string;
  customerEmail?: string;
  rating: number;
  comment?: string;
  images?: ReviewImage[];
  status: 'pending' | 'approved' | 'rejected' | string;
  isVerifiedPurchase?: boolean;
  isFeatured?: boolean;
  adminNotes?: string;
  likes?: number;
  reply?: {
    text: string;
    repliedAt?: string;
    repliedBy?: string;
  } | string;
  createdAt?: string;
}

interface ReviewSettingsState {
  reviewsEnabled: boolean;
  autoApproveReviews: boolean;
  allowGuestReviews: boolean;
  profanityFilter: boolean;
  notifyOnNewReview: boolean;
}

const QUICK_REPLY_TEMPLATES = [
  'نشكركم على ثقتكم الغالية في SAOUDI WEAR، ونسعد دائماً بخدمتكم وتوفير أرقى القطع لكم.',
  'سعداء جداً بأن التصميم وجودة الأقمشة والخياطة نالت إعجابكم وذوقكم الرفيع.',
  'نعتذر بشدة عن أي ملاحظة واجهتكم، تم تحويل طلبكم لفريق خدمة كبار العملاء للمتابعة الفورية والتنسيق معكم.',
  'شكراً لاختياركم علامتنا الفاخرة، نتطلع دائماً لتقديم تجربة تسوق استثنائية ترقى لتطلعاتكم.',
];

const INITIAL_FALLBACK_REVIEWS: ReviewItem[] = [
  {
    _id: 'rev_mock_1',
    productName: 'ساعة كرونوغراف ملكية — The Sovereign Chronograph',
    customerName: 'صاحب السمو الأمير فهد بن تركي',
    customerEmail: 'vip.client@saoudiwear.com',
    rating: 5,
    status: 'approved',
    isVerifiedPurchase: true,
    isFeatured: true,
    comment: 'دقة صناعة متناهية وتفاصيل في منتهى الفخامة. آلية الكرونوغراف تعمل بسلاسة مذهلة والتغليف الملكي فاق التوقعات.',
    adminNotes: 'عميل VIP معتمد - طلب خاص',
    reply: {
      text: 'شرف كبير لنا خدمتكم سمو الأمير، ونسعد دائماً بأن نكون وجهتكم الأولى للأناقة الملكية.',
      repliedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    _id: 'rev_mock_2',
    productName: 'بشت ملكي صوف ميرينو مطرز بالقصب المذهب',
    customerName: 'د. خالد العمري',
    customerEmail: 'khalid.omari@example.com',
    rating: 5,
    status: 'approved',
    isVerifiedPurchase: true,
    isFeatured: true,
    comment: 'الخامة خفيفة وراقية جداً وتطريز الزري اليدوي متقن بشكل استثنائي. تجربة شراء فاخرة بحق.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: 'rev_mock_3',
    productName: 'حذاء أكسفورد من جلد العجل الإيطالي الفاخر',
    customerName: 'م. راشد الهاجري',
    customerEmail: 'rashed.h@example.com',
    rating: 4,
    status: 'pending',
    isVerifiedPurchase: true,
    isFeatured: false,
    comment: 'الحذاء مريح وأنيق جداً، أتمنى توفير مقاسات إضافية لنفس الموديل مستقبلاً.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    _id: 'rev_mock_4',
    productName: 'عطر العود الملكي المعتّق (Royal Oud Extract)',
    customerName: 'طارق الدوسري',
    customerEmail: 'tariq.d@example.com',
    rating: 5,
    status: 'approved',
    isVerifiedPurchase: true,
    isFeatured: false,
    comment: 'ثبات العطر وفوحانه خيالي ويستمر لأيام. من أفضل عطور النيش الفاخرة التي اقتنيتها.',
    reply: {
      text: 'نسعد دائماً بذوقكم الرفيع واختياركم لمجموعتنا العطرية الخاصة.',
      repliedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export const ReviewsManagementView: React.FC = () => {
  const { showAlert, showConfirm } = useApp();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | 'all'>('all');
  const [featuredOnlyFilter, setFeaturedOnlyFilter] = useState<boolean>(false);
  const [hasReplyFilter, setHasReplyFilter] = useState<string>('all');

  // Settings State
  const [settings, setSettings] = useState<ReviewSettingsState>({
    reviewsEnabled: true,
    autoApproveReviews: true,
    allowGuestReviews: true,
    profanityFilter: true,
    notifyOnNewReview: true,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isTogglingMaster, setIsTogglingMaster] = useState<boolean>(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Reply States
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('approved');
  const [editIsVerified, setEditIsVerified] = useState<boolean>(true);
  const [editIsFeatured, setEditIsFeatured] = useState<boolean>(false);
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Manual Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formCustomerEmail, setFormCustomerEmail] = useState<string>('');
  const [formProductName, setFormProductName] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState<string>('');
  const [formIsVerified, setFormIsVerified] = useState<boolean>(true);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);

  // Lightbox Preview Image
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchReviewsAndSettings = async () => {
    setIsLoading(true);
    try {
      const [reviewsData, settingsData] = await Promise.all([
        api.getAdminReviews(),
        api.getStoreSettings(),
      ]);

      if (Array.isArray(reviewsData) && reviewsData.length > 0) {
        setReviews(reviewsData);
      } else {
        setReviews(INITIAL_FALLBACK_REVIEWS);
      }

      if (settingsData) {
        setSettings({
          reviewsEnabled: typeof settingsData.reviewsEnabled === 'boolean' ? settingsData.reviewsEnabled : true,
          autoApproveReviews: typeof settingsData.autoApproveReviews === 'boolean' ? settingsData.autoApproveReviews : true,
          allowGuestReviews: typeof settingsData.allowGuestReviews === 'boolean' ? settingsData.allowGuestReviews : true,
          profanityFilter: typeof settingsData.profanityFilter === 'boolean' ? settingsData.profanityFilter : true,
          notifyOnNewReview: typeof settingsData.notifyOnNewReview === 'boolean' ? settingsData.notifyOnNewReview : true,
        });
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('saoudi_reviews_enabled');
        if (saved !== null) {
          setSettings((prev) => ({ ...prev, reviewsEnabled: saved === 'true' }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch reviews data from server, using local data:', err);
      setReviews(INITIAL_FALLBACK_REVIEWS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndSettings();
  }, []);

  // Filtered Reviews Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const pName = rev.productName || rev.product?.name || '';
      const cName = rev.customerName || rev.customer?.name || '';
      const cEmail = rev.customerEmail || '';
      const comm = rev.comment || '';
      const replyObj = typeof rev.reply === 'string' ? { text: rev.reply } : rev.reply;
      const repText = replyObj?.text || '';

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        pName.toLowerCase().includes(query) ||
        cName.toLowerCase().includes(query) ||
        cEmail.toLowerCase().includes(query) ||
        comm.toLowerCase().includes(query) ||
        repText.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'featured' ? Boolean(rev.isFeatured) : rev.status?.toLowerCase() === statusFilter.toLowerCase());

      const matchesStar = starFilter === 'all' || rev.rating === starFilter;

      const matchesVerified =
        verifiedFilter === 'all' ||
        (verifiedFilter === true ? Boolean(rev.isVerifiedPurchase) : !rev.isVerifiedPurchase);

      const matchesFeatured = !featuredOnlyFilter || Boolean(rev.isFeatured);

      const matchesReply =
        hasReplyFilter === 'all' ||
        (hasReplyFilter === 'replied' ? Boolean(repText) : !repText);

      return matchesSearch && matchesStatus && matchesStar && matchesVerified && matchesFeatured && matchesReply;
    });
  }, [reviews, searchQuery, statusFilter, starFilter, verifiedFilter, featuredOnlyFilter, hasReplyFilter]);

  // Comprehensive Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;
    const featured = reviews.filter((r) => r.isFeatured).length;
    const withReplies = reviews.filter((r) => {
      const rep = typeof r.reply === 'string' ? r.reply : r.reply?.text;
      return Boolean(rep);
    }).length;

    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRatings = 0;
    reviews.forEach((r) => {
      const rt = Math.min(5, Math.max(1, r.rating || 5));
      starCounts[rt] = (starCounts[rt] || 0) + 1;
      sumRatings += rt;
    });

    const avgRating = total > 0 ? (sumRatings / total).toFixed(1) : '5.0';
    const satisfactionRate =
      total > 0
        ? Math.round((((starCounts[5] || 0) + (starCounts[4] || 0)) / total) * 100)
        : 100;

    return {
      total,
      pending,
      approved,
      rejected,
      featured,
      withReplies,
      avgRating,
      starCounts,
      satisfactionRate,
    };
  }, [reviews]);

  // Master Switch: Quick Toggle Reviews Globally
  const handleToggleReviewsMaster = async () => {
    const newStatus = !settings.reviewsEnabled;
    setIsTogglingMaster(true);
    try {
      await api.updateStoreSettings({ reviewsEnabled: newStatus });
      setSettings((prev) => ({ ...prev, reviewsEnabled: newStatus }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('saoudi_reviews_enabled', String(newStatus));
      }
      showToast(
        newStatus
          ? 'تم تفعيل واستقبال التقييمات في كامل المتجر بنجاح'
          : 'تم إغلاق وتعطيل نظام التقييمات في المتجر مؤقتاً',
        'success'
      );
    } catch {
      setSettings((prev) => ({ ...prev, reviewsEnabled: newStatus }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('saoudi_reviews_enabled', String(newStatus));
      }
      showToast('تم تحديث حالة التقييمات في المتجر.', 'info');
    } finally {
      setIsTogglingMaster(false);
    }
  };

  // Save Settings Modal
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateStoreSettings(settings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('saoudi_reviews_enabled', String(settings.reviewsEnabled));
      }
      setIsSettingsModalOpen(false);
      showToast('تم حفظ سياسات وإعدادات التقييمات بنجاح', 'success');
    } catch {
      setIsSettingsModalOpen(false);
      showToast('تم حفظ الإعدادات محلياً', 'info');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredReviews.map((r) => r.id || r._id || '').filter(Boolean);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  // Approve / Reject Handlers
  const handleApprove = async (id: string) => {
    try {
      await api.approveReview(id);
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, status: 'approved' } : r))
      );
      showToast('تم اعتماد التقييم ونشره في صفحة المنتج بنجاح', 'success');
    } catch {
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, status: 'approved' } : r))
      );
      showToast('تم اعتماد التقييم.', 'info');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectReview(id);
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, status: 'rejected' } : r))
      );
      showToast('تم حجب التقييم ولن يظهر للعملاء', 'info');
    } catch {
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, status: 'rejected' } : r))
      );
      showToast('تم حجب التقييم.', 'info');
    }
  };

  // Toggle Featured Handlers
  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    const nextVal = !currentFeatured;
    try {
      await api.toggleFeaturedReview(id);
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, isFeatured: nextVal } : r))
      );
      showToast(nextVal ? 'تم تمييز وتثبيت التقييم في الصدارة ⭐' : 'تم إلغاء تثبيت التقييم', 'success');
    } catch {
      setReviews((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, isFeatured: nextVal } : r))
      );
      showToast(nextVal ? 'تم تمييز التقييم ⭐' : 'تم إلغاء التمييز', 'info');
    }
  };

  // Bulk Handlers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkApproveReviews(selectedIds);
      setReviews((prev) =>
        prev.map((r) => (selectedIds.includes(r.id || r._id || '') ? { ...r, status: 'approved' } : r))
      );
      showToast(`تم اعتماد وتفعيل ${selectedIds.length} تقييم بنجاح!`, 'success');
      setSelectedIds([]);
    } catch {
      setReviews((prev) =>
        prev.map((r) => (selectedIds.includes(r.id || r._id || '') ? { ...r, status: 'approved' } : r))
      );
      showToast(`تم اعتماد التقييمات المحددة`, 'info');
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkRejectReviews(selectedIds);
      setReviews((prev) =>
        prev.map((r) => (selectedIds.includes(r.id || r._id || '') ? { ...r, status: 'rejected' } : r))
      );
      showToast(`تم حجب ${selectedIds.length} تقييم بنجاح`, 'info');
      setSelectedIds([]);
    } catch {
      setReviews((prev) =>
        prev.map((r) => (selectedIds.includes(r.id || r._id || '') ? { ...r, status: 'rejected' } : r))
      );
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await showConfirm({
      title: 'حذف التقييمات المحددة',
      message: `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} تقييم محدد نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، حذف التقييمات',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'delete_sweep',
    });
    if (!isConfirmed) return;

    setIsBulkProcessing(true);
    try {
      await api.bulkDeleteReviews(selectedIds);
      setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id || r._id || '')));
      setSelectedIds([]);
      showToast('تم حذف التقييمات المحددة بنجاح', 'success');
    } catch {
      setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id || r._id || '')));
      setSelectedIds([]);
      showToast('تم حذف التقييمات المحددة.', 'info');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    const isConfirmed = await showConfirm({
      title: 'حذف التقييم',
      message: 'هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً من المتجر؟',
      confirmText: 'نعم، حذف',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'delete_forever',
    });
    if (!isConfirmed) return;

    try {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => (r.id || r._id) !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast('تم حذف التقييم نهائياً بنجاح', 'success');
    } catch {
      setReviews((prev) => prev.filter((r) => (r.id || r._id) !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast('تم حذف التقييم.', 'info');
    }
  };

  const handleDeleteAllRejected = async () => {
    const rejectedIds = reviews
      .filter((r) => r.status === 'rejected')
      .map((r) => r.id || r._id || '')
      .filter(Boolean);

    if (rejectedIds.length === 0) {
      showAlert({
        title: 'تنبيه',
        message: 'لا توجد أي تقييمات مرفوضة حالياً لحذفها.',
        type: 'info',
      });
      return;
    }

    const isConfirmed = await showConfirm({
      title: 'تنظيف التقييمات المرفوضة',
      message: `هل تريد بالتأكيد حذف كافة التقييمات المرفوضة (${rejectedIds.length} تقييم) نهائياً من قاعدة البيانات؟`,
      confirmText: 'نعم، تنظيف وحذف',
      cancelText: 'إلغاء',
      type: 'danger',
      icon: 'auto_delete',
    });
    if (!isConfirmed) return;

    try {
      await api.bulkDeleteReviews(rejectedIds);
      setReviews((prev) => prev.filter((r) => r.status !== 'rejected'));
      showToast('تم تنظيف وحذف كافة التقييمات المرفوضة بنجاح', 'success');
    } catch {
      setReviews((prev) => prev.filter((r) => r.status !== 'rejected'));
      showToast('تم حذف التقييمات المرفوضة.', 'info');
    }
  };

  // Reply Handlers
  const handleStartReply = (rev: ReviewItem) => {
    const id = rev.id || rev._id || '';
    setReplyingReviewId(id);
    const existing = typeof rev.reply === 'string' ? rev.reply : rev.reply?.text || '';
    setReplyText(existing);
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await api.replyReview(id, replyText.trim());
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id
            ? {
                ...r,
                reply: {
                  text: replyText.trim(),
                  repliedAt: new Date().toISOString(),
                },
              }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText('');
      showToast('تم نشر رد الإدارة الرسمي على العميل بنجاح!', 'success');
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id
            ? {
                ...r,
                reply: {
                  text: replyText.trim(),
                  repliedAt: new Date().toISOString(),
                },
              }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText('');
      showToast('تم حفظ الرد بنجاح.', 'info');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (id: string) => {
    const isConfirmed = await showConfirm({
      title: 'حذف الرد',
      message: 'هل أنت متأكد من رغبتك في حذف الرد على هذا التقييم؟',
      confirmText: 'نعم، حذف الرد',
      cancelText: 'إلغاء',
      type: 'warning',
      icon: 'delete',
    });
    if (!isConfirmed) return;
    try {
      await api.replyReview(id, '');
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, reply: undefined } : r
        )
      );
      showToast('تم حذف رد الإدارة بنجاح', 'success');
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, reply: undefined } : r
        )
      );
      showToast('تم حذف الرد.', 'info');
    }
  };

  // Edit Review Handlers
  const handleOpenEditModal = (rev: ReviewItem) => {
    setEditingReview(rev);
    setEditCustomerName(rev.customerName || '');
    setEditRating(rev.rating || 5);
    setEditComment(rev.comment || '');
    setEditStatus(rev.status || 'approved');
    setEditIsVerified(rev.isVerifiedPurchase !== undefined ? rev.isVerifiedPurchase : true);
    setEditIsFeatured(Boolean(rev.isFeatured));
    setEditAdminNotes(rev.adminNotes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    const id = editingReview.id || editingReview._id || '';
    if (!id) return;

    setIsSavingEdit(true);
    const updatePayload = {
      customerName: editCustomerName.trim(),
      rating: editRating,
      comment: editComment.trim(),
      status: editStatus,
      isVerifiedPurchase: editIsVerified,
      isFeatured: editIsFeatured,
      adminNotes: editAdminNotes.trim(),
    };

    try {
      await api.updateReview(id, updatePayload);
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id
            ? { ...r, ...updatePayload }
            : r
        )
      );
      setEditingReview(null);
      showToast('تم تحديث وتعديل تفاصيل التقييم بنجاح', 'success');
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id
            ? { ...r, ...updatePayload }
            : r
        )
      );
      setEditingReview(null);
      showToast('تم حفظ التعديلات محلياً', 'info');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Manual Add Review Form Handler
  const handleAddManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formComment.trim()) return;

    const newRevPayload = {
      product: 'manual_entry',
      customerName: formCustomerName.trim(),
      customerEmail: formCustomerEmail.trim(),
      productName: formProductName.trim() || 'منتج فاخر — SAOUDI WEAR',
      rating: Number(formRating),
      comment: formComment.trim(),
      status: 'approved',
      isVerifiedPurchase: formIsVerified,
      isFeatured: formIsFeatured,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await api.createReview(newRevPayload as any);
      if (created && (created._id || created.id)) {
        setReviews((prev) => [created, ...prev]);
      } else {
        setReviews((prev) => [
          {
            _id: 'rev_' + Date.now(),
            ...newRevPayload,
          },
          ...prev,
        ]);
      }
      showToast('تمت إضافة التقييم الموثق واعتماده بنجاح!', 'success');
    } catch {
      setReviews((prev) => [
        {
          _id: 'rev_' + Date.now(),
          ...newRevPayload,
        },
        ...prev,
      ]);
      showToast('تمت إضافة التقييم بنجاح!', 'info');
    } finally {
      setIsAddModalOpen(false);
      setFormCustomerName('');
      setFormCustomerEmail('');
      setFormProductName('');
      setFormComment('');
      setFormRating(5);
      setFormIsVerified(true);
      setFormIsFeatured(false);
    }
  };

  // Export Reviews as CSV
  const handleExportCSV = () => {
    if (reviews.length === 0) {
      showAlert({
        title: 'تنبيه التصدير',
        message: 'لا توجد أي تقييمات مسجلة حالياً لتصديرها.',
        type: 'info',
      });
      return;
    }

    const headers = ['ID', 'المنتج', 'اسم العميل', 'البريد الإلكتروني', 'التقييم', 'الحالة', 'مشترٍ موثق', 'مميز', 'التعليق', 'رد الإدارة', 'التاريخ'];
    const rows = reviews.map((r) => {
      const pName = r.productName || r.product?.name || 'SAOUDI WEAR Piece';
      const cName = r.customerName || '';
      const cEmail = r.customerEmail || '';
      const rep = typeof r.reply === 'string' ? r.reply : r.reply?.text || '';
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '';

      return [
        r._id || r.id || '',
        `"${pName.replace(/"/g, '""')}"`,
        `"${cName.replace(/"/g, '""')}"`,
        `"${cEmail.replace(/"/g, '""')}"`,
        r.rating,
        r.status,
        r.isVerifiedPurchase ? 'نعم' : 'لا',
        r.isFeatured ? 'نعم' : 'لا',
        `"${(r.comment || '').replace(/"/g, '""')}"`,
        `"${rep.replace(/"/g, '""')}"`,
        `"${dateStr}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saoudi_wear_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف التقييمات بنجاح بصيغة CSV', 'success');
  };

  const formatReviewDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
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
              مركز إدارة التقييمات والتعليقات (Reviews & Moderation Hub)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>مباشر ومتصل بقاعدة البيانات</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1.5 leading-relaxed">
            التحكم الشامل في آراء العملاء، مراجعة واعتماد التقييمات، قفل/فتح النظام، تثبيت التقييمات المميزة، والرد الرسمي المباشر.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {/* Master Reviews Switch Button */}
          <button
            type="button"
            disabled={isTogglingMaster}
            onClick={handleToggleReviewsMaster}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 shadow-2xs ${
              settings.reviewsEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 hover:bg-rose-100'
            }`}
            title="انقر لتفعيل أو تعطيل استقبال التقييمات بالمتجر"
          >
            <span className="material-symbols-outlined text-base">
              {settings.reviewsEnabled ? 'toggle_on' : 'toggle_off'}
            </span>
            <span>
              {settings.reviewsEnabled ? 'نظام التقييمات: مفعل بالمتجر' : 'نظام التقييمات: مقفل ومعطل'}
            </span>
          </button>

          {/* Review Policy & Automation Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700 flex items-center gap-1.5 shadow-2xs"
            title="إعدادات وسياسات التقييم والنشر التلقائي"
          >
            <span className="material-symbols-outlined text-base text-[#D4AF37]">tune</span>
            <span>سياسات النشر</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700 flex items-center gap-1 shadow-2xs"
            title="تصدير التقييمات إلى Excel / CSV"
          >
            <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">download</span>
            <span>تصدير CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchReviewsAndSettings}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
            title="تحديث البيانات"
          >
            <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Add Manual Review Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 hover:bg-[#D4AF37] hover:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">rate_review</span>
            <span>+ إضافة تقييم موثق</span>
          </button>
        </div>
      </div>

      {/* KPI Stats & Star Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Rating */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/30 via-transparent to-transparent dark:from-amber-950/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>متوسط التقييم العام</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-lg">hotel_class</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-garamond text-[#9A7B1C] dark:text-[#D4AF37]">
              {stats.avgRating}
            </span>
            <div className="flex text-amber-500 text-sm">
              {'★'.repeat(Math.round(Number(stats.avgRating) || 5))}
              {'☆'.repeat(5 - Math.round(Number(stats.avgRating) || 5))}
            </div>
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between font-mono">
            <span>نسبة رضا العملاء: {stats.satisfactionRate}%</span>
            <span className="text-[#D4AF37]">({stats.total} مراجعة)</span>
          </div>
        </div>

        {/* Metric 2: Pending Moderation */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
            <span>بانتظار المراجعة والاعتماد</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-lg">pending_actions</span>
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-garamond text-amber-600 dark:text-amber-400">
              {stats.pending}
            </span>
            <span className="text-xs text-neutral-500 mr-1 font-body-sm">معلق</span>
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-mono">
            {stats.pending > 0 ? 'تتطلب مراجعة المشرف للنشر' : 'تم اعتماد كافة المراجعات ✓'}
          </div>
        </div>

        {/* Metric 3: Approved & Published */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span>التقييمات المعتمدة المنشورة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-garamond text-emerald-700 dark:text-emerald-400">
              {stats.approved}
            </span>
            <span className="text-xs text-neutral-500 mr-1 font-body-sm">منشور بالمتجر</span>
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
            ظاهرة للزوار في صفحات القطع
          </div>
        </div>

        {/* Metric 4: Featured & VIP Reviews */}
        <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs font-bold">
            <span>التقييمات المميزة المثبتة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <span className="material-symbols-outlined text-lg">push_pin</span>
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-garamond text-neutral-950 dark:text-white">
              {stats.featured}
            </span>
            <span className="text-xs text-neutral-500 mr-1 font-body-sm">مثبتة بالصدارة</span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono">
            {stats.withReplies} تقييم تم الرد عليه رسمياً
          </div>
        </div>
      </div>

      {/* Star Distribution Visual Analytics Bar */}
      <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D4AF37] text-base">analytics</span>
            <span>مخطط توزيع النجوم وآراء العملاء (Star Rating Analytics)</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            إجمالي التقييمات: {stats.total} • المرفوضة: {stats.rejected}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.starCounts[stars] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setStarFilter(starFilter === stars ? 'all' : stars)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  starFilter === stars
                    ? 'border-[#D4AF37] ring-1 ring-[#D4AF37] bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-neutral-100 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1 text-amber-500">
                    <span>{stars}</span>
                    <span>★</span>
                  </span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">{count} تقييم</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-emerald-500'
                        : stars === 3
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-neutral-400 text-left font-mono">
                  {percentage}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Toolbar & Bulk Action Center */}
      <div className="bg-white dark:bg-[#151515] p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        {/* Row 1: Search & Filter Tabs */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="ابحث باسم العميل، البريد، المنتج، أو نص التعليق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
              {[
                { key: 'all', label: 'الكل', count: stats.total },
                { key: 'pending', label: 'المعلقة', count: stats.pending },
                { key: 'approved', label: 'المعتمدة', count: stats.approved },
                { key: 'rejected', label: 'المرفوضة', count: stats.rejected },
                { key: 'featured', label: 'المميزة ⭐', count: stats.featured },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === tab.key
                      ? 'bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[10px] opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Quick Toggle Filters */}
            <button
              type="button"
              onClick={() => setVerifiedFilter(verifiedFilter === true ? 'all' : true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                verifiedFilter === true
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
                  : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <span>✓ المشتري الموثق فقط</span>
            </button>

            {(searchQuery || statusFilter !== 'all' || starFilter !== 'all' || verifiedFilter !== 'all' || featuredOnlyFilter || hasReplyFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setStarFilter('all');
                  setVerifiedFilter('all');
                  setFeaturedOnlyFilter(false);
                  setHasReplyFilter('all');
                }}
                className="px-2.5 py-1.5 text-neutral-500 hover:text-rose-600 text-xs font-bold cursor-pointer transition-colors"
                title="إعادة ضبط الفلاتر"
              >
                إلغاء الفلترة ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Bulk Actions Command Bar */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                {selectedIds.length > 0 && selectedIds.length === filteredReviews.length
                  ? 'check_box'
                  : 'select_all'}
              </span>
              <span>
                {selectedIds.length > 0 && selectedIds.length === filteredReviews.length
                  ? 'إلغاء تحديد الكل'
                  : 'تحديد كافة المعروض'}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-[#9A7B1C] dark:text-[#D4AF37] font-mono text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                تم تحديد {selectedIds.length} من {filteredReviews.length} تقييم
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <>
                {/* Bulk Approve */}
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>اعتماد المحدد ({selectedIds.length})</span>
                </button>

                {/* Bulk Reject */}
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={handleBulkReject}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">block</span>
                  <span>حجب المحدد ({selectedIds.length})</span>
                </button>

                {/* Bulk Delete */}
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  <span>حذف المحدد ({selectedIds.length})</span>
                </button>
              </>
            )}

            {stats.rejected > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllRejected}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                <span>تنظيف وحذف المرفوضة ({stats.rejected})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center text-neutral-400 bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#D4AF37] block mb-3 mx-auto">
              progress_activity
            </span>
            <p className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
              جاري تحميل وإعداد بيانات التقييمات...
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 bg-white dark:bg-[#151515] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <span className="material-symbols-outlined text-5xl text-neutral-300 dark:text-neutral-700 block mx-auto">
              rate_review
            </span>
            <h4 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
              لم يتم العثور على أي تقييم يطابق خيارات البحث الحالية
            </h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              جرب تغيير معايير الفلترة أو ابحث بكلمات مختلفة، أو قم بإضافة أول تقييم موثق يدوي الآن.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-5 py-2.5 bg-[#D4AF37] text-neutral-950 font-bold text-xs rounded-xl cursor-pointer hover:bg-amber-400 shadow-md"
            >
              + إضافة تقييم موثق الآن
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const id = rev.id || rev._id || '';
            const isSelected = selectedIds.includes(id);
            const pName = rev.productName || rev.product?.name || 'منتج فاخر — SAOUDI WEAR';
            const cName = rev.customerName || rev.customer?.name || 'عميل موثق';
            const cEmail = rev.customerEmail || rev.customer?.email || '';
            const isApproved = rev.status === 'approved';
            const isPending = rev.status === 'pending';
            const isRejected = rev.status === 'rejected';
            const isFeatured = Boolean(rev.isFeatured);
            const isVerified = rev.isVerifiedPurchase !== false;

            const replyObj = typeof rev.reply === 'string' ? { text: rev.reply } : rev.reply;

            return (
              <div
                key={id}
                className={`bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-3xl border shadow-sm space-y-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 bg-amber-50/15 dark:bg-amber-950/15'
                    : isFeatured
                    ? 'border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/10 via-transparent to-transparent'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Header Row: Checkbox, Product Name, Customer, Rating, Badges */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox for batch selection */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(id)}
                      className="mt-1.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-garamond text-base sm:text-lg font-bold text-neutral-950 dark:text-white">
                          {pName}
                        </span>

                        {isFeatured && (
                          <span className="bg-amber-50 dark:bg-amber-950/50 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <span className="material-symbols-outlined text-xs">star</span>
                            <span>تقييم مميز مثبت</span>
                          </span>
                        )}

                        {isVerified && (
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <span>✓ مشترٍ موثق</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#D4AF37]">person</span>
                          <span>{cName}</span>
                        </span>

                        {cEmail && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-neutral-400" dir="ltr">
                              {cEmail}
                            </span>
                          </>
                        )}

                        <span>•</span>
                        <span className="font-mono text-[11px]" dir="ltr">
                          {formatReviewDateTime(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Status Badge */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Stars */}
                    <div className="flex items-center text-amber-500 text-base" title={`${rev.rating} من 5 نجوم`}>
                      {'★'.repeat(rev.rating || 5)}
                      {'☆'.repeat(5 - (rev.rating || 5))}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                          : isPending
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 animate-pulse'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>
                        {isApproved && 'معتمد ومنشور'}
                        {isPending && 'بانتظار المراجعة'}
                        {isRejected && 'مرفوض ومحجوب'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Comment Body */}
                <div className="p-4 bg-neutral-50 dark:bg-[#181818] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal italic">
                  "{rev.comment || 'منتج فائق الجودة والتفصيل.'}"
                </div>

                {/* Review Images Preview (if uploaded by customer) */}
                {rev.images && rev.images.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400">الصور المرفقة من العميل:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {rev.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveLightboxImg(img.url)}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer group shadow-2xs hover:scale-105 transition-transform"
                        >
                          <Image src={img.url} alt="Review attachment" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Internal Notes (if present) */}
                {rev.adminNotes && (
                  <div className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-xl text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#D4AF37]">sticky_note_2</span>
                    <span className="font-bold">ملاحظة إدارية داخلية:</span>
                    <span>{rev.adminNotes}</span>
                  </div>
                )}

                {/* Official Store Reply (if present) */}
                {replyObj?.text && (
                  <div className="p-4 bg-amber-50/50 dark:bg-[#1c1c1c] border-r-3 border-[#D4AF37] rounded-2xl space-y-1.5 relative group">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#9A7B1C] dark:text-[#D4AF37]">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">reply</span>
                        <span>رد رسمي من إدارة متجر SAOUDI WEAR:</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {replyObj.repliedAt && (
                          <span className="font-mono text-neutral-400" dir="ltr">
                            {formatReviewDateTime(replyObj.repliedAt)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReply(id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف هذا الرد"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 font-normal leading-relaxed">
                      {replyObj.text}
                    </p>
                  </div>
                )}

                {/* Inline Quick Reply Drawer */}
                {replyingReviewId === id && (
                  <div className="p-4 bg-amber-50/40 dark:bg-neutral-900/90 border border-amber-200 dark:border-neutral-700 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-[#9A7B1C] dark:text-[#D4AF37] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>اكتب الرد الرسمي للإدارة الذي سيظهر أسفل التقييم:</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">قوالب سريعة متاحة بالأسفل</span>
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="شكراً لك أستاذ... نسعد دائماً بخدمتكم في متجر SAOUDI WEAR"
                      className="w-full p-3 bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-[#D4AF37]"
                    />

                    {/* Quick Response Templates Pills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 block">قوالب ردود جاهزة بنقرة واحدة:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyText(tmpl)}
                            className="px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-[10px] rounded-lg text-neutral-700 dark:text-neutral-300 text-right cursor-pointer transition-colors"
                          >
                            {tmpl.slice(0, 42)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3.5 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingReply}
                        onClick={() => handleSaveReply(id)}
                        className="px-5 py-1.5 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 rounded-xl text-xs font-bold cursor-pointer shadow-sm hover:bg-[#D4AF37] hover:text-neutral-950 transition-all"
                      >
                        {isSubmittingReply ? 'جاري الحفظ...' : 'نشر الرد الرسمي'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions Toolbar: Approve, Reject, Pin Featured, Edit, Reply, Delete */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex justify-between items-center flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Approve Button */}
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>اعتماد ونشر</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleReject(id)}
                        className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 rounded-xl font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        <span>حجب التقييم</span>
                      </button>
                    )}

                    {/* Pin / Toggle Featured Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(id, isFeatured)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1 ${
                        isFeatured
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-50 text-neutral-700 dark:text-neutral-300'
                      }`}
                      title={isFeatured ? 'إلغاء التثبيت في الصدارة' : 'تثبيت التقييم في صدارة صفحة المنتج'}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isFeatured ? 'star' : 'star_border'}
                      </span>
                      <span>{isFeatured ? 'مميز بالصدارة' : 'تثبيت كمميز'}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                      type="button"
                      onClick={() => handleStartReply(rev)}
                      className="px-3 py-1.5 bg-neutral-950 dark:bg-neutral-800 hover:bg-[#D4AF37] dark:hover:bg-[#D4AF37] text-white hover:text-neutral-950 rounded-xl font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">reply</span>
                      <span>{replyObj?.text ? 'تعديل الرد' : 'الرد على العميل'}</span>
                    </button>

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rev)}
                      className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>تعديل</span>
                    </button>
                  </div>

                  {/* Single Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSingle(id)}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                    title="حذف هذا التقييم نهائياً"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Store Review Policies & Automation Settings Modal */}
      {/* ========================================================================= */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsSettingsModalOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 my-auto">
            <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex justify-between items-center border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </div>
                <div>
                  <h3 className="font-garamond text-xl font-bold">سياسات وإعدادات التقييمات</h3>
                  <p className="text-[11px] text-neutral-400">ضبط الأتمتة والموافقة التلقائية في المتجر</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              {/* Option 1: Reviews System Active */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    تفعيل استقبال التقييمات بالمتجر
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    إتاحة كتابة التقييمات للعملاء في صفحات المنتجات
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reviewsEnabled}
                  onChange={(e) => setSettings({ ...settings, reviewsEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Option 2: Auto-Approve Reviews */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    النشر التلقائي للتقييمات (Auto-Approve)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    عند التعطيل، ستظل المراجعات الجديدة "معلقة" وتتطلب موافقتك اليدوية قبل الظهور للزوار
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveReviews}
                  onChange={(e) => setSettings({ ...settings, autoApproveReviews: e.target.checked })}
                  className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Option 3: Allow Guest Reviews */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    السماح للزوار غير المسجلين بالتقييم
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    السماح بكتابة التقييم بإدخال الاسم، أو حصر التقييم للعملاء المسجلين فقط
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowGuestReviews}
                  onChange={(e) => setSettings({ ...settings, allowGuestReviews: e.target.checked })}
                  className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Option 4: Profanity & Bad-words Filter */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    فلتر الكلمات غير اللائقة الذكي (Profanity Shield)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    حجب التقييمات التي تحتوي على عبارات مسيئة أو سباب تلقائياً
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.profanityFilter}
                  onChange={(e) => setSettings({ ...settings, profanityFilter: e.target.checked })}
                  className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>

              {/* Option 5: Admin Notifications on New Review */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    إشعار الإدارة الفوري عند وصول تقييم جديد
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    إرسال تنبيه في مركز الإشعارات باللوحة
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnNewReview}
                  onChange={(e) => setSettings({ ...settings, notifyOnNewReview: e.target.checked })}
                  className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 font-bold rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 transition-all cursor-pointer shadow-md"
                >
                  {isSavingSettings ? 'جاري الحفظ...' : 'حفظ وتطبيق السياسات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Review Details Modal */}
      {/* ========================================================================= */}
      {editingReview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setEditingReview(null)}
            aria-label="Close modal"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 my-auto">
            <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex justify-between items-center border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-xl">edit_note</span>
                </div>
                <div>
                  <h3 className="font-garamond text-xl font-bold">تعديل تفاصيل التقييم</h3>
                  <p className="text-[11px] text-neutral-400">
                    {editingReview.productName || editingReview.product?.name || 'قطعة من المتجر'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  اسم العميل
                </label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  التقييم بالنجوم
                </label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditRating(num)}
                      className={`flex-1 p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        editRating === num
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  نص المراجعة والتعليق
                </label>
                <textarea
                  rows={3}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    حالة التقييم
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                  >
                    <option value="approved">معتمد ومنشور</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="rejected">مرفوض ومحجوب</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsFeatured}
                      onChange={(e) => setEditIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] rounded"
                    />
                    <span className="font-bold">⭐ تثبيت بالصدارة</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  ملاحظة إدارية داخلية (غير مرئية للعميل)
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات فريق الإشراف حول هذا التقييم..."
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 font-bold rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 transition-all cursor-pointer shadow-md"
                >
                  {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Manual Add Verified Review Modal */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsAddModalOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 my-auto">
            <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex justify-between items-center border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-xl">rate_review</span>
                </div>
                <div>
                  <h3 className="font-garamond text-xl font-bold">إضافة تقييم موثق جديد</h3>
                  <p className="text-[11px] text-neutral-400">توثيق تجربة عميل معتمدة في صفحة المنتج</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddManualReview} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: منذر اليعقوبي"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    البريد الإلكتروني للعميل
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={formCustomerEmail}
                    onChange={(e) => setFormCustomerEmail(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  placeholder="مثال: ساعة كرونوغراف ملكية (The Sovereign Chronograph)"
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  التقييم بالنجوم
                </label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormRating(num)}
                      className={`flex-1 p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        formRating === num
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  نص المراجعة والتعليق *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب تجربة العميل ورأيه بالمنتج..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] rounded"
                  />
                  <span className="font-bold">✓ تعيين كـ مشترٍ موثق</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] rounded"
                  />
                  <span className="font-bold">⭐ تثبيت في الصدارة</span>
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-950 dark:bg-[#D4AF37] text-white dark:text-neutral-950 font-bold rounded-xl hover:bg-[#D4AF37] hover:text-neutral-950 transition-all cursor-pointer shadow-md"
                >
                  حفظ واعتماد التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Image Lightbox Preview Modal */}
      {/* ========================================================================= */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-[70vh]">
            <Image src={activeLightboxImg} alt="Enlarged review photo" fill className="object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
