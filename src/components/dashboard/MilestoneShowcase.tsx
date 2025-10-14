'use client'

import { Milestones } from '@/types/dashboard'

interface MilestoneShowcaseProps {
  data: Milestones
}

export default function MilestoneShowcase({ data }: MilestoneShowcaseProps) {
  const { totalCommits, badges } = data

  // 達成済みのバッジを取得
  const achievedBadges = badges.filter(b => b.achievedAt !== null)

  // 最近達成したバッジ（上位3つ）
  const recentBadges = achievedBadges
    .sort((a, b) => {
      if (!a.achievedAt || !b.achievedAt) return 0
      return new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    })
    .slice(0, 3)

  // 次のバッジ
  const nextBadge = badges.find(b => b.achievedAt === null)

  // 進捗率の計算（次のバッジまで）
  const progressToNextBadge = nextBadge
    ? Math.min((totalCommits / nextBadge.threshold) * 100, 100)
    : 100

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">マイルストーン</h2>
        <div className="text-right">
          <div className="text-sm text-gray-600">総コミット数</div>
          <div className="text-3xl font-bold text-gray-800">{totalCommits}</div>
        </div>
      </div>

      {/* 最近達成したバッジ */}
      {recentBadges.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">最近の達成</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl">{badge.emoji}</div>
                  <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    {badge.achievedAt ? new Date(badge.achievedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
                <div className="font-bold text-gray-800 mb-1">{badge.name}</div>
                <div className="text-xs text-gray-600 mb-2">{badge.chapter}</div>
                <div className="text-sm text-gray-700 leading-relaxed">{badge.concept}</div>
                <div className="mt-3 text-xs text-gray-500">
                  {badge.threshold} コミット達成
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-blue-50 rounded-xl p-8 text-center border border-blue-200">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">最初のマイルストーンを目指そう！</h3>
          <p className="text-gray-600">
            コミットを重ねて、最初のバッジを獲得しましょう
          </p>
        </div>
      )}

      {/* 次のバッジへの進捗 */}
      {nextBadge && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">次の目標</h3>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{nextBadge.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-lg">{nextBadge.name}</div>
                <div className="text-sm text-gray-600 mt-1">{nextBadge.concept}</div>
              </div>
            </div>

            {/* プログレスバー */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{totalCommits} / {nextBadge.threshold} コミット</span>
                <span>{progressToNextBadge.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNextBadge}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                あと {nextBadge.threshold - totalCommits} コミットで達成！
              </div>
            </div>
          </div>
        </div>
      )}

      {/* すべてのバッジを見るリンク */}
      <div className="text-center">
        <button
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 mx-auto group"
          onClick={() => {
            // 今後、モーダルやページ遷移を実装
            alert('全バッジ一覧機能は準備中です')
          }}
        >
          <span>すべてのバッジを見る</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* バッジ達成率 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">達成率</div>
            <div className="text-2xl font-bold text-gray-800">
              {achievedBadges.length} / {badges.length} バッジ
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {((achievedBadges.length / badges.length) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
