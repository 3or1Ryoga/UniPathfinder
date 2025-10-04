# Supabase設定ガイド

## 重要：リダイレクトURLの設定

マジックリンク認証が正しく動作するために、Supabaseダッシュボードで以下の設定を行ってください：

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にログイン
   - 該当プロジェクトを選択

2. **Authentication設定**
   - 左メニューから「Authentication」を選択
   - 「URL Configuration」タブを開く

3. **Redirect URLs**に以下を追加：
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```
   
   本番環境の場合は以下も追加：
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com
   ```

4. **Site URL**を設定：
   - 開発環境：`http://localhost:3000`
   - 本番環境：`https://yourdomain.com`

## トラブルシューティング

### マジックリンクをクリックしてもログインできない場合

1. **ブラウザの確認**
   - マジックリンクを開くブラウザと、アプリケーションを開いているブラウザが同じであることを確認
   - 異なるブラウザで開くとセッションが共有されません

2. **リダイレクトURL**
   - Supabaseダッシュボードの「Redirect URLs」に`http://localhost:3000/auth/callback`が登録されているか確認

3. **コンソールエラーの確認**
   - ブラウザの開発者ツール（F12）でコンソールエラーを確認
   - ネットワークタブで`/auth/callback`へのリクエストが成功しているか確認

4. **セッション確認**
   - `/account`ページに直接アクセスして、ログイン状態を確認