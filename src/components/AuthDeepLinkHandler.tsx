'use client'

import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Capacitorアプリでのディープリンク（認証後のコールバック）を処理するコンポーネント
 * 外部ブラウザでの認証完了後、アプリに戻ってきた際にセッションを確立します
 */
export default function AuthDeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    // ネイティブプラットフォームでない場合は何もしない
    if (!Capacitor.isNativePlatform()) {
      return
    }

    // アプリURLが開かれた時のリスナーを設定
    const handleAppUrlOpen = async (event: { url: string }) => {
      console.log('[DeepLink] App opened with URL:', event.url)

      try {
        const url = new URL(event.url)

        // 認証コールバックURLかどうかを確認
        if (url.pathname.includes('/auth/callback')) {
          const code = url.searchParams.get('code')
          const error = url.searchParams.get('error')
          const errorDescription = url.searchParams.get('error_description')

          if (error) {
            console.error('[DeepLink] Auth error:', error, errorDescription)
            // エラーをホームページにリダイレクトして表示
            router.push(`/?error=${encodeURIComponent(errorDescription || error)}`)
            return
          }

          if (code) {
            console.log('[DeepLink] Exchange code for session...')
            const supabase = createClient()

            // 認証コードをセッションに交換
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              console.error('[DeepLink] Session exchange error:', exchangeError)
              router.push(`/?error=${encodeURIComponent('セッションの確立に失敗しました。もう一度お試しください。')}`)
              return
            }

            if (data?.session) {
              console.log('[DeepLink] Session established successfully')
              // 認証成功 - ホームページにリダイレクト
              router.push('/home')
            }
          }
        }
      } catch (err) {
        console.error('[DeepLink] Error processing deep link:', err)
      }
    }

    // リスナーを登録
    const listener = CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen)

    // クリーンアップ関数
    return () => {
      listener.then(l => l.remove())
    }
  }, [router])

  // このコンポーネントは何もレンダリングしない
  return null
}
