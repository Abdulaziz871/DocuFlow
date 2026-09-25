import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import './globals.css';

// Cairo: a modern, professional Arabic Google font (used across Arabic SaaS products).
// Inter: pairs with it for Latin text, numbers, and monospace-adjacent UI chrome.
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DocuFlow AI',
  description: 'منصة الأتمتة الذكية للمستندات والعمليات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
