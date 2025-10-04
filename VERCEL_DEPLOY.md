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

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**重要：** これらの値はSupabaseダッシュボードの Settings > API から取得してください。

### 3. ビルド設定
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. デプロイ実行
"Deploy"ボタンをクリックしてデプロイを開始します。

## トラブルシューティング

### ビルドエラーが発生した場合
1. 環境変数が正しく設定されているか確認
2. ローカルで`npm run build`が成功するか確認
3. package.jsonの依存関係に問題がないか確認

### Supabase接続エラーが発生した場合
1. SupabaseのURLとAPI Keyが正しいか確認
2. Supabaseプロジェクトがアクティブか確認
3. RLSポリシーが正しく設定されているか確認

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