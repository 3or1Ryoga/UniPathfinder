-- 技術スタック経験フィールドの追加
-- 実行日: 2025年（手動で実行してください）

-- 使用経験のある技術スタック・言語フィールドの追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tech_stack_experienced JSONB DEFAULT '[]'::jsonb;

-- カラムコメントの追加
COMMENT ON COLUMN public.profiles.tech_stack IS '興味のある技術スタック・言語（すべて）';
COMMENT ON COLUMN public.profiles.tech_stack_experienced IS '使用経験のある技術スタック・言語（tech_stackのサブセット）';

-- インデックスの追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_tech_stack_experienced ON public.profiles USING GIN (tech_stack_experienced);
