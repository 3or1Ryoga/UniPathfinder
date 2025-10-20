import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware - Processing request:', request.nextUrl.pathname)

    // Update session
    const response = await updateSession(request)
    
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware')
      // Continue without auth check if env vars are missing
      return response
    }
    
    // Create supabase client for auth check
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user in middleware:', error)
      // Continue without auth check if there's an error
      return response
    }

    // if user is signed in and the current path is / redirect the user to /home
    if (user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    // if user is not signed in and the current path is not / redirect the user to /
    if (!user && request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is signed in, check profile completion
    if (user) {
      // Don't check profile completion for onboarding page itself
      if (request.nextUrl.pathname !== '/onboarding') {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('profile_completion, onboarding_completed')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching profile in middleware:', profileError)
          } else {
            console.log('Middleware - Profile check:', {
              path: request.nextUrl.pathname,
              profile_completion: profile?.profile_completion,
              onboarding_completed: profile?.onboarding_completed
            })

            // If profile completion is less than 40% or onboarding not completed, redirect to onboarding
            if (profile && (profile.profile_completion === null || profile.profile_completion < 40 || !profile.onboarding_completed)) {
              console.log('Middleware - Redirecting to onboarding')
              return NextResponse.redirect(new URL('/onboarding', request.url))
            }
          }
        } catch (profileError) {
          console.error('Error checking profile completion:', profileError)
          // Continue even if profile check fails
        }
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without auth check if there's an unexpected error
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback)
     * - auth/signout (auth signout)
     * - link-line (LINE connection page - needs auth check separately)
     * - add-friend (LINE friend-add page - needs auth check separately)
     * - onboarding (onboarding page - accessible after login)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth|link-line|add-friend).*)',
  ],
}
