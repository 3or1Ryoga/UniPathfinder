import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const next = requestUrl.searchParams.get('next') ?? '/account'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error('Failed to exchange code for session:', error)
            // Redirect to login page with error
            return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
        }

        // Successfully exchanged code for session
        // The session cookies should now be set by the Supabase server client
        const redirectUrl = `${origin}${next.startsWith('/') ? next : `/${next}`}`
        return NextResponse.redirect(redirectUrl)
    }

    // No code present - redirect to login
    console.error('No code present in auth callback')
    return NextResponse.redirect(`${origin}/?error=no_code`)
}
