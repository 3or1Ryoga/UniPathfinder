'use client'

import { useState } from 'react'
import { WeeklyCommitData } from '@/types/dashboard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PersonalGrowthChartProps {
  data: WeeklyCommitData[]
}

export default function PersonalGrowthChart({ data }: PersonalGrowthChartProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'language' | 'repository'>('weekly')

  // 週のラベルをフォーマット（MM/DD形式）
  const formattedData = data.map((item, index) => {
    const date = new Date(item.weekStartDate)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    return {
      ...item,
      label,
      isLatest: index === data.length - 1
    }
  })

  // 最大値を取得してY軸の範囲を設定
  const maxCommits = Math.max(...data.map(d => d.commitCount), 10)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">成長の軌跡</h2>

        {/* タブ */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            週別コミット
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'language'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled
          >
            言語別
            <span className="ml-1 text-xs">(準備中)</span>
          </button>
          <button
            onClick={() => setActiveTab('repository')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'repository'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled
          >
            リポジトリ別
            <span className="ml-1 text-xs">(準備中)</span>
          </button>
        </div>
      </div>

      {/* グラフ */}
      {activeTab === 'weekly' && (
        <div className="mt-8">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ce1e6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4dd4d9" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="colorCommitLatest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                domain={[0, maxCommits + 5]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value} コミット`, '週次コミット数']}
              />
              <Bar
                dataKey="commitCount"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isLatest ? 'url(#colorCommitLatest)' : 'url(#colorCommit)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* グラフの説明 */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #5ce1e6, #4dd4d9)' }} />
              <span className="text-gray-600">過去の週</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #10b981, #059669)' }} />
              <span className="text-gray-600">今週</span>
            </div>
          </div>

          {/* 統計サマリー */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">平均 (週)</div>
              <div className="text-2xl font-bold text-gray-800">
                {(data.reduce((sum, d) => sum + d.commitCount, 0) / data.length).toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">最高記録</div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.max(...data.map(d => d.commitCount))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">合計 (8週間)</div>
              <div className="text-2xl font-bold text-gray-800">
                {data.reduce((sum, d) => sum + d.commitCount, 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 言語別・リポジトリ別は準備中メッセージ */}
      {(activeTab === 'language' || activeTab === 'repository') && (
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-24 h-24 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-lg font-medium">この機能は準備中です</p>
          <p className="text-sm mt-2">近日公開予定です。お楽しみに！</p>
        </div>
      )}
    </div>
  )
}
