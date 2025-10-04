import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniPath Finder - コーディング学習AIコンシェルジュ",
  description: "GitHubリポジトリを分析し、あなたの現在のスキルレベルを客観的に評価。AIが最適化された学習パスと推奨教材を提案します。初心者開発者向けの無料プログラミング学習サポートサービス。",
  keywords: ["プログラミング学習", "GitHub分析", "AI学習サポート", "コーディング", "開発者", "初心者", "学習パス", "技術スキル"],
  authors: [{ name: "UniPath Finder Team" }],
  creator: "UniPath Finder",
  publisher: "UniPath Finder",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://unipath-finder.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "UniPath Finder - コーディング学習AIコンシェルジュ",
    description: "GitHubリポジトリを分析し、AIが最適化された学習パスを提案。初心者開発者のスキルアップを完全無料でサポートします。",
    url: 'https://unipath-finder.com',
    siteName: 'UniPath Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'UniPath Finder - コーディング学習AIコンシェルジュ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "UniPath Finder - コーディング学習AIコンシェルジュ",
    description: "GitHubリポジトリを分析し、AIが最適化された学習パスを提案。初心者開発者のスキルアップを完全無料でサポートします。",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
