/**
 * AI Mentor - コアロジック
 *
 * ユーザーのテックブログ投稿とGitHub活動を分析し、
 * 成長をスコアリングしてLINEでフィードバックを送る機能
 */

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { sendLinePushMessage } from './line-push-message'

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

// Supabase Admin クライアント
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

// ========================================
// 型定義
// ========================================

interface BlogPost {
  id: string
  title: string
  content: string
  topic: string
  created_at: string
  embedding?: number[]
}

interface GitHubStats {
  commits7Days: number
  commits14Days: number
  lastCommitDate: string | null
}

interface AnalysisResult {
  growthScore: number // 0-100
  analysisSummary: string
  lineMessage: string
  similarityWithPrevious?: number // 0-1
  growthInsight?: string
}

interface NotificationCheck {
  canSend: boolean
  lastSentAt?: string
}

// ========================================
// 1. Embedding生成機能
// ========================================

/**
 * ブログ記事のEmbeddingを生成
 *
 * @param title - 記事タイトル
 * @param content - 記事本文
 * @returns Embeddingベクトル (1536次元)
 */
export async function generateEmbedding(
  title: string,
  content: string
): Promise<number[]> {
  try {
    const openai = getOpenAIClient()

    // タイトルと本文を結合
    const text = `${title}\n\n${content}`

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * ブログ投稿のEmbeddingを保存
 *
 * @param postId - 投稿ID
 * @param embedding - Embeddingベクトル
 */
export async function saveEmbedding(
  postId: string,
  embedding: number[]
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('tech_blog_posts')
      .update({ embedding })
      .eq('id', postId)

    if (error) {
      console.error('Error saving embedding:', error)
      throw error
    }
  } catch (error) {
    console.error('Exception while saving embedding:', error)
    throw error
  }
}

// ========================================
// 2. 過去投稿との類似度計算
// ========================================

/**
 * コサイン類似度を計算
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    mag1 += vec1[i] * vec1[i]
    mag2 += vec2[i] * vec2[i]
  }

  mag1 = Math.sqrt(mag1)
  mag2 = Math.sqrt(mag2)

  if (mag1 === 0 || mag2 === 0) {
    return 0
  }

  return dotProduct / (mag1 * mag2)
}

/**
 * 過去の投稿との類似度を分析
 *
 * @param userId - ユーザーID
 * @param currentEmbedding - 現在の投稿のEmbedding
 * @param currentPostId - 現在の投稿ID（除外用）
 * @returns 最も類似した投稿との類似度とその投稿情報
 */
export async function analyzeSimilarityWithPreviousPosts(
  userId: string,
  currentEmbedding: number[],
  currentPostId: string
): Promise<{
  maxSimilarity: number
  similarPost?: BlogPost
  averageSimilarity: number
  totalPosts: number
}> {
  try {
    const supabase = getSupabaseAdmin()

    // ユーザーの過去の投稿を取得（Embeddingがあるもののみ）
    const { data: previousPosts, error } = await supabase
      .from('tech_blog_posts')
      .select('id, title, content, topic, created_at, embedding')
      .eq('user_id', userId)
      .neq('id', currentPostId)
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10) // 直近10件まで

    if (error) {
      console.error('Error fetching previous posts:', error)
      return {
        maxSimilarity: 0,
        averageSimilarity: 0,
        totalPosts: 0
      }
    }

    if (!previousPosts || previousPosts.length === 0) {
      return {
        maxSimilarity: 0,
        averageSimilarity: 0,
        totalPosts: 0
      }
    }

    // 類似度を計算
    const similarities: { similarity: number; post: BlogPost }[] = []

    for (const post of previousPosts) {
      if (post.embedding && Array.isArray(post.embedding)) {
        const similarity = cosineSimilarity(currentEmbedding, post.embedding)
        similarities.push({ similarity, post })
      }
    }

    if (similarities.length === 0) {
      return {
        maxSimilarity: 0,
        averageSimilarity: 0,
        totalPosts: 0
      }
    }

    // 最大類似度と平均類似度を計算
    const maxSimilarityObj = similarities.reduce((max, current) =>
      current.similarity > max.similarity ? current : max
    )
    const averageSimilarity =
      similarities.reduce((sum, item) => sum + item.similarity, 0) /
      similarities.length

    return {
      maxSimilarity: maxSimilarityObj.similarity,
      similarPost: maxSimilarityObj.post,
      averageSimilarity,
      totalPosts: similarities.length
    }
  } catch (error) {
    console.error('Error analyzing similarity:', error)
    return {
      maxSimilarity: 0,
      averageSimilarity: 0,
      totalPosts: 0
    }
  }
}

