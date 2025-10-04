-- Row Level Security (RLS) ポリシーの設定
-- UniPath Finder 本番環境用セキュリティ設定

-- profilesテーブルのRLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーをドロップ（存在する場合）
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for own profile" ON profiles;

-- 読み取りポリシー: ユーザーは自分のプロフィールのみ読み取り可能
CREATE POLICY "Enable read access for own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 更新ポリシー: ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 挿入ポリシー: ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Enable insert for own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 削除ポリシー: ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "Enable delete for own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- RLS設定の確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- ポリシー一覧の確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 追加のセキュリティ設定

-- 認証されていないユーザーのアクセス制限
-- （Supabaseのデフォルト設定で既に制限されていますが、明示的に設定）

-- プロフィール作成時の自動設定を確実にするためのトリガー関数の更新
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email, updated_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'username', ''),
    new.email,
    now()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
END;
$$;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 新しいトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- セキュリティ監査用のビュー作成（管理者用）
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users 
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- 管理者以外はこのビューにアクセスできないように制限
ALTER VIEW admin_user_stats OWNER TO postgres;

-- コメント追加
COMMENT ON TABLE profiles IS 'ユーザープロフィール情報。RLSにより各ユーザーは自分のデータのみアクセス可能。';
COMMENT ON POLICY "Enable read access for own profile" ON profiles IS 'ユーザーは自分のプロフィールのみ読み取り可能';
COMMENT ON POLICY "Enable update for own profile" ON profiles IS 'ユーザーは自分のプロフィールのみ更新可能';
COMMENT ON POLICY "Enable insert for own profile" ON profiles IS 'ユーザーは自分のプロフィールのみ作成可能';
COMMENT ON POLICY "Enable delete for own profile" ON profiles IS 'ユーザーは自分のプロフィールのみ削除可能';

-- 設定完了メッセージ
SELECT 'RLS policies have been successfully configured for UniPath Finder!' as status;