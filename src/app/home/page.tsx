'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { calculateProfileCompletion, getMissingFields, MissingField } from '@/utils/profileCompletion'
import { Tables } from '@/app/database.types'

type Profile = Tables<'profiles'>

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [completion, setCompletion] = useState(0)
  const [missingFields, setMissingFields] = useState<MissingField[]>([])

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
        const profileCompletion = calculateProfileCompletion(data)
        setCompletion(profileCompletion)
        setMissingFields(getMissingFields(data))

        // プロフィール完成度をDBに保存
        if (data.profile_completion !== profileCompletion) {
          await supabase
            .from('profiles')
            .update({ profile_completion: profileCompletion })
            .eq('id', user.id)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">プロフィールが見つかりません</p>
      </div>
    )
  }

  return (
    <MainLayout profileCompletion={completion}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">マイプロフィール</h1>
          <p className="text-gray-600 mt-2">あなたのプロフィールと企業からの見え方</p>
        </div>

        {/* プロフィール完成度カード */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">プロフィール完成度</h2>
            <div className="text-4xl font-bold text-blue-600">{completion}%</div>
          </div>

          {/* プログレスバー */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* 完成度メッセージ */}
          {completion < 40 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                必須項目が未入力です。まずは必須項目を入力して40%を目指しましょう！
              </p>
            </div>
          )}

          {completion >= 40 && completion < 60 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-medium">
                もう少しです！60%以上で企業からの注目度が3倍にアップします！
              </p>
            </div>
          )}

          {completion >= 60 && completion < 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                素晴らしい！企業からのオファーが届きやすくなっています。100%を目指してさらに充実させましょう！
              </p>
            </div>
          )}

          {completion === 100 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                完璧です！あなたのプロフィールは100%完成しています。企業からのオファーをお待ちください！
              </p>
            </div>
          )}

          {/* 未入力項目リスト */}
          {missingFields.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">未入力項目</h3>
              <div className="space-y-2">
                {missingFields.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {field.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                          必須
                        </span>
                      )}
                      <span className="text-gray-700">{field.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">+{field.weight}%</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/onboarding')}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                プロフィールを更新する
              </button>
            </div>
          )}
        </div>

        {/* プロフィールプレビュー */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィールプレビュー</h2>
          <p className="text-gray-600 mb-6">企業からはこのように見えています</p>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">氏名</span>
                  <p className="font-medium text-gray-900">{profile.full_name || '未設定'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">卒業予定年</span>
                  <p className="font-medium text-gray-900">
                    {profile.graduation_year ? `${profile.graduation_year}年卒` : '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">学歴</span>
                  <p className="font-medium text-gray-900">{profile.education || '未設定'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">GitHubユーザー名</span>
                  <p className="font-medium text-gray-900">{profile.github_username || '未設定'}</p>
                </div>
              </div>
            </div>

            {/* キャリア */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">キャリア・価値観</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">キャリアの関心</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.career_interests) && profile.career_interests.length > 0 ? (
                      profile.career_interests.map((interest) => (
                        <span key={interest} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">仕事を通して実現したいこと</span>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-line">
                    {profile.career_goal || '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">重視する価値観</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.work_values) && profile.work_values.length > 0 ? (
                      profile.work_values.map((value) => (
                        <span key={value} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {value}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 技術 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">技術スタック・スキル</h3>
              <div className="space-y-4">
                {/* 使用経験のある技術スタック・言語 */}
                <div>
                  <span className="text-sm text-gray-500">使用経験のある技術スタック・言語</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.tech_stack_experienced) && profile.tech_stack_experienced.length > 0 ? (
                      profile.tech_stack_experienced.map((tech) => (
                        <span key={tech} className="px-3 py-1 bg-blue-700 text-white rounded-full text-sm font-medium">
                          {tech}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>

                {/* 興味のある技術スタック・言語 */}
                <div>
                  <span className="text-sm text-gray-500">興味のある技術スタック・言語</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.tech_stack) && profile.tech_stack.length > 0 ? (
                      profile.tech_stack
                        .filter(tech => !Array.isArray(profile.tech_stack_experienced) || !profile.tech_stack_experienced.includes(tech))
                        .map((tech) => (
                          <span key={tech} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {tech}
                          </span>
                        ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ハードスキル（開発手法）</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.hard_skills) && profile.hard_skills.length > 0 ? (
                      profile.hard_skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ソフトスキル</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.soft_skills) && profile.soft_skills.length > 0 ? (
                      profile.soft_skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 経験 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">経験・実績</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">活動・職務経験</span>
                  <p className="font-medium text-gray-900 mt-1 whitespace-pre-line">
                    {profile.experience || '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ポートフォリオ</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {profile.portfolio_url ? (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.portfolio_url}
                      </a>
                    ) : (
                      '未設定'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* AI/LLM活用 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI/LLM活用</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">日常的な使用用途</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.ai_usage_scenarios) && profile.ai_usage_scenarios.length > 0 ? (
                      profile.ai_usage_scenarios.map((scenario) => (
                        <span key={scenario} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                          {scenario}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">使用経験のあるAIツール</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.ai_tools_experience) && profile.ai_tools_experience.length > 0 ? (
                      profile.ai_tools_experience.map((tool) => (
                        <span key={tool} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                          {tool}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">AI技術への関心</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {profile.ai_interest_direction || '未設定'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
