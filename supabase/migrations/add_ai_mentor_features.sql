-- AI Mentor機能のためのデータベース拡張
-- 実行日: 2025-11-27
-- 説明: ブログ投稿のEmbedding、AI分析スコア、通知管理テーブルを追加

-- ========================================
-- 1. Vector拡張機能の有効化
-- ========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- 2. tech_blog_postsテーブルにEmbeddingカラムを追加
-- ========================================
ALTER TABLE tech_blog_posts
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Embeddingカラムにインデックスを作成（類似度検索の高速化）
CREATE INDEX IF NOT EXISTS tech_blog_posts_embedding_idx
ON tech_blog_posts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ========================================
-- 3. user_engagement_statusテーブルにAI分析カラムを追加
-- ========================================
ALTER TABLE user_engagement_status
ADD COLUMN IF NOT EXISTS growth_score int,
ADD COLUMN IF NOT EXISTS ai_analysis_summary text,
ADD COLUMN IF NOT EXISTS last_analyzed_at timestamp with time zone;

-- growth_scoreにチェック制約を追加（0〜100の範囲）
ALTER TABLE user_engagement_status
ADD CONSTRAINT growth_score_range
CHECK (growth_score IS NULL OR (growth_score >= 0 AND growth_score <= 100));

-- ========================================
-- 4. AI Mentor通知管理テーブルの作成
-- ========================================
CREATE TABLE IF NOT EXISTS ai_mentor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'blog_post' or 'github_sync'
  notification_date date NOT NULL DEFAULT CURRENT_DATE, -- 1日1回制限用の日付カラム
  message text NOT NULL,
  growth_score int,
  analysis_summary text,
  sent_successfully boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,

  -- 制約: user_idとnotification_typeと日付の組み合わせで1日1回まで
  CONSTRAINT ai_mentor_notifications_user_type_date_unique
  UNIQUE (user_id, notification_type, notification_date)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS ai_mentor_notifications_user_id_idx
ON ai_mentor_notifications(user_id);

CREATE INDEX IF NOT EXISTS ai_mentor_notifications_created_at_idx
ON ai_mentor_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS ai_mentor_notifications_sent_successfully_idx
ON ai_mentor_notifications(sent_successfully)
WHERE sent_successfully = false;

-- ========================================
-- 5. LINE送信エラーログテーブルの作成
-- ========================================
CREATE TABLE IF NOT EXISTS line_push_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id text,
  message text NOT NULL,
  error_code text,
  error_message text NOT NULL,
  notification_id uuid REFERENCES ai_mentor_notifications(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS line_push_errors_user_id_idx
ON line_push_errors(user_id);

CREATE INDEX IF NOT EXISTS line_push_errors_created_at_idx
ON line_push_errors(created_at DESC);

-- ========================================
-- 6. Row Level Security (RLS) ポリシーの設定
-- ========================================

-- ai_mentor_notificationsテーブルのRLS有効化
ALTER TABLE ai_mentor_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧可能
CREATE POLICY "Users can view their own notifications"
ON ai_mentor_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- サービスロールは全ての操作が可能（挿入・更新はバックエンドから実行）
CREATE POLICY "Service role can manage all notifications"
ON ai_mentor_notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- line_push_errorsテーブルのRLS有効化
ALTER TABLE line_push_errors ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエラーログのみ閲覧可能
CREATE POLICY "Users can view their own error logs"
ON line_push_errors
FOR SELECT
USING (auth.uid() = user_id);

-- サービスロールは全ての操作が可能
CREATE POLICY "Service role can manage all error logs"
ON line_push_errors
FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================
-- 7. コメント
-- ========================================
COMMENT ON COLUMN tech_blog_posts.embedding IS 'OpenAI Embeddings API (text-embedding-3-small) で生成されたベクトルデータ';
COMMENT ON COLUMN user_engagement_status.growth_score IS 'AI分析による成長スコア (0-100)';
COMMENT ON COLUMN user_engagement_status.ai_analysis_summary IS 'AI分析の要約';
COMMENT ON COLUMN user_engagement_status.last_analyzed_at IS '最後にAI分析を実行した日時';
COMMENT ON TABLE ai_mentor_notifications IS 'AI Mentorからの通知履歴（1日1回制限付き）';
COMMENT ON TABLE line_push_errors IS 'LINEプッシュメッセージ送信エラーログ';
