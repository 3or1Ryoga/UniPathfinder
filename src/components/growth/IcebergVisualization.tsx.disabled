'use client'

import { useEffect, useState, useRef } from 'react'

// ========================================
// 型定義
// ========================================

interface IcebergData {
  underwater: {
    totalCommits: number
    totalAdditions: number
    totalDeletions: number
    developmentDays: number
    recentCommits: number
    recentActiveDays: number
  }
  aboveWater: {
    publicBlogCount: number
  }
  techStack: Array<{
    name: string
    count: number
  }>
  metrics: {
    underwaterDepth: number // 0-100
    aboveWaterHeight: number // 0-100
  }
}

interface IcebergVisualizationProps {
  compact?: boolean // コンパクトモード（/homeで使用）
  showDetails?: boolean // 詳細表示（/growthで使用）
}

// ========================================
// カラーパレット
// ========================================

const COLORS = {
  // 深海グラデーション
  deepNavy: '#020617',
  darkNavy: '#0f172a',
  midNavy: '#1e293b',

  // 海面
  seaSurface: '#0ea5e9',
  seaFoam: '#38bdf8',

  // 氷山
  iceBase: '#e0f2fe',
  iceHighlight: '#ffffff',
  iceShadow: '#7dd3fc',

  // アクセント
  cyan: '#06b6d4',
  glow: '#22d3ee',

  // 技術タグ
  tagBg: 'rgba(224, 242, 254, 0.1)',
  tagBorder: 'rgba(224, 242, 254, 0.3)',
  tagText: '#e0f2fe'
}

// ========================================
// メインコンポーネント
// ========================================

