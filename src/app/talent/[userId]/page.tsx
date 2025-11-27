import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Tables } from '@/app/database.types'

type Profile = Tables<'profiles'>

interface GithubDailyStat {
  id: string
  user_id: string
  date: string
  commit_count: number
  files_changed: Array<{ file: string; additions?: number; deletions?: number }>
  code_highlights: Array<{ category?: string; description?: string }>
  commit_summary: string | null
  activity_description: string | null
  created_at: string
}

interface BlogPost {
  id: string
  user_id: string
  topic: string
  title: string
  content: string
  created_at: string
  is_public: boolean
}

interface TimelineItem {
  date: string
  type: 'github' | 'blog'
  title: string
  description: string
  tags?: string[]
  evidence?: string
  url?: string
}

export default async function TalentProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient()
  const { userId } = await params

  // ========================================
  // 1. プロフィールデータ取得
  // ========================================
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // ========================================
  // 2. GitHub統計データ取得（全期間）
  // ========================================
  const { data: githubStats } = await supabase
    .from('github_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false }) as { data: GithubDailyStat[] | null }

  // ========================================
  // 3. ブログ投稿データ取得（公開のみ）
  // ========================================
  const { data: blogPosts } = await supabase
    .from('tech_blog_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false }) as { data: BlogPost[] | null }

  // ========================================
  // 4. Current Focus計算（直近3日）
  // ========================================
  const recentStats = githubStats?.slice(0, 3) || []
  const currentFocus = recentStats
    .map(stat => stat.activity_description)
    .filter(Boolean)[0] || '開発活動を継続中'

  // ========================================
  // 5. Tech Stack抽出（profileとcode_highlightsから）
  // ========================================
  const profileTechStack = (profile.tech_stack as string[]) || []
  const codeHighlightTechs = new Set<string>()

  githubStats?.forEach(stat => {
    stat.code_highlights?.forEach(highlight => {
      if (highlight.category) {
        codeHighlightTechs.add(highlight.category)
      }
    })
  })

  const allTechStack = [...new Set([...profileTechStack, ...Array.from(codeHighlightTechs)])]

  // ========================================
  // 6. タイムライン作成（ハイライトのみ）
  // ========================================
  const timeline: TimelineItem[] = []

  // ブログ投稿を追加
  blogPosts?.forEach(post => {
    timeline.push({
      date: post.created_at,
      type: 'blog',
      title: post.title,
      description: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
      tags: [post.topic]
    })
  })

  // GitHubマイルストーンを追加（commit_summaryまたはcode_highlightsがある日のみ）
  githubStats?.forEach(stat => {
    const hasHighlight = stat.code_highlights && stat.code_highlights.length > 0
    const hasMilestone = stat.commit_summary && (
      stat.commit_summary.includes('実装') ||
      stat.commit_summary.includes('機能') ||
      stat.commit_summary.includes('解決') ||
      stat.commit_summary.includes('追加') ||
      stat.commit_summary.includes('改善')
    )

    if (hasHighlight || hasMilestone) {
      const tags = stat.code_highlights?.map(h => h.category).filter(Boolean) as string[] || []
      const filesCount = stat.files_changed?.length || 0

      timeline.push({
        date: stat.date,
        type: 'github',
        title: stat.activity_description || 'Development Activity',
        description: stat.commit_summary || '',
        tags: tags.slice(0, 5),
        evidence: `${stat.commit_count} commits, ${filesCount} files changed`
      })
    }
  })

  // 日付でソート（新しい順）
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // ========================================
  // 7. AI Growth Assessment計算
  // ========================================
  const totalCommits = githubStats?.reduce((sum, stat) => sum + stat.commit_count, 0) || 0
  const blogCount = blogPosts?.length || 0
  const activeDays = githubStats?.filter(stat => stat.commit_count > 0).length || 0

  let assessmentText = ''
  let assessmentHighlight = ''

  // 自己申告 vs 実態のギャップを評価
  const experienceLevel = profile.experience || ''

  if (experienceLevel.includes('独学') && totalCommits > 50) {
    assessmentHighlight = '驚異的な自走力'
    assessmentText = `「${experienceLevel}」としながらも、${totalCommits}コミット・${activeDays}日間の開発実績を持つ。実務レベルの技術力に到達しています。`
  } else if (totalCommits > 100) {
    assessmentHighlight = '高い開発力'
    assessmentText = `${totalCommits}コミット・${activeDays}日間の継続的な開発活動により、実践的なスキルを身につけています。`
  } else if (totalCommits > 0) {
    assessmentHighlight = '成長意欲'
    assessmentText = `${totalCommits}コミットの開発実績があり、継続的に学習を続けています。`
  } else {
    assessmentHighlight = 'ポテンシャル'
    assessmentText = 'プロフィール情報から、成長意欲とポテンシャルが見られます。'
  }

  // ブログ執筆能力を評価
  if (blogCount >= 5) {
    assessmentText += ` さらに${blogCount}件の技術ブログ執筆により、高い言語化能力を持ち、チーム開発での知識共有やドキュメント作成で貢献が期待できます。`
  } else if (blogCount > 0) {
    assessmentText += ` ${blogCount}件の技術ブログを執筆しており、学びを言語化する力があります。`
  }

  // ========================================
  // 8. Work Preference情報
  // ========================================
  const workValues = (profile.work_values as string[]) || []
  const preferredLocations = (profile.preferred_locations as string[]) || []

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-start gap-6">
            {/* アバター */}
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ''}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {profile.full_name || profile.username || 'Anonymous'}
              </h1>

              {profile.education && (
                <p className="text-slate-600 mb-3 flex items-center gap-2">
                  <span className="text-lg">🎓</span>
                  {profile.education}
                  {profile.graduation_year && ` - ${profile.graduation_year}年卒業予定`}
                </p>
              )}

              {(preferredLocations.length > 0 || profile.location) && (
                <p className="text-slate-600 flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  {preferredLocations.join(', ') || profile.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* ========================================
            Section 1: The "NOW" Card（現在地）
            ======================================== */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* タイトルバー */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">📍</span>
                現在地 - NOW
              </h2>
            </div>

            <div className="p-8">
              {/* Primary Role */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Role
                </h3>
                <p className="text-4xl font-bold text-slate-800">
                  {profile.main_role || 'Developer'}
                </p>
              </div>

              {/* Current Focus */}
              <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-base">💻</span>
                  Current Focus（今やっていること）
                </h3>
                <p className="text-xl text-slate-800 font-medium leading-relaxed">
                  {currentFocus}
                </p>
              </div>

              {/* Tech Stack */}
              {allTechStack.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTechStack.slice(0, 12).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-200 transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Preference */}
              <div className="grid grid-cols-2 gap-6">
                {workValues.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Work Style
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {workValues.map((value, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm border border-green-200"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.graduation_year && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Graduation
                    </h3>
                    <p className="text-lg font-semibold text-slate-800">
                      {profile.graduation_year}年
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
            Section 2: Vertical Growth Path（成長の軌跡）
            ======================================== */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
            <span className="text-4xl">📈</span>
            成長の軌跡 - Growth Path
          </h2>

          <div className="relative">
            {/* 垂直タイムライン */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            <div className="space-y-8">
              {timeline.slice(0, 20).map((item, idx) => (
                <div key={idx} className="relative pl-20">
                  {/* タイムラインドット */}
                  <div
                    className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-lg ${
                      item.type === 'blog'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>

                  {/* カード */}
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                    {/* ヘッダー */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {item.type === 'blog' ? (
                          <span className="text-xl">📝</span>
                        ) : (
                          <span className="text-xl">💻</span>
                        )}
                        <span className="text-sm font-semibold text-slate-500">
                          {new Date(item.date).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === 'blog'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.type === 'blog' ? 'Blog Post' : 'Dev Activity'}
                      </span>
                    </div>

                    {/* タイトルと説明 */}
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {item.description}
                    </p>

                    {/* タグとエビデンス */}
                    <div className="flex items-center justify-between">
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.evidence && (
                        <span className="text-xs text-slate-500 font-medium">
                          {item.evidence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {timeline.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p>アクティビティデータがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================
            Section 3: AI Growth Assessment（定性評価）
            ======================================== */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">
                AI Growth Assessment
              </h2>
            </div>

            <div className="p-8">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold text-lg border border-amber-300">
                  {assessmentHighlight}
                </span>
              </div>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                {assessmentText}
              </p>

              {/* 統計サマリー */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-amber-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {totalCommits}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    Total Commits
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {activeDays}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    Active Days
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {blogCount}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    Blog Posts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* キャリア目標とバイオ */}
        {(profile.career_goal || profile.bio) && (
          <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
            {profile.career_goal && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  キャリア目標
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {profile.career_goal}
                </p>
              </div>
            )}

            {profile.bio && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  自己紹介
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
