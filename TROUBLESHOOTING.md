# トラブルシューティングガイド

## エラー：「セッションの確立に失敗しました」

### 原因と解決方法

#### 1. Vercelの環境変数が設定されていない
**確認方法**:
- Vercelダッシュボード → Settings → Environment Variables
- 以下が設定されているか確認：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**解決方法**:
1. Vercelダッシュボードで環境変数を追加
2. 再デプロイを実行

#### 2. Supabaseの認証URLが正しく設定されていない
**確認方法**:
- Supabaseダッシュボード → Authentication → Settings
- Site URLとRedirect URLsを確認

**解決方法**:
```
Site URL: https://uni-pathfinder-lf9w.vercel.app

Redirect URLs:
- https://uni-pathfinder-lf9w.vercel.app/auth/callback
- https://*.vercel.app/auth/callback
- http://localhost:3000/auth/callback
```

#### 3. マジックリンクの有効期限切れ
**症状**: 
- メールのリンクをクリックしてもログインできない
- "otp_expired"エラーが表示される

**解決方法**:
- もう一度新しいマジックリンクを送信する
- メールが届いたらすぐにクリックする（デフォルト有効期限：1時間）

#### 4. ブラウザのクッキー設定
**症状**:
- ログインしてもすぐにログアウトされる
- セッションが保持されない

**解決方法**:
1. ブラウザのクッキーを有効にする
2. サードパーティクッキーをブロックしていない確認
3. プライベートブラウジングモードを使用していない確認

## デバッグ方法

### 1. ブラウザのコンソールログを確認
```javascript
// 以下のログが表示されるか確認
"Magic link redirect URL: ..."
"Auth callback invoked: ..."
"Exchange result: ..."
```

### 2. Vercelのログを確認
1. Vercelダッシュボード → Functions → Logs
2. `/auth/callback`のログを確認
3. エラーメッセージを探す

### 3. Supabaseのログを確認
1. Supabaseダッシュボード → Logs → Auth
2. 失敗したログイン試行を確認

## よくある問題

### Q: 複数のVercelドメインを使用している
**A**: 動的にリダイレクトURLを生成するよう修正済み。`window.location.origin`を使用。

### Q: ローカルでは動作するが本番環境で動作しない
**A**: 環境変数がVercelに設定されているか確認。

### Q: マジックリンクをクリックしても何も起こらない
**A**: SupabaseのRedirect URLsに現在のドメインが追加されているか確認。

## 連絡先
問題が解決しない場合は、以下の情報と共に報告してください：
1. エラーメッセージ
2. ブラウザのコンソールログ
3. 使用しているURL
4. 再現手順