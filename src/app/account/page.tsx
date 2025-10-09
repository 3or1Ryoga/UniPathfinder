import { createClient } from '@/utils/supabase/server'
import AccountForm from './account-form'
// import PasswordForm from './password-form' // 既存のパスワード機能は一時的に無効化
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
            {/* 既存のパスワード変更フォームは一時的に無効化されています */}
            {/* 将来的に再度有効化する可能性があるため、コードは保持されています */}
            {/* <PasswordForm session={session} /> */}
        </div>
    )
}
