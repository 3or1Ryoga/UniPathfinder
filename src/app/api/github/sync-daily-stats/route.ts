import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeGitHubActivityAndNotify } from '@/lib/ai-mentor'
import { analyzeDailyCommits } from '@/lib/github-commit-analyzer'
import { generateDailySummary } from '@/lib/github-summary-generator'
import { detectRepositoriesForAllUsers } from '@/lib/github-repo-detector'

// Supabaseクライアントを遅延初期化する関数
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is missing')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

interface DailyStats {
  date: string // YYYY-MM-DD (JST)
  commitCount: number
  pushEventCount: number
  issueCount: number
  pullRequestCount: number
}

interface SyncResult {
  userId: string
  githubUsername: string
  success: boolean
  daysSynced: number
  error?: string
  engagementStatus?: 'active' | 'stagnant' | 'normal'
}

interface GitHubEvent {
  type: string
  created_at: string
  payload?: {
    commits?: { sha: string }[]
    size?: number  // PushEventのコミット数
  }
}

// GitHubイベントから日次統計を集計
function aggregateDailyStats(events: GitHubEvent[]): Map<string, DailyStats> {
  const dailyStatsMap = new Map<string, DailyStats>()

  for (const event of events) {
    // イベントの作成日時をJSTに変換
    const createdAt = new Date(event.created_at)
    const jstDate = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000)
    const dateKey = jstDate.toISOString().split('T')[0] // YYYY-MM-DD

    // 既存のエントリを取得または初期化
    let stats = dailyStatsMap.get(dateKey)
    if (!stats) {
      stats = {
        date: dateKey,
        commitCount: 0,
        pushEventCount: 0,
        issueCount: 0,
        pullRequestCount: 0
      }
      dailyStatsMap.set(dateKey, stats)
    }

    // イベントタイプごとに集計
    switch (event.type) {
      case 'PushEvent':
        stats.pushEventCount++
        // PushEventのコミット数を取得
        // 優先順位: 1. payload.size, 2. payload.commits.length, 3. 最低1
        let commitCount = 0
        if (event.payload?.size !== undefined && event.payload.size > 0) {
          commitCount = event.payload.size
        } else if (event.payload?.commits && event.payload.commits.length > 0) {
          commitCount = event.payload.commits.length
        } else {
          // PushEventがあれば最低1コミットとカウント
          commitCount = 1
        }
        stats.commitCount += commitCount
        break
      case 'IssuesEvent':
      case 'IssueCommentEvent':
        stats.issueCount++
        break
      case 'PullRequestEvent':
      case 'PullRequestReviewEvent':
      case 'PullRequestReviewCommentEvent':
        stats.pullRequestCount++
        break
    }
  }

  return dailyStatsMap
}

// ユーザーの日次サマリーを生成・更新
async function generateDailySummaryForUser(
  userId: string,
  date: string,  // YYYY-MM-DD
  accessToken: string
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // ユーザーのプライマリリポジトリを取得
    const { data: repos, error: repoError } = await supabaseAdmin
      .from('user_github_repos')
      .select('repo_owner, repo_name')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .limit(1)

    if (repoError || !repos || repos.length === 0) {
      console.log(`[Daily Summary] No primary repo found for user ${userId}, skipping`)
      return
    }

    const { repo_owner, repo_name } = repos[0]

    // GitHub Commit Analyzerでその日のコミットを分析
    const analyzedCommit = await analyzeDailyCommits(
      repo_owner,
      repo_name,
      date,
      accessToken
    )

    if (!analyzedCommit) {
      console.warn(`[Daily Summary] Failed to analyze commits for ${repo_owner}/${repo_name} on ${date}`)
      return
    }

    // GPT-4oでサマリー生成
    const summary = await generateDailySummary(analyzedCommit, date)

    // github_daily_statsを更新
    const { error: updateError } = await supabaseAdmin
      .from('github_daily_stats')
      .update({
        commit_summary: summary.commitSummary,
        activity_description: summary.activityDescription,
        files_changed: summary.filesChanged,
        code_highlights: summary.codeHighlights
      })
      .eq('user_id', userId)
      .eq('date', date)

    if (updateError) {
      console.error(`[Daily Summary] Failed to update github_daily_stats:`, updateError)
    } else {
      console.log(`[Daily Summary] Successfully generated summary for user ${userId} on ${date}`)
    }
  } catch (error) {
    console.error('[Daily Summary] Error:', error)
    // エラーが発生してもメイン処理には影響させない
  }
}

