#!/bin/bash

# Cronジョブを実行して詳細なレスポンスを表示
echo "=== Cron Job Debug ==="
echo "Executing sync-daily-stats..."
echo ""

# ローカル環境の場合
curl -X POST http://localhost:3000/api/github/sync-daily-stats \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -v 2>&1 | tee cron-response.log

echo ""
echo "=== Response saved to cron-response.log ==="
