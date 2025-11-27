# GitHub開発サマリー機能 実装ガイド

## 概要

GitHubのコミット詳細を分析し、GPT-4oで日次の技術サマリーを自動生成する機能を実装しました。

### 主な機能
- **日次サマリー**: 毎日のコミット内容を分析し、「何をしたか」を自動で記録
- **技術的サマリー**: React Component、Hooks、型定義など、実装の本質を抽出
- **ノイズ除去**: package-lock.jsonなどの不要なファイルを自動フィルタリング
- **データベース保存**: 履歴として保存し、後で振り返り可能

---

## 実装内容

### 新規作成ファイル

1. **`supabase/migrations/add_github_summary_features.sql`**
   - データベーススキーマ拡張
   - `github_daily_stats`にサマリーカラム追加
   - `user_github_repos`テーブル作成（リポジトリ管理）
   - `github_weekly_summaries`テーブル作成（週次レポート用）

2. **`src/lib/github-commit-analyzer.ts`**
   - GitHub Compare APIでコミット差分を取得
   - ノイズ除去フィルタ（設定ファイル、ロックファイルを除外）
   - コードハイライト抽出（Component、Hooks、型定義を検出）

3. **`src/lib/github-summary-generator.ts`**
   - GPT-4oで技術サマリー生成
   - 日次サマリー（200文字程度）
   - 活動説明（100文字程度）
   - 週次成長レポート（将来の拡張用）

### 修正ファイル

4. **`src/app/api/github/sync-daily-stats/route.ts`**
   - 日次Cronジョブに統合
   - 統計同期後、自動でサマリー生成
   - エラー処理を追加

---

## セットアップ手順

### Step 1: データベースマイグレーション

Supabase SQL Editorで以下を実行：

```bash
supabase/migrations/add_github_summary_features.sql
```

実行内容：
- `github_daily_stats`に4つのカラム追加（commit_summary, activity_description, files_changed, code_highlights）
- `user_github_repos`テーブル作成
- `github_weekly_summaries`テーブル作成

### Step 2: アプリケーションの再起動

```bash
npm run dev
```

環境変数（`OPENAI_API_KEY`）は既に設定済みです。

---

## 使い方

### 1. リポジトリの自動検出

**GitHub連携を行うと、リポジトリが自動的に検出・登録されます！**

#### 自動検出のタイミング

1. **GitHub OAuth後**（初回ログイン時）
   - GitHub連携を行うと、即座にリポジトリを自動検出
   - 最もアクティブなリポジトリ上位3つを自動登録
   - 1つ目をプライマリリポジトリに設定

2. **日次Cronジョブ**（24:00 JST）
   - まだリポジトリが登録されていないユーザーを自動検出
   - 既存ユーザーの新規リポジトリも定期的に検出

#### 自動検出の条件

- **ユーザー所有 + 組織のリポジトリ** から検出
- **Forkは除外** - オリジナルのリポジトリのみ
- **最近プッシュされた順** - アクティブなリポジトリを優先
- **上位3つまで登録** - 最も活動しているリポジトリを自動選択

#### 手動登録（必要な場合のみ）

通常は自動検出で十分ですが、特定のリポジトリを指定したい場合はSQLで登録できます：

```sql
INSERT INTO user_github_repos (user_id, repo_owner, repo_name, is_primary)
VALUES (
  '【あなたのユーザーID】',
  '【GitHubユーザー名】',
  '【リポジトリ名】',
  true
);
```

---

### 2. 動作確認

#### A. GitHub連携でリポジトリ自動検出を確認

1. **GitHub連携を行う**
   - プラットフォームにログイン
   - GitHub OAuthでログイン
   - 自動的にリポジトリが検出されます

2. **ログで確認**
   ```
   [Repo Auto-Detect] Detecting repositories after GitHub OAuth for user: xxx
   [Repo Auto-Detect] Successfully registered 3 repositories. Primary: username/repo-name
   ```

3. **データベースで確認**
   ```sql
   SELECT repo_owner, repo_name, is_primary
   FROM user_github_repos
   WHERE user_id = '【あなたのユーザーID】'
   ORDER BY is_primary DESC;
   ```

#### B. Cronジョブの手動実行

日次Cronジョブを手動で実行してテストできます：

```bash
curl -X POST https://uni-pathfinder-lf9w.vercel.app/api/github/sync-daily-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

または、ローカル開発環境：

```bash
curl -X POST http://localhost:3000/api/github/sync-daily-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

#### C. ログの確認

ターミナルで以下のログが表示されます：

**リポジトリ自動検出**:
```
[Repo Auto-Detect] Running repository auto-detection...
[Repo Auto-Detect] Completed: 5 success, 0 failed out of 5 processed
```

**日次サマリー生成**:
```
[Daily Summary] Successfully generated summary for user xxx on 2025-11-27
```

#### D. データベースで確認

Supabase SQL Editorで実行：

```sql
-- 日次サマリーを確認
SELECT
  date,
  commit_count,
  commit_summary,
  activity_description
FROM github_daily_stats
WHERE user_id = '【あなたのユーザーID】'
  AND commit_summary IS NOT NULL
ORDER BY date DESC
LIMIT 5;

-- コードハイライトを確認
SELECT
  date,
  code_highlights
FROM github_daily_stats
WHERE user_id = '【あなたのユーザーID】'
  AND code_highlights IS NOT NULL
ORDER BY date DESC
LIMIT 5;
```

---

## データ構造

### github_daily_stats（拡張後）

