'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminCustomer } from '../../../types';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export const CustomersManagement: React.FC = () => {
  const { showAlert } = useApp();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getAdminCustomers()
      .then((liveCusts) => {
        if (isMounted && liveCusts && liveCusts.length > 0) {
          setCustomers(liveCusts);
        }
        if (isMounted) setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in dir-rtl transition-colors">
      <div className="bg-white dark:bg-[#151515] p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex justify-between items-center transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-garamond text-2xl font-bold text-neutral-950 dark:text-white">
              قاعدة بيانات العملاء وكبار الشخصيات (VIP Clientele)
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-200 dark:border-amber-700/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              متصل لحظياً
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal mt-1">
            {customers.length} عميل مسجل في تونس وكافة الوجهات مع سجل المشتريات ونقاط الولاء.
          </p>
        </div>
      </div>

      {/* Customer Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-neutral-400 bg-white dark:bg-[#151515] rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <span className="material-symbols-outlined animate-spin text-2xl text-[#D4AF37] block mb-2 mx-auto">
            progress_activity
          </span>
          جاري تحميل بيانات العملاء...
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 bg-white dark:bg-[#151515] rounded-2xl border border-neutral-200 dark:border-neutral-800 font-light">
          لا يوجد عملاء في قاعدة البيانات حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((cust) => {
            const avatarUrl = typeof cust.avatar === 'string' ? cust.avatar : cust.avatar?.url;
            const initials = cust.name
              ? cust.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'SW';
            const city = cust.city || cust.addresses?.[0]?.city || 'تونس العاصمة';
            const country = cust.country || cust.addresses?.[0]?.country || 'الجمهورية التونسية';

            return (
              <div
                key={cust.id || cust._id}
                className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] flex-shrink-0 bg-neutral-900 text-[#D4AF37] flex items-center justify-center font-bold font-garamond text-lg shadow-2xs">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={cust.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/40 text-[10px] font-bold rounded uppercase">
                      عضوية {cust.status || 'Active'}
                    </span>
                    <h3 className="font-garamond text-lg font-bold text-neutral-950 dark:text-white leading-tight mt-1">
                      {cust.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {city}، {country}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-neutral-400 font-bold block">إجمالي الإنفاق</span>
                    <span className="font-bold text-[#9A7B1C] dark:text-[#D4AF37] font-garamond text-sm">
                      ${(cust.totalSpent || 0).toLocaleString()} USD
                    </span>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-neutral-400 font-bold block">عدد الطلبات</span>
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {cust.totalOrders || 0} طلبات
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    نقاط الولاء:{' '}
                    <strong className="text-neutral-900 dark:text-white">
                      {cust.rewardPoints ?? cust.loyaltyPoints ?? 0} نقطة
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => showAlert({
                      title: `ملف العميل: ${cust.name}`,
                      message: `• الاسم الكامل: ${cust.name}\n• رقم الجوال: ${cust.phone || 'غير مسجل'}\n• البريد الإلكتروني: ${cust.email}\n• إجمالي الطلبات: ${cust.totalOrders || 0} طلبات\n• نقاط الولاء: ${cust.rewardPoints ?? cust.loyaltyPoints ?? 0} نقطة\n• إجمالي المشتريات: $${(cust.totalSpent || 0).toLocaleString()} USD`,
                      type: 'info',
                      icon: 'person',
                    })}
                    className="text-[#9A7B1C] dark:text-[#D4AF37] font-bold hover:underline uppercase text-[10px] cursor-pointer"
                  >
                    عرض الملف والسجل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
