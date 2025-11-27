# AI Mentor機能 実装ガイド

## 概要

TechMightプラットフォームに、OpenAI GPT-4oを活用したAIメンタリング機能を実装しました。
ユーザーのテックブログ投稿とGitHub活動を分析し、成長をスコアリングして、LINEで並走するパートナーとしてフィードバックを送ります。

---

## 実装内容

### 1. データベーススキーマの拡張

#### マイグレーションファイル
`supabase/migrations/add_ai_mentor_features.sql`

#### 追加されたテーブルとカラム

##### `tech_blog_posts`テーブル
- **`embedding`** (vector(1536)): OpenAI Embeddings APIで生成されたベクトルデータ
  - 過去投稿との類似度分析に使用
  - IVFFlat インデックス付き（高速検索）

##### `user_engagement_status`テーブル
- **`growth_score`** (int): AI分析による成長スコア (0-100)
- **`ai_analysis_summary`** (text): AI分析の要約
- **`last_analyzed_at`** (timestamp): 最後にAI分析を実行した日時

##### 新規テーブル: `ai_mentor_notifications`
通知履歴を管理（1日1回制限を実装）
- `id` (uuid): 通知ID
- `user_id` (uuid): ユーザーID
- `notification_type` (text): 'blog_post' or 'github_sync'
- `message` (text): 送信したメッセージ
- `growth_score` (int): 成長スコア
- `analysis_summary` (text): 分析要約
- `sent_successfully` (boolean): 送信成功フラグ
- `error_message` (text): エラーメッセージ
- `created_at`, `sent_at` (timestamp)

**制約**: user_id + notification_type + 日付の組み合わせで一意（1日1回制限）

##### 新規テーブル: `line_push_errors`
LINE送信エラーログ
- `id` (uuid): エラーログID
- `user_id` (uuid): ユーザーID
- `line_user_id` (text): LINEユーザーID
- `message` (text): 送信しようとしたメッセージ
- `error_code` (text): エラーコード
- `error_message` (text): エラーメッセージ
- `notification_id` (uuid): 関連する通知ID
- `created_at` (timestamp)

---

### 2. 実装したファイル

#### **`src/lib/line-push-message.ts`**
LINE Messaging API プッシュメッセージ送信ユーティリティ
- `sendLinePushMessage()`: メッセージ送信
- `sendBulkLinePushMessages()`: 一斉送信（将来の拡張用）
- エラー時はデータベースにログ保存

#### **`src/lib/ai-mentor.ts`**
AI Mentorのコアロジック

**主要な機能**:
1. **Embedding生成**
   - `generateEmbedding()`: OpenAI text-embedding-3-small でベクトル化
   - `saveEmbedding()`: DBに保存

2. **類似度分析**
   - `analyzeSimilarityWithPreviousPosts()`: 過去投稿との類似度を計算
   - コサイン類似度を使用
   - 直近10件の投稿と比較

3. **GitHub統計取得**
   - `getGitHubStats()`: 過去7日間・14日間のコミット数を取得

4. **AI分析とメッセージ生成**
   - `analyzeGrowthAndGenerateMessage()`: GPT-4oで成長分析
   - 内省の深さと継続力を評価
   - 0-100のスコアリング
   - 丁寧で落ち着いたトーンのメッセージ生成

5. **通知頻度制限**
   - `checkNotificationLimit()`: 1日1回制限をチェック

6. **メイン処理**
   - `analyzeBlogPostAndNotify()`: ブログ投稿時の分析・通知
   - `analyzeGitHubActivityAndNotify()`: GitHub同期時の分析・通知

#### **`src/app/api/ai-mentor/analyze-post/route.ts`**
ブログ投稿分析API
- POST /api/ai-mentor/analyze-post
- 認証チェック、投稿所有者確認
- 非同期でAI分析を実行（エラーが発生してもクライアントには成功を返す）

#### **`src/app/home/page.tsx`** (修正)
ブログ投稿処理の修正
- `handleCreatePost()`: 投稿後にAI分析APIを呼び出す
- エラーが発生しても投稿処理には影響させない

#### **`src/app/api/github/sync-daily-stats/route.ts`** (修正)
GitHub同期処理の修正
- 統計同期成功後にAI分析を実行
- 全ユーザーに対して分析実行

---

## 環境変数

### 必須の環境変数

`.env.local`に以下を追加してください：

```bash
# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# LINE Messaging API（既存）
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_MESSAGING_CHANNEL_SECRET=your-line-messaging-channel-secret
```

### 環境変数の取得方法

#### OpenAI API Key
1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. API Keys セクションで新しいキーを作成
3. `OPENAI_API_KEY` にセット

#### LINE Messaging API（既存の設定を使用）
`LINE_MESSAGING_API_SETUP.md` を参照

---

## セットアップ手順

### 1. パッケージのインストール

```bash
npm install openai
```

### 2. データベースマイグレーションの実行

Supabase SQL Editorで以下を実行：

```bash
# ファイルの内容をコピー&ペースト
supabase/migrations/add_ai_mentor_features.sql
```

または、Supabase CLIを使用：

```bash
supabase db push
```

### 3. 環境変数の設定

`.env.local`に以下を追加：

```bash
OPENAI_API_KEY=sk-proj-...
```

### 4. アプリケーションの再起動

```bash
npm run dev
```

---

## 動作フロー

### A. ブログ投稿時のフロー

