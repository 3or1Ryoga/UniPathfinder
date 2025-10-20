-- ユーザーエンゲージメント状態テーブルの作成
-- 実行日: 2025年（手動で実行してください）

-- ユーザーのGitHubアクティビティに基づくエンゲージメント状態を保存するテーブル
CREATE TABLE IF NOT EXISTS public.user_engagement_status (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'stagnant', 'normal')),

  -- 統計情報
  commits_last_7days INTEGER NOT NULL DEFAULT 0,
  commits_last_14days INTEGER NOT NULL DEFAULT 0,
  last_commit_date DATE,

  -- 推奨メッセージ情報
  recommended_message_type VARCHAR(20),
  last_notified_at TIMESTAMP WITH TIME ZONE,

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT user_engagement_status_pkey PRIMARY KEY (id),
  CONSTRAINT user_engagement_status_user_id_key UNIQUE (user_id),
  CONSTRAINT user_engagement_status_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_engagement_status_user_id
  ON public.user_engagement_status USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_engagement_status_status
  ON public.user_engagement_status USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_engagement_status_updated_at
  ON public.user_engagement_status USING btree (updated_at DESC) TABLESPACE pg_default;

-- カラムコメントの追加
COMMENT ON TABLE public.user_engagement_status IS 'ユーザーのGitHubアクティビティに基づくエンゲージメント状態';
COMMENT ON COLUMN public.user_engagement_status.status IS 'エンゲージメント状態: active（アクティブ）, stagnant（停滞）, normal（通常）';
COMMENT ON COLUMN public.user_engagement_status.commits_last_7days IS '過去7日間のコミット数';
COMMENT ON COLUMN public.user_engagement_status.commits_last_14days IS '過去14日間のコミット数';
COMMENT ON COLUMN public.user_engagement_status.last_commit_date IS '最後のコミット日';
COMMENT ON COLUMN public.user_engagement_status.recommended_message_type IS '推奨メッセージタイプ: active_encouragement, stagnant_reminder';
COMMENT ON COLUMN public.user_engagement_status.last_notified_at IS '最後に通知を送った日時（手動通知の記録用）';

-- updated_atトリガーの作成（既存の場合は削除してから再作成）
DROP TRIGGER IF EXISTS set_updated_at ON public.user_engagement_status;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_engagement_status
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS（Row Level Security）の設定
ALTER TABLE public.user_engagement_status ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view own engagement status" ON public.user_engagement_status;
DROP POLICY IF EXISTS "Authenticated users can view all engagement status" ON public.user_engagement_status;
DROP POLICY IF EXISTS "Service role can manage all engagement status" ON public.user_engagement_status;

-- ポリシー: ユーザーは自分のエンゲージメント状態を閲覧可能
CREATE POLICY "Users can view own engagement status"
  ON public.user_engagement_status
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: 認証済みユーザーは全てのエンゲージメント状態を閲覧可能（管理者用）
-- 本番環境では、特定の管理者ロールのみに制限することを推奨
CREATE POLICY "Authenticated users can view all engagement status"
  ON public.user_engagement_status
  FOR SELECT
  TO authenticated
  USING (true);

-- ポリシー: サービスロールは全操作可能（API用）
CREATE POLICY "Service role can manage all engagement status"
  ON public.user_engagement_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
