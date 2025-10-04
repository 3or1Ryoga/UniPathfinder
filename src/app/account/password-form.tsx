'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Session } from '@supabase/supabase-js'

export default function PasswordForm({ session }: { session: Session | null }) {
    const [supabase] = useState(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Supabase environment variables not found')
            return null
        }
        return createClient()
    })
    const [loading, setLoading] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    async function updatePassword() {
        try {
            setLoading(true)
            setMessage(null)

            if (!supabase) {
                setMessage({ type: 'error', text: 'サービスが利用できません。しばらく後でお試しください。' })
                return
            }

            if (newPassword !== confirmPassword) {
                setMessage({ type: 'error', text: 'パスワードが一致しません' })
                return
            }

            if (newPassword.length < 6) {
                setMessage({ type: 'error', text: 'パスワードは6文字以上にしてください' })
                return
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) {
                console.error('Error updating password:', error)
                throw error
            }

            setMessage({ type: 'success', text: 'パスワードを設定しました！' })
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'パスワードの更新に失敗しました'
            console.error('Password update error:', error)
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setLoading(false)
        }
    }

    if (!session) {
        return null
    }

    return (
        <div className="form-widget" style={{ marginTop: '20px' }}>
            <h3>パスワード設定</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
                マジックリンクでログインした場合も、パスワードを設定することで通常のログインが可能になります。
            </p>

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

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="newPassword">新しいパスワード</label>
                <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6文字以上"
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="confirmPassword">パスワード（確認）</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="同じパスワードを入力"
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
            </div>

            <div>
                <button
                    className="button primary block"
                    onClick={updatePassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    style={{ width: '100%', padding: '10px' }}
                >
                    {loading ? '更新中...' : 'パスワードを設定'}
                </button>
            </div>
        </div>
    )
}