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

        // stateをセッションに保存（クッキーを使用）
        const response = NextResponse.redirect(
            `https://access.line.me/oauth2/v2.1/authorize?` +
            `response_type=code` +
            `&client_id=${channelId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}` +
            `&scope=profile%20openid`
        )

        // stateとuserIdをクッキーに保存
        response.cookies.set('line_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600, // 10分
            path: '/'
        })

        response.cookies.set('line_oauth_user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600, // 10分
            path: '/'
        })

        return response
    } catch (error) {
        console.error('LINE OAuth initiation error:', error)
        return NextResponse.json(
            { error: 'Failed to initiate LINE authentication' },
            { status: 500 }
        )
    }
}
