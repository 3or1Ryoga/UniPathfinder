'use client'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

// LoginFormを動的インポートしてSSGを回避
// 注意: 既存のメールアドレス認証機能は一時的に無効化されています
// 将来的に再度有効化する可能性があるため、コードは保持されています
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LoginForm = dynamic(() => import('./login-form'), {
    ssr: false,
    loading: () => <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#718096'
    }}>ログインフォームを読み込み中...</div>
})

// GitHubログインコンポーネント
function GitHubLoginButton() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleGitHubLogin = async () => {
        try {
            setLoading(true)
            setError(null)
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })

            if (error) {
                console.error('GitHub login error:', error)
                setError('GitHubログインに失敗しました。もう一度お試しください。')
                setLoading(false)
            }
            // 成功時はリダイレクトされるため、ここでの処理は不要
        } catch (err) {
            console.error('Unexpected error:', err)
            setError('予期しないエラーが発生しました。')
            setLoading(false)
        }
    }

    return (
        <div className="form-widget" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#2d3748' }}>
                ログイン / 新規登録
            </h2>

            {error && (
                <div style={{
                    padding: '12px',
                    marginBottom: '1rem',
                    backgroundColor: '#fee',
                    color: '#c00',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleGitHubLogin}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: '#24292e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s ease',
                    opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1a1e22')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#24292e')}
            >
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {loading ? '処理中...' : 'GitHubでログイン / 登録'}
            </button>

            <p style={{
                marginTop: '1.5rem',
                fontSize: '14px',
                color: '#718096',
                textAlign: 'center',
                lineHeight: '1.6'
            }}>
                GitHubでログイン後、LINE連携が必要です。<br />
                初回登録時のみLINEアカウントとの連携をお願いします。
            </p>
        </div>
    )
}

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false)

    const handleGitHubLogin = async () => {
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            if (error) {
                console.error('GitHub login error:', error)
            }
        } catch (err) {
            console.error('Unexpected error:', err)
        }
    }

    return (
        <div style={{ fontFamily: 'Inter, "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            {/* ヘッダー */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                zIndex: 1000,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
            }}>
                {/* ハンバーガーメニュー */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                    }}
                    aria-label="メニュー"
                >
                    <span style={{
                        width: '24px',
                        height: '2px',
                        backgroundColor: '#222222',
                        transition: 'all 0.3s ease',
                        transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none'
                    }}></span>
                    <span style={{
                        width: '24px',
                        height: '2px',
                        backgroundColor: '#222222',
                        transition: 'all 0.3s ease',
                        opacity: menuOpen ? 0 : 1
                    }}></span>
                    <span style={{
                        width: '24px',
                        height: '2px',
                        backgroundColor: '#222222',
                        transition: 'all 0.3s ease',
                        transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'
                    }}></span>
                </button>

                {/* ロゴ（中央） */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    height: '70px'
                }}>
                    <Image
                        src="/TechMightLogo.jpeg"
                        alt="TechMight Logo"
                        width={180}
                        height={180}
                        style={{
                            height: '50px',
                            width: 'auto',
                            cursor: 'pointer',
                            objectFit: 'contain'
                        }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    />
                </div>

                {/* GitHubで新規登録ボタン */}
                <button
                    onClick={handleGitHubLogin}
                    style={{
                        backgroundColor: '#5ce1e6',
                        color: '#000000',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#4dd4d9'
                        e.target.style.transform = 'translateY(-1px)'
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#5ce1e6'
                        e.target.style.transform = 'translateY(0)'
                    }}
                >
                    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    新規登録
                </button>
            </header>

            {/* サイドメニュー（ハンバーガーメニュー展開時） */}
            <div style={{
                position: 'fixed',
                top: '70px',
                left: 0,
                bottom: 0,
                width: '280px',
                backgroundColor: '#FFFFFF',
                borderRight: '1px solid #E0E0E0',
                transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                zIndex: 999,
                padding: '2rem 0',
                boxShadow: menuOpen ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none'
            }}>
                <nav>
                    <a href="#features" style={{
                        display: 'block',
                        padding: '1rem 2rem',
                        color: '#222222',
                        textDecoration: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => setMenuOpen(false)}
                    >
                        サービスについて
                    </a>
                    <a href="#flow" style={{
                        display: 'block',
                        padding: '1rem 2rem',
                        color: '#222222',
                        textDecoration: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => setMenuOpen(false)}
                    >
                        ご利用の流れ
                    </a>
                    <a href="/privacy-policy" style={{
                        display: 'block',
                        padding: '1rem 2rem',
                        color: '#222222',
                        textDecoration: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => setMenuOpen(false)}
                    >
                        プライバシーポリシー
                    </a>
                    <a href="/terms-of-service" style={{
                        display: 'block',
                        padding: '1rem 2rem',
                        color: '#222222',
                        textDecoration: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={() => setMenuOpen(false)}
                    >
                        利用規約
                    </a>
                </nav>
            </div>

            {/* オーバーレイ（メニュー開いている時） */}
            {menuOpen && (
                <div
                    onClick={() => setMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        top: '70px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 998
                    }}
                />
            )}

            {/* メインコンテンツ（ヘッダー分の余白を追加） */}
            <div style={{ paddingTop: '70px' }}>
            {/* ヒーローセクション */}
            <div className="row" style={{ minHeight: '90vh', alignItems: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
                {/* 背景の抽象的なビジュアル */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: '90%',
                    height: '80%',
                    opacity: 0.1,
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* コードを象徴する抽象的なラインアート */}
                        <path d="M50 100 L150 100 L150 150 L200 150" stroke="#5ce1e6" strokeWidth="2" opacity="0.6"/>
                        <path d="M50 200 L100 200 L100 250 L180 250" stroke="#5ce1e6" strokeWidth="2" opacity="0.6"/>
                        <path d="M50 300 L120 300 L120 280 L220 280" stroke="#5ce1e6" strokeWidth="2" opacity="0.6"/>
                        {/* 光の線が企業ロゴに繋がる */}
                        <path d="M200 150 L400 150 L400 200 L600 200" stroke="#5ce1e6" strokeWidth="3" opacity="0.8"/>
                        <path d="M180 250 L380 250 L380 230 L620 230" stroke="#5ce1e6" strokeWidth="3" opacity="0.8"/>
                        <path d="M220 280 L420 280 L420 260 L640 260" stroke="#5ce1e6" strokeWidth="3" opacity="0.8"/>
                        {/* 洗練された企業ロゴを模した幾何学形状 */}
                        <rect x="600" y="180" width="60" height="60" stroke="#222222" strokeWidth="2" fill="none" opacity="0.4"/>
                        <circle cx="650" cy="210" r="20" stroke="#222222" strokeWidth="2" fill="none" opacity="0.4"/>
                        <rect x="620" y="210" width="60" height="60" stroke="#222222" strokeWidth="2" fill="none" opacity="0.4"/>
                        <circle cx="670" cy="240" r="20" stroke="#222222" strokeWidth="2" fill="none" opacity="0.4"/>
                    </svg>
                </div>

                <div className="col-6" style={{ zIndex: 1 }}>
                    <div style={{ paddingRight: '2rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            {/* <Image
                                src="/TechMight_icon.png"
                                alt="TechMight Logo"
                                width={200}
                                height={200}
                                style={{
                                    width: '200px',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            /> */}
                        </div>
                        <h1 style={{
                            fontSize: '3.5rem',
                            color: '#000000',
                            marginBottom: '1.5rem',
                            fontWeight: '700',
                            lineHeight: '1.2'
                        }}>
                            技術力で社会と繋がりたい<br/>全学生エンジニアへ <br></br>
                        </h1>
                        <p style={{
                            fontSize: '1.2rem',
                            lineHeight: '1.8',
                            color: '#222222',
                            marginBottom: '2.5rem',
                            maxWidth: '540px'
                        }}>
                            「TechMight」は、あなたのコードを履歴書として具体化し、スキルで企業と直接繋がるためのプラットフォームです。
                        </p>
                    </div>
                </div>
                <div className="col-6 auth-widget" style={{ zIndex: 1 }}>
                    {/* 既存のメールアドレス認証フォームは一時的に無効化されています */}
                    {/* 将来的に再度有効化する可能性があるため、コードは保持されています */}
                    {/* <LoginForm /> */}

                    {/* 新しいGitHub認証フォーム */}
                    <GitHubLoginButton />
                </div>
            </div>

            {/* セクション2: ご利用の流れ (4-Step Flow) */}
            <div id="flow" style={{ padding: '6rem 0', backgroundColor: '#FFFFFF' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2.5rem',
                        marginBottom: '4rem',
                        color: '#000000',
                        fontWeight: '700'
                    }}>
                        Next Career Starts in 1 Minute
                    </h2>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        position: 'relative'
                    }}>
                        {/* タイムラインの線 */}
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            left: '12.5%',
                            right: '12.5%',
                            height: '2px',
                            backgroundColor: '#5ce1e6',
                            zIndex: 0
                        }}></div>

                        {/* ステップ1 */}
                        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 1.5rem auto',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}>
                                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* GitHubのOctocatとLINEの吹き出しを組み合わせたカスタムアイコン */}
                                    <path d="M25 20 L25 35 L40 35 L45 40 L45 35 L50 35 L50 20 Z" stroke="#5ce1e6" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
                                    <circle cx="32" cy="27" r="2" fill="#5ce1e6"/>
                                    <circle cx="42" cy="27" r="2" fill="#5ce1e6"/>
                                    <path d="M20 45 Q20 50 25 50 L45 50 Q50 50 50 45 L50 40" stroke="#222222" strokeWidth="2.5" fill="none"/>
                                    <circle cx="30" cy="45" r="1.5" fill="#222222"/>
                                    <circle cx="40" cy="45" r="1.5" fill="#222222"/>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#000000', fontWeight: '700' }}>
                                簡単登録
                            </h3>
                            <p style={{ color: '#222222', lineHeight: '1.6', fontSize: '1rem' }}>
                                GitHubとLINEを連携するだけ。<br/>1分で登録完了。
                            </p>
                        </div>

                        {/* ステップ2 */}
                        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 1.5rem auto',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}>
                                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* 右肩上がりのグラフ */}
                                    <path d="M20 50 L20 20 L55 20" stroke="#222222" strokeWidth="2.5"/>
                                    <path d="M25 45 L30 40 L35 35 L40 28 L45 22 L50 18" stroke="#5ce1e6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="25" cy="45" r="3" fill="#5ce1e6"/>
                                    <circle cx="30" cy="40" r="3" fill="#5ce1e6"/>
                                    <circle cx="35" cy="35" r="3" fill="#5ce1e6"/>
                                    <circle cx="40" cy="28" r="3" fill="#5ce1e6"/>
                                    <circle cx="45" cy="22" r="3" fill="#5ce1e6"/>
                                    <circle cx="50" cy="18" r="3" fill="#5ce1e6"/>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#000000', fontWeight: '700' }}>
                                スキルを可視化
                            </h3>
                            <p style={{ color: '#222222', lineHeight: '1.6', fontSize: '1rem' }}>
                                Githubの公開ディレクトリを参照し<br></br>あなたの技術力を偏差値で<br/>客観的にスコアリング。
                            </p>
                        </div>

                        {/* ステップ3 */}
                        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 1.5rem auto',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}>
                                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* スマートフォンとLINE通知 */}
                                    <rect x="25" y="15" width="25" height="45" rx="3" stroke="#222222" strokeWidth="2.5" fill="none"/>
                                    <line x1="32" y1="55" x2="43" y2="55" stroke="#222222" strokeWidth="2"/>
                                    {/* LINE通知バッジ */}
                                    <circle cx="45" cy="22" r="8" fill="#5ce1e6"/>
                                    <path d="M42 22 L44 24 L48 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    {/* スマートフォン内のメッセージアイコン */}
                                    <line x1="30" y1="25" x2="40" y2="25" stroke="#5ce1e6" strokeWidth="1.5"/>
                                    <line x1="30" y1="30" x2="42" y2="30" stroke="#5ce1e6" strokeWidth="1.5"/>
                                    <line x1="30" y1="35" x2="38" y2="35" stroke="#5ce1e6" strokeWidth="1.5"/>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#000000', fontWeight: '700' }}>
                                オファーが届く
                            </h3>
                            <p style={{ color: '#222222', lineHeight: '1.6', fontSize: '1rem' }}>
                                企業や開発チームから、<br/>あなたのLINEに直接オファーが届きます。
                            </p>
                        </div>

                        {/* ステップ4 */}
                        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 1.5rem auto',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}>
                                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* 握手を抽象化した2本の線が繋がる */}
                                    <path d="M20 40 L25 35 L30 40 L35 35" stroke="#5ce1e6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M35 35 L40 30 L45 35 L50 30" stroke="#222222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="35" cy="35" r="4" fill="#5ce1e6"/>
                                    <path d="M22 38 L22 28 Q22 25 25 25 L30 25" stroke="#5ce1e6" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M48 32 L48 22 Q48 19 45 19 L40 19" stroke="#222222" strokeWidth="2.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#000000', fontWeight: '700' }}>
                                新しいご縁へ
                            </h3>
                            <p style={{ color: '#222222', lineHeight: '1.6', fontSize: '1rem' }}>
                                内定や共同開発など、<br/>新しいキャリアや仲間と繋がろう。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* セクション3: TechMightが選ばれる3つの理由 (Features) */}
            <div id="features" style={{ padding: '6rem 0', backgroundColor: '#FFFFFF' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2.5rem',
                        marginBottom: '4rem',
                        color: '#000000',
                        fontWeight: '700'
                    }}>
                        Why TechMight?
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2.5rem'
                    }}>
                        {/* 特徴カード1 */}
                        <div style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                            <div style={{
                                width: '100%',
                                position: 'relative',
                                aspectRatio: '16/9'
                            }}>
                                <Image
                                    src="/EffortlessProfile.jpg"
                                    alt="Effortless Profile Screen"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    marginBottom: '1rem',
                                    color: '#000000',
                                    fontWeight: '700'
                                }}>
                                    Effortless Profile
                                </h3>
                                <p style={{
                                    color: '#222222',
                                    lineHeight: '1.7',
                                    fontSize: '1rem'
                                }}>
                                    面倒なポートフォリオ作成はもう不要。あなたのGitHub活動が、そのまま最強の履歴書になります。
                                </p>
                            </div>
                        </div>

                        {/* 特徴カード2 */}
                        <div style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                            <div style={{
                                width: '100%',
                                position: 'relative',
                                aspectRatio: '16/9'
                            }}>
                                <Image
                                    src="/LINE-BasedOffer.jpg"
                                    alt="LINE-Based Offer Screen"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    marginBottom: '1rem',
                                    color: '#000000',
                                    fontWeight: '700'
                                }}>
                                    LINE-Based Offer
                                </h3>
                                <p style={{
                                    color: '#222222',
                                    lineHeight: '1.7',
                                    fontSize: '1rem'
                                }}>
                                    もう就活サイトの受信箱は確認しなくていい。重要なオファーは、いつも使うLINEに直接届き、見逃しません。
                                </p>
                            </div>
                        </div>

                        {/* 特徴カード3 */}
                        <div style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                            <div style={{
                                width: '100%',
                                position: 'relative',
                                aspectRatio: '16/9'
                            }}>
                                <Image
                                    src="/ObjectiveScoring.jpg"
                                    alt="Objective Scoring Screen"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    marginBottom: '1rem',
                                    color: '#000000',
                                    fontWeight: '700'
                                }}>
                                    Objective Scoring
                                </h3>
                                <p style={{
                                    color: '#222222',
                                    lineHeight: '1.7',
                                    fontSize: '1rem'
                                }}>
                                    独自アルゴリズムがあなたのスキルを客観的に評価。自分の立ち位置を正確に把握し、自信を持って企業と話せます。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* セクション4: 行動喚起 (Final CTA) */}
            <div style={{ padding: '6rem 0', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{
                        fontSize: '2.8rem',
                        marginBottom: '1.5rem',
                        color: '#000000',
                        fontWeight: '700',
                        lineHeight: '1.3'
                    }}>
                        未来のキャリアは、<br/>ここから始まる。
                    </h2>
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#222222',
                        marginBottom: '3rem',
                        lineHeight: '1.8'
                    }}>
                        学歴や書類選考に悩む時間はもう終わり。あなたの技術力で、未来の選択肢を広げよう。
                    </p>
                    <button
                        style={{
                            backgroundColor: '#5ce1e6',
                            color: '#000000',
                            border: 'none',
                            padding: '18px 48px',
                            borderRadius: '8px',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(92, 225, 230, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#4dd4d9'
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 6px 16px rgba(92, 225, 230, 0.4)'
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#5ce1e6'
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = '0 4px 12px rgba(92, 225, 230, 0.3)'
                        }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        今すぐ無料で始める
                    </button>
                    <p style={{
                        marginTop: '1.5rem',
                        fontSize: '0.9rem',
                        color: '#222222',
                        opacity: 0.7
                    }}>
                        登録は無料です。いつでも退会できます。
                    </p>
                </div>
            </div>
            </div>
        </div>
    )
}