1. ユーザーがテックブログを投稿
2. `handleCreatePost()` が投稿をDBに保存
3. 投稿IDを使って `/api/ai-mentor/analyze-post` を呼び出し（非同期）
4. API内で `analyzeBlogPostAndNotify()` を実行：
   - 1日1回制限チェック
   - Embedding生成・保存
   - 過去投稿との類似度分析
   - GitHub統計取得
   - GPT-4oで成長分析
   - LINEメッセージ送信
   - 通知履歴を保存
   - `user_engagement_status` 更新

### B. GitHub同期時のフロー

1. Cronジョブ（24:00 JST）が `/api/github/sync-daily-stats` を実行
2. 各ユーザーのGitHub統計を同期
3. 同期成功後、`analyzeGitHubActivityAndNotify()` を実行：
   - 1日1回制限チェック
   - 通知条件チェック（停滞 or 活発）
   - GitHub統計取得
   - 最近のブログ投稿取得
   - GPT-4oでメッセージ生成
   - LINEメッセージ送信
   - 通知履歴を保存
   - `user_engagement_status` 更新

---

## 通知条件

### ブログ投稿時
- 常に分析・通知（ただし1日1回まで）

### GitHub同期時
以下のいずれかに該当する場合のみ通知：
- **停滞**: 過去14日間でコミット数が0
- **活発**: 過去7日間でコミット数が10以上

---

## AIメンターのペルソナ設定

### トーン
- 丁寧で落ち着いた
- 上から目線ではなく、並走するパートナー
- 共感と励ましを重視

### メッセージ例
- 「今日も投稿ありがとう。その考察は深いですね。一緒に成長していきましょう」
- 「コミットが続いていますね。着実な積み重ねが成長につながります」
- 「最近、活動が止まっているようですね。無理せず、できる範囲で続けていきましょう」

---

## エラーハンドリング

### OpenAI APIエラー
- ログ出力のみ
- フォールバックメッセージを送信

### LINE送信エラー
- ログ出力
- `line_push_errors` テーブルにエラーを保存
- メイン処理には影響させない

### 通知制限
- 1日1回まで（`ai_mentor_notifications`テーブルで管理）
- 制限に達した場合はスキップ

---

## データベーステーブル設計

### テーブル関係図

```
auth.users
    ↓
profiles (LINE情報)
    ↓
tech_blog_posts (embedding追加)
    ↓
ai_mentor_notifications (通知履歴)
    ↓
line_push_errors (エラーログ)

user_engagement_status (AI分析結果)
```

---

## パフォーマンス最適化

### Embedding検索
- IVFFlat インデックスを使用
- 直近10件の投稿のみ比較

### 非同期処理
- ブログ投稿APIは即座にレスポンスを返す
- AI分析は非同期で実行

### エラー耐性
- AI分析の失敗がメイン処理に影響しない
- try-catchで全ての処理を保護

---

## 監視とデバッグ

### ログ確認

```bash
# Vercel Logsで確認
[AI Mentor] Analyzing blog post for user xxx
[AI Mentor] Daily notification limit reached, skipping
[AI Mentor] Analysis completed successfully
```

### データベースクエリ

```sql
-- 通知履歴を確認
SELECT * FROM ai_mentor_notifications
ORDER BY created_at DESC
LIMIT 10;

-- エラーログを確認
SELECT * FROM line_push_errors
ORDER BY created_at DESC
LIMIT 10;

-- ユーザーの成長スコアを確認
SELECT user_id, growth_score, ai_analysis_summary, last_analyzed_at
FROM user_engagement_status
ORDER BY last_analyzed_at DESC;
```

---

## トラブルシューティング

### 通知が送られない

1. **LINE友達追加を確認**
   ```sql
   SELECT line_user_id, line_friend_added FROM profiles WHERE id = 'user-id';
   ```

2. **1日1回制限をチェック**
   ```sql
   SELECT * FROM ai_mentor_notifications
   WHERE user_id = 'user-id'
   AND DATE(created_at) = CURRENT_DATE;
   ```

3. **環境変数を確認**
   - `OPENAI_API_KEY`
   - `LINE_CHANNEL_ACCESS_TOKEN`

### Embeddingが生成されない

1. **OpenAI APIキーを確認**
2. **ログでエラーを確認**
3. **手動でテスト**
   ```typescript
   import { generateEmbedding } from '@/lib/ai-mentor'
   const embedding = await generateEmbedding('Test', 'Test content')
   ```

### GitHub同期時に分析されない

1. **通知条件を確認**（停滞 or 活発のみ）
2. **`analyzeGitHubActivityAndNotify` のログを確認**

---

## 将来の拡張

### 実装可能な機能
- [ ] ユーザーごとにメンター人格をカスタマイズ
- [ ] 週次/月次の成長レポート
- [ ] 他のユーザーとの比較分析
- [ ] スキル別の詳細フィードバック
- [ ] リアルタイムチャット機能

---

## セキュリティ

### Row Level Security (RLS)
- `ai_mentor_notifications`: ユーザーは自分の通知のみ閲覧可能
- `line_push_errors`: ユーザーは自分のエラーログのみ閲覧可能
- サービスロールは全ての操作が可能

### API認証
- `/api/ai-mentor/analyze-post`: 認証必須、投稿所有者確認

---

## まとめ

AI Mentor機能により、TechMightはユーザーの成長を自動的に分析し、適切なタイミングでフィードバックを送ることができるようになりました。

**実装の特徴**:
- ✅ OpenAI GPT-4oによる高度な分析
- ✅ 過去投稿との類似度分析で成長を可視化
- ✅ 1日1回制限でスパム防止
- ✅ エラー耐性の高い設計
- ✅ 丁寧で落ち着いたトーン
- ✅ 非同期処理でユーザー体験を損なわない

これにより、ユーザーは「並走するパートナー」として、常にAIメンターのサポートを受けながら成長することができます。
