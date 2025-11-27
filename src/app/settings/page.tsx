'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

interface Profile {
  // 基本情報
  full_name: string | null
  username: string | null
  bio: string | null
  location: string | null
  // SNS・リンク
  website: string | null
  portfolio_url: string | null
  twitter_username: string | null
  linkedin_url: string | null
  instagram_username: string | null
  discord_username: string | null
  youtube_url: string | null
  facebook_url: string | null
  // スキル・キャリア
  skills: string | null
  interests: string | null
  job_interest: string | null
  skill_level: string | null
  learning_goal: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    // 基本情報
    full_name: '',
    username: '',
    bio: '',
    location: '',
    // SNS・リンク
    website: '',
    portfolio_url: '',
    twitter_username: '',
    linkedin_url: '',
    instagram_username: '',
    discord_username: '',
    youtube_url: '',
    facebook_url: '',
    // スキル・キャリア
    skills: '',
    interests: '',
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
        .select('*')
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
          // 基本情報
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          // SNS・リンク
          website: profile.website,
          portfolio_url: profile.portfolio_url,
          twitter_username: profile.twitter_username,
          linkedin_url: profile.linkedin_url,
          instagram_username: profile.instagram_username,
          discord_username: profile.discord_username,
          youtube_url: profile.youtube_url,
          facebook_url: profile.facebook_url,
          // スキル・キャリア
          skills: profile.skills,
          interests: profile.interests,
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
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報セクション */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">基本情報</h2>
            <div className="space-y-6">
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

              {/* ユーザー名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="yamada_taro"
                  minLength={3}
                />
                <p className="mt-2 text-sm text-gray-500">
                  3文字以上の一意なユーザー名を設定してください
                </p>
              </div>

              {/* 自己紹介 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  自己紹介
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="簡単な自己紹介を入力してください"
                />
              </div>

              {/* 所在地 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  所在地
                </label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="東京都"
                />
              </div>
            </div>
          </div>

          {/* SNS・リンクセクション */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">SNS・リンク</h2>
            <div className="space-y-6">
              {/* ウェブサイト */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ウェブサイト
                </label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {/* ポートフォリオURL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ポートフォリオURL
                </label>
                <input
                  type="url"
                  value={profile.portfolio_url || ''}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://portfolio.example.com"
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Twitterユーザー名
                </label>
                <input
                  type="text"
                  value={profile.twitter_username || ''}
                  onChange={(e) => setProfile({ ...profile, twitter_username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your_twitter"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={profile.linkedin_url || ''}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instagramユーザー名
                </label>
                <input
                  type="text"
                  value={profile.instagram_username || ''}
                  onChange={(e) => setProfile({ ...profile, instagram_username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your_instagram"
                />
              </div>

              {/* Discord */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discordユーザー名
                </label>
                <input
                  type="text"
                  value={profile.discord_username || ''}
                  onChange={(e) => setProfile({ ...profile, discord_username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="YourName#1234"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={profile.youtube_url || ''}
                  onChange={(e) => setProfile({ ...profile, youtube_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={profile.facebook_url || ''}
                  onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>
            </div>
          </div>

          {/* スキル・キャリアセクション */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">スキル・キャリア</h2>
            <div className="space-y-6">
              {/* スキル */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  スキル
                </label>
                <textarea
                  value={profile.skills || ''}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="例：JavaScript, TypeScript, React, Node.js"
                />
              </div>

              {/* 興味 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  興味
                </label>
                <textarea
                  value={profile.interests || ''}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="例：Web開発, モバイルアプリ, AI/ML"
                />
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
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </form>

        {/* オンボーディング再表示セクション */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">オンボーディング</h2>
          <p className="text-gray-600 mb-6">
            サービスの使い方を再確認したい場合は、オンボーディング画面を表示できます。
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            オンボーディングを表示
          </button>
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
      </div>
    </MainLayout>
  )
}
