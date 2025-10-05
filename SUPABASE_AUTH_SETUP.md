# Supabase認証設定ガイド

## 1. Supabaseダッシュボードでの設定

### Authentication設定
1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. 左メニューから「Authentication」をクリック
4. 「Settings」タブをクリック

### Site URL設定
**Site URL**にメインのURLを設定：
```
https://uni-pathfinder-lf9w.vercel.app
```
注意：実際に使用するドメインを設定してください。

### Redirect URLs設定
**Redirect URLs**に以下を追加（1行ずつ追加）：
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://uni-pathfinder-lf9w.vercel.app/auth/callback
https://uni-pathfinder-e7kb-hd1wnp3k8-ryoga-sakais-projects.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```
重要：Vercelの複数のドメインを使用する場合は、すべて追加してください。

## 2. 設定手順詳細

### Step 1: Site URL
- Authentication > Settings > Site URL
- 本番環境のメインURLを入力
- 「Save」をクリック

### Step 2: Redirect URLs
- Authentication > Settings > Redirect URLs
- 「Add URL」をクリックして以下を1つずつ追加：
  1. `http://localhost:3000/auth/callback` (ローカル開発用)
  2. `http://localhost:3001/auth/callback` (ローカル開発用)
  3. `https://uni-pathfinder-e7kb-hd1wnp3k8-ryoga-sakais-projects.vercel.app/auth/callback` (本番環境)
  4. `https://*.vercel.app/auth/callback` (Vercelプレビュー環境用)

### Step 3: Email Templates (オプション)
- Authentication > Settings > Email Templates
- 各テンプレート（Confirm signup, Magic Link, etc.）で：
  - 「{{ .SiteURL }}」が正しく設定されているか確認
  - 必要に応じてカスタマイズ

## 3. トラブルシューティング

### マジックリンクがlocalhostにリダイレクトされる場合
1. Supabaseの「Site URL」が正しく設定されているか確認
2. 「Redirect URLs」に本番環境のURLが含まれているか確認
3. 設定変更後、数分待ってから再テスト

### エラー: "Invalid redirect URL"
- Redirect URLsに使用するURLが正確に登録されているか確認
- URLの末尾スラッシュ、プロトコル（http/https）が一致しているか確認

### Vercelプレビュー環境での問題
- Wildcard URL（`https://*.vercel.app/auth/callback`）が設定されているか確認
- プレビューURLが頻繁に変わる場合は、環境変数での管理を検討

## 4. セキュリティ注意事項

- 本番環境では必ずHTTPSのURLのみを使用
- 不要なRedirect URLは削除（セキュリティリスク軽減）
- 定期的にRedirect URLsリストを見直し

## 5. 確認方法

設定完了後、以下を確認：
1. ローカル環境でマジックリンクが正常に動作するか
2. 本番環境でマジックリンクが正常に動作するか
3. 各環境でリダイレクト後にログインが完了するか