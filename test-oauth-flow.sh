#!/bin/bash

echo "=== GitHub OAuth Test Flow ==="
echo ""
echo "【手順】"
echo "1. ブラウザのシークレットモードを開く"
echo "2. 以下のURLにアクセス:"
echo "   https://uni-pathfinder-lf9w.vercel.app/"
echo ""
echo "3. GitHub OAuthでログイン"
echo "4. 認証後、以下のSQLでトークンを確認:"
echo ""
echo "--- SQL Query ---"
cat <<'SQL'
SELECT
  email,
  github_username,
  LENGTH(github_access_token) as token_length,
  SUBSTRING(github_access_token, 1, 20) || '...' as token_preview,
  CASE
    WHEN github_access_token IS NULL THEN '❌ NULL'
    WHEN LENGTH(github_access_token) < 100 THEN '⚠️ 短い（無効）'
    WHEN LENGTH(github_access_token) > 100 THEN '✅ 正常（自動取得成功）'
  END as status,
  updated_at
FROM profiles
WHERE email = 'YOUR_TEST_EMAIL@gmail.com'
ORDER BY updated_at DESC
LIMIT 1;
SQL
echo ""
echo "【期待される結果】"
echo "✅ token_length: 200-300文字"
echo "✅ status: '✅ 正常（自動取得成功）'"
echo ""
echo "【もし❌ NULLまたは⚠️ 短い場合】"
echo "→ Vercelログで以下を確認:"
echo "  [DEBUG] GitHub OAuth data"
echo "  Provider Token exists: true"
echo "  Token length: 200+ characters"
