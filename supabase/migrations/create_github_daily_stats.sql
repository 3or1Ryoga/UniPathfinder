-- GitHub Daily Stats テーブルの作成
-- ユーザーの日次GitHubアクティビティをキャッシュするテーブル

CREATE TABLE IF NOT EXISTS public.github_daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    commit_count INTEGER DEFAULT 0 NOT NULL,
    push_event_count INTEGER DEFAULT 0 NOT NULL,
    issue_count INTEGER DEFAULT 0 NOT NULL,
    pull_request_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- ユニーク制約: 1ユーザーにつき1日1レコード
    UNIQUE(user_id, date)
);

-- インデックスの作成（高速検索のため）
CREATE INDEX IF NOT EXISTS idx_github_daily_stats_user_id ON public.github_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_github_daily_stats_date ON public.github_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_github_daily_stats_user_date ON public.github_daily_stats(user_id, date DESC);

-- Row Level Security (RLS) の有効化
ALTER TABLE public.github_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view their own github stats"
    ON public.github_daily_stats
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert their own github stats"
    ON public.github_daily_stats
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update their own github stats"
    ON public.github_daily_stats
    FOR UPDATE
    USING (auth.uid() = user_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.github_daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- コメント追加
COMMENT ON TABLE public.github_daily_stats IS 'GitHubの日次アクティビティ統計をキャッシュするテーブル';
COMMENT ON COLUMN public.github_daily_stats.user_id IS 'ユーザーID（auth.usersへの外部キー）';
COMMENT ON COLUMN public.github_daily_stats.date IS 'データの日付（JST基準）';
COMMENT ON COLUMN public.github_daily_stats.commit_count IS 'その日のコミット数';
COMMENT ON COLUMN public.github_daily_stats.push_event_count IS 'その日のプッシュイベント数';
COMMENT ON COLUMN public.github_daily_stats.issue_count IS 'その日のIssue関連アクティビティ数';
COMMENT ON COLUMN public.github_daily_stats.pull_request_count IS 'その日のPull Request関連アクティビティ数';
