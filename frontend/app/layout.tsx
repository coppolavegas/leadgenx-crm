import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { GenieChatWidget } from '@/components/genie-chat-widget';

// LeadGenX Design System Typography
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LeadGenX - Enterprise Lead Generation Platform',
  description: 'AI-powered lead generation and enrichment platform for modern businesses',
  keywords: 'lead generation, AI, automation, enrichment, B2B, sales intelligence',
  authors: [{ name: 'LeadGenX' }],
  themeColor: '#0B0E14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0B0E14] text-[#EDEEF2]`}
      >
        <AuthProvider>
          {children}
          {/* Genie AI Chat Widget - Available on all pages */}
          <GenieChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