// ========================================
// 3. GitHub統計の取得
// ========================================

/**
 * ユーザーのGitHub活動統計を取得
 *
 * @param userId - ユーザーID
 * @returns GitHub統計
 */
export async function getGitHubStats(userId: string): Promise<GitHubStats> {
  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()

    // 過去7日間
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 過去14日間
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // 過去7日間のコミット数
    const { data: stats7Days } = await supabase
      .from('github_daily_stats')
      .select('commit_count')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0])

    const commits7Days = stats7Days?.reduce((sum, stat) => sum + stat.commit_count, 0) || 0

    // 過去14日間のコミット数
    const { data: stats14Days } = await supabase
      .from('github_daily_stats')
      .select('commit_count, date')
      .eq('user_id', userId)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0])
      .order('date', { ascending: false })

    const commits14Days = stats14Days?.reduce((sum, stat) => sum + stat.commit_count, 0) || 0
    const lastCommitDate = stats14Days?.find(stat => stat.commit_count > 0)?.date || null

    return {
      commits7Days,
      commits14Days,
      lastCommitDate
    }
  } catch (error) {
    console.error('Error fetching GitHub stats:', error)
    return {
      commits7Days: 0,
      commits14Days: 0,
      lastCommitDate: null
    }
  }
}

// ========================================
// 4. AI分析とメッセージ生成（GPT-4o）
// ========================================

/**
 * ユーザーの成長を分析してメッセージを生成
 *
 * @param userId - ユーザーID
 * @param blogPost - ブログ投稿
 * @param githubStats - GitHub統計
 * @param similarityAnalysis - 類似度分析結果
 * @returns 分析結果
 */
export async function analyzeGrowthAndGenerateMessage(
  userId: string,
  blogPost: BlogPost,
  githubStats: GitHubStats,
  similarityAnalysis?: {
    maxSimilarity: number
    similarPost?: BlogPost
    averageSimilarity: number
    totalPosts: number
  }
): Promise<AnalysisResult> {
  try {
    const openai = getOpenAIClient()

    // プロンプトを構築
    const systemPrompt = `あなたは、エンジニアの成長を支援する「並走するパートナー」です。

【役割】
- 上から目線の教師ではなく、一緒に頑張る同僚のような存在
- ユーザーの内省の深さと継続力を評価し、成長をサポート
- 丁寧で落ち着いたトーンで、共感と励ましを届ける

【評価軸】
1. 内省の深さ: ブログ記事の内容から、技術的な考察、振り返り、学びの質を評価
2. 継続力: GitHubのコミット活動から、学習・開発の継続性を評価

【出力形式】
以下のJSON形式で回答してください：
{
  "growthScore": <0-100の整数>,
  "analysisSummary": "<分析の要約（200文字以内）>",
  "lineMessage": "<LINEで送るメッセージ（100文字程度）>",
  "growthInsight": "<前回の投稿と比較した成長の気づき（あれば）>"
}

【メッセージトーン】
- 「今日も投稿ありがとう。その考察は深いですね。一緒に成長していきましょう」
- 「その視点は素晴らしいです。内省が丁寧で、学びへの姿勢が伝わります」
- 「コミットが続いていますね。着実な積み重ねが成長につながります」
- 「最近、活動が止まっているようですね。無理せず、できる範囲で続けていきましょう」`

    // ユーザーデータを整理
    let userPrompt = `【ブログ記事】
トピック: ${blogPost.topic}
タイトル: ${blogPost.title}
内容:
${blogPost.content}

【GitHub活動】
- 過去7日間のコミット数: ${githubStats.commits7Days}
- 過去14日間のコミット数: ${githubStats.commits14Days}
- 最終コミット日: ${githubStats.lastCommitDate || '不明'}
`

    // 類似度分析結果がある場合は追加
    if (similarityAnalysis && similarityAnalysis.totalPosts > 0) {
      userPrompt += `
【過去の投稿との比較】
- 過去の投稿数: ${similarityAnalysis.totalPosts}
- 最も類似した投稿との類似度: ${(similarityAnalysis.maxSimilarity * 100).toFixed(1)}%
- 平均類似度: ${(similarityAnalysis.averageSimilarity * 100).toFixed(1)}%
${
  similarityAnalysis.similarPost
    ? `- 類似投稿のタイトル: ${similarityAnalysis.similarPost.title}`
    : ''
}

類似度が低い（<30%）場合は新しいテーマへの挑戦、高い（>70%）場合は同じテーマの深掘りと解釈してください。
`
    }

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
      growthScore: Math.min(100, Math.max(0, result.growthScore || 50)),
      analysisSummary: result.analysisSummary || 'AI分析を実行しました',
      lineMessage: result.lineMessage || '今日も投稿ありがとう。一緒に成長していきましょう。',
      similarityWithPrevious: similarityAnalysis?.maxSimilarity,
      growthInsight: result.growthInsight
    }
  } catch (error) {
    console.error('Error in AI analysis:', error)

    // エラー時のフォールバック
    return {
      growthScore: 50,
      analysisSummary: 'AI分析でエラーが発生しましたが、投稿を確認しました。',
      lineMessage: '投稿ありがとうございます。技術的な考察を続けていきましょう。'
    }
  }
}

