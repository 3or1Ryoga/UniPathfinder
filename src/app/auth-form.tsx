'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'

export default function AuthForm() {
    const supabase = createClient()

    return (
        <Auth
        supabaseClient={supabase}
        view="sign_in"
        appearance={{ 
            theme: ThemeSupa,
            variables: {
                default: {
                    colors: {
                        brand: '#404040',
                        brandAccent: '#52525b'
                    }
                }
            }
        }}
        theme="dark"
        showLinks={true}
        providers={[]}
        redirectTo={`${window.location.origin}/auth/callback`}
        />
    )
}
