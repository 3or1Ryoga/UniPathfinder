# GitHub Stats 自動同期セットアップガイド

このドキュメントでは、`repository_dispatch` + Cron-job.org を使用して、GitHub統計データを毎日自動的に同期する方法を説明します。

## 📋 構成図

```
Cron-job.org (毎日3:00 JST)
    ↓ HTTP POST
GitHub Webhook API
    ↓ repository_dispatch イベント発火
GitHub Actions ワークフロー実行
    ↓ HTTP POST
Vercel API (/api/github/sync-daily-stats)
    ↓ データ同期
Supabase (github_daily_stats テーブル)
```

## 🔧 セットアップ手順

### ステップ1: GitHub Personal Access Token (PAT) を作成

1. GitHubにログイン
2. 右上のプロフィールアイコン → **Settings**
3. 左メニュー最下部の **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**

**設定内容:**
- **Note**: `UniPath Cron Job`
- **Expiration**: `No expiration` または `1 year`
- **Scopes**:
  - ✅ **repo** (すべてにチェック)
    - repo:status
    - repo_deployment
    - public_repo
    - repo:invite
    - security_events

6. **Generate token** をクリック
7. 🔑 **表示されたトークンをコピー**（再表示できないので注意！）

例: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### ステップ2: GitHub Secrets を設定

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニューの **Secrets and variables** → **Actions**
4. **New repository secret** をクリック

**Secret 1: CRON_SECRET**
- **Name**: `CRON_SECRET`
- **Secret**: Vercel環境変数と同じ値を入力

  生成方法（ターミナル）:
  ```bash
  openssl rand -base64 32
  ```

  例: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0==`

**Secret 2: なし（ステップ1のPATは Cron-job.org でのみ使用）**

---

### ステップ3: Vercel 環境変数を設定（未設定の場合）

1. [Vercel Dashboard](https://vercel.com/dashboard) → プロジェクト選択
2. **Settings** → **Environment Variables**
3. 以下を追加:

**CRON_SECRET**
- Value: GitHub Secrets と同じ値（ステップ2で生成した値）

**SUPABASE_SERVICE_ROLE_KEY**
- Value: Supabase Dashboard → Settings → API → `service_role` key

4. **Save** → **Redeploy** をクリック

---

### ステップ4: Cron-job.org で定期実行を設定

1. [https://cron-job.org/](https://cron-job.org/) にアクセス
2. **Sign up** で無料アカウントを作成
3. **Create cronjob** をクリック

**Basic Settings:**
- **Title**: `UniPath GitHub Stats Sync`
- **URL**: `https://api.github.com/repos/<OWNER>/<REPO>/dispatches`

  例: `https://api.github.com/repos/ryogasakai/UniPathFinder/dispatches`

  ⚠️ **注意**: リポジトリオーナー名とリポジトリ名を実際の値に置き換えてください

**Schedule:**
- **Execution schedule**: `0 18 * * *`（毎日18:00 UTC = 翌日 3:00 JST）
- または GUI で設定:
  - **Every**: Day
  - **Time**: `03:00`
  - **Timezone**: `Asia/Tokyo`

**Headers:**
```
Accept: application/vnd.github+json
Authorization: Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
X-GitHub-Api-Version: 2022-11-28
```

⚠️ **注意**: `Authorization` の値をステップ1で作成したPATに置き換えてください

**Advanced:**
- **Time zone**: `Asia/Tokyo`
- **Request method**: `POST`
- **Request timeout**: `30` seconds
- **Request body**:
  ```json
  {"event_type":"sync-daily-stats"}
  ```

4. **Create cronjob** をクリック

---

## ✅ 動作確認

### 手動テスト（GitHub UI）

1. GitHubリポジトリページを開く
2. **Actions** タブをクリック
3. 左サイドバーの **Sync GitHub Daily Stats** をクリック
4. 右上の **Run workflow** をクリック
5. **Run workflow** ボタンを再度クリック

実行ログで以下を確認:
```
✅ Sync completed successfully!
📈 Summary:
  - Total Users: 3
  - Success: 3
  - Failure: 0
  - Total Days Synced: 45
```

### 手動テスト（Cron-job.org）

1. Cron-job.org ダッシュボードを開く
2. 作成したCron Jobの横にある **▶️ アイコン（Run now）** をクリック
3. **Execution log** タブで結果を確認
   - Status: `200 OK`
   - Response time: `< 5s`

4. GitHub Actions タブに戻り、ワークフローが実行されたことを確認

---

## 📊 実行履歴の確認

### GitHub Actions
- リポジトリ → **Actions** タブ
- 各実行をクリックすると詳細ログが表示されます

### Cron-job.org
- ダッシュボード → **Execution log** タブ
- 成功/失敗の履歴と実行時刻を確認できます

### Vercel
- Vercel Dashboard → プロジェクト → **Logs** タブ
- API実行ログとエラーを確認できます

---

## 🔧 トラブルシューティング

### エラー: `401 Unauthorized` (GitHub Webhook)

**原因**: Personal Access Token が無効または権限不足

**解決策**:
1. PATが正しくコピーされているか確認
2. PAT に `repo` スコープが付与されているか確認
3. PAT の有効期限が切れていないか確認

---

### エラー: `401 Unauthorized` (Vercel API)

**原因**: CRON_SECRET が一致していない

**解決策**:
1. GitHub Secrets と Vercel 環境変数の CRON_SECRET が同じか確認
2. Vercel で環境変数を更新後、再デプロイが必要

---

### エラー: `404 Not Found`

**原因**: リポジトリURLが間違っている

**解決策**:
Cron-job.org の URL を確認:
```
https://api.github.com/repos/<OWNER>/<REPO>/dispatches
```
`<OWNER>` と `<REPO>` を実際の値に置き換える

---

### エラー: `event_type not found`

**原因**: Request body の event_type が一致していない

**解決策**:
- Cron-job.org: `{"event_type":"sync-daily-stats"}`
- ワークフロー: `types: [sync-daily-stats]`

両方が一致しているか確認

---

## 🎯 次のステップ

1. ✅ GitHub Actions ワークフローをコミット
2. ✅ GitHub PAT を作成
3. ✅ GitHub Secrets を設定
4. ✅ Vercel 環境変数を設定
5. ✅ Cron-job.org を設定
6. ✅ 手動テストで動作確認
7. ✅ 翌日3:00に自動実行されることを確認

---

## 📝 メンテナンス

### PAT の有効期限更新

Personal Access Token には有効期限があります（設定による）。期限切れ前に更新してください：

1. GitHub Settings → Developer settings → Personal access tokens
2. 期限切れのトークンを **Regenerate token**
3. 新しいトークンをコピー
4. Cron-job.org の設定を更新（Authorization ヘッダー）

---

## 📚 参考リンク

- [GitHub repository_dispatch イベント](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Cron-job.org](https://cron-job.org/)
- [Vercel 環境変数](https://vercel.com/docs/environment-variables)
