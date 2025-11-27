/**
 * AI Mentor - ブログ投稿分析API
 *
 * ブログ投稿後にクライアントから呼び出され、
 * AI分析とLINE通知を非同期で実行します。
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyzeBlogPostAndNotify } from '@/lib/ai-mentor'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      )
    }

    // 認証チェック
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 投稿の所有者確認
    const { data: post, error: postError } = await supabase
      .from('tech_blog_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this post' },
        { status: 403 }
      )
    }

    // AI分析を非同期で実行（エラーが発生してもレスポンスには影響させない）
    analyzeBlogPostAndNotify(user.id, postId).catch((error) => {
      console.error('[AI Mentor API] Error in background analysis:', error)
    })

    // すぐにレスポンスを返す（分析は非同期で続行）
    return NextResponse.json({
      success: true,
      message: 'AI analysis started in background'
    })
  } catch (error) {
    console.error('[AI Mentor API] Unexpected error:', error)

    // エラーが発生してもクライアントには成功を返す（分析失敗がメイン処理に影響しないように）
    return NextResponse.json({
      success: true,
      message: 'Request received, analysis may run in background'
    })
  }
}
