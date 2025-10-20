'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  profileCompletion: number
}

export default function MainLayout({ children, profileCompletion }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar profileCompletion={profileCompletion} />

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        {/* モバイル用の上部スペース（ヘッダー + プロフィール完成度バー） */}
        <div className={`lg:hidden ${profileCompletion < 100 ? 'h-32' : 'h-16'}`} />

        {/* コンテンツエリア */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
