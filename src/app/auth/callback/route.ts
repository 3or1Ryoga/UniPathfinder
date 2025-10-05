import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') ?? '/account'
    
    // Check for Supabase error parameters
    const error = requestUrl.searchParams.get('error')
    const errorCode = requestUrl.searchParams.get('error_code')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // Handle Supabase errors (like expired OTP)
    if (error || errorCode) {
        console.error('Auth callback error:', {
            error,
            errorCode,
            errorDescription
        })
        
        let errorMessage = 'ログインに失敗しました。'
        
        if (errorCode === 'otp_expired') {
            errorMessage = 'マジックリンクの有効期限が切れています。もう一度ログインしてください。'
        } else if (error === 'access_denied') {
            errorMessage = 'アクセスが拒否されました。もう一度ログインしてください。'
        } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription)
        }
        
        // Redirect to login page with error message
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMessage)}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
            console.error('Failed to exchange code for session:', exchangeError)
            
            let errorMessage = 'セッションの確立に失敗しました。'
            
            // Handle specific exchange errors
            if (exchangeError.message?.includes('expired')) {
                errorMessage = 'マジックリンクの有効期限が切れています。もう一度ログインしてください。'
            } else if (exchangeError.message?.includes('already used')) {
                errorMessage = 'このマジックリンクは既に使用されています。もう一度ログインしてください。'
            }
            
            // Redirect to login page with error
            return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMessage)}`)
        }

        // Successfully exchanged code for session
        // The session cookies should now be set by the Supabase server client
        const redirectUrl = `${origin}${next.startsWith('/') ? next : `/${next}`}`
        console.log('Successfully authenticated, redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
    }

    // No code present - redirect to login
    console.error('No code present in auth callback')
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('認証コードが見つかりません。もう一度ログインしてください。')}`)
}
