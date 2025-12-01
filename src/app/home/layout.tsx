import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マイページ - あなたの成長を可視化',
  description: 'あなたのGitHub活動、技術スタック、キャリア目標を一目で確認。学生エンジニアとしての成長を追跡し、ポートフォリオを自動生成します。',
  openGraph: {
    title: 'マイページ | 学生エンジニア.com',
    description: 'あなたの成長を可視化。GitHub活動や技術スタックを一目で確認できます。',
    url: 'https://gakusei-engineer.com/home',
  },
  alternates: {
    canonical: '/home',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
