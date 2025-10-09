'use client'
import dynamic from 'next/dynamic'
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
    return (
        <div>
            {/* ヒーローセクション */}
            <div className="row" style={{ minHeight: '80vh', alignItems: 'center', padding: 20}}>
                <div className="col-6">
                    <div style={{ paddingRight: '2rem' }}>
                        <h1 className="header" style={{ 
                            fontSize: '2.5rem', 
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold'
                        }}>
                            TechMight
                        </h1>
                        <h2 style={{ 
                            fontSize: '1.3rem', 
                            color: '#4a5568', 
                            marginBottom: '1.5rem',
                            fontWeight: 'normal'
                        }}>
                            あなたの為のプログラミング学習コンシェルジュ
                        </h2>
                        <p style={{ 
                            fontSize: '1.1rem', 
                            lineHeight: '1.6', 
                            color: '#718096', 
                            marginBottom: '2rem' 
                        }}>
                            GitHubリポジトリを分析し、あなたの現在のスキルレベルを客観的に評価。
                            <br />
                            AIが最適化された学習パスと推奨教材を提案します。<br></br>
                            今後、多くの学習教材と連携予定。
                        </p>
                        
                        {/* GitHubで始めるCTA */}
                        <div style={{ marginBottom: '2rem' }}>
                            <button 
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                onClick={() => alert('GitHub連携機能は開発中です。まずは無料登録をお試しください！')}
                            >
                                🚀 GitHubで始める（準備中）
                            </button>
                        </div>
                        
                        <p style={{ fontSize: '0.9rem', color: '#a0aec0' }}>
                            完全無料 • 登録は30秒 • GitHub連携で即座に分析開始
                        </p>
                    </div>
                </div>
                <div className="col-6 auth-widget">
                    {/* 既存のメールアドレス認証フォームは一時的に無効化されています */}
                    {/* 将来的に再度有効化する可能性があるため、コードは保持されています */}
                    {/* <LoginForm /> */}

                    {/* 新しいGitHub認証フォーム */}
                    <GitHubLoginButton />
                </div>
            </div>

            {/* 3つのコア価値 */}
            <div style={{ padding: '4rem 0', backgroundColor: '#f7fafc' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        fontSize: '2rem', 
                        marginBottom: '3rem',
                        color: '#2d3748'
                    }}>
                        なぜTechMightなのか？
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '2rem' 
                    }}>
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '2rem',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#2d3748' }}>
                                コードレビューを提供
                            </h3>
                            <p style={{ color: '#718096', lineHeight: '1.6' }}>
                                SonarCloudを活用したコード品質分析により、
                                個人開発において不足しがちなコードレビューを提供します。
                            </p>
                        </div>
                        
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '2rem',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#2d3748' }}>
                                学習リソースを提供
                            </h3>
                            <p style={{ color: '#718096', lineHeight: '1.6' }}>
                                膨大なプログラミング教材の中から、
                                あなたに最適化された良質な学習リソースをAIが厳選します。
                            </p>
                        </div>
                        
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '2rem',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#2d3748' }}>
                                個別最適化された学習パス
                            </h3>
                            <p style={{ color: '#718096', lineHeight: '1.6' }}>
                                GitHubリポジトリ分析結果から、
                                あなたが今学ぶべき技術と学習順序を明確に提示します。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* プレゼン資料セクション */}
            <div style={{ padding: '4rem 0' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        fontSize: '2rem', 
                        marginBottom: '2rem',
                        color: '#2d3748'
                    }}>
                        プロダクト詳細
                    </h2>
                    <div style={{
                        backgroundColor: '#f7fafc',
                        border: '2px dashed #cbd5e0',
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'center',
                        minHeight: '300px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4a5568' }}>
                            プレゼンテーション資料
                        </h3>
                        <p style={{ color: '#718096', fontSize: '1.1rem' }}>
                            こちらにプロダクトの詳細なプレゼン資料を挿入してください
                        </p>
                        <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginTop: '1rem' }}>
                            (画像、PDF、動画などの形式で配置可能)
                        </p>
                    </div>
                </div>
            </div>

            {/* 使い方3ステップ */}
            <div style={{ padding: '4rem 0', backgroundColor: '#f7fafc' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        fontSize: '2rem', 
                        marginBottom: '3rem',
                        color: '#2d3748'
                    }}>
                        簡単3ステップで始める
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '2rem' 
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '50%', 
                                backgroundColor: '#667eea', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1.5rem', 
                                fontWeight: 'bold',
                                margin: '0 auto 1rem auto'
                            }}>1</div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
                                無料アカウント作成
                            </h3>
                            <p style={{ color: '#718096' }}>
                                メールアドレスまたはマジックリンクで <br></br>
                                30秒で登録完了
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '50%', 
                                backgroundColor: '#667eea', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1.5rem', 
                                fontWeight: 'bold',
                                margin: '0 auto 1rem auto'
                            }}>2</div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
                                GitHubリポジトリ連携
                            </h3>
                            <p style={{ color: '#718096' }}>
                                あなたのPublicリポジトリを
                                AIが自動分析
                            </p>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '50%', 
                                backgroundColor: '#667eea', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1.5rem', 
                                fontWeight: 'bold',
                                margin: '0 auto 1rem auto'
                            }}>3</div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
                                パーソナライズされた学習開始
                            </h3>
                            <p style={{ color: '#718096' }}>
                                推奨された学習リソースで効率的にスキルアップ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 最終CTA */}
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
                    <h2 style={{ 
                        fontSize: '2.2rem', 
                        marginBottom: '1rem',
                        color: '#2d3748'
                    }}>
                        今すぐ学習を始めませんか？
                    </h2>
                    <p style={{ 
                        fontSize: '1.2rem', 
                        color: '#718096', 
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        無料で使える。いつでも辞められる。
                        <br />
                        あなただけの学習パスを見つけて、効率的にスキルアップしましょう。
                    </p>
                    <button 
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '16px 32px',
                            borderRadius: '8px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        🚀 今すぐ無料で始める
                    </button>
                </div>
            </div>
        </div>
    )
}