import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { detectAndRegisterRepositories } from '@/lib/github-repo-detector'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') ?? '/home'

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

            // === OAuth認証後の処理（GitHub / Google） ===
            // Successfully exchanged code for session
            if (data?.user) {
                const userId = data.user.id
                const provider = data.user.app_metadata?.provider || 'unknown'

                console.log('OAuth provider:', provider)

                // Check if user profile exists and has LINE connection
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('line_user_id, github_username, email, full_name, avatar_url')
                    .eq('id', userId)
                    .single()

                // プロバイダーに応じた情報取得と保存
                if (provider === 'github') {
                    // GitHubのユーザー名とアクセストークンを取得
                    const githubUsername = data.user.user_metadata?.user_name ||
                                          data.user.user_metadata?.preferred_username ||
                                          null

                    const githubAccessToken = data.session?.provider_token || null

                    // デバッグログ
                    console.log('[DEBUG] GitHub OAuth data:', {
                        hasSession: !!data.session,
                        hasProviderToken: !!data.session?.provider_token,
                        providerTokenLength: data.session?.provider_token?.length || 0,
                        username: githubUsername
                    })

                    // プロフィールが存在する場合、GitHub情報を更新
                    if (profile && (githubUsername || githubAccessToken)) {
                        // github_usernameまたはgithub_access_tokenが未設定、または異なる場合は更新
                        if (!profile.github_username || profile.github_username !== githubUsername || githubAccessToken) {
                            const updateData: Record<string, string> = {
                                updated_at: new Date().toISOString()
                            }

                            if (githubUsername) {
                                updateData.github_username = githubUsername
                            }

                            if (githubAccessToken) {
                                updateData.github_access_token = githubAccessToken
                            }

                            const { error: updateError } = await supabase
                                .from('profiles')
                                .update(updateData)
                                .eq('id', userId)

                            if (updateError) {
                                console.error('Error updating GitHub info:', updateError)
                            } else {
                                console.log('GitHub info updated successfully:', { username: githubUsername, hasToken: !!githubAccessToken })
                            }
                        }
                    } else if (githubUsername || githubAccessToken) {
                        // プロフィールが存在しない場合は作成
                        const { error: insertError } = await supabase
                            .from('profiles')
                            .insert({
                                id: userId,
                                email: data.user.email,
                                github_username: githubUsername,
                                github_access_token: githubAccessToken,
                                full_name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
                                avatar_url: data.user.user_metadata?.avatar_url || null,
                                updated_at: new Date().toISOString()
                            })

                        if (insertError) {
                            console.error('Error creating profile with GitHub info:', insertError)
                        } else {
                            console.log('Profile created with GitHub info:', { username: githubUsername, hasToken: !!githubAccessToken })
                        }
                    }

                    // GitHub OAuth成功後、リポジトリを自動検出（非同期、エラーが発生しても処理は続行）
                    if (githubAccessToken) {
                        try {
                            console.log('[Repo Auto-Detect] Detecting repositories after GitHub OAuth for user:', userId)
                            const repoResult = await detectAndRegisterRepositories(userId, githubAccessToken)
                            if (repoResult.success) {
                                console.log(`[Repo Auto-Detect] Successfully registered ${repoResult.repoCount} repositories. Primary: ${repoResult.primaryRepo}`)
                            } else {
                                console.warn('[Repo Auto-Detect] No repositories found or registration failed')
                            }
                        } catch (repoError) {
                            console.warn('[Repo Auto-Detect] Failed to detect repositories:', repoError)
                            // リポジトリ検出の失敗は全体の処理には影響させない
                        }
                    }
                } else if (provider === 'google') {
                    // Googleから取得できる情報
                    const googleEmail = data.user.email || null
                    const googleName = data.user.user_metadata?.name || data.user.user_metadata?.full_name || null
                    const googleAvatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null

                    // プロフィールが存在する場合、Google情報で更新
                    if (profile) {
                        const updateData: Record<string, string | null> = {
                            updated_at: new Date().toISOString()
                        }

                        // メールアドレスがない場合のみ更新
                        if (!profile.email && googleEmail) {
                            updateData.email = googleEmail
                        }

                        // 名前がない場合のみ更新
                        if (googleName) {
                            updateData.full_name = googleName
                        }

                        // アバター画像がない場合のみ更新
                        if (googleAvatarUrl) {
                            updateData.avatar_url = googleAvatarUrl
                        }

                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update(updateData)
                            .eq('id', userId)

                        if (updateError) {
                            console.error('Error updating Google info:', updateError)
                        } else {
                            console.log('Google info updated successfully:', { email: googleEmail, name: googleName })
                        }
                    } else {
                        // プロフィールが存在しない場合は作成
                        const { error: insertError } = await supabase
                            .from('profiles')
                            .insert({
                                id: userId,
                                email: googleEmail,
                                full_name: googleName,
                                avatar_url: googleAvatarUrl,
                                updated_at: new Date().toISOString()
                            })

                        if (insertError) {
                            console.error('Error creating profile with Google info:', insertError)
                        } else {
                            console.log('Profile created with Google info:', { email: googleEmail, name: googleName })
                        }
                    }
                }

                // Check if LINE is connected (共通処理)
                if (profileError || !profile || !profile.line_user_id) {
                    console.log('New user or LINE not connected, redirecting to /link-line')
                    return NextResponse.redirect(`${origin}/link-line`)
                }

                // Existing user with LINE connection - redirect to home
                console.log('Existing user with LINE connection, redirecting to /home')
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
