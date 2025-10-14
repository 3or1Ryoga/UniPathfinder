'use client'

import { useEffect, useState } from 'react'
import { DashboardData } from '@/types/dashboard'
import WeeklySnapshot from '@/components/dashboard/WeeklySnapshot'
import PersonalGrowthChart from '@/components/dashboard/PersonalGrowthChart'
import MilestoneShowcase from '@/components/dashboard/MilestoneShowcase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: string | null, reset: string | null }>({ remaining: null, reset: null })
  const router = useRouter()

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-600 mt-1">あなたの成長の軌跡</p>
            </div>
            <button
              onClick={() => router.push('/account')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              ← アカウントに戻る
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>

      {/* フッター */}
      <footer className="mt-16 py-8 text-center text-gray-500 text-sm">
        <p>データは5分間キャッシュされます</p>
        <p className="mt-2">GitHub APIから直接取得しています</p>
      </footer>
    </div>
  )
}