// ========================================
// 5. 通知頻度制限チェック
// ========================================

/**
 * 1日1回の通知制限をチェック
 *
 * @param userId - ユーザーID
 * @param notificationType - 通知タイプ ('blog_post' or 'github_sync')
 * @returns 送信可否
 */
export async function checkNotificationLimit(
  userId: string,
  notificationType: 'blog_post' | 'github_sync'
): Promise<NotificationCheck> {
  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 今日既に同じタイプの通知を送ったかチェック（notification_dateカラムを使用）
    const { data, error } = await supabase
      .from('ai_mentor_notifications')
      .select('created_at')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .eq('notification_date', today)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error checking notification limit:', error)
      // エラー時は送信を許可（安全側に倒す）
      return { canSend: true }
    }

    if (data && data.length > 0) {
      return {
        canSend: false,
        lastSentAt: data[0].created_at
      }
    }

    return { canSend: true }
  } catch (error) {
    console.error('Exception while checking notification limit:', error)
    return { canSend: true }
  }
}

// ========================================
// 6. 通知の保存
// ========================================

/**
 * 通知をデータベースに保存
 *
 * @param params - 通知パラメータ
 * @returns 通知ID
 */
export async function saveNotification(params: {
  userId: string
  notificationType: 'blog_post' | 'github_sync'
  message: string
  growthScore: number
  analysisSummary: string
  sentSuccessfully: boolean
  errorMessage?: string
}): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('ai_mentor_notifications')
      .insert({
        user_id: params.userId,
        notification_type: params.notificationType,
        message: params.message,
        growth_score: params.growthScore,
        analysis_summary: params.analysisSummary,
        sent_successfully: params.sentSuccessfully,
        error_message: params.errorMessage || null,
        sent_at: params.sentSuccessfully ? new Date().toISOString() : null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving notification:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Exception while saving notification:', error)
    return null
  }
}

// ========================================
// 7. メイン処理: ブログ投稿分析
// ========================================

/**
 * ブログ投稿を分析してLINE通知を送る
 *
 * @param userId - ユーザーID
 * @param postId - 投稿ID
 */
