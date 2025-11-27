#!/bin/bash

# Supabase Auth設定を再確認＆再起動するスクリプト

PROJECT_ID="wfvcxxpasvgrzhexoylx"
API_KEY="sbp_81a74f0149f782fa377a47f03f7bca1c05b7dd29"

echo "=== Supabase Auth Configuration Check ==="
echo ""
echo "Step 1: 現在の sessions_provider_token 設定を確認"
echo ""

curl -s "https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth" \
  -H "Authorization: Bearer ${API_KEY}" \
  | grep -o '"sessions_provider_token":[^,]*'

echo ""
echo ""
echo "期待される結果: \"sessions_provider_token\":true"
echo ""
echo "---"
echo ""
echo "Step 2: Authサービスの再起動（必要な場合）"
echo ""
echo "以下のコマンドで再起動できます:"
echo ""
echo "curl -X POST \"https://api.supabase.com/v1/projects/${PROJECT_ID}/database/restart\" \\"
echo "  -H \"Authorization: Bearer ${API_KEY}\""
echo ""
echo "⚠️ 注意: データベース再起動は数分かかります"
echo ""
