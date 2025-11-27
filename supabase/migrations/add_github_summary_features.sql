-- GitHub開発サマリー機能のためのデータベース拡張
-- 実行日: 2025-11-27
-- 説明: GitHubコミット詳細分析、日次サマリー、週次成長レポート機能を追加

-- ========================================
-- 1. github_daily_statsテーブルにサマリーカラムを追加
-- ========================================

-- 日次の技術サマリー
ALTER TABLE github_daily_stats
ADD COLUMN IF NOT EXISTS commit_summary text,
ADD COLUMN IF NOT EXISTS activity_description text,
ADD COLUMN IF NOT EXISTS files_changed jsonb,
ADD COLUMN IF NOT EXISTS code_highlights jsonb;

-- インデックスの作成（JSONB検索用）
CREATE INDEX IF NOT EXISTS github_daily_stats_files_changed_idx
ON github_daily_stats USING gin (files_changed);

CREATE INDEX IF NOT EXISTS github_daily_stats_code_highlights_idx
ON github_daily_stats USING gin (code_highlights);

-- ========================================
-- 2. ユーザーGitHubリポジトリ管理テーブルの作成
-- ========================================

CREATE TABLE IF NOT EXISTS user_github_repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_owner text NOT NULL,  -- リポジトリ所有者名（GitHubユーザー名または組織名）
  repo_name text NOT NULL,   -- リポジトリ名
  is_primary boolean DEFAULT false,  -- メイン分析対象フラグ
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- 制約: 同じユーザーが同じリポジトリを複数登録できないようにする
  CONSTRAINT user_github_repos_unique UNIQUE (user_id, repo_owner, repo_name)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS user_github_repos_user_id_idx
ON user_github_repos(user_id);

CREATE INDEX IF NOT EXISTS user_github_repos_is_primary_idx
ON user_github_repos(user_id, is_primary)
WHERE is_primary = true;

-- ========================================
-- 3. GitHub週次サマリーテーブルの作成
-- ========================================

CREATE TABLE IF NOT EXISTS github_weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,  -- 週の開始日（月曜日）
  week_end_date date NOT NULL,    -- 週の終了日（日曜日）
  growth_summary text,            -- 週次成長レポート（GPT-4o生成）
  achievements jsonb,             -- 週の達成内容
  technical_progress jsonb,       -- 技術的進捗
  total_commits int DEFAULT 0,
  total_files_changed int DEFAULT 0,
  total_additions int DEFAULT 0,
  total_deletions int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),

  -- 制約: 同じユーザーの同じ週のサマリーは1つまで
  CONSTRAINT github_weekly_summaries_unique UNIQUE (user_id, week_start_date)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS github_weekly_summaries_user_id_idx
ON github_weekly_summaries(user_id);

CREATE INDEX IF NOT EXISTS github_weekly_summaries_week_start_idx
ON github_weekly_summaries(week_start_date DESC);

CREATE INDEX IF NOT EXISTS github_weekly_summaries_achievements_idx
ON github_weekly_summaries USING gin (achievements);

CREATE INDEX IF NOT EXISTS github_weekly_summaries_technical_progress_idx
ON github_weekly_summaries USING gin (technical_progress);

-- ========================================
-- 4. Row Level Security (RLS) ポリシーの設定
-- ========================================

-- user_github_reposテーブルのRLS有効化
ALTER TABLE user_github_repos ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のリポジトリのみ閲覧・編集可能
CREATE POLICY "Users can view their own repos"
ON user_github_repos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repos"
ON user_github_repos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repos"
ON user_github_repos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repos"
ON user_github_repos
FOR DELETE
USING (auth.uid() = user_id);

-- github_weekly_summariesテーブルのRLS有効化
ALTER TABLE github_weekly_summaries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の週次サマリーのみ閲覧可能
CREATE POLICY "Users can view their own weekly summaries"
ON github_weekly_summaries
FOR SELECT
USING (auth.uid() = user_id);

-- サービスロールは全ての操作が可能
CREATE POLICY "Service role can manage all weekly summaries"
ON github_weekly_summaries
FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================
-- 5. コメント
-- ========================================

COMMENT ON COLUMN github_daily_stats.commit_summary IS 'GPT-4oが生成した日次の技術サマリー';
COMMENT ON COLUMN github_daily_stats.activity_description IS 'その日に何をしていたかの説明';
COMMENT ON COLUMN github_daily_stats.files_changed IS '変更されたファイルの詳細情報（JSON）';
COMMENT ON COLUMN github_daily_stats.code_highlights IS '重要なコード変更のハイライト（JSON）';

COMMENT ON TABLE user_github_repos IS 'ユーザーが選択したGitHubリポジトリの管理';
COMMENT ON COLUMN user_github_repos.is_primary IS 'メイン分析対象のリポジトリ（1ユーザー1つまで推奨）';

COMMENT ON TABLE github_weekly_summaries IS 'GitHub週次成長レポート';
COMMENT ON COLUMN github_weekly_summaries.growth_summary IS 'GPT-4oが生成した週次成長レポート';
COMMENT ON COLUMN github_weekly_summaries.achievements IS '週の達成内容（JSON）';
COMMENT ON COLUMN github_weekly_summaries.technical_progress IS '技術的な進捗（JSON）';

-- ========================================
-- 6. トリガー: updated_at自動更新
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_github_repos_updated_at
BEFORE UPDATE ON user_github_repos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
