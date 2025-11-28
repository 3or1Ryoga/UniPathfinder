-- AI Mentor Chat機能のためのテーブル作成
-- 実行日: 2025-11-28
-- 説明: チャットセッションとメッセージを管理するテーブル

-- ========================================
-- 1. chat_sessionsテーブルの作成
-- ========================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '新しい会話',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);

-- ========================================
-- 2. chat_messagesテーブルの作成
-- ========================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- ========================================
-- 3. Row Level Security (RLS) の設定
-- ========================================

-- chat_sessionsテーブルのRLS有効化
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のセッションのみ閲覧可能
CREATE POLICY "Users can view their own sessions"
    ON public.chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ作成可能
CREATE POLICY "Users can create their own sessions"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ更新可能
CREATE POLICY "Users can update their own sessions"
    ON public.chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ削除可能
CREATE POLICY "Users can delete their own sessions"
    ON public.chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- chat_messagesテーブルのRLS有効化
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のセッションのメッセージのみ閲覧可能
CREATE POLICY "Users can view messages in their sessions"
    ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションにメッセージを作成可能
CREATE POLICY "Users can create messages in their sessions"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションのメッセージを削除可能
CREATE POLICY "Users can delete messages in their sessions"
    ON public.chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ========================================
-- 4. トリガー関数とトリガーの作成
-- ========================================

-- updated_atを自動更新するトリガー（chat_sessions用）
CREATE TRIGGER set_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- 5. コメントの追加
-- ========================================
COMMENT ON TABLE public.chat_sessions IS 'AI Mentorチャットのセッション管理テーブル';
COMMENT ON COLUMN public.chat_sessions.user_id IS 'ユーザーID（auth.usersへの外部キー）';
COMMENT ON COLUMN public.chat_sessions.title IS 'チャットセッションのタイトル';

COMMENT ON TABLE public.chat_messages IS 'AI Mentorチャットのメッセージ履歴テーブル';
COMMENT ON COLUMN public.chat_messages.session_id IS 'セッションID（chat_sessionsへの外部キー）';
COMMENT ON COLUMN public.chat_messages.role IS 'メッセージの送信者（user, assistant, system）';
COMMENT ON COLUMN public.chat_messages.content IS 'メッセージの内容';
