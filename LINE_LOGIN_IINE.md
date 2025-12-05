# LINE連携ログイン実装ドキュメント

## 概要

このドキュメントは、UniPathFinderにおけるLINE連携ログイン機能の実装詳細を説明します。
AIがこの機能を理解・修正・拡張する際に必要な情報をまとめています。

---

## 全体フロー図

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LINE連携ログインフロー                              │
└─────────────────────────────────────────────────────────────────────────────┘

[ユーザー] ─── GitHubログイン ───> [/auth/callback]
                                        │
                                        │ onboarding未完了?
                                        ▼
                                  [/link-line]
                                  中間ページ
                                  「LINEと連携する」ボタン
                                        │
                                        │ ユーザーがボタンをタップ
                                        ▼
                                [/api/auth/line]
                                  ・state生成
                                  ・DBにstate保存
                                  ・LINE認証URLへリダイレクト
                                        │
                                        ▼
                        ┌─────────────────────────────────┐
                        │      LINE認証画面（外部）         │
                        │  ・プロフィール情報の許可         │
                        │  ・友だち追加（デフォルトON）     │
                        └─────────────────────────────────┘
                                        │
                                        │ 「許可する」をタップ
                                        ▼
                            [/api/auth/line/callback]
                              ・DBからstate検索
                              ・ユーザー特定
                              ・アクセストークン取得
                              ・プロフィール取得
                              ・DB更新（LINE情報保存）
                              ・stateクリア
                                        │
                                        ▼
                                  [/onboarding]
                                  オンボーディング開始
```

---

## 関連ファイル一覧

| ファイルパス | 役割 |
|-------------|------|
| `src/app/api/auth/line/route.ts` | LINE OAuth認証開始エンドポイント |
| `src/app/api/auth/line/callback/route.ts` | LINE OAuthコールバック処理 |
| `src/app/link-line/page.tsx` | LINE連携中間ページ（ボタン表示） |
| `src/app/auth/callback/route.ts` | GitHub/Google認証後のルーティング |
| `supabase/migrations/add_line_oauth_state.sql` | state保存用カラムのマイグレーション |
| `supabase/migrations/add_line_columns.sql` | LINE情報保存用カラムのマイグレーション |

---

## 詳細実装

### 1. 認証開始 (`/api/auth/line/route.ts`)

**エンドポイント**: `GET /api/auth/line`

**前提条件**: ユーザーがGitHub/Googleで認証済みであること

**処理フロー**:
1. Supabaseセッションからユーザー情報を取得
2. CSRF対策用のstateを生成（`crypto.randomUUID()`）
3. stateをDBに保存（有効期限: 10分）
4. LINE認証URLにリダイレクト

**重要なパラメータ**:
```typescript
// 友だち追加をデフォルトONにする
const botPrompt = '&bot_prompt=aggressive'

// LINE認証URL
`https://access.line.me/oauth2/v2.1/authorize?` +
`response_type=code` +
`&client_id=${channelId}` +
`&redirect_uri=${encodeURIComponent(redirectUri)}` +
`&state=${state}` +
`&scope=profile%20openid` +
botPrompt
```

**なぜDBにstateを保存するのか**:
- iOSではLINEアプリからのコールバックがデフォルトブラウザ（Safari）に開かれる
- 元のブラウザ（Arc等）と異なるため、Cookieが引き継がれない
- DBに保存することでブラウザ間でstateを共有可能

---

### 2. コールバック処理 (`/api/auth/line/callback/route.ts`)

**エンドポイント**: `GET /api/auth/line/callback`

**処理フロー**:
1. URLパラメータから`code`と`state`を取得
2. DBからstateを検索してユーザーを特定
3. 有効期限チェック（10分以内か）
4. LINE APIでアクセストークンを取得
5. LINE APIでユーザープロフィールを取得
6. 重複チェック（同じLINE IDが別ユーザーに紐付いていないか）
7. profilesテーブルにLINE情報を保存
8. stateをクリア（再利用防止）
9. `/onboarding`にリダイレクト

**LINE APIエンドポイント**:
```typescript
// トークン取得
POST https://api.line.me/oauth2/v2.1/token

