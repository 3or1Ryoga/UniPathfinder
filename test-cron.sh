#!/bin/bash

# Cronジョブを手動実行するスクリプト
# 使い方: ./test-cron.sh

echo "=== GitHub Daily Stats Cron Job Test ==="
echo ""

# CRON_SECRETの確認
if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET is not set"
  echo "Please set CRON_SECRET environment variable:"
  echo "  export CRON_SECRET='your-cron-secret'"
  exit 1
fi

echo "✓ CRON_SECRET is set"
echo ""

# 本番環境のURL
PROD_URL="https://uni-pathfinder-lf9w.vercel.app/api/github/sync-daily-stats"

echo "Calling: $PROD_URL"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "=== Response ==="
echo ""

# Cronジョブを実行
curl -X POST "$PROD_URL" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq . || cat

echo ""
echo "=== Completed ==="
echo ""
echo "Next steps:"
echo "1. Check Vercel logs: https://vercel.com/your-project/logs"
echo "2. Check database with SQL queries (see below)"