export default function IcebergVisualization({
  compact = false
}: IcebergVisualizationProps) {
  const [data, setData] = useState<IcebergData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // ========================================
  // データ取得
  // ========================================

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/growth/iceberg-data')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch iceberg data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ========================================
  // スクロールエフェクト（パララックス）
  // ========================================

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const scrollProgress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight))
        setScrollY(scrollProgress)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初期値設定

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ========================================
  // ローディング状態
  // ========================================

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: compact ? '400px' : '600px',
        background: `linear-gradient(to bottom, ${COLORS.deepNavy}, ${COLORS.darkNavy})`,
        borderRadius: compact ? '16px' : '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.iceBase,
        fontSize: '14px'
      }}>
        <div style={{
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          氷山を描画中...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        width: '100%',
        height: compact ? '400px' : '600px',
        background: `linear-gradient(to bottom, ${COLORS.deepNavy}, ${COLORS.darkNavy})`,
        borderRadius: compact ? '16px' : '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.tagText,
        fontSize: '14px'
      }}>
        データが見つかりません
      </div>
    )
  }

  // ========================================
  // 氷山の形状計算
  // ========================================

  const containerHeight = compact ? 400 : 600
  const seaLevel = 0.25 // 海面の位置（上から25%）

  // 氷山の高さ（ブログ投稿数に応じて変動）
  const aboveWaterHeightPx = Math.max(40, data.metrics.aboveWaterHeight * 1.5)

  // 氷山の深さ（コミット数に応じて変動）
  const underwaterDepthPx = Math.max(200, data.metrics.underwaterDepth * 4)

  // 氷山の幅
  const icebergWidth = compact ? 200 : 280

  // ========================================
  // レンダリング
  // ========================================

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${containerHeight}px`,
        background: `linear-gradient(to bottom, ${COLORS.deepNavy} 0%, ${COLORS.darkNavy} ${seaLevel * 100}%, ${COLORS.midNavy} 100%)`,
        borderRadius: compact ? '16px' : '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* 海面 */}
      <div
        style={{
          position: 'absolute',
          top: `${seaLevel * 100}%`,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(to right, transparent, ${COLORS.seaSurface}, ${COLORS.seaFoam}, ${COLORS.seaSurface}, transparent)`,
          opacity: 0.6,
          boxShadow: `0 0 20px ${COLORS.seaFoam}`,
          transform: `translateY(${scrollY * -10}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      />

      {/* 氷山SVG */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${seaLevel * 100}%`,
          transform: `translateX(-50%) translateY(${scrollY * 20}px)`,
          transition: 'transform 0.1s ease-out',
          filter: 'drop-shadow(0 10px 40px rgba(6, 182, 212, 0.3))'
        }}
      >
        <svg
          width={icebergWidth}
          height={aboveWaterHeightPx + underwaterDepthPx}
          viewBox={`0 0 ${icebergWidth} ${aboveWaterHeightPx + underwaterDepthPx}`}
          style={{
            overflow: 'visible'
          }}
        >
          {/* 海面下（巨大な氷山の土台） */}
          <defs>
            {/* 氷のグラデーション */}
            <linearGradient id="iceGradientUnder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={COLORS.iceShadow} stopOpacity="0.6" />
              <stop offset="50%" stopColor={COLORS.iceShadow} stopOpacity="0.4" />
              <stop offset="100%" stopColor={COLORS.iceShadow} stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="iceGradientAbove" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={COLORS.iceHighlight} stopOpacity="1" />
              <stop offset="50%" stopColor={COLORS.iceBase} stopOpacity="0.95" />
              <stop offset="100%" stopColor={COLORS.iceShadow} stopOpacity="0.8" />
            </linearGradient>

            {/* 光の効果 */}
            <radialGradient id="glowEffect">
              <stop offset="0%" stopColor={COLORS.glow} stopOpacity="0.4" />
              <stop offset="100%" stopColor={COLORS.glow} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 海面下の氷山（巨大な土台） */}
          <path
            d={`
              M ${icebergWidth * 0.5} ${aboveWaterHeightPx}
              L ${icebergWidth * 0.2} ${aboveWaterHeightPx + underwaterDepthPx * 0.3}
              Q ${icebergWidth * 0.1} ${aboveWaterHeightPx + underwaterDepthPx * 0.5}, ${icebergWidth * 0.15} ${aboveWaterHeightPx + underwaterDepthPx * 0.7}
              L ${icebergWidth * 0.3} ${aboveWaterHeightPx + underwaterDepthPx}
              L ${icebergWidth * 0.7} ${aboveWaterHeightPx + underwaterDepthPx}
              L ${icebergWidth * 0.85} ${aboveWaterHeightPx + underwaterDepthPx * 0.7}
              Q ${icebergWidth * 0.9} ${aboveWaterHeightPx + underwaterDepthPx * 0.5}, ${icebergWidth * 0.8} ${aboveWaterHeightPx + underwaterDepthPx * 0.3}
              L ${icebergWidth * 0.5} ${aboveWaterHeightPx}
              Z
            `}
            fill="url(#iceGradientUnder)"
            stroke={COLORS.iceShadow}
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* 海面上の氷山（輝く一角） */}
          <path
            d={`
              M ${icebergWidth * 0.5} 0
              L ${icebergWidth * 0.35} ${aboveWaterHeightPx}
              L ${icebergWidth * 0.5} ${aboveWaterHeightPx}
              L ${icebergWidth * 0.65} ${aboveWaterHeightPx}
              L ${icebergWidth * 0.5} 0
              Z
            `}
            fill="url(#iceGradientAbove)"
            stroke={COLORS.iceHighlight}
            strokeWidth="2"
            strokeOpacity="0.6"
          />

          {/* 光の効果（頂上） */}
          <circle
            cx={icebergWidth * 0.5}
            cy={aboveWaterHeightPx * 0.3}
            r={60}
            fill="url(#glowEffect)"
          />
        </svg>
      </div>

      {/* 統計データ表示 */}
      {!compact && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            color: COLORS.tagText,
            fontSize: '12px',
            background: COLORS.tagBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.tagBorder}`,
            borderRadius: '12px',
            padding: '12px 16px',
            transform: `translateY(${scrollY * -15}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: COLORS.iceHighlight }}>
            海面下の努力
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>{data.underwater.totalCommits.toLocaleString()} コミット</div>
            <div>{data.underwater.totalAdditions.toLocaleString()} 行追加</div>
            <div>{data.underwater.developmentDays} 日間開発</div>
          </div>
        </div>
      )}

      {!compact && data.aboveWater.publicBlogCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            color: COLORS.tagText,
            fontSize: '12px',
            background: COLORS.tagBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.tagBorder}`,
            borderRadius: '12px',
            padding: '12px 16px',
            transform: `translateY(${scrollY * -15}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: COLORS.iceHighlight }}>
            海面上の成果
          </div>
          <div>{data.aboveWater.publicBlogCount} 件の公開記事</div>
        </div>
      )}

      {/* 技術スタック（氷山の周囲） */}
      {data.techStack.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: compact ? '24px' : '40px',
            left: '50%',
            transform: `translateX(-50%) translateY(${scrollY * 10}px)`,
            transition: 'transform 0.1s ease-out',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            maxWidth: '90%'
          }}
        >
          {data.techStack.slice(0, compact ? 6 : 12).map((tech, index) => (
            <div
              key={tech.name}
              style={{
                background: COLORS.tagBg,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${COLORS.tagBorder}`,
                borderRadius: '20px',
                padding: '6px 12px',
                color: COLORS.tagText,
                fontSize: compact ? '10px' : '11px',
                fontWeight: '500',
                boxShadow: `0 4px 12px rgba(6, 182, 212, 0.1)`,
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.tagBorder
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(6, 182, 212, 0.3)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.tagBg
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(6, 182, 212, 0.1)`
              }}
            >
              {tech.name}
            </div>
          ))}
        </div>
      )}

      {/* アニメーション用CSS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
