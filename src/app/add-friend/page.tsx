'use client'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

interface UserType {
    id: string
    email?: string
}

// useSearchParams を使用するコンポーネントを分離
function AddFriendContent() {
    const [completing, setCompleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<UserType | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    // 環境変数から友だち追加URLを取得
    const lineAddFriendUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || ''

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

                // すでに友だち追加済みかチェック
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('line_friend_added, onboarding_completed')
                    .eq('id', user.id)
                    .single()

                if (profile?.line_friend_added) {
                    // 既に友だち追加済みの場合
                    if (!profile.onboarding_completed) {
                        // オンボーディング未完了なら /onboarding にリダイレクト
                        router.push('/onboarding')
                    } else {
                        // オンボーディング完了済みなら /home にリダイレクト
                        router.push('/home')
                    }
                }
            }
        }
        checkAuth()
    }, [router, supabase, searchParams])

    const handleOpenLineApp = () => {
        if (!lineAddFriendUrl) {
            setError('友だち追加URLが設定されていません。管理者にお問い合わせください。')
            return
        }

        // LINE公式アカウントの友だち追加URLを新しいタブで開く
        window.open(lineAddFriendUrl, '_blank')
    }

    const handleComplete = async () => {
        if (!user) return

        try {
            setCompleting(true)
            setError(null)

            // profilesテーブルの line_friend_added を true に更新
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    line_friend_added: true,
                    line_friend_added_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) {
                throw updateError
            }

            // 完了したら /onboarding にリダイレクト
            router.push('/onboarding')
        } catch (err) {
            console.error('Friend add completion error:', err)
            setError('友だち追加の記録に失敗しました。もう一度お試しください。')
            setCompleting(false)
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
                    }}>🤝</div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '1rem'
                    }}>
                        LINE公式アカウントを友だち追加
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#718096',
                        lineHeight: '1.6'
                    }}>
                        TechMightからの通知を受け取るため、<br />
                        LINE公式アカウントを友だち追加してください。
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

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #86efac'
                }}>
                    <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        color: '#166534',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>📱</span> 友だち追加の手順
                    </h3>
                    <ol style={{
                        fontSize: '0.9rem',
                        color: '#15803d',
                        lineHeight: '1.8',
                        paddingLeft: '1.5rem',
                        margin: 0
                    }}>
                        <li>下のボタンをタップしてLINEアプリを開く</li>
                        <li>「追加」ボタンをタップして友だち追加</li>
                        <li>このページに戻って「完了」ボタンをタップ</li>
                    </ol>
                </div>

                <button
                    onClick={handleOpenLineApp}
                    disabled={!lineAddFriendUrl}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        backgroundColor: '#06C755',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: !lineAddFriendUrl ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'background-color 0.2s ease',
                        opacity: !lineAddFriendUrl ? 0.7 : 1,
                        marginBottom: '1rem'
                    }}
                    onMouseOver={(e) => lineAddFriendUrl && (e.currentTarget.style.backgroundColor = '#05b04b')}
                    onMouseOut={(e) => lineAddFriendUrl && (e.currentTarget.style.backgroundColor = '#06C755')}
                >
                    <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    LINEアプリで友だち追加
                </button>

                <button
                    onClick={handleComplete}
                    disabled={completing}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: completing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'background-color 0.2s ease',
                        opacity: completing ? 0.7 : 1,
                        marginBottom: '1.5rem'
                    }}
                    onMouseOver={(e) => !completing && (e.currentTarget.style.backgroundColor = '#5568d3')}
                    onMouseOut={(e) => !completing && (e.currentTarget.style.backgroundColor = '#667eea')}
                >
                    {completing ? '処理中...' : '✓ 友だち追加を完了する'}
                </button>

                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #fbbf24'
                }}>
                    <p style={{
                        fontSize: '0.85rem',
                        color: '#92400e',
                        lineHeight: '1.6',
                        margin: 0
                    }}>
                        <strong>⚠️ 注意:</strong> 友だち追加が完了したら、必ず「完了」ボタンをタップしてください。ボタンをタップしないと、TechMightからの通知が届きません。
                    </p>
                </div>

                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '8px'
                }}>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#2d3748',
                        marginBottom: '0.5rem'
                    }}>
                        📢 受け取れる通知
                    </h3>
                    <ul style={{
                        fontSize: '0.85rem',
                        color: '#718096',
                        lineHeight: '1.8',
                        paddingLeft: '1.2rem',
                        margin: 0
                    }}>
                        <li>おすすめの学習リソース情報</li>
                        <li>学習の進捗リマインド</li>
                        <li>新機能やアップデートのお知らせ</li>
                        <li>あなたにパーソナライズされたアドバイス</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

// Suspense でラップしたメインコンポーネント
export default function AddFriendPage() {
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
            <AddFriendContent />
        </Suspense>
    )
}
