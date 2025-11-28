'use client'

import { useEffect, useState, FormEvent, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { calculateProfileCompletion } from '@/utils/profileCompletion'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeContext } from '@/contexts/ThemeProvider'
import { ThemeType } from '@/types/theme'

// 主な役割の選択肢
const MAIN_ROLES = [
  'フルスタックエンジニア',
  'フロントエンドエンジニア',
  'バックエンドエンジニア',
  'モバイルエンジニア',
  'データサイエンティスト',
  'デザイナー',
  'プロダクトマネージャー',
  'ビジネス',
  'その他'
]

// プログラミング経験レベル
const PROGRAMMING_EXPERIENCE_LEVELS = [
  { id: 'created', label: '作ったものがある', prompt: '何を作りましたか？（例：ToDoアプリ、ゲーム）' },
  { id: 'academic', label: '授業/研究でプログラミング経験', prompt: 'どんな授業/研究ですか？' },
  { id: 'self_learning', label: '独学で勉強中', prompt: '何を勉強中ですか？' },
  { id: 'want_to_learn', label: 'これから学びたい', prompt: 'なぜプログラミングを学びたいですか？（50文字程度）' }
]

// 興味のある分野
const INTEREST_AREAS = [
  '初心者向け',
  'Web開発',
  'モバイルアプリ開発',
  'AI/機械学習',
  'データ分析',
  'IoT/ハードウェア',
  'ゲーム開発',
  '社会課題解決',
  'ビジネスイノベーション',
  'パフォーマンス最適化',
  'オープンデータ活用',
  'アイデアソン'
]

// 職業
const OCCUPATIONS = [
  '中学生', '高校生', '高専生',
  '大学生', '大学院生（修士・博士）',
  '専門学校生', 'その他の学生',
  '社会人', 'フリーランス'
]

// いつから働けるか
const AVAILABILITY_OPTIONS = [
  '今すぐ（今週から）',
  '来週から',
  '来月から',
  '3ヶ月以内',
  '半年以内'
]

// 週何時間働けるか
const WEEKLY_HOURS_OPTIONS = [
  '10時間未満（週1日程度）',
  '10-20時間（週2-3日）',
  '20-30時間（週3-4日）',
  '30時間以上（週4日以上）'
]

// 勤務スタイル
const WORK_STYLES = [
  'オフィス出社OK',
  'フルリモート希望',
  'どちらでもOK'
]

// 希望時給
const HOURLY_RATE_OPTIONS = [
  '1,000円〜',
  '1,200円〜',
  '1,500円〜',
  '2,000円〜',
  'こだわらない'
]

// 都道府県
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

// 技術スタック
const TECH_STACK = [
  'HTML/CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Ruby',
  'Python',
  'Django',
  'PHP',
  'Go',
  'Swift',
  'Kotlin',
  'Dart',
  'C#',
  'C/C++',
  'Java',
  'Rust',
  'R',
  'SQL',
]

// キャリアで重視すること
const CAREER_VALUES = [
  '技術的挑戦',
  'プロダクトへの貢献',
  '社会的インパクト',
  'ワークライフバランス',
  'チーム文化',
  '給与・待遇'
]

interface OnboardingData {
  // ステップ1: 主な役割
  main_role: string
  main_role_other: string  // 「その他」を選択した場合の詳細

  // ステップ2: プログラミング経験
  experience_level: string
  experience_detail: string

  // ステップ3: Tech Stack & Career Values（新規追加）
  tech_stack: string[]
  career_values: string[]
  career_goal: string

  // ステップ4: 興味のある分野
  interest_areas: string[]
  hackathon_experience: string

  // ステップ5: 参加資格
  country: string
  birth_year: string
  birth_month: string
  occupation: string
  school_name: string
  graduation_year: number | null
  receive_emails: boolean

  // ステップ6: 働き方の希望
  availability_start: string
  weekly_hours: string
  work_styles: string[]
  preferred_locations: string[]
  hourly_rate: string

  // ステップ7: 連絡先
  github_username: string
  portfolio_url: string
  self_intro: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { theme, changer } = useContext(ThemeContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1) // 1: 次へ, -1: 戻る
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const [formData, setFormData] = useState<OnboardingData>({
    main_role: '',
    main_role_other: '',
    experience_level: '',
    experience_detail: '',
    tech_stack: [],
    career_values: [],
    career_goal: '',
    interest_areas: [],
    hackathon_experience: '',
    country: '日本',
    birth_year: '',
    birth_month: '',
    occupation: '',
    school_name: '',
    graduation_year: null,
    receive_emails: true,
    availability_start: '',
    weekly_hours: '',
    work_styles: [],
    preferred_locations: [],
    hourly_rate: '',
    github_username: '',
    portfolio_url: '',
    self_intro: ''
  })

