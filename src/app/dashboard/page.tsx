'use client'

import { useEffect, useState } from 'react'
import { DashboardData } from '@/types/dashboard'
import WeeklySnapshot from '@/components/dashboard/WeeklySnapshot'
import PersonalGrowthChart from '@/components/dashboard/PersonalGrowthChart'
import MilestoneShowcase from '@/components/dashboard/MilestoneShowcase'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

interface UserProfile {
  email: string | null
  github_username: string | null
  line_user_id: string | null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: string | null, reset: string | null }>({ remaining: null, reset: null })
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // ユーザープロフィールを取得
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            email: user.email || null,
            github_username: profile.github_username,
            line_user_id: profile.line_user_id
          })
        }

        const response = await fetch('/api/github/dashboard-data')

        // レート制限情報を取得
        const remaining = response.headers.get('X-RateLimit-Remaining')
        const reset = response.headers.get('X-RateLimit-Reset')
        setRateLimitInfo({ remaining, reset })

        if (response.status === 401) {
          // 未認証の場合はログインページにリダイレクト
          router.push('/')
          return
        }

        if (response.status === 429) {
          // レート制限エラー
          const errorData = await response.json()
          setError(`GitHub APIのレート制限に達しました。${errorData.resetAt ? `${new Date(errorData.resetAt).toLocaleTimeString('ja-JP')} 以降に再度お試しください。` : '少し時間をおいて再度お試しください。'}`)
          setLoading(false)
          return
        }

        if (response.status === 400) {
          const errorData = await response.json()
          setError(errorData.error || 'GitHubユーザー名が設定されていません。プロフィールページで設定してください。')
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const dashboardData: DashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError('ダッシュボードデータの取得に失敗しました。ページを更新してもう一度お試しください。')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-lg">ダッシュボードを読み込み中...</p>
          <p className="text-gray-500 text-sm mt-2">GitHubからデータを取得しています</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              再読み込み
            </button>
            <button
              onClick={() => router.push('/account')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              アカウントページへ
            </button>
          </div>
          {rateLimitInfo.remaining && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <p>API残り回数: {rateLimitInfo.remaining}</p>
              {rateLimitInfo.reset && (
                <p>リセット時刻: {new Date(parseInt(rateLimitInfo.reset) * 1000).toLocaleString('ja-JP')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">データがありません</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 連携アカウント情報 */}
        {userProfile && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">連携アカウント</h2>
            <div className="space-y-4">
              {/* GitHub連携 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900">GitHub</div>
                    <div className="text-sm text-gray-600">{userProfile.email || userProfile.github_username || '未設定'}</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  連携済み
                </span>
              </div>

              {/* LINE連携 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900">LINE</div>
                    <div className="text-sm text-gray-600">
                      {userProfile.line_user_id ? '連携済み' : '未連携'}
                    </div>
                  </div>
                </div>
                {userProfile.line_user_id ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    連携済み
                  </span>
                ) : (
                  <button
                    onClick={() => router.push('/link-line')}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    連携する
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* 週次スナップショット */}
          <WeeklySnapshot data={data.weeklySnapshot} />

          {/* 成長チャート */}
          <PersonalGrowthChart data={data.growthChart} />

          {/* マイルストーン */}
          <MilestoneShowcase data={data.milestones} />
        </div>

        {/* APIレート制限情報（デバッグ用） */}
        {rateLimitInfo.remaining && (
          <div className="mt-8 bg-white rounded-lg shadow p-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>GitHub API残り回数: {rateLimitInfo.remaining}</span>
              {rateLimitInfo.reset && (
                <span>リセット時刻: {new Date(parseInt(rateLimitInfo.reset) * 1000).toLocaleTimeString('ja-JP')}</span>
              )}
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="mt-16 py-8 text-center text-gray-500 text-sm">
          <p className="font-semibold text-gray-700">GitHubデータは毎日24:00（日本時間）に自動更新されます</p>
          <p className="mt-2">データは5分間キャッシュされます</p>
          <p className="mt-1">GitHub APIから直接取得しています</p>
        </div>
      </div>
    </MainLayout>
  )
}
