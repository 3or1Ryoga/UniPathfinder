# データベース設定手順

## メールアドレスをprofilesテーブルに保存する設定

### 1. Supabaseダッシュボードでの設定

1. **Supabaseダッシュボードにログイン**
   - https://supabase.com/dashboard
   - 該当プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから「SQL Editor」を選択

3. **以下のSQLを実行**
   ```sql
   -- Add email column to profiles table
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

   -- Create or replace the trigger function to automatically create/update profile on user creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name, username, email, updated_at)
     VALUES (
       new.id, 
       new.raw_user_meta_data->>'full_name',
       new.raw_user_meta_data->>'username',
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

   -- Drop existing trigger if it exists
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

   -- Create trigger to call the function on user creation or update
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT OR UPDATE ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

   -- Update existing profiles with email from auth.users
   UPDATE public.profiles p
   SET email = u.email
   FROM auth.users u
   WHERE p.id = u.id
   AND p.email IS NULL;
   ```

4. **「Run」ボタンをクリック**
   - SQLが正常に実行されたことを確認

### 2. 実装の確認

実装により、以下が可能になります：

1. **自動保存**: 新規ユーザー登録時に、メールアドレスが自動的にprofilesテーブルに保存されます

2. **既存ユーザー**: 既存ユーザーのメールアドレスも、上記SQLによってprofilesテーブルに追加されます

3. **プロファイル更新**: ユーザーがプロファイルを更新する際も、メールアドレスが保存されます

### 3. データの確認方法

Supabaseダッシュボードで確認：

1. 「Table Editor」を選択
2. 「profiles」テーブルを選択
3. 「email」カラムが追加され、データが保存されていることを確認

### 4. トラブルシューティング

**エラーが発生した場合**:

1. **権限エラー**: Supabaseダッシュボードで「Database」→「Roles」から適切な権限が設定されているか確認

2. **カラムが既に存在**: emailカラムが既に存在する場合は、ALTER TABLEの行をスキップして実行

3. **トリガーの競合**: 既存のトリガーがある場合は、まずDROP TRIGGERで削除してから新しいトリガーを作成