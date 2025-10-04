'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Session } from '@supabase/supabase-js'

export default function AccountForm({ session }: { session: Session | null }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [fullname, setFullname] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [website, setWebsite] = useState<string | null>(null)
    const [avatar_url, setAvatarUrl] = useState<string | null>(null)
    
    // SNS関連のstate
    const [githubUsername, setGithubUsername] = useState<string | null>(null)
    const [twitterUsername, setTwitterUsername] = useState<string | null>(null)
    const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null)
    const [instagramUsername, setInstagramUsername] = useState<string | null>(null)
    const [discordUsername, setDiscordUsername] = useState<string | null>(null)
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null)
    const [facebookUrl, setFacebookUrl] = useState<string | null>(null)
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null)
    
    // 追加プロフィール情報
    const [bio, setBio] = useState<string | null>(null)
    const [location, setLocation] = useState<string | null>(null)
    const [skills, setSkills] = useState<string>('')
    const [interests, setInterests] = useState<string>('')
    
    const user = session?.user

    const getProfile = useCallback(async () => {
        try {
        setLoading(true)
        
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
                bio, location, skills, interests
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
        getProfile()
    }, [user, getProfile])

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