| カラム名 | 型 | 説明 |
|---------|-----|-----|
| commit_summary | text | GPT-4oが生成した技術サマリー（200文字程度） |
| activity_description | text | その日の活動説明（100文字程度） |
| files_changed | jsonb | 変更されたファイルの詳細 |
| code_highlights | jsonb | 重要なコード変更のハイライト |

**files_changed の構造**:
```json
[
  {
    "filename": "src/app/login/page.tsx",
    "status": "modified",
    "additions": 10,
    "deletions": 2
  }
]
```

**code_highlights の構造**:
```json
[
  {
    "type": "component",
    "description": "React Componentを実装",
    "filename": "src/components/Button.tsx",
    "additions": 45,
    "deletions": 0
  },
  {
    "type": "hook",
    "description": "useStateを使用",
    "filename": "src/app/home/page.tsx",
    "additions": 5,
    "deletions": 1
  }
]
```

### user_github_repos

| カラム名 | 型 | 説明 |
|---------|-----|-----|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| repo_owner | text | リポジトリ所有者（GitHubユーザー名） |
| repo_name | text | リポジトリ名 |
| is_primary | boolean | メイン分析対象フラグ |

---

## 技術仕様

### ノイズ除去フィルタ

以下のファイルは自動で分析対象から除外されます：

- 依存関係ロックファイル（`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`）
- 設定ファイル（`tsconfig.json`, `.eslintrc.*`, `next.config.js`など）
- 型定義・ソースマップ（`.d.ts`, `.map`）
- 静的アセット（画像、フォント）
- ビルド成果物（`.next/`, `dist/`, `build/`）

### コードハイライト検出

以下のパターンを検出します：

**React Component**:
- `export default function`
- `return (`
- `<Component>`

**Hooks**:
- `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`など

**型定義**:
- `interface`, `type`, `enum`, `z.object`（Zod）

**ロジック**:
- `async function`, `await`, `.map()`, `.filter()`, `try/catch`

---

## トラブルシューティング

### リポジトリが自動検出されない

**原因1**: GitHub連携が完了していない

**解決策**:
```sql
-- GitHub連携状況を確認
SELECT github_username, github_access_token
FROM profiles
WHERE id = '【あなたのユーザーID】';
```
- `github_username`と`github_access_token`が両方とも設定されている必要があります
- 設定されていない場合は、GitHub OAuthで再ログインしてください

**原因2**: アクティブなリポジトリがない

**解決策**:
- Forkでないオリジナルリポジトリがあるか確認
- 最近プッシュしたリポジトリがあるか確認

**原因3**: 手動確認が必要

**解決策**:
```sql
-- 自動検出されたリポジトリを確認
SELECT repo_owner, repo_name, is_primary, created_at
FROM user_github_repos
WHERE user_id = '【あなたのユーザーID】'
ORDER BY created_at DESC;
```

### サマリーが生成されない

**原因1**: その日のコミットがない

**解決策**: コミットを作成してCronを実行

**原因2**: リポジトリが未登録（稀なケース）

**解決策**: GitHub OAuthで再ログイン、または手動でCronを実行

### Cronジョブが動かない

**ローカル開発環境では自動実行されません**。手動で実行してください：

```bash
curl -X POST http://localhost:3000/api/github/sync-daily-stats \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### OpenAI APIエラー

ログに以下のようなエラーが表示される場合：

```
Error generating daily summary: ...
```

**確認事項**:
1. `OPENAI_API_KEY`が正しく設定されているか
2. OpenAI APIのクレジットが残っているか
3. レート制限に引っかかっていないか

---

## サマリー例

### 日次サマリー（commit_summary）

```
React ComponentにuseStateとuseEffectを追加し、ログイン機能を実装しました。
TypeScriptのinterfaceを3つ定義し、型安全性を向上させました。
Tailwind CSSでレスポンシブデザインを改善し、モバイル対応を強化しました。
```

### 活動説明（activity_description）

```
ユーザー認証機能の実装とUI改善
```

---

## 次のフェーズ（UI実装）

基本機能が動作確認できたら、次の機能を実装予定：

1. **Activity/DevLogページ** - カレンダー形式で日次サマリーを表示
2. **タイムライン表示** - 美しいUIで開発履歴を可視化
3. **リポジトリ選択UI** - SQLを使わずにリポジトリを登録
4. **週次成長レポート** - 1週間分を集約して成長分析
5. **プロフィールページに表示** - 週次レポートをプロフィールに追加

---

## まとめ

**実装完了機能**:
- ✅ GitHub Commit Analyzer（コード変更の自動分析）
- ✅ GPT-4oによる技術サマリー生成
- ✅ **リポジトリ自動検出**（GitHub OAuth + 日次Cron）
- ✅ 日次サマリーのデータベース保存
- ✅ ノイズフィルタリング（config、lock files除外）
- ✅ コードハイライト抽出（React、Hooks、型定義）

**使い方**:
1. **GitHub連携** - GitHubでログインするだけで自動でリポジトリが検出されます
2. **コミット** - いつも通り開発してGitHubにプッシュ
3. **自動サマリー** - 毎日24:00（JST）に自動でサマリーが生成されます

**手動テスト（オプション）**:
1. マイグレーションSQLを実行（初回のみ）
2. Cronジョブを手動実行してテスト
3. データベースでサマリーを確認

**次のフェーズ（UI実装）**:
- Activity/DevLogページ（カレンダー + タイムライン）
- 週次成長レポート表示
- プロフィールページへの統合