  const totalSteps = 7

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
        // 既存データを読み込んでフォームに反映
        let bioData: {
          self_intro?: string
          birth_year?: number
          birth_month?: number
          availability_start?: string
          weekly_hours?: string
          hourly_rate?: string
          work_styles?: string[]
        } = {}
        try {
          if (data.bio) {
            bioData = JSON.parse(data.bio)
          }
        } catch {
          // bioがJSON形式でない場合はself_introとして扱う
          bioData = { self_intro: data.bio }
        }

        const careerInterests = Array.isArray(data.career_interests) ? data.career_interests : []
        const techStack = Array.isArray(data.tech_stack) ? data.tech_stack : []
        const careerValues = Array.isArray(data.work_values) ? data.work_values : []

        // main_roleが既存の選択肢にない場合は「その他」として扱う
        const isStandardRole = MAIN_ROLES.includes(data.main_role || '')

        setFormData({
          main_role: isStandardRole ? (data.main_role || '') : 'その他',
          main_role_other: !isStandardRole ? (data.main_role || '') : '',
          experience_level: data.skill_level || '',
          experience_detail: data.learning_goal || data.experience || '',
          tech_stack: techStack,
          career_values: careerValues,
          career_goal: data.career_goal || '',
          interest_areas: careerInterests,
          hackathon_experience: data.awards || '',
          country: data.location || '日本',
          birth_year: bioData.birth_year?.toString() || '',
          birth_month: bioData.birth_month?.toString() || '',
          occupation: data.job_interest || '',
          school_name: data.education || '',
          graduation_year: data.graduation_year || null,
          receive_emails: true,
          availability_start: bioData.availability_start || '',
          weekly_hours: bioData.weekly_hours || '',
          work_styles: Array.isArray(bioData.work_styles) ? bioData.work_styles : [],
          preferred_locations: Array.isArray(data.preferred_locations) ? data.preferred_locations : [],
          hourly_rate: bioData.hourly_rate || '',
          github_username: data.github_username || '',
          portfolio_url: data.portfolio_url || '',
          self_intro: bioData.self_intro || ''
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
        if (!formData.main_role) return false
        // 「その他」の場合は詳細入力も必須
        if (formData.main_role === 'その他' && !formData.main_role_other) return false
        return true
      case 2:
        return !!(formData.experience_level && formData.experience_detail)
      case 3:
        // Tech Stack & Career Values - 技術スタックとキャリア価値観は必須（UIでは2つまでに制限、既存データで3つ以上でもOK）
        return formData.tech_stack.length > 0 && formData.career_values.length > 0
      case 4:
        return formData.interest_areas.length > 0
      case 5:
        return !!(formData.country && formData.occupation && formData.school_name && formData.graduation_year)
      case 6:
        return !!(formData.availability_start && formData.weekly_hours && formData.work_styles.length > 0)
      case 7:
        return true // 任意項目のみ
      default:
        return false
    }
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      setMessage({ type: 'error', text: '必須項目を入力してください' })
      return
    }
    setMessage(null)
    setDirection(1)
    setCurrentStep(currentStep + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setMessage(null)
    setDirection(-1)
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleArrayValue(array: string[], value: string): string[] {
    if (array.includes(value)) {
      return array.filter(v => v !== value)
    } else {
      return [...array, value]
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (currentStep !== totalSteps) {
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

      // bioフィールドをJSON形式で保存
      const bioData = {
        self_intro: formData.self_intro,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        birth_month: formData.birth_month ? parseInt(formData.birth_month) : null,
        availability_start: formData.availability_start,
        weekly_hours: formData.weekly_hours,
        hourly_rate: formData.hourly_rate,
        work_styles: formData.work_styles
      }

      const updateData = {
        main_role: formData.main_role === 'その他' ? formData.main_role_other : formData.main_role,
        tech_stack: formData.tech_stack,
        work_values: formData.career_values,
        career_goal: formData.career_goal,
        career_interests: formData.interest_areas,
        skill_level: formData.experience_level,
        learning_goal: formData.experience_detail,
        awards: formData.hackathon_experience,
        location: formData.country,
        job_interest: formData.occupation,
        education: formData.school_name,
        graduation_year: formData.graduation_year,
        preferred_locations: formData.preferred_locations,
        github_username: formData.github_username,
        portfolio_url: formData.portfolio_url,
        bio: JSON.stringify(bioData),
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            あなたのことを教えてください
          </h1>
          <button
            onClick={() => changer(theme === ThemeType.DARK ? ThemeType.LIGHT : ThemeType.DARK)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
          >
            {theme === ThemeType.DARK ? (
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {currentStep} / {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* メッセージ */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 min-h-[400px] transition-colors duration-300"
            >
              {/* ステップ1: 主な役割 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      主な役割は何ですか？<span className="text-red-500">*</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      最も近いものを選択してください
                    </p>
                  </div>

                  <div className="space-y-3">
                    {MAIN_ROLES.map(role => (
                      <motion.button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, main_role: role })}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full px-6 py-4 rounded-xl font-medium transition-all text-left ${
                          formData.main_role === role
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {role}
                      </motion.button>
                    ))}
                  </div>

                  {/* 「その他」を選択した時のテキストフィールド */}
                  {formData.main_role === 'その他' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4"
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        詳しく教えてください<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.main_role_other}
                        onChange={(e) => setFormData({ ...formData, main_role_other: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：UI/UXデザイナー、グロースハッカー等"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* ステップ2: プログラミング経験 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      プログラミング経験を教えてください<span className="text-red-500">*</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      最も近いものを選択してください
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {PROGRAMMING_EXPERIENCE_LEVELS.map(level => (
                      <motion.button
                        key={level.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, experience_level: level.label })}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full px-6 py-4 rounded-xl font-medium transition-all text-left ${
                          formData.experience_level === level.label
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {level.label}
                      </motion.button>
                    ))}
                  </div>

                  {formData.experience_level && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {PROGRAMMING_EXPERIENCE_LEVELS.find(l => l.label === formData.experience_level)?.prompt}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.experience_detail}
                        onChange={(e) => setFormData({ ...formData, experience_detail: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="具体的に教えてください..."
                        required
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* ステップ3: Tech Stack & Career Values（新規追加） */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      技術とキャリアについて
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      あなたの興味と価値観を教えてください
                    </p>
                  </div>

                  {/* 技術スタック */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      得意な言語<span className="text-red-500">*</span>（複数選択可）
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {TECH_STACK.map(tech => (
                        <motion.button
                          key={tech}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tech_stack: toggleArrayValue(formData.tech_stack, tech)
                          })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                            formData.tech_stack.includes(tech)
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tech}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* キャリアで重視すること */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      キャリアで重視すること<span className="text-red-500">*</span>（1つか2つ選択）
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {CAREER_VALUES.map(value => {
                        const isSelected = formData.career_values.includes(value)
                        const isDisabled = !isSelected && formData.career_values.length >= 2

                        return (
                          <motion.button
                            key={value}
                            type="button"
                            onClick={() => {
                              // 1つだけ選択されている状態で、そのボタンをクリックした場合は解除しない（最低1つは必須）
                              if (isSelected && formData.career_values.length === 1) {
                                return
                              }
                              if (!isDisabled) {
                                setFormData({
                                  ...formData,
                                  career_values: toggleArrayValue(formData.career_values, value)
                                })
                              }
                            }}
                            whileHover={!isDisabled ? { scale: 1.05 } : {}}
                            whileTap={!isDisabled ? { scale: 0.95 } : {}}
                            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                              isSelected
                                ? 'bg-green-600 text-white shadow-md'
                                : isDisabled
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            disabled={isDisabled}
                          >
                            {value}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 仕事を通して実現したいこと */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      仕事を通して実現したいこと（任意）
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      例：Webのパフォーマンスチューニングが好きなので、大規模サービスの速度改善に貢献し、数百万人のユーザー体験を向上させたいです。
                    </p>
                    <textarea
                      value={formData.career_goal}
                      onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="あなたのキャリアビジョンを教えてください..."
                    />
                  </div>
                </div>
              )}

              {/* ステップ4: 興味のある分野 */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      興味のあるイベント/バイト/職務<span className="text-red-500">*</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      複数選択可
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {INTEREST_AREAS.map(area => (
                      <motion.button
                        key={area}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          interest_areas: toggleArrayValue(formData.interest_areas, area)
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                          formData.interest_areas.includes(area)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {area}
                      </motion.button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      過去に参加したハッカソン/イベント（任意）
                    </label>
                    <input
                      type="text"
                      value={formData.hackathon_experience}
                      onChange={(e) => setFormData({ ...formData, hackathon_experience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例：技育展2024 最優秀賞"
                    />
                  </div>
                </div>
              )}

              {/* ステップ5: 参加資格 */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                      参加資格
                    </h2>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      居住国<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="日本">日本</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      生年月日（任意）
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={formData.birth_year}
                        onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">年</option>
                        {Array.from({ length: 50 }, (_, i) => 2010 - i).map(year => (
                          <option key={year} value={year}>{year}年</option>
                        ))}
                      </select>
                      <select
                        value={formData.birth_month}
                        onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">月</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}月</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      職業<span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {OCCUPATIONS.map(occupation => (
                        <motion.button
                          key={occupation}
                          type="button"
                          onClick={() => setFormData({ ...formData, occupation })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                            formData.occupation === occupation
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {occupation}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      学校<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例：○○大学 工学部 情報工学科"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      卒業年度<span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={formData.graduation_year || ''}
                        onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">年</option>
                        {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                          <option key={year} value={year}>{year}年</option>
                        ))}
                        <option value="0">卒業済み</option>
                      </select>
                      <select
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="3">3月</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="receive_emails"
                      checked={formData.receive_emails}
                      onChange={(e) => setFormData({ ...formData, receive_emails: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="receive_emails" className="text-sm text-gray-700 dark:text-gray-300">
                      情報等のメールを受け取る
                    </label>
                  </div>
                </div>
              )}

              {/* ステップ6: 働き方の希望 */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                      働き方の希望
                    </h2>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      いつから働けますか？<span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {AVAILABILITY_OPTIONS.map(option => (
                        <motion.button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, availability_start: option })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                            formData.availability_start === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      週何時間働けますか？<span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {WEEKLY_HOURS_OPTIONS.map(option => (
                        <motion.button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, weekly_hours: option })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                            formData.weekly_hours === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      勤務スタイル<span className="text-red-500">*</span>（複数選択可）
                    </label>
                    <div className="space-y-2">
                      {WORK_STYLES.map(style => (
                        <motion.button
                          key={style}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            work_styles: toggleArrayValue(formData.work_styles, style)
                          })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                            formData.work_styles.includes(style)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {style}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      希望勤務地（オフィス出社OKの場合）
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left flex items-center justify-between"
                    >
                      <span>
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
                          <span key={location} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            {location}
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                preferred_locations: formData.preferred_locations.filter(l => l !== location)
                              })}
                              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      希望時給
                    </label>
                    <div className="space-y-2">
                      {HOURLY_RATE_OPTIONS.map(option => (
                        <motion.button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, hourly_rate: option })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                            formData.hourly_rate === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ステップ7: 連絡先 */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      最後の確認
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      任意項目ですが、入力するとマッチング率が上がります
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      GitHubアカウント（任意）
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      GitHubがなくても全く問題ありません！
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">@</span>
                      <input
                        type="text"
                        value={formData.github_username}
                        onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ユーザー名"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      ポートフォリオ・ブログ等（任意）
                    </label>
                    <input
                      type="url"
                      value={formData.portfolio_url}
                      onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      自己PR（任意・200文字まで）
                    </label>
                    <textarea
                      value={formData.self_intro}
                      onChange={(e) => setFormData({ ...formData, self_intro: e.target.value })}
                      maxLength={200}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="あなたの強みや、やりたいことを教えてください"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {formData.self_intro.length} / 200
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ナビゲーションボタン */}
          <div className="flex justify-between gap-4">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold shadow-md"
              >
                戻る
              </motion.button>
            )}
            <div className="flex-1" />
            {currentStep < totalSteps ? (
              <motion.button
                type="button"
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
              >
                次へ
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={!saving ? { scale: 1.05 } : {}}
                whileTap={!saving ? { scale: 0.95 } : {}}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '完了！'}
              </motion.button>
            )}
          </div>
        </form>
      </div>

      {/* 希望勤務地モーダル */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setIsLocationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">希望勤務地を選択</h3>
                  <button
                    onClick={() => setIsLocationModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">都道府県</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {PREFECTURES.map(prefecture => (
                      <label key={prefecture} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preferred_locations.includes(prefecture)}
                          onChange={() => setFormData({
                            ...formData,
                            preferred_locations: toggleArrayValue(formData.preferred_locations, prefecture)
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{prefecture}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  選択完了（{formData.preferred_locations.length}件）
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
