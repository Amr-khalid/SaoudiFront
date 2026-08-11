import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SAOUDI WEAR • Luxury Admin Dashboard',
  description: 'Enterprise Atelier Management Dashboard for SAOUDI WEAR Luxury Menswear & Horology.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-neutral-900 font-sans antialiased selection:bg-[#D4AF37] selection:text-neutral-900">
      {children}
    </div>
  );
}
