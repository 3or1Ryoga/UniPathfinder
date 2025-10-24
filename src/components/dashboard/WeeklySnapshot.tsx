'use client'

import { WeeklySnapshot as WeeklySnapshotType } from '@/types/dashboard'
import { WEEKLY_COMMIT_GOAL } from '@/constants/badges'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

interface WeeklySnapshotProps {
  data: WeeklySnapshotType
}

export default function WeeklySnapshot({ data }: WeeklySnapshotProps) {
  const { currentWeekCommits, previousWeekCommits, todayCommits, previousWeekDailyAverage, streakDays } = data

  // 週次目標に対する進捗率
  const progressPercentage = Math.min((currentWeekCommits / WEEKLY_COMMIT_GOAL) * 100, 100)

  // 今週のコミット数 vs 先週のコミット数（増減率）
  const weeklyChange = previousWeekCommits > 0
    ? ((currentWeekCommits - previousWeekCommits) / previousWeekCommits) * 100
    : currentWeekCommits > 0 ? 100 : 0

  const isPositiveChange = weeklyChange >= 0

  // RadialBarChart用のデータ
  const chartData = [
    {
      name: 'Progress',
      value: progressPercentage,
      fill: progressPercentage >= 100 ? '#10b981' : '#5ce1e6'
    }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">今週の活動</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左側：コミット数とプログレスリング */}
        <div className="flex flex-col items-center justify-center">
          {/* プログレスリング */}
          <div className="relative w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="100%"
                barSize={20}
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: '#f3f4f6' }}
                  dataKey="value"
                  cornerRadius={10}
                  fill={chartData[0].fill}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* 中央のコミット数表示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold text-gray-800">
                {currentWeekCommits}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                / {WEEKLY_COMMIT_GOAL} コミット
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {progressPercentage.toFixed(0)}% 達成
              </div>
            </div>
          </div>
        </div>

        {/* 右側：統計情報 */}
        <div className="flex flex-col justify-center space-y-6">
          {/* 今週のコミット vs 先週のコミット */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">今週の活動</div>
            <div className="flex items-baseline gap-3">
              <div className={`text-3xl font-bold ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveChange ? '+' : ''}{weeklyChange.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                vs 先週
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              今週: <span className="font-semibold">{currentWeekCommits}</span> コミット /
              先週: <span className="font-semibold">{previousWeekCommits}</span> コミット
            </div>
            <div className="mt-3">
              {isPositiveChange ? (
                <div className="flex items-center text-green-600 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  素晴らしい成長です！
                </div>
              ) : (
                <div className="flex items-center text-red-600 text-sm">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  もう少し頑張りましょう
                </div>
              )}
            </div>
          </div>

          {/* ストリーク */}
          {streakDays > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <div className="text-sm text-gray-600 mb-2">継続日数</div>
              <div className="flex items-center gap-3">
                <div className="text-5xl">🔥</div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {streakDays}日間
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    連続コミット中！
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                この調子でコミットを続けよう！
              </div>
            </div>
          )}

          {/* ストリークがない場合の励まし */}
          {streakDays === 0 && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="text-sm text-gray-600 mb-2">継続日数</div>
              <div className="flex items-center gap-3">
                <div className="text-5xl opacity-30">🔥</div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">
                    0日間
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    今日からストリートを始めよう！
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                小さな一歩が大きな成長につながります
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
