import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

// LINE Messaging API Webhookエンドポイント
// 友だち追加イベントなどを受信して処理する

export async function POST(request: NextRequest) {
    try {
        // リクエストボディを取得
        const body = await request.text()
        const events = JSON.parse(body)

        // Webhook署名の検証
        const signature = request.headers.get('x-line-signature')
        const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET

        if (!channelSecret) {
            console.error('LINE_MESSAGING_CHANNEL_SECRET not configured')
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
        }

        // 署名検証
        if (signature) {
            const hash = crypto
                .createHmac('SHA256', channelSecret)
                .update(body)
                .digest('base64')

            if (hash !== signature) {
                console.error('Invalid webhook signature')
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        // イベントを処理
        if (events.events && Array.isArray(events.events)) {
            for (const event of events.events) {
                await handleLineEvent(event)
            }
        }

        // LINEへの応答（200 OKを返す必要がある）
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('LINE webhook error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// LINEイベントを処理する関数
async function handleLineEvent(event: {
    type: string
    source: { userId: string }
    timestamp: number
}) {
    const { type, source } = event

    // 友だち追加イベント
    if (type === 'follow') {
        const lineUserId = source.userId
        console.log('Friend added event:', lineUserId)

        // Supabaseクライアントを作成
        const supabase = await createClient()

        // line_user_idが一致するprofileを見つけて更新
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)

        if (fetchError) {
            console.error('Error fetching profile:', fetchError)
            return
        }

        if (profiles && profiles.length > 0) {
            const profileId = profiles[0].id

            // line_friend_addedをtrueに更新
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    line_friend_added: true,
                    line_friend_added_at: new Date().toISOString()
                })
                .eq('id', profileId)

            if (updateError) {
                console.error('Error updating friend status:', updateError)
            } else {
                console.log('Friend status updated successfully for user:', profileId)
            }
        } else {
            console.warn('No profile found for LINE user:', lineUserId)
        }
    }

    // 友だち削除イベント（ブロックまたは削除）
    if (type === 'unfollow') {
        const lineUserId = source.userId
        console.log('Friend removed event:', lineUserId)

        const supabase = await createClient()

        // line_friend_addedをfalseに更新
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                line_friend_added: false
            })
            .eq('line_user_id', lineUserId)

        if (updateError) {
            console.error('Error updating unfollow status:', updateError)
        } else {
            console.log('Unfollow status updated successfully for LINE user:', lineUserId)
        }
    }

    // メッセージ受信イベント（将来の機能拡張用）
    if (type === 'message') {
        console.log('Message received from LINE user:', source.userId)
        // 将来的にメッセージに対する応答処理を実装可能
    }
}
