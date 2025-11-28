LINEログイン (SSO) 実装設計書: Supabase + Capacitor編
1. 概要とアーキテクチャ
本ドキュメントは、Next.js + Supabase + Capacitor環境において、LINEアカウントを用いたシングルサインオン（SSO）を実装するための手順書である。

認証基盤: Supabase Auth (OAuth 2.0)

UX目標: 「LINEでログイン」ボタン押下後、可能な限りLINEアプリを起動して認証を行う（App-to-App連携）。

実装方式: PKCEフローを用いたセキュアな認証。

2. 前提条件
LINE Developers アカウントが開設済みであること。

Supabase プロジェクトが作成済みであること。

Capacitor の設定（capacitor.config.ts 等）で packageId（例: com.gakusei.engineer）が設定されていること。

Step 1: LINE Developers コンソールの設定
LINEアプリとの連携を行うため、**「ウェブアプリ」と「ネイティブアプリ」**の両方の側面を持つ設定が必要となる。

チャネルの作成

LINE Developers Console にログイン。

新規プロバイダーを作成（または既存を選択）。

**「LINEログイン」**チャネルを作成する。

【重要】ウェブアプリ設定 (Supabase連携用)

「LINEログイン設定」タブを開く。

コールバックURLに、SupabaseのCallback URLを入力する。

形式: https://<PROJECT_REF>.supabase.co/auth/v1/callback

※Supabaseダッシュボードの Authentication > Providers > LINE で確認可能。

【重要】ネイティブアプリ設定 (App-to-App連携用)

同タブ内で「アプリのURLスキーム」を設定する箇所がある場合、アプリのカスタムスキーム（例: com.gakusei.engineer://）を登録する。

※これにより、LINEアプリでの認証後、確実に自社アプリに戻れるようになる。

公開設定

開発中はステータスが「開発中」でも良いが、自分以外のLINEアカウントでテストする場合は、そのアカウントを「権限設定」でテスターに追加するか、チャネルを「公開」にする必要がある。

Step 2: Supabase ダッシュボードの設定
LINE Providerの有効化

Supabase ダッシュボード > Authentication > Providers > LINE を選択。

LINE Login Enabled をONにする。

認証情報の入力

LINE Developers コンソールの「チャネル基本設定」タブにある情報を入力する。

Channel ID: Client IDに入力。

Channel Secret: Client Secretに入力。

リダイレクトURLの許可

Authentication > URL Configuration > Redirect URLs に、アプリのカスタムスキームを追加する。

追加例: com.gakusei.engineer://google-auth (Googleと共有可) または com.gakusei.engineer://auth/callback

※末尾にスラッシュを含めないこと。

Step 3: Next.js + Capacitor 実装コード
Googleログインと同様に、skipBrowserRedirect: true を使用し、CapacitorのBrowserプラグインで認証URLを開く。LINEアプリがインストールされている端末では、ブラウザ経由でLINEアプリが起動する（Universal Links挙動）。

必要なライブラリ
Bash

npm install @capacitor/browser
npx cap sync
実装例 (auth/line-login.ts)
TypeScript

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Browser } from '@capacitor/browser'

// アプリのカスタムスキーム (capacitor.config.tsのidと合わせる)
const APP_REDIRECT_SCHEME = 'com.gakusei.engineer://auth/callback'

export const handleLineLogin = async () => {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'line',
    options: {
      // 認証後にアプリに戻ってくるためのURL
      redirectTo: APP_REDIRECT_SCHEME,
      // OAuthフローのstate検証用
      skipBrowserRedirect: true, 
      queryParams: {
        // 友だち追加を促す設定 (normal または aggressive)
        bot_prompt: 'aggressive' 
      }
    },
  })

  if (error) {
    console.error('Login Error:', error)
    return
  }

  if (data?.url) {
    // Capacitorのブラウザ機能で開く
    // iOS/Androidの設定によっては、ここで自動的にLINEアプリに飛ぶ
    await Browser.open({ 
      url: data.url,
      windowName: '_self' // 重要: iOSでの挙動安定のため
    })
  }
}
Step 4: アプリ復帰時の処理 (Deep Link handling)
LINEアプリ（またはブラウザ）での認証後、アプリに戻ってきた際にセッションを確立する処理。Googleログイン実装時に設定済みであれば、追加設定は不要な場合が多い。

App.tsx または layout.tsx (クライアントサイド)
TypeScript

import { App } from '@capacitor/app'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ...初期化処理内...

App.addListener('appUrlOpen', async (event) => {
  // カスタムスキームで戻ってきたURL (例: com.gakusei.engineer://auth/callback#access_token=...)
  if (event.url.includes('access_token')) {
    const supabase = createClientComponentClient()
    
    // URLからセッション情報を抽出してSupabaseにセットする
    // Supabase JS v2系は自動検知することもあるが、
    // 確実に行うなら getSession() を呼ぶか、URLフラグメントを解析する
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (session) {
      console.log('ログイン成功:', session.user)
      // 必要に応じて画面遷移 (router.push('/dashboard')など)
    }
  }
  
  // ブラウザ(In-App Browser)を閉じる
  await Browser.close()
})
補足: 友だち追加の連携
LINE Developersコンソール設定

「LINEログイン設定」タブ > 「友だち追加オプション (Linked OA)」で、紐付けたい公式アカウントを選択する。

コード側の設定

上記コード内の queryParams: { bot_prompt: 'aggressive' } が機能し、ログイン同意画面に「友だち追加」のチェックボックスが表示されるようになる。
