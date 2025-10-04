import { createClient } from '@/utils/supabase/server'
import AccountForm from './account-form'
import PasswordForm from './password-form'
import { redirect } from 'next/navigation'

export default async function Account() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/')
    }

    const {
        data: { session },
    } = await supabase.auth.getSession()

    return (
        <div>
            <AccountForm session={session} />
            <PasswordForm session={session} />
        </div>
    )
}
