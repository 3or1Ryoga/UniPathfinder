# Vercelデプロイガイド

## 前提条件
- Supabaseプロジェクトが作成済み
- GitHubにコードがプッシュ済み

## デプロイ手順

### 1. Vercelプロジェクト作成
1. [Vercel](https://vercel.com)にログイン
2. "New Project"をクリック
3. GitHubリポジトリを選択してインポート

### 2. 環境変数設定
VercelダッシュボードでSettings > Environment Variablesに以下を追加：

**Environment Variables:**
| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Production, Preview, Development |

**重要な手順:**
1. Supabaseダッシュボードの Settings > API から値を取得
2. 各環境変数を追加する際は「Production」「Preview」「Development」すべてにチェック
3. 値をコピペする際は前後のスペースに注意
4. 保存後は必ず再デプロイを実行

### 3. ビルド設定
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. デプロイ実行
"Deploy"ボタンをクリックしてデプロイを開始します。

## トラブルシューティング

### MIDDLEWARE_INVOCATION_FAILED エラー
このエラーが発生した場合：
1. Vercelの環境変数が正しく設定されているか確認
2. 環境変数名に誤字がないか確認（`NEXT_PUBLIC_`プレフィックス必須）
3. Vercelで再デプロイを実行
4. Vercelのログでミドルウェアのエラー詳細を確認

### ビルドエラーが発生した場合
1. 環境変数が正しく設定されているか確認
2. ローカルで`npm run build`が成功するか確認
3. package.jsonの依存関係に問題がないか確認

### Supabase接続エラーが発生した場合
1. SupabaseのURLとAPI Keyが正しいか確認
2. Supabaseプロジェクトがアクティブか確認
3. RLSポリシーが正しく設定されているか確認

### 環境変数が認識されない場合
1. Vercelダッシュボードで環境変数を再確認
2. 「Production」「Preview」「Development」すべての環境にチェックが入っているか確認
3. 値の前後にスペースがないか確認
4. 環境変数を保存後、必ず「Redeploy」を実行

## セキュリティチェックリスト
- ✅ API Keyは`NEXT_PUBLIC_`プレフィックス付きの公開可能なもの
- ✅ 秘密鍵（Service Role Key）は使用していない
- ✅ RLSが有効になっている
- ✅ セキュリティヘッダーが設定されている（next.config.ts）

## パフォーマンス最適化
- ✅ 動的インポートでバンドルサイズを最適化
- ✅ 画像最適化が有効
- ✅ コンプレッションが有効
- ✅ 不要なヘッダーを削除（poweredByHeader: false）