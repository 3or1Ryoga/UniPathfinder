// ダッシュボードのデータ型定義

export interface WeeklySnapshot {
  currentWeekCommits: number
  previousWeekCommits: number
  streakDays: number
}

export interface WeeklyCommitData {
  weekStartDate: string // YYYY-MM-DD
  commitCount: number
}

export interface Badge {
  id: number
  name: string
  emoji: string
  threshold: number
  achievedAt: string | null // YYYY-MM-DD or null if not achieved
  concept: string
  chapter: string
}

export interface Milestones {
  totalCommits: number
  badges: Badge[]
}

export interface DashboardData {
  weeklySnapshot: WeeklySnapshot
  growthChart: WeeklyCommitData[]
  milestones: Milestones
}

export interface GitHubEvent {
  id: string
  type: string
  actor: {
    id: number
    login: string
    display_login: string
    gravatar_id: string
    url: string
    avatar_url: string
  }
  repo: {
    id: number
    name: string
    url: string
  }
  payload: {
    push_id?: number
    size?: number
    distinct_size?: number
    ref?: string
    head?: string
    before?: string
    commits?: Array<{
      sha: string
      author: {
        email: string
        name: string
      }
      message: string
      distinct: boolean
      url: string
    }>
    [key: string]: unknown
  }
  public: boolean
  created_at: string
}

export interface GitHubRateLimitResponse {
  resources: {
    core: {
      limit: number
      used: number
      remaining: number
      reset: number
    }
    [key: string]: {
      limit: number
      used: number
      remaining: number
      reset: number
    }
  }
  rate: {
    limit: number
    used: number
    remaining: number
    reset: number
  }
}
