-- いいね機能のテーブル作成
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES tech_blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id) -- 1ユーザーは1投稿に1回だけいいねできる
);

-- コメント機能のテーブル作成
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES tech_blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

-- RLSポリシー設定

-- post_likes テーブルのRLS有効化
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Everyone can view likes" ON post_likes;
DROP POLICY IF EXISTS "Users can add their own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;

-- 誰でも全てのいいねを閲覧可能
CREATE POLICY "Everyone can view likes"
  ON post_likes FOR SELECT
  USING (true);

-- 認証済みユーザーは自分のいいねを追加可能
CREATE POLICY "Users can add their own likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分のいいねを削除可能
CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- post_comments テーブルのRLS有効化
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Everyone can view comments on public posts" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can add comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

-- 誰でも公開投稿のコメントを閲覧可能
CREATE POLICY "Everyone can view comments on public posts"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tech_blog_posts
      WHERE tech_blog_posts.id = post_comments.post_id
      AND tech_blog_posts.is_public = true
    )
  );

-- 認証済みユーザーはコメントを追加可能
CREATE POLICY "Authenticated users can add comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分のコメントを更新可能
CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- 認証済みユーザーは自分のコメントを削除可能
CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);
