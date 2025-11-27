'use client'

/**
 * Growth Page - 氷山ビジュアライゼーション機能
 *
 * デザインが分かりづらいため一時的に無効化
 * /homeにリダイレクトする
 *
 * 将来的に改善版を実装予定
 */

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function GrowthPage() {
  const router = useRouter()

  useEffect(() => {
    // ホームページにリダイレクト
    router.push('/home')
  }, [router])

  return null
}
