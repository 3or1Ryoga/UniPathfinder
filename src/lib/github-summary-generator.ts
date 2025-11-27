/**
 * GitHub Summary Generator
 *
 * GitHubコミット分析結果をGPT-4oで処理し、
 * 技術的サマリーと活動説明を生成します。
 */

import OpenAI from 'openai'
import { AnalyzedCommit, CodeHighlight } from './github-commit-analyzer'

// OpenAI クライアント
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

// ========================================
// 型定義
// ========================================

export interface DailySummary {
  commitSummary: string       // 技術的サマリー（200文字程度）
  activityDescription: string // 何をしていたかの説明（100文字程度）
  codeHighlights: CodeHighlight[]
  filesChanged: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
  }>
}

// ========================================
// サマリー生成
// ========================================

/**
 * GPT-4oで日次開発サマリーを生成
 *
 * @param analyzedCommit 分析済みコミットデータ
 * @param date 対象日（表示用）
 */
export async function generateDailySummary(
  analyzedCommit: AnalyzedCommit,
  date: string
): Promise<DailySummary> {
  try {
    const openai = getOpenAIClient()

    // データがない場合
    if (analyzedCommit.relevantFiles === 0) {
      return {
        commitSummary: 'コミットはありませんでした',
        activityDescription: '開発活動なし',
        codeHighlights: [],
        filesChanged: []
      }
    }

    // プロンプト構築
    const systemPrompt = `あなたは、エンジニアの日々の開発活動を分析し、技術的なサマリーを生成する専門家です。

【役割】
- GitHubのコミット情報から、その日に「何をしたか」を簡潔に説明する
- 技術的な詳細を含めつつ、読みやすく理解しやすい文章にする
- 実装の本質を捉え、ノイズを排除する

【出力形式】
以下のJSON形式で回答してください：
{
  "commitSummary": "<技術的サマリー（200文字程度）>",
  "activityDescription": "<何をしていたかの説明（100文字程度）>"
}

【サマリーの方針】
- 技術的サマリー: 実装した機能、使用した技術、変更内容を具体的に記述
  例: "React ComponentにuseStateとuseEffectを追加し、ログイン機能を実装しました。TypeScriptのinterfaceを3つ定義し、型安全性を向上させました。"

- 活動説明: より簡潔に、その日の作業内容を要約
  例: "ユーザー認証機能の実装とUI改善"

【注意点】
- 過度に技術的すぎず、かつ曖昧すぎない適切なバランスを保つ
- コミットメッセージが明確な場合はそれを活用する
- ファイル数や行数は具体的に記載しない（冗長になるため）`

    // ユーザープロンプト構築
    let userPrompt = `【日付】
${date}

【コミットメッセージ】
${analyzedCommit.commitMessages.join('\n')}

【変更されたファイル】
${analyzedCommit.filesChanged.map(f => `- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})`).join('\n')}

【コードハイライト】
${analyzedCommit.codeHighlights.map(h => `- ${h.description} (${h.filename})`).join('\n')}

【統計】
- 変更ファイル数: ${analyzedCommit.relevantFiles}
- 追加行数: ${analyzedCommit.totalAdditions}
- 削除行数: ${analyzedCommit.totalDeletions}
`

    // GPT-4oで分析
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    })

    const resultText = response.choices[0]?.message?.content
    if (!resultText) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(resultText)

    return {
      commitSummary: result.commitSummary || '開発活動を行いました',
      activityDescription: result.activityDescription || '開発作業',
      codeHighlights: analyzedCommit.codeHighlights,
      filesChanged: analyzedCommit.filesChanged
    }
  } catch (error) {
    console.error('Error generating daily summary:', error)

    // エラー時のフォールバック
    return {
      commitSummary: `${analyzedCommit.relevantFiles}個のファイルを変更しました。`,
      activityDescription: '開発作業',
      codeHighlights: analyzedCommit.codeHighlights,
      filesChanged: analyzedCommit.filesChanged
    }
  }
}

/**
 * 週次成長レポートを生成
 *
 * @param dailySummaries 1週間分の日次サマリー
 * @param weekStart 週の開始日
 * @param weekEnd 週の終了日
 */
export async function generateWeeklySummary(
  dailySummaries: Array<{
    date: string
    commitSummary: string
    activityDescription: string
    commitCount: number
  }>,
  weekStart: string,
  weekEnd: string
): Promise<{
  growthSummary: string
  achievements: any
  technicalProgress: any
}> {
  try {
    const openai = getOpenAIClient()

    // データがない場合
    if (dailySummaries.length === 0) {
      return {
        growthSummary: '今週は開発活動がありませんでした',
        achievements: {},
        technicalProgress: {}
      }
    }

    const systemPrompt = `あなたは、エンジニアの週次成長を分析し、成長レポートを生成する専門家です。

【役割】
- 1週間分の開発活動から、技術的な成長と達成を分析する
- 単なる作業記録ではなく、「成長」の視点で評価する
- 励ましと具体的なフィードバックを含める

【出力形式】
以下のJSON形式で回答してください：
{
  "growthSummary": "<週次成長レポート（300文字程度）>",
  "achievements": {
    "mainAchievements": ["達成1", "達成2", "達成3"],
    "technicalSkills": ["習得した技術1", "習得した技術2"]
  },
  "technicalProgress": {
    "strongPoints": ["強み1", "強み2"],
    "growthAreas": ["成長ポイント1", "成長ポイント2"]
  }
}

【レポートの方針】
- 成長の視点: 「何ができるようになったか」「どう成長したか」に焦点
- 具体性: 抽象的な褒め言葉ではなく、具体的な技術や成果を指摘
- バランス: ポジティブな評価と、今後の成長ポイントの両方を含める
- トーン: 並走するパートナーとして、励ましと共感を含める`

    const userPrompt = `【期間】
${weekStart} 〜 ${weekEnd}

【日次サマリー】
${dailySummaries.map(d => `[${d.date}] ${d.commitCount}コミット
${d.commitSummary}
活動: ${d.activityDescription}
`).join('\n---\n')}

【統計】
- 合計コミット数: ${dailySummaries.reduce((sum, d) => sum + d.commitCount, 0)}
- 開発日数: ${dailySummaries.filter(d => d.commitCount > 0).length}/7日
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800
    })

    const resultText = response.choices[0]?.message?.content
    if (!resultText) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(resultText)

    return {
      growthSummary: result.growthSummary || '今週も開発を続けました',
      achievements: result.achievements || {},
      technicalProgress: result.technicalProgress || {}
    }
  } catch (error) {
    console.error('Error generating weekly summary:', error)

    return {
      growthSummary: '今週も着実に開発を続けました',
      achievements: {},
      technicalProgress: {}
    }
  }
}
