'use client'
import dynamic from 'next/dynamic'

// LoginFormを動的インポートしてSSGを回避
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
                            UniPathfinder
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
                    <LoginForm />
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
                        なぜUniPathfinderなのか？
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