// ユーザーのエンゲージメント状態を計算・更新
async function updateEngagementStatus(userId: string): Promise<'active' | 'stagnant' | 'normal'> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date()

    // 過去7日間の日付範囲
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 過去14日間の日付範囲
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // 過去7日間のコミット数を集計
    const { data: last7DaysStats, error: error7 } = await supabaseAdmin
      .from('github_daily_stats')
      .select('commit_count')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0])

    if (error7) {
      console.error('Error fetching 7 days stats:', error7)
      return 'normal'
    }

    const commits7Days = last7DaysStats?.reduce((sum, stat) => sum + stat.commit_count, 0) || 0

    // 過去14日間のコミット数を集計
    const { data: last14DaysStats, error: error14 } = await supabaseAdmin
      .from('github_daily_stats')
      .select('commit_count, date')
      .eq('user_id', userId)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error14) {
      console.error('Error fetching 14 days stats:', error14)
      return 'normal'
    }

    const commits14Days = last14DaysStats?.reduce((sum, stat) => sum + stat.commit_count, 0) || 0
    const lastCommitDate = last14DaysStats?.find(stat => stat.commit_count > 0)?.date || null

    // エンゲージメント状態を判定
    let status: 'active' | 'stagnant' | 'normal' = 'normal'
    let recommendedMessageType: string | null = null

    if (commits7Days > 10) {
      status = 'active'
      recommendedMessageType = 'active_encouragement'
    } else if (commits14Days === 0) {
      status = 'stagnant'
      recommendedMessageType = 'stagnant_reminder'
    }

    // user_engagement_statusテーブルを更新（テーブルが存在しない場合はスキップ）
    const { error: upsertError } = await supabaseAdmin
      .from('user_engagement_status')
      .upsert(
        {
          user_id: userId,
          status: status,
          commits_last_7days: commits7Days,
          commits_last_14days: commits14Days,
          last_commit_date: lastCommitDate,
          recommended_message_type: recommendedMessageType,
          updated_at: now.toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )

    if (upsertError) {
      // テーブルが存在しない場合はログを出力するだけでエラーにしない
      console.warn('Warning: Could not update engagement status (table may not exist yet):', upsertError.message)
      console.warn('Please run migration: /migrations/004_add_user_engagement_status.sql')
      // エラーがあってもstatusは返す
    }

    return status
  } catch (error) {
    console.error('Error in updateEngagementStatus:', error)
    return 'normal'
  }
}

