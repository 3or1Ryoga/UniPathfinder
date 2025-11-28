'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import { motion } from 'framer-motion'

interface MemberProfile {
  id: string
  full_name: string
  avatar_url: string
  main_role: string
  tech_stack: string[]
  work_values: string[]
  career_goal: string
  career_interests: string[]
  skill_level: string
  learning_goal: string
  awards: string
  job_interest: string
  education: string
  graduation_year: number
  github_username: string
  portfolio_url: string
  bio: string
  location: string
  onboarding_completed: boolean
}

interface BioData {
  self_intro?: string
  work_styles?: string[]
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // フィルター状態
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedGraduationYear, setSelectedGraduationYear] = useState<string>('')
  const [selectedInterest, setSelectedInterest] = useState<string>('')

  // フィルターオプション用のリスト
  const [allTechStacks, setAllTechStacks] = useState<string[]>([])
  const [allRoles, setAllRoles] = useState<string[]>([])
  const [allGraduationYears, setAllGraduationYears] = useState<number[]>([])
  const [allInterests, setAllInterests] = useState<string[]>([])

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [members, selectedTechStack, selectedRole, selectedGraduationYear, selectedInterest])

  async function loadMembers() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setCurrentUserId(user.id)

      // 全プロフィール数を確認
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      console.log('[Members] Total profiles:', totalCount)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })

      console.log('[Members] Query result:', { data, error })
      console.log('[Members] Onboarding completed profiles:', data?.length)

      if (error) {
        console.error('[Members] Supabase error:', error)
        throw error
      }

      setMembers(data || [])

      // フィルターオプションを抽出
      const techStacks = new Set<string>()
      const roles = new Set<string>()
      const graduationYears = new Set<number>()
      const interests = new Set<string>()

      data?.forEach(member => {
        if (member.tech_stack) {
          member.tech_stack.forEach((tech: string) => techStacks.add(tech))
        }
        if (member.main_role) roles.add(member.main_role)
        if (member.graduation_year) graduationYears.add(member.graduation_year)
        if (member.career_interests) {
          member.career_interests.forEach((interest: string) => interests.add(interest))
        }
      })

      setAllTechStacks(Array.from(techStacks).sort())
      setAllRoles(Array.from(roles).sort())
      setAllGraduationYears(Array.from(graduationYears).sort())
      setAllInterests(Array.from(interests).sort())

    } catch (error) {
      console.error('[Members] Error loading members:', error)
      console.error('[Members] Error details:', JSON.stringify(error, null, 2))
      if (error instanceof Error) {
        console.error('[Members] Error message:', error.message)
        console.error('[Members] Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...members]

    // 技術スタックフィルター
    if (selectedTechStack.length > 0) {
      filtered = filtered.filter(member =>
        member.tech_stack && selectedTechStack.some(tech => member.tech_stack.includes(tech))
      )
    }

    // 役割フィルター
    if (selectedRole) {
      filtered = filtered.filter(member => member.main_role === selectedRole)
    }

    // 卒業年度フィルター
    if (selectedGraduationYear) {
      filtered = filtered.filter(member => member.graduation_year === parseInt(selectedGraduationYear))
    }

    // 興味分野フィルター
    if (selectedInterest) {
      filtered = filtered.filter(member =>
        member.career_interests && member.career_interests.includes(selectedInterest)
      )
    }

    setFilteredMembers(filtered)
  }

  function toggleTechStack(tech: string) {
    if (selectedTechStack.includes(tech)) {
      setSelectedTechStack(selectedTechStack.filter(t => t !== tech))
    } else {
      setSelectedTechStack([...selectedTechStack, tech])
    }
  }

  function clearFilters() {
    setSelectedTechStack([])
    setSelectedRole('')
    setSelectedGraduationYear('')
    setSelectedInterest('')
  }

  function parseBio(bioString: string): BioData {
    try {
      return JSON.parse(bioString)
    } catch {
      return { self_intro: bioString }
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* ヘッダー */}
          <div className="mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">登録学生一覧</h1>
            <p className="text-sm sm:text-base text-gray-600">プラットフォームに登録している学生エンジニアの一覧です</p>
          </div>

          {/* モバイル用フィルターボタン */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md text-gray-700 font-semibold"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                フィルター
              </span>
              <svg className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* フィルターサイドバー */}
            <aside className={`${isFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
                  {(selectedTechStack.length > 0 || selectedRole || selectedGraduationYear || selectedInterest) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      クリア
                    </button>
                  )}
                </div>

                {/* 技術スタック */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">技術スタック</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allTechStacks.map(tech => (
                      <label key={tech} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedTechStack.includes(tech)}
                          onChange={() => toggleTechStack(tech)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{tech}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 役割 */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">役割</h3>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">すべて</option>
                    {allRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* 卒業年度 */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">卒業年度</h3>
                  <select
                    value={selectedGraduationYear}
                    onChange={(e) => setSelectedGraduationYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">すべて</option>
                    {allGraduationYears.map(year => (
                      <option key={year} value={year}>{year}年卒業</option>
                    ))}
                  </select>
                </div>

                {/* 興味のある分野 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">興味のある分野</h3>
                  <select
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">すべて</option>
                    {allInterests.map(interest => (
                      <option key={interest} value={interest}>{interest}</option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            {/* 学生リスト */}
            <main className="flex-1 min-w-0">
              <div className="mb-4 text-sm sm:text-base text-gray-600">
                {filteredMembers.length}名の学生が見つかりました
              </div>

              <div className="space-y-3 sm:space-y-4">
                {filteredMembers.map((member, index) => {
                  const bioData = member.bio ? parseBio(member.bio) : {}
                  const isCurrentUser = member.id === currentUserId

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* アバター */}
                        <div className="flex-shrink-0 flex justify-center sm:block">
                          <img
                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || 'User')}&size=96&background=3B82F6&color=fff`}
                            alt={member.full_name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-100"
                          />
                        </div>

                        {/* メイン情報 */}
                        <div className="flex-1 min-w-0">
                          {/* 名前と役割 */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              {member.full_name || '名前未設定'}
                            </h3>
                            {isCurrentUser && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                あなた
                              </span>
                            )}
                            {!member.onboarding_completed && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                設定未完了
                              </span>
                            )}
                            {member.main_role && (
                              <span className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold rounded-full">
                                {member.main_role}
                              </span>
                            )}
                          </div>

                          {/* 学校情報 */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
                            {member.education && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>{member.education}</span>
                              </div>
                            )}
                            {member.graduation_year && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{member.graduation_year}年卒業予定</span>
                              </div>
                            )}
                            {member.job_interest && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{member.job_interest}</span>
                              </div>
                            )}
                          </div>

                          {/* 技術スタック */}
                          {member.tech_stack && member.tech_stack.length > 0 && (
                            <div className="mb-2 sm:mb-3">
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {member.tech_stack.map(tech => (
                                  <span
                                    key={tech}
                                    className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* キャリア価値観 */}
                          {member.work_values && member.work_values.length > 0 && (
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">重視すること:</span>
                                {member.work_values.map(value => (
                                  <span
                                    key={value}
                                    className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 経験レベル */}
                          {member.skill_level && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs text-gray-500">経験: </span>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">{member.skill_level}</span>
                              {member.learning_goal && (
                                <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2 block sm:inline">- {member.learning_goal}</span>
                              )}
                            </div>
                          )}

                          {/* キャリアゴール */}
                          {member.career_goal && (
                            <div className="mb-2 sm:mb-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs sm:text-sm text-gray-700">
                                <span className="font-semibold text-blue-700">実現したいこと: </span>
                                {member.career_goal}
                              </p>
                            </div>
                          )}

                          {/* 自己PR */}
                          {bioData.self_intro && (
                            <div className="mb-2 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-700">{bioData.self_intro}</p>
                            </div>
                          )}

                          {/* 興味のある分野 */}
                          {member.career_interests && member.career_interests.length > 0 && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs text-gray-500">興味: </span>
                              <span className="text-xs sm:text-sm text-gray-700">
                                {member.career_interests.join(', ')}
                              </span>
                            </div>
                          )}

                          {/* ハッカソン経験 */}
                          {member.awards && (
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center gap-1 text-xs sm:text-sm">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                <span className="text-gray-700 font-medium">{member.awards}</span>
                              </div>
                            </div>
                          )}

                          {/* 勤務スタイル */}
                          {bioData.work_styles && bioData.work_styles.length > 0 && (
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">勤務スタイル:</span>
                                {bioData.work_styles.map((style: string) => (
                                  <span
                                    key={style}
                                    className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
                                  >
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* リンク */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                            {member.github_username && (
                              <a
                                href={`https://github.com/${member.github_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate">@{member.github_username}</span>
                              </a>
                            )}
                            {member.portfolio_url && (
                              <a
                                href={member.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span>ポートフォリオ</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {filteredMembers.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-gray-500">条件に一致する学生が見つかりませんでした</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
