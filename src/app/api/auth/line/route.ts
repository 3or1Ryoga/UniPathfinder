import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// LINE OAuth認証を開始するエンドポイント
export async function GET(request: NextRequest) {
    try {
        // ユーザーが認証されているか確認
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login with GitHub first.' },
                { status: 401 }
            )
        }

        // 環境変数の確認
        const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID
        const redirectUri = `${request.nextUrl.origin}/api/auth/line/callback`

        if (!channelId) {
            console.error('LINE_CHANNEL_ID is not set')
            return NextResponse.json(
                { error: 'LINE authentication is not configured' },
                { status: 500 }
            )
        }

        // ランダムなstateを生成（CSRF対策）
        const state = crypto.randomUUID()

        // stateをDBに保存（Cookieの代わり - ブラウザ間で引き継ぎ可能にするため）
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分後
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                line_oauth_state: state,
                line_oauth_state_expires_at: expiresAt.toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Failed to save OAuth state:', updateError)
            return NextResponse.json(
                { error: 'Failed to initiate LINE authentication' },
                { status: 500 }
            )
        }

        // 全ユーザーに対し、ログイン同意画面で友だち追加を「デフォルトON」で提案する
        const botPrompt = '&bot_prompt=aggressive'

        // LINE認証画面にリダイレクト
        const response = NextResponse.redirect(
            `https://access.line.me/oauth2/v2.1/authorize?` +
            `response_type=code` +
            `&client_id=${channelId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}` +
            `&scope=profile%20openid` +
            botPrompt
        )

        return response
    } catch (error) {
        console.error('LINE OAuth initiation error:', error)
        return NextResponse.json(
            { error: 'Failed to initiate LINE authentication' },
            { status: 500 }
        )
    }
}