// 単一ユーザーの統計を同期
async function syncUserStats(
  userId: string,
  githubUsername: string,
  providerToken: string
): Promise<{ success: boolean; daysSynced: number; error?: string }> {
  try {
    // GitHubイベントを取得（最大100件 = 1ページ、Vercel Hobby プラン対応）
    const allEvents: GitHubEvent[] = []

    for (let page = 1; page <= 1; page++) {
      const response = await fetch(
        `https://api.github.com/users/${githubUsername}/events?per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'UniPath-Dashboard'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, daysSynced: 0, error: 'GitHub user not found' }
        }
        if (response.status === 401) {
          return { success: false, daysSynced: 0, error: 'Invalid GitHub token' }
        }
        return { success: false, daysSynced: 0, error: `GitHub API error: ${response.status}` }
      }

      const events = await response.json()
      if (events.length === 0) break

      allEvents.push(...events)
    }

    // 日次統計を集計
    const dailyStatsMap = aggregateDailyStats(allEvents)

    // データベースに保存（upsert）
    let successCount = 0
    const supabaseAdmin = getSupabaseAdmin()
    for (const stats of dailyStatsMap.values()) {
      const { error } = await supabaseAdmin
        .from('github_daily_stats')
        .upsert(
          {
            user_id: userId,
            date: stats.date,
            commit_count: stats.commitCount,
            push_event_count: stats.pushEventCount,
            issue_count: stats.issueCount,
            pull_request_count: stats.pullRequestCount,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,date'
          }
        )

      if (!error) {
        successCount++
      } else {
        console.error(`Failed to upsert stats for ${githubUsername} on ${stats.date}:`, error)
      }
    }

    return { success: true, daysSynced: successCount }
  } catch (error) {
    console.error(`Error syncing stats for ${githubUsername}:`, error)
    return {
      success: false,
      daysSynced: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Sync Daily Stats API Called ===')

    // 認証チェック（Cronジョブからの呼び出しを想定）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized: Invalid auth header')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Auth check passed, initializing Supabase admin client...')
    const supabaseAdmin = getSupabaseAdmin()
    console.log('Supabase admin client initialized')

    // GitHubユーザー名とアクセストークンが設定されている全ユーザーを取得
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, github_username, github_access_token')
      .not('github_username', 'is', null)
      .not('github_access_token', 'is', null)

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: 'No users with GitHub username and access token found',
        results: []
      })
    }

    console.log(`Found ${profiles.length} users to sync`)

    // リポジトリ自動検出（リポジトリが未登録のユーザーのみ）
    console.log('[Repo Auto-Detect] Running repository auto-detection...')
    try {
      const repoDetectionResult = await detectRepositoriesForAllUsers()
      console.log(`[Repo Auto-Detect] Completed: ${repoDetectionResult.success} success, ${repoDetectionResult.failed} failed out of ${repoDetectionResult.processed} processed`)
    } catch (repoError) {
      console.warn('[Repo Auto-Detect] Failed:', repoError)
      // リポジトリ検出の失敗は全体の処理には影響させない
    }

    // タイムアウト対策: Hobby プラン (10秒制限) に対応
    // 各ユーザーの処理に約1秒かかるため、8ユーザー = 約8秒（余裕を持って10秒以内）
    const MAX_USERS_PER_RUN = 8

    // 既に処理済みのユーザーをスキップ（updated_atが最近のものを除外）
    // user_engagement_statusテーブルで最近更新されたユーザーをチェック
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: recentlyUpdated } = await supabaseAdmin
      .from('user_engagement_status')
      .select('user_id')
      .gte('updated_at', oneDayAgo.toISOString())

    const recentlyUpdatedIds = new Set(recentlyUpdated?.map(r => r.user_id) || [])

    // 未処理または更新が古いユーザーを優先
    const unprocessedProfiles = profiles.filter(p => !recentlyUpdatedIds.has(p.id))
    const profilesToProcess = unprocessedProfiles.length > 0 ? unprocessedProfiles : profiles
    const profilesToSync = profilesToProcess.slice(0, MAX_USERS_PER_RUN)

    if (profiles.length > MAX_USERS_PER_RUN) {
      console.log(`Processing ${profilesToSync.length} users (out of ${profiles.length} total)`)
      console.log(`Unprocessed users: ${unprocessedProfiles.length}`)
      if (unprocessedProfiles.length > MAX_USERS_PER_RUN) {
        console.log(`Note: Run this API again to process remaining ${unprocessedProfiles.length - MAX_USERS_PER_RUN} users`)
      }
    }

    // 各ユーザーの統計を同期
    const syncResults: SyncResult[] = []

    for (const profile of profilesToSync) {
      try {
        if (!profile.github_access_token) {
          syncResults.push({
            userId: profile.id,
            githubUsername: profile.github_username,
            success: false,
            daysSynced: 0,
            error: 'GitHub token not found in profile'
          })
          continue
        }

        // 統計を同期
        const result = await syncUserStats(
          profile.id,
          profile.github_username,
          profile.github_access_token
        )

        // 統計同期が成功した場合、エンゲージメント状態を更新（オプショナル）
        let engagementStatus: 'active' | 'stagnant' | 'normal' = 'normal'
        if (result.success) {
          try {
            engagementStatus = await updateEngagementStatus(profile.id)
          } catch (engagementError) {
            console.warn(`Failed to update engagement status for user ${profile.id}:`, engagementError)
            // エンゲージメント更新の失敗は全体の処理には影響させない
          }

          // AI分析とLINE通知を実行（非同期、エラーが発生しても処理は続行）
          try {
            await analyzeGitHubActivityAndNotify(profile.id)
          } catch (aiError) {
            console.warn(`Failed to run AI analysis for user ${profile.id}:`, aiError)
            // AI分析の失敗は全体の処理には影響させない
          }

          // 日次サマリー生成（非同期、エラーが発生しても処理は続行）
          try {
            const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
            await generateDailySummaryForUser(profile.id, today, profile.github_access_token)
          } catch (summaryError) {
            console.warn(`Failed to generate daily summary for user ${profile.id}:`, summaryError)
            // サマリー生成の失敗は全体の処理には影響させない
          }
        }

        syncResults.push({
          userId: profile.id,
          githubUsername: profile.github_username,
          ...result,
          engagementStatus
        })

        // Vercel Hobby プランの10秒制限対応のため、待機時間を削除
        // 5ユーザーのみ処理するため、GitHubのレート制限には引っかからない
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error)
        syncResults.push({
          userId: profile.id,
          githubUsername: profile.github_username,
          success: false,
          daysSynced: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // 結果のサマリーを作成
    const summary = {
      totalUsers: profiles.length,
      processedUsers: profilesToSync.length,
      skippedUsers: profiles.length - profilesToSync.length,
      successCount: syncResults.filter(r => r.success).length,
      failureCount: syncResults.filter(r => !r.success).length,
      totalDaysSynced: syncResults.reduce((sum, r) => sum + r.daysSynced, 0),
      timestamp: new Date().toISOString()
    }

    console.log('Sync completed:', summary)

    return NextResponse.json({
      summary,
      results: syncResults
    })
  } catch (error) {
    console.error('=== Sync batch job failed ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)

    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      {
        error: 'Sync batch job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
