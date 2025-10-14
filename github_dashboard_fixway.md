📍 Vercel Dashboardでの手動実行方法

  ステップ1: Vercel Dashboardにアクセス

  1. https://vercel.com/dashboard にログイン
  2. プロジェクト（UniPathFinder）を選択
  3. 上部メニューの 「Cron」 タブをクリック

  ステップ2: Cron Jobを確認

  /api/github/sync-daily-stats のCron Jobが表示されます：
  - Schedule: 0 18 * * *（毎日18:00 UTC）
  - Path: /api/github/sync-daily-stats

  ステップ3: 手動実行

  Cron Jobの右側にある 「...」（3点メニュー） をクリックして：
  - 「Run Now」 または 「Trigger」 を選択

  これで即座にバッチ処理が実行されます。

  ステップ4: 実行結果の確認

  1. Logs タブに移動
  2. 最新の実行ログを確認
  3. エラーがないか、正常に完了したかを確認

  ---
  🔧 curlコマンドでの手動実行（推奨）

  Vercel Dashboardからの実行が見つからない場合や、より確実な方法として：

  curl -X POST https://uni-pathfinder-lf9w.vercel.app/api/github/sync-daily-stats \
    -H "Authorization: Bearer YOUR_CRON_SECRET" \
    -H "Content-Type: application/json"

  注意: YOUR_CRON_SECRET を実際の値に置き換えてください。

  ---
  💡 ローカル環境でのテスト方法

  .env.localを開いているとのことなので、ローカルでテストする方法もご紹介します：

  1. 環境変数を設定

  .env.localに以下を追加：

  # Supabaseサービスロールキー
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

  # Cron Job認証用（テスト用の文字列でOK）
  CRON_SECRET=local_test_secret_123

  2. 開発サーバーを起動

  npm run dev

  3. ローカルでAPIを呼び出し

  別のターミナルで：

  curl -X POST http://localhost:3000/api/github/sync-daily-stats \
    -H "Authorization: Bearer local_test_secret_123" \
    -H "Content-Type: application/json"

  4. レスポンス例

  {
    "summary": {
      "totalUsers": 5,
      "successCount": 5,
      "failureCount": 0,
      "totalDaysSynced": 127,
      "timestamp": "2025-10-14T10:30:00.000Z"
    },
    "results": [
      {
        "userId": "abc123...",
        "githubUsername": "example_user",
        "success": true,
        "daysSynced": 25
      }
    ]
  }

  ---
  ⚠️ トラブルシューティング

  エラー: 401 Unauthorized

  → CRON_SECRETが正しく設定されていない、またはヘッダーが間違っている

  エラー: 500 Internal Server Error

  → ログを確認：
  - SUPABASE_SERVICE_ROLE_KEYが設定されているか
  - github_daily_statsテーブルが作成されているか
  - identitiesテーブルにアクセス権限があるか

  エラー: GitHub token not found

  → ユーザーが一度もGitHubでログインしていない可能性