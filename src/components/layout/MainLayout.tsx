'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      {/* メインコンテンツ */}
      <div className="pt-16">
        {/* コンテンツエリア */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
