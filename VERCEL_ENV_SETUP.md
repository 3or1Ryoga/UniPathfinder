# Vercel環境変数設定ガイド

## 重要：Vercelダッシュボードでの環境変数設定

Vercelにデプロイする際は、以下の環境変数を**必ず**Vercelダッシュボードで設定してください。

### 1. Vercelダッシュボードにアクセス
1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクト「uni-pathfinder」を選択
3. 「Settings」タブをクリック
4. 左メニューから「Environment Variables」を選択

### 2. 必要な環境変数を追加

以下の3つの環境変数を設定してください：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wfvcxxpasvgrzhexoylx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` (Supabaseから取得) | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://uni-pathfinder-e7kb-hd1wnp3k8-ryoga-sakais-projects.vercel.app` | Production |

### 3. NEXT_PUBLIC_SITE_URLの環境別設定

`NEXT_PUBLIC_SITE_URL`は環境によって異なる値を設定する必要があります：

- **Production**: `https://uni-pathfinder-e7kb-hd1wnp3k8-ryoga-sakais-projects.vercel.app`
- **Preview**: 空欄のまま（自動的にプレビューURLが使用されます）
- **Development**: `http://localhost:3000`

### 4. 設定手順

1. 「Add New」ボタンをクリック
2. Key欄に環境変数名を入力（例：`NEXT_PUBLIC_SITE_URL`）
3. Value欄に値を入力
4. 適用する環境をチェック（Production/Preview/Development）
5. 「Save」をクリック

### 5. デプロイの再実行

環境変数を追加・変更した後は、必ず再デプロイが必要です：
1. 「Deployments」タブに移動
2. 最新のデプロイメントの「...」メニューをクリック
3. 「Redeploy」を選択

## トラブルシューティング

### 問題：マジックリンクがVercelログインページにリダイレクトされる

**原因**: `NEXT_PUBLIC_SITE_URL`が設定されていない

**解決方法**: 
1. Vercelダッシュボードで`NEXT_PUBLIC_SITE_URL`を設定
2. 再デプロイを実行

### 問題：環境変数が反映されない

**解決方法**:
1. ブラウザのキャッシュをクリア
2. Vercelで強制再デプロイ（Force Deploy）を実行
3. デプロイログで環境変数が読み込まれているか確認

## ローカル開発環境での設定

ローカル環境では`.env.local`ファイルに以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## セキュリティ注意事項

- `SUPABASE_SERVICE_ROLE_KEY`などの秘密鍵は**絶対に**クライアント側の環境変数（`NEXT_PUBLIC_`プレフィックス付き）に設定しない
- 環境変数の値は定期的に確認し、不要なものは削除する