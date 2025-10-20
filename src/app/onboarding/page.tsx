'use client'

import { useEffect, useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { calculateProfileCompletion } from '@/utils/profileCompletion'

// 選択肢の定義
const CAREER_INTERESTS_OPTIONS = [
  'Web開発',
  'フロントエンド開発',
  'バックエンド開発',
  'モバイルアプリ開発',
  'データサイエンス',
  'ML/AI',
  'インフラ',
  'DevOps/SRE',
  'セキュリティ',
  'QA/テスト',
  'プロダクトマネジメント',
  'UI/UXデザイン',
  'ブロックチェーン',
  'IoT',
  'ゲーム開発',
  'その他'
]

// キャリアで重視することの選択肢（15項目以上）
const WORK_VALUES_OPTIONS = [
  '技術的挑戦',
  '最先端技術への取り組み',
  'プロダクトへの貢献',
  'ユーザー体験の向上',
  '社会的インパクト',
  'グローバルな影響力',
  'ワークライフバランス',
  'フレックス・リモートワーク',
  'チーム文化',
  '多様性と包括性',
  '給与・待遇',
  '成長機会・キャリアパス',
  '裁量権・自律性',
  'スピード感・意思決定の速さ',
  '安定性・企業の信頼性',
  '教育・メンター制度',
  '副業・複業の可否'
]

// 全都道府県
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

// 海外地域
const OVERSEAS_REGIONS = [
  'リモート',
  '東アジア（中国、韓国、台湾など）',
  '東南アジア（シンガポール、タイ、ベトナムなど）',
  '南アジア（インドなど）',
  '北米（アメリカ、カナダ）',
  'ヨーロッパ',
  'オセアニア（オーストラリア、ニュージーランド）',
  'その他'
]

// 技術スタック・言語の予め用意された選択肢
const TECH_STACK_OPTIONS = [
  // 言語
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'Dart', 'Objective-C',
  // フロントエンド
  'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte',
  // モバイル
  'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose', 'Framer',
  // バックエンド
  'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Rails', 'FastAPI',
  // クラウド・インフラ
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  // データベース・BaaS
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase',
  // その他
  'Git', 'GitHub', 'GitLab', 'GraphQL', 'REST API'
]

// ハードスキル（開発手法）の選択肢
const HARD_SKILLS_OPTIONS = [
  'TDD（テスト駆動開発）',
  'CI/CD',
  'アジャイル開発',
  'スクラム',
  'RESTful API設計',
  'GraphQL',
  'マイクロサービス',
  'コンテナ化',
  'Infrastructure as Code',
  'セキュリティ設計',
  'パフォーマンス最適化',
  'リファクタリング'
]

// ソフトスキルの選択肢
const SOFT_SKILLS_OPTIONS = [
  'チームワーク',
  'コミュニケーション',
  '問題解決',
  'リーダーシップ',
  'プレゼンテーション',
  '時間管理',
  '自己学習',
  '柔軟性',
  'クリティカルシンキング'
]

// AI使用用途の選択肢
const AI_USAGE_SCENARIOS_OPTIONS = [
  'コーディング補助',
  'デバッグ支援',
  'コードレビュー',
  'アイデア創出',
  'ドキュメント作成',
  '学習支援',
  'リサーチ',
  '翻訳',
  '使用していない'
]

// AIツールの選択肢（20項目以上）
const AI_TOOLS_OPTIONS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'GitHub Copilot',
  'Cursor',
  'Codeium',
  'Tabnine',
  'Amazon CodeWhisperer',
  'Replit Ghostwriter',
  'Sourcegraph Cody',
  'Perplexity AI',
  'Notion AI',
  'Microsoft Copilot',
  'Google Bard',
  'Midjourney',
  'Stable Diffusion',
  'DALL-E',
  'Figma AI',
  'v0.dev',
  'Vercel v0',
  'Bolt.new',
  'Lovable',
  'Windsurf',
  '使用していない'
]

