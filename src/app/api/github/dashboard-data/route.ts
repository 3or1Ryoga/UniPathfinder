import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { DashboardData, WeeklyCommitData, Badge } from '@/types/dashboard'
import { BADGE_DEFINITIONS } from '@/constants/badges'

interface DailyStatsRow {
  date: string
  commit_count: number
  push_event_count: number
  issue_count: number
  pull_request_count: number
}

/**
 * GitHub Activity Dashboard Data APIエンドポイント
 * キャッシュされたGitHubアクティビティデータを集計し、ダッシュボード表示用のデータを返す
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 認証チェック
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

    // 2. ユーザーのGitHubユーザー名を確認
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_username')
      .eq('id', session.user.id)
      .single()

    if (!profile?.github_username) {
      return NextResponse.json(
        { error: 'GitHub username not found in profile. Please update your profile.' },
        { status: 400 }
      )
    }

    // 3. キャッシュされた統計データを取得（過去90日分）
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const startDate = ninetyDaysAgo.toISOString().split('T')[0]

    const { data: dailyStats, error: statsError } = await supabase
      .from('github_daily_stats')
      .select('date, commit_count, push_event_count, issue_count, pull_request_count')
      .eq('user_id', session.user.id)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (statsError) {
      console.error('Failed to fetch daily stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch cached data. Please try again later.' },
        { status: 500 }
      )
    }

    // データがない場合は空のダッシュボードデータを返す
    if (!dailyStats || dailyStats.length === 0) {
      return NextResponse.json({
        weeklySnapshot: {
          currentWeekCommits: 0,
          previousWeekCommits: 0,
          streakDays: 0
        },
        growthChart: generateEmptyGrowthChart(),
        milestones: {
          totalCommits: 0,
          badges: BADGE_DEFINITIONS.map(badge => ({ ...badge, achievedAt: null }))
        }
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300',
        }
      })
    }

    // 4. データ集計
    const dashboardData = aggregateDashboardDataFromCache(dailyStats as DailyStatsRow[])

    // 5. レスポンスにキャッシュヘッダーを追加（5分間キャッシュ）
    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 空の成長チャートを生成
 */
function generateEmptyGrowthChart(): WeeklyCommitData[] {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const nowJST = new Date(now.getTime() + jstOffset)

  const dayOfWeek = nowJST.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const thisWeekStart = new Date(nowJST)
  thisWeekStart.setDate(nowJST.getDate() - daysFromMonday)
  thisWeekStart.setHours(0, 0, 0, 0)

  const weeks: WeeklyCommitData[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(thisWeekStart.getDate() - (i * 7))
    weeks.push({
      weekStartDate: weekStart.toISOString().split('T')[0],
      commitCount: 0
    })
  }
  return weeks
}

/**
 * キャッシュデータからダッシュボードデータに変換
 */
function aggregateDashboardDataFromCache(dailyStats: DailyStatsRow[]): DashboardData {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000 // JST = UTC+9
  const nowJST = new Date(now.getTime() + jstOffset)

  // コミット数を日付ごとにマップ化
  const commitsByDate = new Map<string, number>()
  let totalCommits = 0

  dailyStats.forEach(stat => {
    commitsByDate.set(stat.date, stat.commit_count)
    totalCommits += stat.commit_count
  })

  // 週次スナップショットを計算
  const weeklySnapshot = calculateWeeklySnapshot(commitsByDate, nowJST)

  // 成長チャートデータを生成（過去8週間）
  const growthChart = calculateGrowthChart(commitsByDate, nowJST)

  // マイルストーンとバッジを計算
  const milestones = calculateMilestones(totalCommits, commitsByDate)

  return {
    weeklySnapshot,
    growthChart,
    milestones
  }
}

/**
 * 週次スナップショットを計算
 */
function calculateWeeklySnapshot(
  commitsByDate: Map<string, number>,
  nowJST: Date
) {
  // 今週の開始日（月曜日）を計算
  const dayOfWeek = nowJST.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 日曜日は6日前、それ以外は dayOfWeek - 1
  const thisWeekStart = new Date(nowJST)
  thisWeekStart.setDate(nowJST.getDate() - daysFromMonday)
  thisWeekStart.setHours(0, 0, 0, 0)

  // 先週の開始日
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  // 今週のコミット数
  let currentWeekCommits = 0
  for (let d = new Date(thisWeekStart); d <= nowJST; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    currentWeekCommits += commitsByDate.get(dateKey) || 0
  }

  // 先週のコミット数
  let previousWeekCommits = 0
  for (let d = new Date(lastWeekStart); d < thisWeekStart; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    previousWeekCommits += commitsByDate.get(dateKey) || 0
  }

  // ストリーク計算（今日から遡って、コミットがあった連続日数）
  let streakDays = 0
  const today = nowJST.toISOString().split('T')[0]

  // 今日のコミットがあれば、昨日から遡ってストリークを計算
  if (commitsByDate.get(today)) {
    streakDays = 1
    const checkDate = new Date(nowJST)
    checkDate.setDate(checkDate.getDate() - 1)

    while (checkDate >= new Date(nowJST.getTime() - 365 * 24 * 60 * 60 * 1000)) {
      const dateKey = checkDate.toISOString().split('T')[0]
      if (commitsByDate.get(dateKey)) {
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  return {
    currentWeekCommits,
    previousWeekCommits,
    streakDays
  }
}

/**
 * 成長チャートデータを生成（過去8週間）
 */
function calculateGrowthChart(
  commitsByDate: Map<string, number>,
  nowJST: Date
): WeeklyCommitData[] {
  const weeks: WeeklyCommitData[] = []

  // 今週の開始日（月曜日）を計算
  const dayOfWeek = nowJST.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const thisWeekStart = new Date(nowJST)
  thisWeekStart.setDate(nowJST.getDate() - daysFromMonday)
  thisWeekStart.setHours(0, 0, 0, 0)

  // 過去8週間分のデータを生成
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(thisWeekStart.getDate() - (i * 7))

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    let commitCount = 0
    for (let d = new Date(weekStart); d < weekEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      commitCount += commitsByDate.get(dateKey) || 0
    }

    weeks.push({
      weekStartDate: weekStart.toISOString().split('T')[0],
      commitCount
    })
  }

  return weeks
}

/**
 * マイルストーンとバッジを計算
 */
function calculateMilestones(
  totalCommits: number,
  commitsByDate: Map<string, number>
) {
  const badges: Badge[] = BADGE_DEFINITIONS.map(badgeDef => {
    // バッジが達成されているかチェック
    if (totalCommits >= badgeDef.threshold) {
      // 達成日を推定（コミット数が閾値を超えた最初の日）
      const sortedDates = Array.from(commitsByDate.keys()).sort()
      let cumulativeCommits = 0
      let achievedDate: string | null = null

      for (const date of sortedDates) {
        cumulativeCommits += commitsByDate.get(date) || 0
        if (cumulativeCommits >= badgeDef.threshold) {
          achievedDate = date
          break
        }
      }

      return {
        ...badgeDef,
        achievedAt: achievedDate || sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0]
      }
    }

    return {
      ...badgeDef,
      achievedAt: null
    }
  })

  return {
    totalCommits,
    badges
  }
}
