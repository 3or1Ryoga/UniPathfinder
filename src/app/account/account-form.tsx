'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Session } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'

function AccountFormContent({ session }: { session: Session | null }) {
    const searchParams = useSearchParams()
    const [supabase] = useState(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Supabase environment variables not found')
            return null
        }
        return createClient()
    })
    const [loading, setLoading] = useState(true)
    const [fullname, setFullname] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [website, setWebsite] = useState<string | null>(null)
    const [avatar_url, setAvatarUrl] = useState<string | null>(null)
    const [showLineSuccess, setShowLineSuccess] = useState(false)
    
    // SNS関連のstate
    const [githubUsername, setGithubUsername] = useState<string | null>(null)
    const [twitterUsername, setTwitterUsername] = useState<string | null>(null)
    const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null)
    const [instagramUsername, setInstagramUsername] = useState<string | null>(null)
    const [discordUsername, setDiscordUsername] = useState<string | null>(null)
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null)
    const [facebookUrl, setFacebookUrl] = useState<string | null>(null)
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null)

    // LINE関連のstate
    const [lineUserId, setLineUserId] = useState<string | null>(null)
    const [lineDisplayName, setLineDisplayName] = useState<string | null>(null)
    // const [lineAvatarUrl, setLineAvatarUrl] = useState<string | null>(null) // 将来の機能拡張用に保持
    
    // 追加プロフィール情報
    const [bio, setBio] = useState<string | null>(null)
    const [location, setLocation] = useState<string | null>(null)
    const [skills, setSkills] = useState<string>('')
    const [interests, setInterests] = useState<string>('')
    
    const user = session?.user

    const getProfile = useCallback(async () => {
        try {
        setLoading(true)
        
        if (!supabase) {
            console.warn('Supabase client not available')
            return
        }
        
        if (!user?.id) {
            console.log('No user ID available')
            return
        }

        const { data, error, status } = await supabase
            .from('profiles')
            .select(`
                full_name, username, website, avatar_url, email,
                github_username, twitter_username, linkedin_url, instagram_username,
                discord_username, youtube_url, facebook_url, portfolio_url,
                bio, location, skills, interests,
                line_user_id, line_display_name, line_avatar_url
            `)
            .eq('id', user.id)
            .single()

        if (error && status !== 406) {
            console.error('Error loading profile:', error)
            throw error
        }

        if (data) {
            setFullname(data.full_name)
            setUsername(data.username)
            setWebsite(data.website)
            setAvatarUrl(data.avatar_url)

            // SNS情報
            setGithubUsername(data.github_username)
            setTwitterUsername(data.twitter_username)
            setLinkedinUrl(data.linkedin_url)
            setInstagramUsername(data.instagram_username)
            setDiscordUsername(data.discord_username)
            setYoutubeUrl(data.youtube_url)
            setFacebookUrl(data.facebook_url)
            setPortfolioUrl(data.portfolio_url)

            // LINE情報
            setLineUserId(data.line_user_id)
            setLineDisplayName(data.line_display_name)
            // setLineAvatarUrl(data.line_avatar_url) // 将来の機能拡張用に保持

            // 追加プロフィール情報
            setBio(data.bio)
            setLocation(data.location)
            setSkills(data.skills || '')
            setInterests(data.interests || '')
        }
        } catch (error) {
        console.error('Error loading user data:', error)
        alert('Error loading user data!')
        } finally {
        setLoading(false)
        }
    }, [user, supabase])

    useEffect(() => {
        // URLパラメータからLINE連携成功フラグを確認
        const lineLinked = searchParams.get('line_linked')
        if (lineLinked === 'true') {
            setShowLineSuccess(true)
            // 3秒後に成功メッセージを非表示
            setTimeout(() => setShowLineSuccess(false), 5000)
        }

        getProfile()
    }, [user, getProfile, searchParams])

    async function updateProfile({
        username,
        website,
        avatar_url,
    }: {
        username: string | null
        fullname: string | null
        website: string | null
        avatar_url: string | null
    }) {
        try {
        setLoading(true)
        
        if (!supabase) {
            alert('サービスが利用できません。しばらく後でお試しください。')
            return
        }
        
        if (!user?.id) {
            alert('No user logged in!')
            return
        }

        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            full_name: fullname,
            username,
            website,
            avatar_url,
            email: user.email,
            
            // SNS情報
            github_username: githubUsername,
            twitter_username: twitterUsername,
            linkedin_url: linkedinUrl,
            instagram_username: instagramUsername,
            discord_username: discordUsername,
            youtube_url: youtubeUrl,
            facebook_url: facebookUrl,
            portfolio_url: portfolioUrl,
            
            // 追加プロフィール情報
            bio,
            location,
            skills: skills || null,
            interests: interests || null,
            
            updated_at: new Date().toISOString(),
        })
        if (error) {
            console.error('Error updating profile:', error)
            throw error
        }
        alert('Profile updated!')
        } catch (error) {
        console.error('Error updating the data:', error)
        alert('Error updating the data!')
        } finally {
        setLoading(false)
        }
    }

    if (!session || !user) {
        return <div>No active session</div>
    }
    
    return (
        <div className="form-widget">
            {/* LINE連携成功メッセージ */}
            {showLineSuccess && (
                <div style={{
                    padding: '16px',
                    marginBottom: '20px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '24px' }}>✅</span>
                    <div>
                        <strong>LINE連携が完了しました！</strong>
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>
                            これでTechMightの全機能が利用可能になりました。
                        </div>
                    </div>
                </div>
            )}

            {/* 連携アカウント情報 */}
            <div style={{
                backgroundColor: '#f7fafc',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2d3748' }}>連携アカウント</h3>

                {/* GitHub連携状態 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    marginBottom: '10px'
                }}>
                    <div style={{ marginRight: '12px', fontSize: '24px' }}>
                        <svg height="24" width="24" viewBox="0 0 16 16" fill="#24292e">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#2d3748' }}>GitHub</div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                            {session?.user.email || '連携済み'}
                        </div>
                    </div>
                    <div style={{
                        padding: '4px 12px',
                        backgroundColor: '#48bb78',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        連携済み
                    </div>
                </div>

                {/* LINE連携状態 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                }}>
                    <div style={{ marginRight: '12px', fontSize: '24px' }}>
                        <svg height="24" width="24" viewBox="0 0 24 24" fill="#06C755">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#2d3748' }}>LINE</div>
                        <div style={{ fontSize: '14px', color: '#718096' }}>
                            {lineDisplayName || '未連携'}
                        </div>
                    </div>
                    <div style={{
                        padding: '4px 12px',
                        backgroundColor: lineUserId ? '#48bb78' : '#f56565',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {lineUserId ? '連携済み' : '未連携'}
                    </div>
                </div>

                {!lineUserId && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: '#fff5f5',
                        borderLeft: '4px solid #f56565',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#c53030'
                    }}>
                        ⚠️ LINE連携が完了していません。<a href="/link-line" style={{ color: '#667eea', textDecoration: 'underline', marginLeft: '4px' }}>こちらから連携してください</a>
                    </div>
                )}
            </div>

            {/* ダッシュボードへのリンク */}
            <a
                href="/dashboard"
                style={{
                    display: 'block',
                    backgroundColor: '#5ce1e6',
                    color: '#000000',
                    padding: '1.5rem 2rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    textDecoration: 'none',
                    border: '2px solid #5ce1e6',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4dd4d9'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#5ce1e6'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                }}>
                    ダッシュボードを見る
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    opacity: 0.9
                }}>
                    あなたの成長の軌跡を確認しよう
                </p>
            </a>

            {/* Stressless Profile 機能構築中のお知らせ */}
            <div style={{
                backgroundColor: '#E3F2FD',
                border: '1px solid #5ce1e6',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                }}>
                    🚧
                </div>
                <h3 style={{
                    color: '#000000',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginTop: 0,
                    marginBottom: '0.8rem'
                }}>
                    Stressless Profile 機能を構築中
                </h3>
                <p style={{
                    color: '#222222',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    margin: '0 auto',
                    maxWidth: '600px'
                }}>
                    GitHubの活動履歴を自動的に分析し、あなたの技術力を可視化する「Stressless Profile」機能を開発中です。<br/>
                    完成までもう少しお待ちください。
                </p>
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.8rem 1.5rem',
                    backgroundColor: '#5ce1e6',
                    color: '#000000',
                    borderRadius: '6px',
                    display: 'inline-block',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                }}>
                    📅 近日公開予定
                </div>
            </div>

            <h3>基本情報</h3>
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="email">メールアドレス</label>
                <input id="email" type="text" value={session?.user.email || ''} disabled style={{ backgroundColor: '#f5f5f5' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="fullName">名前</label>
                <input
                    id="fullName"
                    type="text"
                    value={fullname || ''}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="山田 太郎"
                />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="username">ユーザー名</label>
                <input
                    id="username"
                    type="text"
                    value={username || ''}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yamada_taro"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="bio">自己紹介</label>
                <textarea
                    id="bio"
                    value={bio || ''}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="あなたについて教えてください..."
                    rows={3}
                    style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="location">所在地</label>
                <input
                    id="location"
                    type="text"
                    value={location || ''}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="東京, 日本"
                />
            </div>

            <h3 style={{ marginTop: '30px' }}>SNS・リンク</h3>
            
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="githubUsername">GitHub ユーザー名 <span style={{ color: '#007bff' }}>*推奨</span></label>
                <input
                    id="githubUsername"
                    type="text"
                    value={githubUsername || ''}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="@なしで入力（例: octocat）"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="portfolioUrl">ポートフォリオサイト</label>
                <input
                    id="portfolioUrl"
                    type="url"
                    value={portfolioUrl || ''}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://your-portfolio.com"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="website">個人サイト</label>
                <input
                    id="website"
                    type="url"
                    value={website || ''}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-website.com"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="twitterUsername">Twitter/X ユーザー名</label>
                <input
                    id="twitterUsername"
                    type="text"
                    value={twitterUsername || ''}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    placeholder="@なしで入力（例: jack）"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="linkedinUrl">LinkedIn プロフィール</label>
                <input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl || ''}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="instagramUsername">Instagram ユーザー名</label>
                <input
                    id="instagramUsername"
                    type="text"
                    value={instagramUsername || ''}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="@なしで入力"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="discordUsername">Discord ユーザー名</label>
                <input
                    id="discordUsername"
                    type="text"
                    value={discordUsername || ''}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="username#1234"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="youtubeUrl">YouTube チャンネル</label>
                <input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl || ''}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/channel/your-channel"
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="facebookUrl">Facebook プロフィール</label>
                <input
                    id="facebookUrl"
                    type="url"
                    value={facebookUrl || ''}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/your-profile"
                />
            </div>

            <h3 style={{ marginTop: '30px' }}>スキル・興味</h3>
            
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="skills">スキル・技術</label>
                <input
                    id="skills"
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, TypeScript, Python, Docker（カンマ区切り）"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                    あなたの持つ技術スキルをカンマ区切りで入力してください
                </small>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label htmlFor="interests">興味・関心</label>
                <input
                    id="interests"
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="AI, Web開発, ゲーム開発, デザイン（カンマ区切り）"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                    あなたの興味のある分野をカンマ区切りで入力してください
                </small>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    className="button primary block"
                    onClick={() => updateProfile({ fullname, username, website, avatar_url })}
                    disabled={loading}
                    style={{ width: '100%', padding: '12px' }}
                >
                    {loading ? '更新中...' : 'プロフィールを更新'}
                </button>
            </div>

            <div>
                <form action="/auth/signout" method="post">
                    <button className="button block" type="submit" style={{ width: '100%', padding: '12px' }}>
                        ログアウト
                    </button>
                </form>
            </div>
        </div>
    )
}

// Suspense でラップしたメインコンポーネント
export default function AccountForm({ session }: { session: Session | null }) {
    return (
        <Suspense fallback={<div style={{ padding: '2rem' }}>読み込み中...</div>}>
            <AccountFormContent session={session} />
        </Suspense>
    )
}
