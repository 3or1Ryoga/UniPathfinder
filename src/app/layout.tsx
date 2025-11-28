import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/contexts/ThemeProvider";
import { cookies } from "next/headers";
import { ThemeType, isThemeType } from "@/types/theme";

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
  title: "学生エンジニア.com",
  description: "学生エンジニアの成長を追いながら、就職活動に活かせる実績を自動で蓄積します。",
  keywords: ["GitHub", "活動可視化", "キャリア支援", "学生エンジニア", "就活", "成長トラッキング", "コミット記録", "技術スキル", "ポートフォリオ"],
  authors: [{ name: "TechMight Team" }],
  creator: "TechMight",
  publisher: "TechMight",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://techmight.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "学生エンジニア.com",
    description: "学生エンジニアの成長を追いながら、就職活動に活かせる実績を自動で蓄積します。",
    url: 'https://techmight.com',
    siteName: '学生エンジニア.com',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '学生エンジニア.com',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "学生エンジニア.com",
    description: "学生エンジニアの成長を追いながら、就職活動に活かせる実績を自動で蓄積します。",
    images: ['/og-image.png'],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cookieからテーマの設定値を読み込む
  const cookieStore = await cookies()
  const nowSetTheme = cookieStore.get('theme')?.value
  const theme = nowSetTheme && isThemeType(nowSetTheme) ? nowSetTheme : ThemeType.LIGHT

  console.log('[RootLayout] Cookie value:', nowSetTheme)
  console.log('[RootLayout] Final theme:', theme)

  return (
    <html lang="ja" className={theme === ThemeType.DARK ? 'dark' : ''}>
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
        <ThemeProvider selectedTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
