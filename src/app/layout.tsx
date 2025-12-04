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
  title: {
    default: "学生エンジニア.com | エンジニアを目指す学生のためのキャリア支援・SNSサービス",
    template: "%s | 学生エンジニア.com",
  },
  description: "学生エンジニア.comは、エンジニアを目指す学生のためのキャリア支援・SNSサービスです。GitHub連携で技術力を自動可視化し、AI診断で強みを発見。あなたに合った企業からのスカウトやインターン情報が届きます。完全無料でポートフォリオ作成から就活までサポート。",
  keywords: [
    "学生エンジニア",
    "エンジニア就活",
    "新卒エンジニア",
    "プログラミング",
    "GitHub",
    "ポートフォリオ",
    "インターン",
    "エンジニア採用",
    "キャリア支援",
    "技術力可視化",
    "AI診断",
    "スカウト",
    "IT就活",
    "エンジニア転職",
    "プログラマー",
  ],
  authors: [{ name: "学生エンジニア.com", url: "https://gakusei-engineer.com" }],
  creator: "学生エンジニア.com",
  publisher: "学生エンジニア.com",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gakusei-engineer.com'),
  alternates: {
    canonical: '/',
    languages: {
      'ja': '/',
    },
  },
  openGraph: {
    title: "学生エンジニア.com | エンジニアを目指す学生のためのキャリア支援・SNSサービス",
    description: "学生エンジニア.comは、エンジニアを目指す学生のためのキャリア支援・SNSサービスです。GitHub連携で技術力を自動可視化し、AI診断で強みを発見。完全無料でポートフォリオ作成から就活までサポート。",
    url: 'https://gakusei-engineer.com',
    siteName: '学生エンジニア.com',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '学生エンジニア.com - エンジニアを目指す学生のためのキャリア支援・SNSサービス',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "学生エンジニア.com | エンジニアを目指す学生のキャリア支援",
    description: "GitHub連携で技術力を自動可視化。AI診断で強みを発見し、あなたに合った企業からスカウトが届く。完全無料の学生エンジニア向けキャリア支援サービス。",
    images: ['/og-image.png'],
    creator: '@gakusei_eng',
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
  },
  category: 'technology',
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
    <html lang="ja" className={theme === ThemeType.DARK ? 'dark' : ''} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
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
        {/* JSON-LD 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://gakusei-engineer.com/#website",
                  "name": "学生エンジニア.com",
                  "url": "https://gakusei-engineer.com",
                  "description": "エンジニアを目指す学生のためのキャリア支援・SNSサービス",
                  "inLanguage": "ja",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://gakusei-engineer.com/search?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://gakusei-engineer.com/#organization",
                  "name": "学生エンジニア.com",
                  "url": "https://gakusei-engineer.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://gakusei-engineer.com/gakusei_engineer_.com_logo.png",
                    "width": 512,
                    "height": 512
                  },
                  "sameAs": []
                },
                {
                  "@type": "WebApplication",
                  "name": "学生エンジニア.com",
                  "url": "https://gakusei-engineer.com",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web Browser",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "JPY"
                  },
                  "featureList": [
                    "GitHub連携による技術力の自動可視化",
                    "AI診断による強み発見",
                    "企業からのスカウト機能",
                    "インターン情報の提供",
                    "ポートフォリオ作成支援"
                  ],
                  "audience": {
                    "@type": "Audience",
                    "audienceType": "学生エンジニア、新卒エンジニア"
                  }
                }
              ]
            })
          }}
        />
        <ThemeProvider selectedTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
