import type { Metadata } from 'next';
import './globals.css';
import { ClientLayoutContainer } from '../components/layout/ClientLayoutContainer';

export const metadata: Metadata = {
  title: 'SAOUDI WEAR | Luxury Men\'s Haute Couture & Fine Horology',
  description: 'Uncompromising Italian craftsmanship, bespoke tailoring, fine cashmere, and precision horology for the modern gentleman.',
  keywords: ['SAOUDI WEAR', 'Luxury Menswear', 'Bespoke Suits', 'Chronograph Watches', 'Fine Cashmere', 'Saudi Fashion'],
  openGraph: {
    title: 'SAOUDI WEAR | Luxury Fashion & Timepieces',
    description: 'Uncompromising Italian craftsmanship and horology.',
    siteName: 'SAOUDI WEAR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-[#E5E5E5] antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37] transition-colors duration-300">
        <ClientLayoutContainer>{children}</ClientLayoutContainer>
      </body>
    </html>
  );
}
