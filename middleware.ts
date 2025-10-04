import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request)
  
  // Create supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Read-only in middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // if user is signed in and the current path is / redirect the user to /account
  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/account', request.url))
  }

  // if user is not signed in and the current path is not / redirect the user to /
  if (!user && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
    matcher: ['/', '/account'],
}