// プロフィール取得
GET https://api.line.me/v2/profile
```

---

### 3. 中間ページ (`/link-line/page.tsx`)

**役割**: ユーザータップを経由してLINE認証を開始する

**なぜ中間ページが必要か**:
- iOSのUniversal Linksは、サーバーサイドリダイレクトでは機能しないことがある
- ユーザーのタップアクションをトリガーにすることで、LINEアプリが正常に開く

**主要コンポーネント**:
```typescript
const handleLineLogin = async () => {
    // ネイティブアプリ判定
    const isNative = Capacitor.isNativePlatform()

    if (isNative) {
        // Capacitor Browser使用
        await Browser.open({ url: authUrl, windowName: '_self' })
    } else {
        // 通常のリダイレクト
        window.location.href = '/api/auth/line'
    }
}
```

---

### 4. GitHub認証後のルーティング (`/auth/callback/route.ts`)

**該当コード** (291-296行目):
```typescript
// 新規ユーザーまたはオンボーディング未完了の場合
// LINE連携ページに遷移（ユーザータップでUniversal Linksが機能）
if (!profileData?.onboarding_completed) {
    console.log('New user or onboarding not completed, redirecting to LINE link page')
    return NextResponse.redirect(`${origin}/link-line`)
}
```

---

## データベーススキーマ

### profilesテーブルのLINE関連カラム

```sql
-- LINE OAuth state管理（CSRF対策）
line_oauth_state TEXT
line_oauth_state_expires_at TIMESTAMPTZ

-- LINE連携情報
line_user_id TEXT UNIQUE
line_display_name TEXT
line_avatar_url TEXT
line_friend_added BOOLEAN
line_friend_added_at TIMESTAMPTZ
```

---

## 環境変数

```env
# LINE Login チャネルID（公開可）
NEXT_PUBLIC_LINE_CHANNEL_ID=xxxxx

# LINE Login チャネルシークレット（非公開）
LINE_CHANNEL_SECRET=xxxxx

# LINE公式アカウント友だち追加URL
NEXT_PUBLIC_LINE_ADD_FRIEND_URL=https://line.me/R/ti/p/@xxxxx
```

---

## LINE Developers コンソール設定

### 必須設定

1. **LINEログインチャネル作成**
   - プロバイダー配下に「LINEログイン」チャネルを作成

2. **コールバックURL設定**
   - `https://your-domain.com/api/auth/line/callback`

3. **リンクされたボット設定**
   - LINEログインチャネル → チャネル基本設定 → リンクされたボット
   - LINE公式アカウント（Messaging APIチャネル）を選択

4. **公開設定**
   - チャネルを「公開」に設定

---

## bot_promptパラメータ

| 値 | 動作 |
|----|------|
| `normal` | 友だち追加オプションを表示（チェックなし） |
| `aggressive` | 友だち追加オプションを表示（デフォルトでチェック済み） |
| なし | 友だち追加オプションを表示しない |

現在の実装: `aggressive`（友だち追加がデフォルトON）

---

## エラーハンドリング

| エラー | 原因 | 対処 |
|--------|------|------|
| セキュリティエラー: 無効なリクエストです | stateがDBに存在しない | 再度連携を試行 |
| 認証の有効期限が切れました | 10分以上経過 | 再度連携を試行 |
| このLINEアカウントは既に別のアカウントで使用されています | 重複LINE ID | 別のLINEアカウントを使用 |
| LINE認証に失敗しました | トークン交換失敗 | LINE Developers設定を確認 |

---

## AIが機能を修正・拡張する際のチェックリスト

### 新機能追加時

- [ ] `/api/auth/line/route.ts` - 認証開始時のパラメータ追加
- [ ] `/api/auth/line/callback/route.ts` - コールバック時の処理追加
- [ ] `profiles`テーブル - 必要に応じてカラム追加
- [ ] `database.types.ts` - 型定義の更新

### デバッグ時

- [ ] state不一致 → DBの`line_oauth_state`を確認
- [ ] コールバックエラー → LINE Developersのコールバック設定確認
- [ ] 友だち追加されない → 「リンクされたボット」設定確認

### テスト時の注意

- iOSでテストする場合、LINEアプリからのコールバックはSafariに開かれる
- 異なるブラウザで開始しても、DBベースのstate管理により動作する

---

## 関連ドキュメント

- [LINE Login公式ドキュメント](https://developers.line.biz/ja/docs/line-login/)
- [LINE Login API リファレンス](https://developers.line.biz/ja/reference/line-login/)
- [友だち追加オプション](https://developers.line.biz/ja/docs/line-login/link-a-bot/)
