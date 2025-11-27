-- ========================================
-- GitHub Repository Auto-Detection Debug Queries
-- ========================================

-- 1. GitHub連携済みユーザーの確認
SELECT
  id,
  email,
  github_username,
  CASE
    WHEN github_access_token IS NOT NULL THEN 'あり'
    ELSE 'なし'
  END as access_token_status,
  created_at
FROM profiles
WHERE github_username IS NOT NULL
ORDER BY created_at DESC;

-- 2. 登録済みリポジトリの確認
SELECT
  ugr.user_id,
  p.github_username,
  ugr.repo_owner,
  ugr.repo_name,
  ugr.is_primary,
  ugr.created_at
FROM user_github_repos ugr
LEFT JOIN profiles p ON ugr.user_id = p.id
ORDER BY ugr.created_at DESC;

-- 3. GitHub連携済みだがリポジトリ未登録のユーザー
SELECT
  p.id,
  p.email,
  p.github_username,
  CASE
    WHEN p.github_access_token IS NOT NULL THEN 'あり'
    ELSE 'なし'
  END as access_token_status
FROM profiles p
LEFT JOIN user_github_repos ugr ON p.user_id = ugr.user_id
WHERE p.github_username IS NOT NULL
  AND p.github_access_token IS NOT NULL
  AND ugr.id IS NULL;

-- 4. 自分のユーザー情報を確認（メールアドレスを指定）
-- ※ 'your-email@example.com' を自分のメールアドレスに置き換えてください
SELECT
  id,
  email,
  github_username,
  CASE
    WHEN github_access_token IS NOT NULL THEN '✅ あり'
    ELSE '❌ なし'
  END as token_status,
  LENGTH(github_access_token) as token_length
FROM profiles
WHERE email = 'your-email@example.com';

-- 5. 自分のリポジトリ登録状況を確認
-- ※ user_id を自分のIDに置き換えてください
SELECT
  repo_owner,
  repo_name,
  is_primary,
  created_at
FROM user_github_repos
WHERE user_id = 'your-user-id'
ORDER BY is_primary DESC, created_at DESC;
