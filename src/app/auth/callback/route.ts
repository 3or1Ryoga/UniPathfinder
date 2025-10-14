import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') ?? '/account'

    // Check for Supabase error parameters
    const error = requestUrl.searchParams.get('error')
    const errorCode = requestUrl.searchParams.get('error_code')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // === 既存のメール認証エラーハンドリング（保持） ===
    // Handle Supabase errors (like expired OTP)
    if (error || errorCode) {
        let errorMessage = 'ログインに失敗しました。'

        if (errorCode === 'otp_expired') {
            errorMessage = 'マジックリンクの有効期限が切れています。もう一度ログインしてください。'
        } else if (error === 'access_denied') {
            errorMessage = 'アクセスが拒否されました。もう一度ログインしてください。'
        } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription)
        }

        // Redirect to login page with error message
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMessage)}`)
    }

    if (code) {
        try {
            const supabase = await createClient()
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                let errorMessage = 'セッションの確立に失敗しました。'

                // === 既存のメール認証エラーハンドリング（保持） ===
                // Handle specific exchange errors
                if (exchangeError.message?.includes('expired')) {
                    errorMessage = 'マジックリンクの有効期限が切れています。もう一度ログインしてください。'
                } else if (exchangeError.message?.includes('already used')) {
                    errorMessage = 'このマジックリンクは既に使用されています。もう一度ログインしてください。'
                } else if (exchangeError.message?.includes('invalid')) {
                    errorMessage = '無効な認証コードです。もう一度ログインしてください。'
                }

                // Redirect to login page with error
                return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMessage)}`)
            }

            // === 新規追加: GitHub認証後の処理 ===
            // Successfully exchanged code for session
            if (data?.user) {
                const userId = data.user.id

                // GitHubのユーザー名を取得
                const githubUsername = data.user.user_metadata?.user_name ||
                                      data.user.user_metadata?.preferred_username ||
                                      null

                // Check if user profile exists and has LINE connection
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('line_user_id, github_username')
                    .eq('id', userId)
                    .single()

                // プロフィールが存在する場合、GitHub情報を更新
                if (profile && githubUsername) {
                    // github_usernameが未設定、または異なる場合は更新
                    if (!profile.github_username || profile.github_username !== githubUsername) {
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({
                                github_username: githubUsername,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', userId)

                        if (updateError) {
                            console.error('Error updating GitHub username:', updateError)
                        } else {
                            console.log('GitHub username updated successfully:', githubUsername)
                        }
                    }
                } else if (githubUsername) {
                    // プロフィールが存在しない場合は作成
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            email: data.user.email,
                            github_username: githubUsername,
                            full_name: data.user.user_metadata?.name || null,
                            avatar_url: data.user.user_metadata?.avatar_url || null,
                            updated_at: new Date().toISOString()
                        })

                    if (insertError) {
                        console.error('Error creating profile with GitHub username:', insertError)
                    } else {
                        console.log('Profile created with GitHub username:', githubUsername)
                    }
                }

                // Check if LINE is connected
                if (profileError || !profile || !profile.line_user_id) {
                    console.log('New user or LINE not connected, redirecting to /link-line')
                    return NextResponse.redirect(`${origin}/link-line`)
                }

                // Existing user with LINE connection - redirect to account
                console.log('Existing user with LINE connection, redirecting to /account')
            }

            const redirectUrl = `${origin}${next.startsWith('/') ? next : `/${next}`}`
            return NextResponse.redirect(redirectUrl)
        } catch (err) {
            console.error('Callback error:', err)
            return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('予期しないエラーが発生しました。')}`)
        }
    }

    // No code present - redirect to login
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('認証コードが見つかりません。もう一度ログインしてください。')}`)
}
