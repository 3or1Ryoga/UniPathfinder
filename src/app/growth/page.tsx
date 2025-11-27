'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import IcebergVisualization from '@/components/growth/IcebergVisualization'

// ========================================
// 型定義
// ========================================

interface DailyStat {
  date: string
  commit_count: number
  lines_added: number
  lines_deleted: number
  commit_summary: string | null
  activity_description: string | null
}

// ========================================
// カラーパレット（氷山と同じテーマ）
// ========================================

const COLORS = {
  deepNavy: '#020617',
  darkNavy: '#0f172a',
  midNavy: '#1e293b',
  slate: '#334155',
  iceBase: '#e0f2fe',
  iceHighlight: '#ffffff',
  cyan: '#06b6d4',
  tagBg: 'rgba(224, 242, 254, 0.1)',
  tagBorder: 'rgba(224, 242, 254, 0.3)',
  tagText: '#e0f2fe'
}

// ========================================
// メインコンポーネント
// ========================================

export default function GrowthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])

  // ========================================
  // 認証確認とデータ取得
  // ========================================

  useEffect(() => {
    async function init() {
      // 認証確認
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // 過去30日のデータ取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: stats, error } = await supabase
        .from('github_daily_stats')
        .select('date, commit_count, files_changed, commit_summary, activity_description')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching daily stats:', error)
      } else {
        // files_changedから行数を集計
        const statsWithLines = stats?.map(day => {
          let lines_added = 0
          let lines_deleted = 0

          if (day.files_changed && Array.isArray(day.files_changed)) {
            day.files_changed.forEach((file: { additions?: number; deletions?: number }) => {
              lines_added += file.additions || 0
              lines_deleted += file.deletions || 0
            })
          }

          return {
            ...day,
            lines_added,
            lines_deleted
          }
        }) || []

        setDailyStats(statsWithLines)
      }

      setLoading(false)
    }

    init()
  }, [router, supabase])

  // ========================================
  // ローディング状態
  // ========================================

  if (loading) {
    return (
      <MainLayout>
        <div style={{
          minHeight: '100vh',
          background: COLORS.deepNavy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.tagText
        }}>
          <div>読み込み中...</div>
        </div>
      </MainLayout>
    )
  }

  // ========================================
  // 統計計算
  // ========================================

  const totalCommits = dailyStats.reduce((sum, day) => sum + (day.commit_count || 0), 0)
  const totalAdditions = dailyStats.reduce((sum, day) => sum + (day.lines_added || 0), 0)
  const activeDays = dailyStats.filter(day => day.commit_count > 0).length
  const maxCommitsInDay = Math.max(...dailyStats.map(day => day.commit_count || 0), 1)

  // ========================================
  // レンダリング
  // ========================================

  return (
    <MainLayout>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(to bottom, ${COLORS.deepNavy}, ${COLORS.darkNavy})`,
        padding: '24px 16px',
        paddingBottom: '100px'
      }}>
        {/* ヘッダー */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 32px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: COLORS.iceHighlight,
            marginBottom: '12px',
            textShadow: `0 0 20px ${COLORS.cyan}`
          }}>
            🧊 成長の軌跡
          </h1>
          <p style={{
            fontSize: '14px',
            color: COLORS.tagText,
            opacity: 0.8
          }}>
            あなたの努力は、海面下に広がる氷山のように
          </p>
        </div>

        {/* 氷山ビジュアライゼーション */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 48px'
        }}>
          <IcebergVisualization showDetails={true} />
        </div>

        {/* 統計サマリー */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px'
        }}>
          <StatCard
            label="過去30日のコミット"
            value={totalCommits.toLocaleString()}
            icon="📊"
          />
          <StatCard
            label="追加した行数"
            value={totalAdditions.toLocaleString()}
            icon="✨"
          />
          <StatCard
            label="アクティブ日数"
            value={`${activeDays}日`}
            icon="🔥"
          />
        </div>

        {/* 日々のアクティビティ */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: COLORS.iceHighlight,
            marginBottom: '20px'
          }}>
            日々の開発アクティビティ
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {dailyStats.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                maxCommits={maxCommitsInDay}
              />
            ))}

            {dailyStats.length === 0 && (
              <div style={{
                background: COLORS.tagBg,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${COLORS.tagBorder}`,
                borderRadius: '16px',
                padding: '40px 24px',
                textAlign: 'center',
                color: COLORS.tagText,
                opacity: 0.6
              }}>
                過去30日間のデータがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

// ========================================
// サブコンポーネント：統計カード
// ========================================

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      background: COLORS.tagBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${COLORS.tagBorder}`,
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(6, 182, 212, 0.2)`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      <div style={{
        fontSize: '32px',
        marginBottom: '8px'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: COLORS.iceHighlight,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '11px',
        color: COLORS.tagText,
        opacity: 0.7
      }}>
        {label}
      </div>
    </div>
  )
}

// ========================================
// サブコンポーネント：日次カード
// ========================================

function DayCard({ day, maxCommits }: { day: DailyStat; maxCommits: number }) {
  const commitPercentage = (day.commit_count / maxCommits) * 100
  const hasActivity = day.commit_count > 0

  return (
    <div style={{
      background: hasActivity ? COLORS.tagBg : 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${hasActivity ? COLORS.tagBorder : 'rgba(51, 65, 85, 0.3)'}`,
      borderRadius: '12px',
      padding: '16px',
      transition: 'all 0.3s ease',
      cursor: hasActivity ? 'pointer' : 'default',
      opacity: hasActivity ? 1 : 0.5
    }}
    onMouseEnter={(e) => {
      if (hasActivity) {
        e.currentTarget.style.transform = 'translateX(4px)'
        e.currentTarget.style.borderColor = COLORS.cyan
      }
    }}
    onMouseLeave={(e) => {
      if (hasActivity) {
        e.currentTarget.style.transform = 'translateX(0)'
        e.currentTarget.style.borderColor = COLORS.tagBorder
      }
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: COLORS.iceHighlight
        }}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
          })}
        </div>
        <div style={{
          fontSize: '12px',
          color: COLORS.tagText,
          opacity: 0.8
        }}>
          {day.commit_count} コミット
        </div>
      </div>

      {/* コミットバー */}
      {hasActivity && (
        <div style={{
          width: '100%',
          height: '4px',
          background: COLORS.slate,
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            width: `${commitPercentage}%`,
            height: '100%',
            background: `linear-gradient(to right, ${COLORS.cyan}, ${COLORS.iceBase})`,
            transition: 'width 0.5s ease'
          }} />
        </div>
      )}

      {/* AIサマリー */}
      {day.activity_description && (
        <div style={{
          fontSize: '12px',
          color: COLORS.tagText,
          lineHeight: '1.6',
          marginBottom: '8px'
        }}>
          {day.activity_description}
        </div>
      )}

      {/* コード統計 */}
      {hasActivity && (day.lines_added > 0 || day.lines_deleted > 0) && (
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          color: COLORS.tagText,
          opacity: 0.6
        }}>
          <span>+{day.lines_added.toLocaleString()}</span>
          <span>-{day.lines_deleted.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
