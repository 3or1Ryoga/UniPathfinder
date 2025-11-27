/**
 * LINE Messaging API - プッシュメッセージ送信ユーティリティ
 *
 * AI Mentorからのフィードバックメッセージを送信し、
 * エラーが発生した場合はデータベースにログを保存します。
 */

import { createClient } from '@supabase/supabase-js'

// Supabase Admin クライアントを取得
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is missing')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

interface PushMessageParams {
  userId: string
  lineUserId: string
  message: string
  notificationId?: string // ai_mentor_notificationsのID（オプション）
}

interface PushMessageResult {
  success: boolean
  errorMessage?: string
  errorCode?: string
}

/**
 * LINEプッシュメッセージを送信
 *
 * @param params - 送信パラメータ
 * @returns 送信結果
 */
export async function sendLinePushMessage(
  params: PushMessageParams
): Promise<PushMessageResult> {
  const { userId, lineUserId, message, notificationId } = params

  try {
    // LINE Messaging API の設定
    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    }

    // LINE Messaging API にプッシュメッセージを送信
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    })

    // レスポンスのチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorCode = errorData.error?.code || response.status.toString()
      const errorMessage = errorData.error?.message || response.statusText

      // エラーログをデータベースに保存
      await saveLineErrorLog({
        userId,
        lineUserId,
        message,
        errorCode,
        errorMessage,
        notificationId
      })

      return {
        success: false,
        errorCode,
        errorMessage
      }
    }

    // 送信成功
    return { success: true }
  } catch (error) {
    // 予期しないエラー
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // エラーログをデータベースに保存
    try {
      await saveLineErrorLog({
        userId,
        lineUserId,
        message,
        errorCode: 'UNEXPECTED_ERROR',
        errorMessage,
        notificationId
      })
    } catch (logError) {
      console.error('Failed to save LINE error log:', logError)
    }

    return {
      success: false,
      errorCode: 'UNEXPECTED_ERROR',
      errorMessage
    }
  }
}

/**
 * LINEエラーログをデータベースに保存
 */
async function saveLineErrorLog(params: {
  userId: string
  lineUserId: string
  message: string
  errorCode: string
  errorMessage: string
  notificationId?: string
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('line_push_errors')
      .insert({
        user_id: params.userId,
        line_user_id: params.lineUserId,
        message: params.message,
        error_code: params.errorCode,
        error_message: params.errorMessage,
        notification_id: params.notificationId || null
      })

    if (error) {
      console.error('Failed to save LINE error log to database:', error)
    }
  } catch (error) {
    console.error('Exception while saving LINE error log:', error)
  }
}

/**
 * 複数のユーザーに一斉送信
 * （将来の拡張用）
 */
export async function sendBulkLinePushMessages(
  messages: PushMessageParams[]
): Promise<PushMessageResult[]> {
  const results: PushMessageResult[] = []

  for (const msg of messages) {
    const result = await sendLinePushMessage(msg)
    results.push(result)

    // LINE API のレート制限対策（100ms待機）
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}
