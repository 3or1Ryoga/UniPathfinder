import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登録学生一覧 - エンジニアを目指す仲間を見つけよう',
  description: '学生エンジニア.comに登録している学生エンジニアの一覧です。同じ目標を持つ仲間を見つけ、技術スタックやキャリア目標を共有しましょう。',
  openGraph: {
    title: '登録学生一覧 | 学生エンジニア.com',
    description: '学生エンジニア.comに登録している学生エンジニアの一覧です。同じ目標を持つ仲間を見つけましょう。',
    url: 'https://gakusei-engineer.com/members',
  },
  alternates: {
    canonical: '/members',
  },
}

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
