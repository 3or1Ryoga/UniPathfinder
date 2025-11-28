'use client'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

interface UserType {
    id: string
    email?: string
}

// useSearchParams を使用するコンポーネントを分離
function LinkLineContent() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<UserType | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        // URLパラメータからエラーメッセージを取得
        const errorParam = searchParams.get('error')
        if (errorParam) {
            setError(decodeURIComponent(errorParam))
        }

        // Check if user is authenticated
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                // If not authenticated, redirect to login
                router.push('/')
            } else {
                setUser(user)
            }
        }
        checkAuth()
    }, [router, supabase, searchParams])

    const handleLineLogin = async () => {
        try {
            setLoading(true)
            setError(null)

            // Capacitorネイティブアプリかどうかを判定
            const isNative = Capacitor.isNativePlatform()

            if (isNative) {
                // ネイティブアプリの場合、直接LINE OAuth APIエンドポイントを使用
                const authUrl = `${window.location.origin}/api/auth/line`
                await Browser.open({
                    url: authUrl,
                    windowName: '_self'
                })
            } else {
                // Webブラウザの場合、直接リダイレクト
                window.location.href = '/api/auth/line'
            }
        } catch (err) {
            console.error('LINE login error:', err)
            setError('予期しないエラーが発生しました。')
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f7fafc'
            }}>
                <div style={{ color: '#718096' }}>読み込み中...</div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f7fafc',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '3rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                    }}>🔗</div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '1rem'
                    }}>
                        LINE連携が必要です
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#718096',
                        lineHeight: '1.6'
                    }}>
                        TechMightでは、学習リソースの通知や<br />
                        パーソナライズされた情報提供のため、<br />
                        LINEとの連携を推奨しています。
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '1.5rem',
                        backgroundColor: '#fee',
                        color: '#c00',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLineLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        backgroundColor: '#06C755',
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
                        opacity: loading ? 0.7 : 1,
                        marginBottom: '1.5rem'
                    }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#05b04b')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#06C755')}
                >
                    <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    {loading ? '処理中...' : 'LINEと連携する'}
                </button>

                {/* スキップリンク - 小さく目立たないように */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <button
                        onClick={() => router.push('/home')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a0aec0',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: '0',
                            opacity: 0.6
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                        LINEをお持ちでない場合でもご利用いただけます
                    </button>
                </div>

                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '0.5rem'
                    }}>
                        📢 取得する情報
                    </h3>
                    <ul style={{
                        fontSize: '0.85rem',
                        color: '#718096',
                        lineHeight: '1.8',
                        paddingLeft: '1.2rem'
                    }}>
                        <li>LINEユーザーID（本人確認用）</li>
                        <li>表示名</li>
                        <li>プロフィール画像（任意）</li>
                    </ul>
                </div>

                <p style={{
                    fontSize: '0.75rem',
                    color: '#a0aec0',
                    textAlign: 'center',
                    lineHeight: '1.5'
                }}>
                    取得した情報は、学習リソースの通知と<br />
                    サービス改善のためにのみ使用されます。<br />
                    詳しくは<a href="/privacy-policy" style={{ color: '#667eea', textDecoration: 'underline' }}>プライバシーポリシー</a>をご覧ください。
                </p>
            </div>
        </div>
    )
}

// Suspense でラップしたメインコンポーネント
export default function LinkLinePage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f7fafc'
            }}>
                <div style={{ color: '#718096' }}>読み込み中...</div>
            </div>
        }>
            <LinkLineContent />
        </Suspense>
    )
}
