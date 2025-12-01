import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プロフィール設定',
  description: 'あなたのプロフィールを設定して、学生エンジニア.comを始めましょう。技術スタック、キャリア目標、働き方の希望などを登録できます。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
