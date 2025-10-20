'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface EngagementUser {
  user_id: string
  status: 'active' | 'stagnant' | 'normal'
  commits_last_7days: number
  commits_last_14days: number
  last_commit_date: string | null
  recommended_message_type: string | null
  updated_at: string
  // profilesテーブルからの情報
  full_name: string | null
  github_username: string | null
  line_user_id: string | null
  email: string | null
}

const MESSAGE_TEMPLATES = {
  active_encouragement: `〇〇さん、こんにちは！最近GitHubでの活動が素晴らしいですね🔥 今取り組んでいるプロジェクトについて、UniPathfinderに記録しませんか？他の学生や企業にあなたの頑張りをアピールできますよ！`,
  stagnant_reminder: `〇〇さん、こんにちは！最近の調子はいかがですか？もし新しい技術の学習を始めたり、アイデアを温めたりしていたら、ぜひUniPathfinderでそのプロセスを記録してみてください。思考の整理になりますよ！`
}

export default function EngagementDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<EngagementUser[]>([])
  const [stagnantUsers, setStagnantUsers] = useState<EngagementUser[]>([])
  const [normalUsers, setNormalUsers] = useState<EngagementUser[]>([])
  const [selectedTab, setSelectedTab] = useState<'active' | 'stagnant' | 'normal'>('active')
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  useEffect(() => {
    loadEngagementData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadEngagementData() {
    try {
      const supabase = createClient()

      // 認証チェック（管理者のみアクセス可能にする場合は追加のチェックが必要）
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // エンゲージメント状態を取得
      const { data: engagementData, error: engagementError } = await supabase
        .from('user_engagement_status')
        .select('*')
        .order('updated_at', { ascending: false })

      if (engagementError) {
        console.error('Supabase query error:', engagementError)
        throw engagementError
      }

      if (!engagementData || engagementData.length === 0) {
        setActiveUsers([])
        setStagnantUsers([])
        setNormalUsers([])
        setLoading(false)
        return
      }

      // ユーザーIDを抽出
      const userIds = engagementData.map(item => item.user_id)

      // プロフィール情報を取得
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, github_username, line_user_id, email')
        .in('id', userIds)

      if (profilesError) {
        console.error('Profiles query error:', profilesError)
        throw profilesError
      }

      // プロフィール情報をマップ化
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.id, profile]) || []
      )

      // データをプロフィール情報と結合
      const enrichedData = engagementData.map((item) => {
        const profile = profilesMap.get(item.user_id)
        return {
          user_id: item.user_id,
          status: item.status as 'active' | 'stagnant' | 'normal',
          commits_last_7days: item.commits_last_7days,
          commits_last_14days: item.commits_last_14days,
          last_commit_date: item.last_commit_date,
          recommended_message_type: item.recommended_message_type,
          updated_at: item.updated_at,
          full_name: profile?.full_name || null,
          github_username: profile?.github_username || null,
          line_user_id: profile?.line_user_id || null,
          email: profile?.email || null
        }
      })

      setActiveUsers(enrichedData.filter((u: EngagementUser) => u.status === 'active'))
      setStagnantUsers(enrichedData.filter((u: EngagementUser) => u.status === 'stagnant'))
      setNormalUsers(enrichedData.filter((u: EngagementUser) => u.status === 'normal'))
    } catch (error) {
      console.error('Error loading engagement data:', error)
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        setError(error.message)
      } else {
        setError('データの読み込み中にエラーが発生しました')
      }
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, userId: string) {
    navigator.clipboard.writeText(text)
    setCopiedUserId(userId)
    setTimeout(() => setCopiedUserId(null), 2000)
  }

  function renderUserCard(user: EngagementUser) {
    const messageTemplate = user.recommended_message_type
      ? MESSAGE_TEMPLATES[user.recommended_message_type as keyof typeof MESSAGE_TEMPLATES]
      : null

    const personalizedMessage = messageTemplate?.replace('〇〇', user.full_name || user.github_username || 'ユーザー')

    return (
      <div key={user.user_id} className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {user.full_name || user.github_username || 'Unknown User'}
            </h3>
            <div className="space-y-1 mt-2 text-sm text-gray-600">
              {user.github_username && (
                <p>
                  <span className="font-semibold">GitHub:</span>{' '}
                  <a
                    href={`https://github.com/${user.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{user.github_username}
                  </a>
                </p>
              )}
              {user.email && (
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
              )}
              {user.line_user_id && (
                <p>
                  <span className="font-semibold">LINE ID:</span> {user.line_user_id}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                user.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : user.status === 'stagnant'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">過去7日間</p>
            <p className="text-2xl font-bold text-gray-900">{user.commits_last_7days}</p>
            <p className="text-xs text-gray-600">commits</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">過去14日間</p>
            <p className="text-2xl font-bold text-gray-900">{user.commits_last_14days}</p>
            <p className="text-xs text-gray-600">commits</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">最終コミット</p>
            <p className="text-sm font-semibold text-gray-900">
              {user.last_commit_date || 'N/A'}
            </p>
          </div>
        </div>

        {personalizedMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">推奨メッセージ:</p>
            <p className="text-sm text-blue-800 mb-3 whitespace-pre-line">{personalizedMessage}</p>
            <button
              onClick={() => copyToClipboard(personalizedMessage, user.user_id)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copiedUserId === user.user_id ? 'コピーしました！' : 'メッセージをコピー'}
            </button>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-400">
          最終更新: {new Date(user.updated_at).toLocaleString('ja-JP')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-4">データの読み込み中に問題が発生しました。</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-mono text-red-800">{error}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">対処方法：</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Supabase SQL Editorで以下のマイグレーションを実行してください：
                <code className="block mt-1 p-2 bg-white rounded text-xs">/migrations/004_add_user_engagement_status.sql</code>
              </li>
              <li>GitHub Actionsを手動実行するか、次の自動実行（毎日24:00 JST）を待ってください。</li>
              <li>ページをリロードしてください。</li>
            </ol>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ページをリロード
          </button>
        </div>
      </div>
    )
  }

  const currentUsers = selectedTab === 'active' ? activeUsers : selectedTab === 'stagnant' ? stagnantUsers : normalUsers

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">エンゲージメント管理</h1>
          <p className="text-gray-600">ユーザーのGitHubアクティビティに基づく状態管理とLINE通知用メッセージ</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">アクティブユーザー</p>
                <p className="text-3xl font-bold text-gray-900">{activeUsers.length}</p>
              </div>
              <div className="text-4xl">🔥</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">過去7日間で10コミット以上</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">停滞ユーザー</p>
                <p className="text-3xl font-bold text-gray-900">{stagnantUsers.length}</p>
              </div>
              <div className="text-4xl">😴</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">過去14日間でコミットなし</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">通常ユーザー</p>
                <p className="text-3xl font-bold text-gray-900">{normalUsers.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">通常のアクティビティ</p>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedTab('active')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                selectedTab === 'active'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              アクティブ ({activeUsers.length})
            </button>
            <button
              onClick={() => setSelectedTab('stagnant')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                selectedTab === 'stagnant'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              停滞 ({stagnantUsers.length})
            </button>
            <button
              onClick={() => setSelectedTab('normal')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                selectedTab === 'normal'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              通常 ({normalUsers.length})
            </button>
          </div>
        </div>

        {/* ユーザーリスト */}
        <div>
          {currentUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">該当するユーザーがいません</p>
            </div>
          ) : (
            currentUsers.map(renderUserCard)
          )}
        </div>
      </div>
    </div>
  )
}