export async function analyzeBlogPostAndNotify(
  userId: string,
  postId: string
): Promise<void> {
  try {
    console.log(`[AI Mentor] Analyzing blog post for user ${userId}, post ${postId}`)

    // 1. 通知制限チェック
    const limitCheck = await checkNotificationLimit(userId, 'blog_post')
    if (!limitCheck.canSend) {
      console.log('[AI Mentor] Daily notification limit reached, skipping')
      return
    }

    const supabase = getSupabaseAdmin()

    // 2. 投稿データとユーザーのLINE情報を取得
    const { data: post, error: postError } = await supabase
      .from('tech_blog_posts')
      .select('id, title, content, topic, created_at')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      console.error('[AI Mentor] Post not found:', postError)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('line_user_id, line_friend_added')
      .eq('id', userId)
      .single()

    if (profileError || !profile || !profile.line_user_id || !profile.line_friend_added) {
      console.log('[AI Mentor] User has not added LINE friend, skipping notification')
      return
    }

    // 3. Embedding生成
    const embedding = await generateEmbedding(post.title, post.content)
    await saveEmbedding(postId, embedding)

    // 4. 過去投稿との類似度分析
    const similarityAnalysis = await analyzeSimilarityWithPreviousPosts(
      userId,
      embedding,
      postId
    )

    // 5. GitHub統計取得
    const githubStats = await getGitHubStats(userId)

    // 6. AI分析
    const analysis = await analyzeGrowthAndGenerateMessage(
      userId,
      post,
      githubStats,
      similarityAnalysis
    )

    // 7. LINE通知送信
    const lineResult = await sendLinePushMessage({
      userId,
      lineUserId: profile.line_user_id,
      message: analysis.lineMessage
    })

    // 8. 通知を保存
    await saveNotification({
      userId,
      notificationType: 'blog_post',
      message: analysis.lineMessage,
      growthScore: analysis.growthScore,
      analysisSummary: analysis.analysisSummary,
      sentSuccessfully: lineResult.success,
      errorMessage: lineResult.errorMessage
    })

    // 9. user_engagement_statusを更新
    await supabase
      .from('user_engagement_status')
      .upsert(
        {
          user_id: userId,
          growth_score: analysis.growthScore,
          ai_analysis_summary: analysis.analysisSummary,
          last_analyzed_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )

    console.log('[AI Mentor] Analysis completed successfully')
  } catch (error) {
    console.error('[AI Mentor] Error in analyzeBlogPostAndNotify:', error)
    // エラーをスローせず、ログ出力のみ（メイン処理を失敗させない）
  }
}

// ========================================
// 8. メイン処理: GitHub同期時の分析
// ========================================

/**
 * GitHub同期時にユーザーを分析してLINE通知を送る
 *
 * @param userId - ユーザーID
 */
export async function analyzeGitHubActivityAndNotify(
  userId: string
): Promise<void> {
  try {
    console.log(`[AI Mentor] Analyzing GitHub activity for user ${userId}`)

    // 1. 通知制限チェック
    const limitCheck = await checkNotificationLimit(userId, 'github_sync')
    if (!limitCheck.canSend) {
      console.log('[AI Mentor] Daily notification limit reached for github_sync, skipping')
      return
    }

    const supabase = getSupabaseAdmin()

    // 2. ユーザーのLINE情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('line_user_id, line_friend_added, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile || !profile.line_user_id || !profile.line_friend_added) {
      console.log('[AI Mentor] User has not added LINE friend, skipping notification')
      return
    }

    // 3. GitHub統計取得
    const githubStats = await getGitHubStats(userId)

    // 4. 最新のブログ投稿を取得（過去7日以内）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentPosts } = await supabase
      .from('tech_blog_posts')
      .select('id, title, content, topic, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    // 5. 通知条件をチェック
    const shouldNotify = checkGitHubNotificationCondition(githubStats)

    if (!shouldNotify) {
      console.log('[AI Mentor] No notification condition met, skipping')
      return
    }

    // 6. メッセージを生成
    const message = await generateGitHubSyncMessage(
      profile.full_name || 'あなた',
      githubStats,
      recentPosts && recentPosts.length > 0 ? recentPosts[0] : null
    )

    // 7. LINE通知送信
    const lineResult = await sendLinePushMessage({
      userId,
      lineUserId: profile.line_user_id,
      message: message.lineMessage
    })

    // 8. 通知を保存
    await saveNotification({
      userId,
      notificationType: 'github_sync',
      message: message.lineMessage,
      growthScore: message.growthScore,
      analysisSummary: message.analysisSummary,
      sentSuccessfully: lineResult.success,
      errorMessage: lineResult.errorMessage
    })

    // 9. user_engagement_statusを更新
    await supabase
      .from('user_engagement_status')
      .upsert(
        {
          user_id: userId,
          growth_score: message.growthScore,
          ai_analysis_summary: message.analysisSummary,
          last_analyzed_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )

    console.log('[AI Mentor] GitHub sync analysis completed successfully')
  } catch (error) {
    console.error('[AI Mentor] Error in analyzeGitHubActivityAndNotify:', error)
    // エラーをスローせず、ログ出力のみ
  }
}

/**
 * GitHub同期時の通知条件チェック
 *
 * @param githubStats - GitHub統計
 * @returns 通知すべきかどうか
 */
function checkGitHubNotificationCondition(githubStats: GitHubStats): boolean {
  // 条件1: 過去14日間でコミットが0（停滞）
  if (githubStats.commits14Days === 0) {
    return true
  }

  // 条件2: 過去7日間で10コミット以上（活発）
  if (githubStats.commits7Days >= 10) {
    return true
  }

  // その他の場合は通知しない
  return false
}

/**
 * GitHub同期時のメッセージ生成
 *
 * @param userName - ユーザー名
 * @param githubStats - GitHub統計
 * @param recentPost - 最近のブログ投稿（あれば）
 * @returns メッセージと分析結果
 */
async function generateGitHubSyncMessage(
  userName: string,
  githubStats: GitHubStats,
  recentPost: BlogPost | null
): Promise<{
  lineMessage: string
  growthScore: number
  analysisSummary: string
}> {
  try {
    const openai = getOpenAIClient()

    const systemPrompt = `あなたは、エンジニアの成長を支援する「並走するパートナー」です。

【役割】
- 上から目線の教師ではなく、一緒に頑張る同僚のような存在
- ユーザーのGitHub活動を定期的に確認し、適切なタイミングで励ましや心配のメッセージを送る
- 丁寧で落ち着いたトーンで、共感と励ましを届ける

【出力形式】
以下のJSON形式で回答してください：
{
  "growthScore": <0-100の整数>,
  "analysisSummary": "<分析の要約（200文字以内）>",
  "lineMessage": "<LINEで送るメッセージ（100文字程度）>"
}

【メッセージトーン】
- 活発な場合: 「コミットが続いていますね。着実な積み重ねが成長につながります」
- 停滞している場合: 「最近、活動が止まっているようですね。無理せず、できる範囲で続けていきましょう」`

    let userPrompt = `【GitHub活動】
- 過去7日間のコミット数: ${githubStats.commits7Days}
- 過去14日間のコミット数: ${githubStats.commits14Days}
- 最終コミット日: ${githubStats.lastCommitDate || '不明'}
`

    if (recentPost) {
      userPrompt += `
【最近のブログ投稿】
- タイトル: ${recentPost.title}
- トピック: ${recentPost.topic}
- 投稿日: ${recentPost.created_at}
`
    }

    // GPT-4oで分析
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400
    })

    const resultText = response.choices[0]?.message?.content
    if (!resultText) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(resultText)

    return {
      growthScore: Math.min(100, Math.max(0, result.growthScore || 50)),
      analysisSummary: result.analysisSummary || 'GitHub活動を確認しました',
      lineMessage: result.lineMessage || '引き続き、一緒に成長していきましょう。'
    }
  } catch (error) {
    console.error('Error in generateGitHubSyncMessage:', error)

    // エラー時のフォールバック
    if (githubStats.commits14Days === 0) {
      return {
        growthScore: 30,
        analysisSummary: '過去14日間、活動が確認できませんでした。',
        lineMessage: '最近、活動が止まっているようですね。無理せず、できる範囲で続けていきましょう。'
      }
    } else if (githubStats.commits7Days >= 10) {
      return {
        growthScore: 80,
        analysisSummary: '過去7日間で活発な活動が確認できました。',
        lineMessage: 'コミットが続いていますね。着実な積み重ねが成長につながります。'
      }
    } else {
      return {
        growthScore: 50,
        analysisSummary: 'GitHub活動を確認しました。',
        lineMessage: '引き続き、一緒に成長していきましょう。'
      }
    }
  }
}
