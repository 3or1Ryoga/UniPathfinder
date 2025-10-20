-- プロフィールテーブルの拡張（オンボーディング改善 Part 2）
-- 実行日: 2025年（手動で実行してください）

-- スキル関連フィールドの追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hard_skills JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS soft_skills JSONB DEFAULT '[]'::jsonb;

-- AI/LLM関連フィールドの追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_usage_scenarios JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_tools_experience JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_interest_direction TEXT;

-- カラムコメントの追加
COMMENT ON COLUMN public.profiles.hard_skills IS '開発手法・ハードスキル（例：TDD, CI/CD, アジャイルなど）';
COMMENT ON COLUMN public.profiles.soft_skills IS 'ソフトスキル（例：チームワーク、コミュニケーション、問題解決など）';
COMMENT ON COLUMN public.profiles.ai_usage_scenarios IS '日常的なAI使用用途（例：コーディング補助、デバッグ、学習支援など）';
COMMENT ON COLUMN public.profiles.ai_tools_experience IS '使用経験のあるAIツール（例：ChatGPT, GitHub Copilot, Cursorなど）';
COMMENT ON COLUMN public.profiles.ai_interest_direction IS 'AI技術への関心方向（使う側/作る側/両方）';
COMMENT ON COLUMN public.profiles.skills IS '【非推奨】tech_stack, hard_skills, soft_skillsに移行';

-- インデックスの追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_hard_skills ON public.profiles USING GIN (hard_skills);
CREATE INDEX IF NOT EXISTS idx_profiles_soft_skills ON public.profiles USING GIN (soft_skills);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_usage ON public.profiles USING GIN (ai_usage_scenarios);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_tools ON public.profiles USING GIN (ai_tools_experience);
