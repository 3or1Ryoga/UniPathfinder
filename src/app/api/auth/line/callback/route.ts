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
        console.log('LINE profile data received:', { userId: profileData.userId, displayName: profileData.displayName })

        // Step 3: Supabase profilesテーブルを更新
        const supabase = await createClient()

        // まず、同じLINE user IDが別のユーザーに紐付いていないかチェック
        const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('line_user_id', profileData.userId)
            .neq('id', userId)

        // 既存の紐付けがあれば、エラーを返す（オプションB: 拒否）
        if (existingProfiles && existingProfiles.length > 0) {
            console.log('LINE account already in use by another user:', existingProfiles)
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('このLINEアカウントは既に別のアカウントで使用されています。別のLINEアカウントを使用するか、既存のアカウントでログインしてください。')}`
            )
        }

        // 現在のユーザーにLINE情報を紐付け
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                line_user_id: profileData.userId,
                line_display_name: profileData.displayName,
                line_avatar_url: profileData.pictureUrl || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Failed to update profile with LINE info:', updateError)
            console.error('Error details:', JSON.stringify(updateError, null, 2))
            return NextResponse.redirect(
                `${origin}/link-line?error=${encodeURIComponent('LINE情報の保存に失敗しました: ' + updateError.message)}`
            )
        }

        console.log('LINE info saved successfully for user:', userId)

        // LINE友達追加ページに直接リダイレクト
        // ユーザーはLINE公式アカウントを友達追加し、Botからオンボーディングリンクを受け取る
        const response = NextResponse.redirect('https://line.me/R/ti/p/@409fwjcr')

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
