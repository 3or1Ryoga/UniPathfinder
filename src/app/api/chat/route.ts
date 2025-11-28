import { createClient } from '@/utils/supabase/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, sessionId } = await req.json()

    // ========================================
    // コンテキスト注入: ユーザーの最新活動を取得
    // ========================================

    // 1. GitHub Activity (直近24時間)
    const { data: githubStats } = await supabase
      .from('github_daily_stats')
      .select('commit_count, push_event_count, date')
      .eq('user_id', user.id)
      .gte('date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(1)
      .single()

    // 2. Recent Tech Blog Posts (直近の投稿)
    const { data: recentBlog } = await supabase
      .from('tech_blog_posts')
      .select('title, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3. User Profile (プロフィール情報)
    const { data: profile } = await supabase
      .from('profiles')
      .select('main_role, tech_stack, career_values')
      .eq('id', user.id)
      .single()

    // 4. GitHub Summary (最新のAI生成サマリー)
    const { data: githubSummary } = await supabase
      .from('github_summaries')
      .select('summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // ========================================
    // System Promptの動的生成
    // ========================================
    const contextParts = []

    if (githubStats) {
      contextParts.push(`今日は ${githubStats.commit_count} 回コミットしており、${githubStats.push_event_count} 回プッシュしています。`)
    }

    if (recentBlog) {
      contextParts.push(`直近では「${recentBlog.title}」というテーマについて考えています。`)
    }

    if (profile) {
      if (profile.main_role) {
        contextParts.push(`ユーザーは「${profile.main_role}」を目指しています。`)
      }
      if (profile.tech_stack && profile.tech_stack.length > 0) {
        contextParts.push(`使用技術: ${profile.tech_stack.join(', ')}`)
      }
      if (profile.career_values && profile.career_values.length > 0) {
        contextParts.push(`重視する価値観: ${profile.career_values.join(', ')}`)
      }
    }

    if (githubSummary && githubSummary.summary) {
      contextParts.push(`\n最近のGitHub活動サマリー:\n${githubSummary.summary}`)
    }

    const userContext = contextParts.length > 0
      ? `\n\n## ユーザーの現在の状況\n${contextParts.join('\n')}`
      : ''

    const systemPrompt = `あなたは学生エンジニア向けのメンターAIです。ユーザーの成長を優しく伴走し、技術的な質問に答えたり、学習のアドバイスをしたりします。

**あなたの役割:**
- ユーザーが技術的な質問をした場合は、わかりやすく丁寧に答える
- ユーザーが停滞している場合は「今日の進捗はどうですか？」と優しく問いかける
- ユーザーの学習意欲を引き出すような質問や提案をする
- 専門的すぎる言葉は避け、学生にもわかる言葉で説明する
- ユーザーの目標や興味に合わせた個別のアドバイスを提供する${userContext}

**会話のスタイル:**
- フレンドリーで親しみやすい
- ポジティブで励ましの言葉を忘れない
- 短く簡潔に、要点をまとめて答える
- 必要に応じて具体例やコード例を提示する`

    // ========================================
    // チャットメッセージの保存
    // ========================================
    let currentSessionId = sessionId

    // セッションが存在しない場合は新規作成
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 50) || '新しい会話'
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      currentSessionId = newSession.id
    }

    // ユーザーメッセージを保存
    const userMessage = messages[messages.length - 1]
    if (userMessage?.role === 'user') {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content: userMessage.content
        })
    }

    // ========================================
    // AI応答のストリーミング生成
    // ========================================
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      async onFinish({ text }) {
        // AI応答を保存
        await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: text
          })

        // セッションのupdated_atを更新
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentSessionId)
      }
    })

    return result.toTextStreamResponse({
      headers: {
        'X-Session-Id': currentSessionId
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
