import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// 単一ユーザーの統計を同期
async function syncUserStats(
  userId: string,
  githubUsername: string,
  providerToken: string
): Promise<{ success: boolean; daysSynced: number; error?: string }> {
  try {
    // GitHubイベントを取得（最大300件 = 3ページ）
    const allEvents: GitHubEvent[] = []

    for (let page = 1; page <= 3; page++) {
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

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

    // 各ユーザーの統計を同期
    const syncResults: SyncResult[] = []

    for (const profile of profiles) {
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

        syncResults.push({
          userId: profile.id,
          githubUsername: profile.github_username,
          ...result
        })

        // レート制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 500))
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
    console.error('Sync batch job failed:', error)
    return NextResponse.json(
      {
        error: 'Sync batch job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
