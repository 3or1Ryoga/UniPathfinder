import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// このページは /dashboard にリダイレクトされます
// LINE通知などの外部リンクからのアクセスに対応するため、削除せずに残しています
export default async function Account() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    // ダッシュボードにリダイレクト
    redirect('/dashboard')
}
