'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [signUpMethod, setSignUpMethod] = useState<'magic' | 'password'>('magic') // 新規登録の方法
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // URLパラメータからエラーメッセージを取得
    useEffect(() => {
        const error = searchParams.get('error')
        if (error) {
            setMessage({ type: 'error', text: decodeURIComponent(error) })
            // エラーパラメータをURLから削除
            const newUrl = window.location.pathname
            window.history.replaceState({}, '', newUrl)
        }
    }, [searchParams])
    
    // クライアントサイドでのみSupabaseクライアントを作成
    const [supabase] = useState(() => {
        // 環境変数の存在確認とデバッグログ
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('Environment check:', {
            hasUrl: !!url,
            hasKey: !!key,
            urlPrefix: url ? url.substring(0, 20) + '...' : 'undefined',
            keyPrefix: key ? key.substring(0, 20) + '...' : 'undefined'
        })
        
        if (!url || !key) {
            console.error('Missing Supabase environment variables:', {
                url: !!url,
                key: !!key
            })
            return null
        }
        return createClient()
    })

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!supabase) {
            setMessage({ 
                type: 'error', 
                text: 'サービスの設定に問題があります。管理者にお問い合わせください。（エラー: 環境変数未設定）' 
            })
            setLoading(false)
            return
        }

        // パスワードが空の場合はマジックリンクを送信
        if (!password) {
            // 常に現在のURLを使用（複数のVercelドメインに対応）
            const redirectUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/callback`
                : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            
            console.log('Magic link redirect URL:', redirectUrl)
            
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectUrl,
                }
            })

            if (error) {
                console.error('Magic link error:', error)
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'success', text: 'マジックリンクを送信しました。メールを確認してください。' })
            }
        } else {
            // パスワードがある場合は通常のログイン
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error('Password login error:', error)
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'success', text: 'ログインしました！' })
                router.push('/account')
            }
        }
        setLoading(false)
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!supabase) {
            setMessage({ 
                type: 'error', 
                text: 'サービスの設定に問題があります。管理者にお問い合わせください。（エラー: 環境変数未設定）' 
            })
            setLoading(false)
            return
        }

        if (signUpMethod === 'magic') {
            // マジックリンクでの新規登録
            const redirectUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/callback`
                : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            console.log('Magic link signup redirect URL:', redirectUrl)
            
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectUrl,
                }
            })

            if (error) {
                console.error('Magic link signup error:', error)
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'success', text: 'マジックリンクを送信しました。メールを確認してください。' })
            }
        } else {
            // パスワードでの新規登録
            // パスワードの確認
            if (password !== confirmPassword) {
                setMessage({ type: 'error', text: 'パスワードが一致しません' })
                setLoading(false)
                return
            }

            if (password.length < 6) {
                setMessage({ type: 'error', text: 'パスワードは6文字以上にしてください' })
                setLoading(false)
                return
            }

            const redirectUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/callback`
                : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            console.log('Password signup redirect URL:', redirectUrl)
            
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl,
                }
            })

            if (error) {
                console.error('Password signup error:', error)
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'success', text: '確認メールを送信しました。メールを確認してください。' })
            }
        }
        setLoading(false)
    }

    const handleMagicLink = async () => {
        setLoading(true)
        setMessage(null)

        if (!supabase) {
            setMessage({ 
                type: 'error', 
                text: 'サービスの設定に問題があります。管理者にお問い合わせください。（エラー: 環境変数未設定）' 
            })
            setLoading(false)
            return
        }

        const redirectUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback`
            : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        console.log('Standalone magic link redirect URL:', redirectUrl)
        
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl,
            }
        })

        if (error) {
            console.error('Magic link error:', error)
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'マジックリンクを送信しました。メールを確認してください。' })
        }
        setLoading(false)
    }

    return (
        <div className="form-widget" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>{isSignUp ? '新規登録' : 'ログイン'}</h2>
            
            {/* 新規登録時の方法選択タブ */}
            {isSignUp && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                        display: 'flex', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        border: '1px solid #ddd'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setSignUpMethod('magic')
                                setPassword('')
                                setConfirmPassword('')
                                setMessage(null)
                            }}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                backgroundColor: signUpMethod === 'magic' ? '#007bff' : '#f8f9fa',
                                color: signUpMethod === 'magic' ? 'white' : '#495057',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: signUpMethod === 'magic' ? 'bold' : 'normal'
                            }}
                        >
                            マジックリンクで登録
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSignUpMethod('password')
                                setMessage(null)
                            }}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                backgroundColor: signUpMethod === 'password' ? '#007bff' : '#f8f9fa',
                                color: signUpMethod === 'password' ? 'white' : '#495057',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: signUpMethod === 'password' ? 'bold' : 'normal'
                            }}
                        >
                            パスワードを設定して登録
                        </button>
                    </div>
                    <p style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginTop: '8px',
                        textAlign: 'center'
                    }}>
                        {signUpMethod === 'magic' 
                            ? 'メールアドレスのみで簡単登録。パスワードは後から設定可能です。'
                            : 'パスワードを設定して登録します。登録後すぐにパスワードログインが可能です。'
                        }
                    </p>
                </div>
            )}
            
            {message && (
                <div style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: message.type === 'error' ? '#fee' : '#efe',
                    color: message.type === 'error' ? '#c00' : '#060',
                    borderRadius: '4px'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email">メールアドレス</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>

                {/* パスワードフィールド：ログイン時、または新規登録でパスワード方式の場合のみ表示 */}
                {(!isSignUp || (isSignUp && signUpMethod === 'password')) && (
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="password">
                            {isSignUp ? 'パスワード（6文字以上）' : 'パスワード（マジックリンクの場合は不要）'}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required={isSignUp && signUpMethod === 'password'}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>
                )}

                {/* パスワード確認フィールド：新規登録でパスワード方式の場合のみ表示 */}
                {isSignUp && signUpMethod === 'password' && (
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="confirmPassword">パスワード（確認）</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="もう一度入力してください"
                            required={true}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <button
                        type="submit"
                        className="button primary block"
                        disabled={loading}
                        style={{ width: '100%', padding: '10px' }}
                    >
                        {loading ? '処理中...' : (isSignUp ? 
                            (signUpMethod === 'magic' ? 'マジックリンクで登録' : '新規登録') 
                            : 'ログイン')}
                    </button>
                </div>
            </form>

            {/* ログイン時のみマジックリンクボタンを表示 */}
            {!isSignUp && (
                <div style={{ marginBottom: '15px' }}>
                    <button
                        type="button"
                        onClick={handleMagicLink}
                        className="button block"
                        disabled={loading || !email}
                        style={{ width: '100%', padding: '10px' }}
                    >
                        {loading ? '処理中...' : 'マジックリンクを送信'}
                    </button>
                </div>
            )}

            <div style={{ textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={() => {
                        setIsSignUp(!isSignUp)
                        setMessage(null)
                        setPassword('')
                        setConfirmPassword('')
                        setSignUpMethod('magic') // 新規登録時はデフォルトでマジックリンク方式
                    }}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#666', 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
                </button>
            </div>
        </div>
    )
}