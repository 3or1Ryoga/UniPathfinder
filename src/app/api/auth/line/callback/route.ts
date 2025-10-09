import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// LINE OAuth コールバックを処理するエンドポイント
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const origin = request.nextUrl.origin

    // エラーチェック
    if (error) {
        console.error('LINE OAuth error:', error, errorDescription)
        return NextResponse.redirect(
            `${origin}/link-line?error=${encodeURIComponent(errorDescription || 'LINE認証がキャンセルされました')}`
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            `${origin}/link-line?error=${encodeURIComponent('認証コードが見つかりません')}`
        )
    }

    try {
        // クッキーからstateとuserIdを取得
        const savedState = request.cookies.get('line_oauth_state')?.value
        const userId = request.cookies.get('line_oauth_user_id')?.value

        // CSRF対策: stateの検証
        if (!savedState || savedState !== state) {
            console.error('State mismatch:', { savedState, state })
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('セキュリティエラー: 無効なリクエストです')}`
            )
        }

        if (!userId) {
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('ユーザーセッションが見つかりません')}`
            )
        }

        // 環境変数の取得
        const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID
        const channelSecret = process.env.LINE_CHANNEL_SECRET
        const redirectUri = `${origin}/api/auth/line/callback`

        if (!channelId || !channelSecret) {
            console.error('LINE credentials not configured')
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('LINE認証が設定されていません')}`
            )
        }

        // Step 1: アクセストークンを取得
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: channelId,
                client_secret: channelSecret,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text()
            console.error('LINE token exchange failed:', errorData)
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('LINE認証に失敗しました')}`
            )
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // Step 2: ユーザープロフィールを取得
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!profileResponse.ok) {
            const errorData = await profileResponse.text()
            console.error('LINE profile fetch failed:', errorData)
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('LINEプロフィール取得に失敗しました')}`
            )
        }

        const profileData = await profileResponse.json()

        // Step 3: Supabase profilesテーブルを更新
        const supabase = await createClient()
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                line_user_id: profileData.userId,
                line_display_name: profileData.displayName,
                line_avatar_url: profileData.pictureUrl || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            })

        if (updateError) {
            console.error('Failed to update profile with LINE info:', updateError)
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('LINE情報の保存に失敗しました')}`
            )
        }

        // 成功: クッキーをクリアしてアカウントページにリダイレクト
        const response = NextResponse.redirect(`${origin}/account?line_linked=true`)

        // クッキーを削除
        response.cookies.delete('line_oauth_state')
        response.cookies.delete('line_oauth_user_id')

        return response
    } catch (error) {
        console.error('LINE OAuth callback error:', error)
        return NextResponse.redirect(
            `${origin}/link-line?error=${encodeURIComponent('予期しないエラーが発生しました')}`
        )
    }
}
