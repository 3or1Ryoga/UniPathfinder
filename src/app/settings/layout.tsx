import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '設定',
  description: 'アカウント設定、プロフィール編集、通知設定などを管理できます。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
