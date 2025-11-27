import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Iceberg Visualization Data API
 *
 * 氷山ビジュアライゼーションに必要なデータを取得：
 * - 海面下（GitHub定量データ）：総コミット数、総追加行数、開発日数
 * - 海面上（ブログ投稿数）：公開ブログ投稿の数
 * - 技術スタック：コードハイライトから抽出
 */

export async function GET() {
  try {
    const supabase = await createClient()

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // ========================================
    // 1. GitHub統計データ取得（海面下）
    // ========================================
    const { data: githubStats, error: githubError } = await supabase
      .from('github_daily_stats')
      .select('commit_count, lines_added, lines_deleted, code_highlights')
      .eq('user_id', userId)

    if (githubError) {
      console.error('Error fetching GitHub stats:', githubError)
      return NextResponse.json({ error: 'Failed to fetch GitHub stats' }, { status: 500 })
    }

    // 統計を集計
    const totalCommits = githubStats?.reduce((sum, day) => sum + (day.commit_count || 0), 0) || 0
    const totalAdditions = githubStats?.reduce((sum, day) => sum + (day.lines_added || 0), 0) || 0
    const totalDeletions = githubStats?.reduce((sum, day) => sum + (day.lines_deleted || 0), 0) || 0
    const developmentDays = githubStats?.filter(day => day.commit_count && day.commit_count > 0).length || 0

    // ========================================
    // 2. ブログ投稿数取得（海面上）
    // ========================================
    const { data: blogPosts, error: blogError } = await supabase
      .from('tech_blog_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_public', true)

    if (blogError) {
      console.error('Error fetching blog posts:', blogError)
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
    }

    const publicBlogCount = blogPosts?.length || 0

    // ========================================
    // 3. 技術スタック抽出（code_highlightsから）
    // ========================================
    const techStackMap = new Map<string, number>()

    githubStats?.forEach(day => {
      if (day.code_highlights && Array.isArray(day.code_highlights)) {
        day.code_highlights.forEach((highlight: { category?: string; description?: string }) => {
          // カテゴリから技術名を抽出
          if (highlight.category) {
            const tech = highlight.category
            techStackMap.set(tech, (techStackMap.get(tech) || 0) + 1)
          }

          // 説明文から技術名を抽出（React, TypeScript, Next.js など）
          if (highlight.description) {
            const techKeywords = [
              'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js',
              'Python', 'Rust', 'Go', 'Java', 'C++', 'C#',
              'Vue', 'Angular', 'Svelte',
              'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
              'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
              'GraphQL', 'REST', 'gRPC',
              'TailwindCSS', 'CSS', 'HTML', 'SCSS'
            ]

            techKeywords.forEach(keyword => {
              if (highlight.description && highlight.description.includes(keyword)) {
                techStackMap.set(keyword, (techStackMap.get(keyword) || 0) + 1)
              }
            })
          }
        })
      }
    })

    // 技術スタックを頻度順にソート
    const techStack = Array.from(techStackMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12) // 最大12個まで表示

    // ========================================
    // 4. 最近の活動（過去30日）
    // ========================================
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentStats, error: recentError } = await supabase
      .from('github_daily_stats')
      .select('commit_count, date')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (recentError) {
      console.error('Error fetching recent stats:', recentError)
    }

    const recentCommits = recentStats?.reduce((sum, day) => sum + (day.commit_count || 0), 0) || 0
    const recentActiveDays = recentStats?.filter(day => day.commit_count && day.commit_count > 0).length || 0

    // ========================================
    // 5. レスポンス構築
    // ========================================
    return NextResponse.json({
      // 海面下（GitHub定量データ）
      underwater: {
        totalCommits,
        totalAdditions,
        totalDeletions,
        developmentDays,
        recentCommits,
        recentActiveDays
      },
      // 海面上（ブログ定性データ）
      aboveWater: {
        publicBlogCount
      },
      // 技術スタック
      techStack,
      // 氷山の大きさ計算用
      metrics: {
        // 海面下の深さ（コミット数ベース、最大1000で正規化）
        underwaterDepth: Math.min(totalCommits / 10, 100),
        // 海面上の高さ（ブログ投稿数ベース、最大20で正規化）
        aboveWaterHeight: Math.min(publicBlogCount * 5, 100)
      }
    })
  } catch (error) {
    console.error('Iceberg data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
