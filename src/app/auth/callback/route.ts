import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { detectAndRegisterRepositories } from '@/lib/github-repo-detector'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') ?? '/members'

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

                // Check if user profile exists
                const { data: profile } = await supabase
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

                    // アラート形式でも出力（デバッグ用）
                    console.error('=== CRITICAL DEBUG ===')
                    console.error('Provider Token exists:', !!data.session?.provider_token)
                    console.error('Token length:', data.session?.provider_token?.length || 0)
                    console.error('Token preview:', data.session?.provider_token?.substring(0, 20) || 'null')
                    console.error('======================')

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
                } else if (provider === 'line') {
                    // LINEから取得できる情報
                    const lineUserId = data.user.user_metadata?.sub || null
                    const lineName = data.user.user_metadata?.name || null
                    const lineAvatarUrl = data.user.user_metadata?.picture || null

                    console.log('LINE OAuth data:', { lineUserId, lineName, hasAvatar: !!lineAvatarUrl })

                    // プロフィールが存在する場合、LINE情報で更新
                    if (profile) {
                        const updateData: Record<string, string | null> = {
                            updated_at: new Date().toISOString()
                        }

                        // LINE情報を更新
                        if (lineUserId) {
                            updateData.line_user_id = lineUserId
                        }
                        if (lineName) {
                            updateData.line_display_name = lineName
                        }
                        if (lineAvatarUrl) {
                            updateData.line_avatar_url = lineAvatarUrl
                        }

                        // 名前がない場合のみLINE名を設定
                        if (!profile.full_name && lineName) {
                            updateData.full_name = lineName
                        }

                        // アバター画像がない場合のみLINE画像を設定
                        if (!profile.avatar_url && lineAvatarUrl) {
                            updateData.avatar_url = lineAvatarUrl
                        }

                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update(updateData)
                            .eq('id', userId)

                        if (updateError) {
                            console.error('Error updating LINE info:', updateError)
                        } else {
                            console.log('LINE info updated successfully:', { lineUserId, lineName })
                        }
                    } else {
                        // プロフィールが存在しない場合は作成
                        const { error: insertError } = await supabase
                            .from('profiles')
                            .insert({
                                id: userId,
                                line_user_id: lineUserId,
                                line_display_name: lineName,
                                line_avatar_url: lineAvatarUrl,
                                full_name: lineName,
                                avatar_url: lineAvatarUrl,
                                updated_at: new Date().toISOString()
                            })

                        if (insertError) {
                            console.error('Error creating profile with LINE info:', insertError)
                        } else {
                            console.log('Profile created with LINE info:', { lineUserId, lineName })
                        }
                    }

                    // LINE認証の場合、友達追加ページにリダイレクト
                    console.log('LINE authentication completed, redirecting to add-friend')
                    return NextResponse.redirect('https://line.me/R/ti/p/@409fwjcr')
                }

                // GitHub/Google認証の場合の処理
                // オンボーディング完了状態を確認
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', userId)
                    .single()

                // 新規ユーザーまたはオンボーディング未完了の場合
                // LINE連携ページに遷移（ユーザータップでUniversal Linksが機能）
                if (!profileData?.onboarding_completed) {
                    console.log('New user or onboarding not completed, redirecting to LINE link page')
                    return NextResponse.redirect(`${origin}/link-line`)
                }

                // 既存ユーザー（オンボーディング完了済み）
                console.log('Onboarding completed, redirecting to /members')
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
