'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  full_name: string | null
  github_username: string | null
  job_interest: string | null
  skill_level: string | null
  learning_goal: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    github_username: '',
    job_interest: '',
    skill_level: '',
    learning_goal: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, github_username, job_interest, skill_level, learning_goal')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'プロフィールの読み込みに失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          github_username: profile.github_username,
          job_interest: profile.job_interest,
          skill_level: profile.skill_level,
          learning_goal: profile.learning_goal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '設定を保存しました' })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: '保存に失敗しました' })
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">ダッシュボードに戻る</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メッセージ */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* 基本情報フォーム */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">基本情報</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* フルネーム */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                フルネーム
              </label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>

            {/* GitHubユーザー名 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GitHubユーザー名
              </label>
              <input
                type="text"
                value={profile.github_username || ''}
                onChange={(e) => setProfile({ ...profile, github_username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-github-username"
              />
              <p className="mt-2 text-sm text-gray-500">
                GitHubでログインした場合は自動的に設定されます
              </p>
            </div>

            {/* 興味のある職種 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                興味のある職種
              </label>
              <select
                value={profile.job_interest || ''}
                onChange={(e) => setProfile({ ...profile, job_interest: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="frontend">フロントエンド開発</option>
                <option value="backend">バックエンド開発</option>
                <option value="fullstack">フルスタック開発</option>
                <option value="mobile">モバイルアプリ開発</option>
                <option value="devops">DevOps/インフラ</option>
                <option value="data">データサイエンス/ML</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* スキルレベル */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                スキルレベル
              </label>
              <select
                value={profile.skill_level || ''}
                onChange={(e) => setProfile({ ...profile, skill_level: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="beginner">初心者</option>
                <option value="intermediate">中級者</option>
                <option value="advanced">上級者</option>
              </select>
            </div>

            {/* 学習目標 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                学習目標
              </label>
              <textarea
                value={profile.learning_goal || ''}
                onChange={(e) => setProfile({ ...profile, learning_goal: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="例：Webアプリケーション開発のスキルを習得し、実務で活躍できるエンジニアを目指しています"
              />
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </form>
        </div>

        {/* ログアウトセクション */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">アカウント</h2>
          <p className="text-gray-600 mb-6">
            ログアウトすると、再度ログインが必要になります。
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              ログアウト
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
