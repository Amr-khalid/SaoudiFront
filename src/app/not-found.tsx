'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <span className="font-mono text-6xl md:text-8xl font-black text-[#D4AF37] mb-4">404</span>
      <h1 className="font-garamond text-2xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
        الصفحة غير موجودة (Page Not Found)
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md mb-8 leading-relaxed">
        عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها إلى عنوان آخر.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-neutral-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-105"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
