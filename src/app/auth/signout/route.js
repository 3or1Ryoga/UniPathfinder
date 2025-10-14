import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req) {
    try {
        const supabase = await createClient()

        // グローバルスコープでサインアウト（すべてのセッションを削除）
        await supabase.auth.signOut({ scope: 'global' })

        // すべてのSupabase関連クッキーを明示的に削除
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()

        // Supabase関連のクッキーをすべて削除
        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                cookieStore.delete(cookie.name)
            }
        })

        // キャッシュをクリアしてリダイレクト
        const response = NextResponse.redirect(new URL('/', req.url), {
            status: 302,
        })

        // レスポンスヘッダーでもクッキーを削除
        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                response.cookies.delete(cookie.name)
            }
        })

        // キャッシュを無効化
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')

        return response
    } catch (error) {
        console.error('Error in signout:', error)
        // エラーがあってもリダイレクト
        return NextResponse.redirect(new URL('/', req.url), {
            status: 302,
        })
    }
}

// GETリクエストもサポート（リンクから直接アクセスする場合）
export async function GET(req) {
    try {
        const supabase = await createClient()
        await supabase.auth.signOut({ scope: 'global' })

        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()

        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                cookieStore.delete(cookie.name)
            }
        })

        const response = NextResponse.redirect(new URL('/', req.url), {
            status: 302,
        })

        allCookies.forEach(cookie => {
            if (cookie.name.startsWith('sb-')) {
                response.cookies.delete(cookie.name)
            }
        })

        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')

        return response
    } catch (error) {
        console.error('Error in signout GET:', error)
        return NextResponse.redirect(new URL('/', req.url), {
            status: 302,
        })
    }
}