// AI技術への関心方向
const AI_INTEREST_DIRECTIONS = [
  'AIを使う側（ユーザー）',
  'AIを作る側（開発者）',
  '両方に興味がある',
  '特に関心なし'
]

interface OnboardingData {
  // 基本情報
  full_name: string
  graduation_year: number | null
  education: string

  // キャリア・価値観
  career_interests: string[]
  career_goal: string
  work_values: string[]
  preferred_locations: string[]

  // 技術について
  tech_stack: string[]
  tech_stack_experienced: string[]
  hard_skills: string[]
  soft_skills: string[]

  // 経験・スキル
  experience: string
  portfolio_url: string
  awards: string

  // AI/LLM
  ai_usage_scenarios: string[]
  ai_tools_experience: string[]
  ai_interest_direction: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false) // 2回目以降のアクセスかどうか
  const [lastStepChangeTime, setLastStepChangeTime] = useState<number>(0) // 最後のステップ変更時刻
  const topRef = useRef<HTMLDivElement>(null) // ページトップへのリファレンス

  // 希望勤務地モーダルの状態
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // 入力用の一時的な状態
  const [techInput, setTechInput] = useState('')
  const [aiToolInput, setAiToolInput] = useState('')

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    graduation_year: null,
    education: '',
    career_interests: [],
    career_goal: '',
    work_values: [],
    preferred_locations: [],
    tech_stack: [],
    tech_stack_experienced: [],
    hard_skills: [],
    soft_skills: [],
    experience: '',
    portfolio_url: '',
    awards: '',
    ai_usage_scenarios: [],
    ai_tools_experience: [],
    ai_interest_direction: ''
  })

  const totalSteps = 5

  useEffect(() => {
    loadExistingProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadExistingProfile() {
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
        // onboarding_completed が true かつ profile_completion < 60 の場合は2回目以降のアクセス
        if (data.onboarding_completed && data.profile_completion !== null && data.profile_completion < 60) {
          setIsReturningUser(true)
        }

        // 既存データがあれば入力フォームに反映
        setFormData({
          full_name: data.full_name || '',
          graduation_year: data.graduation_year || null,
          education: data.education || '',
          career_interests: Array.isArray(data.career_interests) ? data.career_interests : [],
          career_goal: data.career_goal || '',
          work_values: Array.isArray(data.work_values) ? data.work_values : [],
          preferred_locations: Array.isArray(data.preferred_locations) ? data.preferred_locations : [],
          tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
          tech_stack_experienced: Array.isArray(data.tech_stack_experienced) ? data.tech_stack_experienced : [],
          hard_skills: Array.isArray(data.hard_skills) ? data.hard_skills : [],
          soft_skills: Array.isArray(data.soft_skills) ? data.soft_skills : [],
          experience: data.experience || '',
          portfolio_url: data.portfolio_url || '',
          awards: data.awards || '',
          ai_usage_scenarios: Array.isArray(data.ai_usage_scenarios) ? data.ai_usage_scenarios : [],
          ai_tools_experience: Array.isArray(data.ai_tools_experience) ? data.ai_tools_experience : [],
          ai_interest_direction: data.ai_interest_direction || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  function validateStep(step: number): boolean {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.graduation_year && formData.education)
      case 2:
        return !!(formData.career_interests.length > 0 && formData.career_goal)
      case 3:
        return true // このステップは任意項目のみ
      case 4:
        return true // このステップは任意項目のみ
      case 5:
        return true // このステップは任意項目のみ
      default:
        return false
    }
  }

  function handleNext() {
    console.log('handleNext called - currentStep:', currentStep)
    if (!validateStep(currentStep)) {
      setMessage({ type: 'error', text: '必須項目を入力してください' })
      return
    }
    setMessage(null)
    console.log('Moving to next step:', currentStep + 1)
    setLastStepChangeTime(Date.now()) // ステップ変更時刻を記録
    setCurrentStep(currentStep + 1)

    // ページトップにスクロール
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleBack() {
    setMessage(null)
    setLastStepChangeTime(Date.now()) // ステップ変更時刻を記録
    setCurrentStep(currentStep - 1)

    // ページトップにスクロール
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function toggleArrayValue(array: string[], value: string): string[] {
    if (array.includes(value)) {
      return array.filter(v => v !== value)
    } else {
      return [...array, value]
    }
  }

  // 技術スタックの2回タップシステム
  function toggleTechStack(tech: string) {
    const isInterested = formData.tech_stack.includes(tech)
    const isExperienced = formData.tech_stack_experienced.includes(tech)

    if (!isInterested && !isExperienced) {
      // 1回目のタップ：興味があるに追加
      setFormData({
        ...formData,
        tech_stack: [...formData.tech_stack, tech]
      })
    } else if (isInterested && !isExperienced) {
      // 2回目のタップ：使用経験があるにも追加
      setFormData({
        ...formData,
        tech_stack_experienced: [...formData.tech_stack_experienced, tech]
      })
    } else {
      // 3回目のタップ：両方から削除
      setFormData({
        ...formData,
        tech_stack: formData.tech_stack.filter(t => t !== tech),
        tech_stack_experienced: formData.tech_stack_experienced.filter(t => t !== tech)
      })
    }
  }

  function addTechStack() {
    if (techInput.trim() && !formData.tech_stack.includes(techInput.trim())) {
      setFormData({
        ...formData,
        tech_stack: [...formData.tech_stack, techInput.trim()]
      })
      setTechInput('')
    }
  }

  function removeTechStack(tech: string) {
    setFormData({
      ...formData,
      tech_stack: formData.tech_stack.filter(t => t !== tech),
      tech_stack_experienced: formData.tech_stack_experienced.filter(t => t !== tech)
    })
  }

  // workValueInputは手動入力を削除したため不要
  // addWorkValue と removeWorkValue も未使用のため削除

  function addAITool() {
    if (aiToolInput.trim() && !formData.ai_tools_experience.includes(aiToolInput.trim())) {
      setFormData({
        ...formData,
        ai_tools_experience: [...formData.ai_tools_experience, aiToolInput.trim()]
      })
      setAiToolInput('')
    }
  }

  function removeAITool(tool: string) {
    setFormData({
      ...formData,
      ai_tools_experience: formData.ai_tools_experience.filter(t => t !== tool)
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    console.log('handleSubmit called - currentStep:', currentStep, 'totalSteps:', totalSteps)

    // ステップ5以外では送信しない（誤送信防止）
    if (currentStep !== totalSteps) {
      console.log('Form submission prevented - not on final step')
      return
    }

    // handleNext直後の誤送信を防ぐ（Enterキー連続押し対策）
    const timeSinceLastStepChange = Date.now() - lastStepChangeTime
    if (timeSinceLastStepChange < 300) {
      console.log('Form submission prevented - too soon after step change (', timeSinceLastStepChange, 'ms)')
      return
    }

    // 必須項目のバリデーション
    if (!formData.full_name || !formData.graduation_year || !formData.education) {
      setMessage({ type: 'error', text: '基本情報（氏名、卒業予定年、学歴）は必須です' })
      setCurrentStep(1)
      return
    }

    if (formData.career_interests.length === 0 || !formData.career_goal) {
      setMessage({ type: 'error', text: 'キャリアの関心と実現したいことは必須です' })
      setCurrentStep(2)
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // データを更新
      const updateData = {
        full_name: formData.full_name,
        graduation_year: formData.graduation_year,
        education: formData.education,
        career_interests: formData.career_interests,
        career_goal: formData.career_goal,
        work_values: formData.work_values,
        preferred_locations: formData.preferred_locations,
        tech_stack: formData.tech_stack,
        tech_stack_experienced: formData.tech_stack_experienced,
        hard_skills: formData.hard_skills,
        soft_skills: formData.soft_skills,
        experience: formData.experience,
        portfolio_url: formData.portfolio_url,
        awards: formData.awards,
        ai_usage_scenarios: formData.ai_usage_scenarios,
        ai_tools_experience: formData.ai_tools_experience,
        ai_interest_direction: formData.ai_interest_direction,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      // プロフィール完成度を計算して更新
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (updatedProfile) {
        const completion = calculateProfileCompletion(updatedProfile)
        await supabase
          .from('profiles')
          .update({ profile_completion: completion })
          .eq('id', user.id)
      }

      // ダッシュボードにリダイレクト
      console.log('Save successful - redirecting to /home')
      router.push('/home')
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: '保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 2回目以降のアクセス時の訴えかけバナー */}
        {isReturningUser && (
          <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-2">
                  プロフィールを充実させて、企業からのオファーを増やしましょう！
                </h3>
                <p className="text-sm text-orange-800">
                  60%以上で企業からの注目度が3倍にアップします。未入力の項目を埋めて、あなたの魅力をもっとアピールしましょう！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* プログレスバー */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center max-w-2xl w-full">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {/* ステップ1: 基本情報 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">基本情報</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    氏名 <span className="text-red-500">*</span>
                    {isReturningUser && !formData.full_name && (
                      <span className="ml-2 text-xs text-orange-600 font-bold">← 未入力</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReturningUser && !formData.full_name
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    卒業予定年 <span className="text-red-500">*</span>
                    {isReturningUser && !formData.graduation_year && (
                      <span className="ml-2 text-xs text-orange-600 font-bold">← 未入力</span>
                    )}
                  </label>
                  <select
                    value={formData.graduation_year || ''}
                    onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReturningUser && !formData.graduation_year
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">選択してください</option>
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                      <option key={year} value={year}>{year}年卒</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    学歴（学部・学科） <span className="text-red-500">*</span>
                    {isReturningUser && !formData.education && (
                      <span className="ml-2 text-xs text-orange-600 font-bold">← 未入力</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReturningUser && !formData.education
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="例：○○大学 工学部 情報工学科"
                    required
                  />
                </div>
              </div>
            )}

            {/* ステップ2: キャリア・価値観 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">キャリア・価値観</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    キャリアの関心 <span className="text-red-500">*</span>
                    {isReturningUser && formData.career_interests.length === 0 && (
                      <span className="ml-2 text-xs text-orange-600 font-bold">← 未選択</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">興味のある分野を選択してください（複数選択可）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CAREER_INTERESTS_OPTIONS.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          career_interests: toggleArrayValue(formData.career_interests, option)
                        })}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                          formData.career_interests.includes(option)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    仕事を通して実現したいこと <span className="text-red-500">*</span>
                    {isReturningUser && !formData.career_goal && (
                      <span className="ml-2 text-xs text-orange-600 font-bold">← 未入力</span>
                    )}
                  </label>
                  <textarea
                    value={formData.career_goal}
                    onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      isReturningUser && !formData.career_goal
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="例：Webのパフォーマンスチューニングが好きなので、大規模サービスの速度改善に貢献し、数百万人のユーザー体験を向上させたいです。"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    キャリアで重視すること
                  </label>
                  <p className="text-sm text-gray-500 mb-3">3つまで選択してください</p>

                  {/* 予め用意された価値観の選択肢 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {WORK_VALUES_OPTIONS.map(option => {
                      const isSelected = formData.work_values.includes(option)
                      const canSelect = isSelected || formData.work_values.length < 3

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (canSelect) {
                              setFormData({
                                ...formData,
                                work_values: toggleArrayValue(formData.work_values, option)
                              })
                            }
                          }}
                          disabled={!canSelect}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : canSelect
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>

                  {/* 選択済みの価値観 */}
                  {formData.work_values.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
                      {formData.work_values.map(value => (
                        <span
                          key={value}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              work_values: formData.work_values.filter(v => v !== value)
                            })}
                            className="text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 選択数の表示 */}
                  <p className="text-xs text-gray-500 mt-2">
                    選択中: {formData.work_values.length} / 3
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    希望勤務地
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {formData.preferred_locations.length === 0
                        ? '勤務地を選択してください'
                        : `${formData.preferred_locations.length}件選択中`}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {formData.preferred_locations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.preferred_locations.map(location => (
                        <span key={location} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {location}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              preferred_locations: formData.preferred_locations.filter(l => l !== location)
                            })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ステップ3: 技術について */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">技術について</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    興味のある/使用経験のある技術スタック・言語
                    {isReturningUser && formData.tech_stack.length < 3 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ：3つ以上 (+10%)</span>
                    )}
                  </label>

                  {/* 使い方の説明バナー */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">👆</div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 mb-1">タップ方法：</p>
                        <div className="space-y-1 text-sm text-blue-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-16 px-2 py-1 bg-blue-400 text-white text-xs rounded text-center font-medium">1回目</span>
                            <span>興味がある技術（薄い青）</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-16 px-2 py-1 bg-blue-700 text-white text-xs rounded text-center font-medium">2回目</span>
                            <span>使用経験がある技術（濃い青）⭐</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-16 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded text-center font-medium">3回目</span>
                            <span>選択解除</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 予め用意された技術の選択肢 */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
                    {TECH_STACK_OPTIONS.map(tech => {
                      const isInterested = formData.tech_stack.includes(tech)
                      const isExperienced = formData.tech_stack_experienced.includes(tech)

                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTechStack(tech)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs ${
                            isExperienced
                              ? 'bg-blue-700 text-white ring-2 ring-blue-900'
                              : isInterested
                                ? 'bg-blue-400 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tech}
                        </button>
                      )
                    })}
                  </div>

                  {/* 手動入力 */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTechStack()
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="その他の技術を入力..."
                    />
                    <button
                      type="button"
                      onClick={addTechStack}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      追加
                    </button>
                  </div>

                  {/* 選択済みの技術 */}
                  {formData.tech_stack.length > 0 && (
                    <div className="space-y-3">
                      {/* 使用経験のある技術 */}
                      {formData.tech_stack_experienced.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">使用経験あり：</p>
                          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                            {formData.tech_stack_experienced.map(tech => (
                              <span
                                key={tech}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-700 text-white rounded-full text-sm font-medium"
                              >
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => removeTechStack(tech)}
                                  className="text-blue-200 hover:text-white"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 興味のある技術（経験なし） */}
                      {formData.tech_stack.filter(t => !formData.tech_stack_experienced.includes(t)).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">興味あり：</p>
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                            {formData.tech_stack.filter(t => !formData.tech_stack_experienced.includes(t)).map(tech => (
                              <span
                                key={tech}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                              >
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => removeTechStack(tech)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ハードスキル（開発手法）
                    {isReturningUser && formData.hard_skills.length < 2 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ：2つ以上 (+5%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">経験のある開発手法を選択してください（複数選択可）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {HARD_SKILLS_OPTIONS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          hard_skills: toggleArrayValue(formData.hard_skills, skill)
                        })}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                          formData.hard_skills.includes(skill)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ソフトスキル
                    {isReturningUser && formData.soft_skills.length < 2 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ：2つ以上 (+5%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">自分の強みを選択してください（複数選択可）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SOFT_SKILLS_OPTIONS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          soft_skills: toggleArrayValue(formData.soft_skills, skill)
                        })}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          formData.soft_skills.includes(skill)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ステップ4: 経験・実績 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">経験・実績</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    活動・職務経験
                    {isReturningUser && !formData.experience && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ (+10%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">インターンシップ、プロジェクト、アルバイトなどの経験</p>
                  <textarea
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
                      isReturningUser && !formData.experience
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="例：&#10;## インターン経験&#10;- ○○株式会社（2024年8月-9月）&#10;  - Webアプリケーション開発&#10;  - React, TypeScriptを使用&#10;&#10;## 個人開発&#10;- タスク管理アプリの開発&#10;  - Next.js + Supabaseで構築"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ポートフォリオ/プロジェクトURL
                    {isReturningUser && !formData.portfolio_url && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ (+10%)</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReturningUser && !formData.portfolio_url
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    受賞・資格
                  </label>
                  <textarea
                    value={formData.awards}
                    onChange={(e) => setFormData({ ...formData, awards: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="例：&#10;- ハッカソン最優秀賞（2024年）&#10;- 応用情報技術者試験 合格&#10;- TOEIC 800点"
                  />
                </div>
              </div>
            )}

            {/* ステップ5: AI/LLM活用 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">AI/LLM活用について</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    日常的にAI/LLMをどんなことに使っていますか？
                    {isReturningUser && formData.ai_usage_scenarios.length === 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ (+3%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">該当するものを選択してください（複数選択可）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {AI_USAGE_SCENARIOS_OPTIONS.map(scenario => (
                      <button
                        key={scenario}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          ai_usage_scenarios: toggleArrayValue(formData.ai_usage_scenarios, scenario)
                        })}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          formData.ai_usage_scenarios.includes(scenario)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {scenario}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    使用経験のあるAIツール
                    {isReturningUser && formData.ai_tools_experience.length === 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ (+3%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">クリックで選択、または手動で追加（複数選択可）</p>

                  {/* 予め用意されたAIツールの選択肢 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                    {AI_TOOLS_OPTIONS.map(tool => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          ai_tools_experience: toggleArrayValue(formData.ai_tools_experience, tool)
                        })}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs ${
                          formData.ai_tools_experience.includes(tool)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>

                  {/* 手動入力 */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={aiToolInput}
                      onChange={(e) => setAiToolInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addAITool()
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="その他のAIツールを入力..."
                    />
                    <button
                      type="button"
                      onClick={addAITool}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      追加
                    </button>
                  </div>

                  {/* 選択済みのAIツール */}
                  {formData.ai_tools_experience.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
                      {formData.ai_tools_experience.map(tool => (
                        <span
                          key={tool}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
                        >
                          {tool}
                          <button
                            type="button"
                            onClick={() => removeAITool(tool)}
                            className="text-pink-600 hover:text-pink-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    AI技術への関心
                    {isReturningUser && !formData.ai_interest_direction && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">← おすすめ (+4%)</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">AI技術に対するあなたの立ち位置を教えてください</p>
                  <div className="space-y-2">
                    {AI_INTEREST_DIRECTIONS.map(direction => (
                      <button
                        key={direction}
                        type="button"
                        onClick={() => setFormData({ ...formData, ai_interest_direction: direction })}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                          formData.ai_interest_direction === direction
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {direction}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex justify-between gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                戻る
              </button>
            )}
            <div className="flex-1" />
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                次へ
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '完了'}
              </button>
            )}
          </div>
        </form>

        {/* 注意書き */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            <span className="text-red-500">*</span> は必須項目です。
            その他の項目も入力することで、企業からのオファー率が向上します。
          </p>
        </div>
      </div>

      {/* 希望勤務地モーダル */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setIsLocationModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">希望勤務地を選択</h3>
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* 海外・リモート */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">海外・リモート</h4>
                <div className="grid grid-cols-2 gap-2">
                  {OVERSEAS_REGIONS.map(region => (
                    <label key={region} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_locations.includes(region)}
                        onChange={() => setFormData({
                          ...formData,
                          preferred_locations: toggleArrayValue(formData.preferred_locations, region)
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 都道府県 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">都道府県</h4>
                <div className="grid grid-cols-3 gap-2">
                  {PREFECTURES.map(prefecture => (
                    <label key={prefecture} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferred_locations.includes(prefecture)}
                        onChange={() => setFormData({
                          ...formData,
                          preferred_locations: toggleArrayValue(formData.preferred_locations, prefecture)
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{prefecture}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                選択完了（{formData.preferred_locations.length}件）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
