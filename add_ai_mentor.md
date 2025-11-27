あなたは、Next.js 15 (App Router) と Supabase のスペシャリストであり、LLMを用いたアプリケーション開発の専門家です。
現在開発中のエンジニア向けプラットフォーム「TechMight (UniPathfinder)」に、以下の要件に従って「AIによる成長分析とメンタリング機能」を実装してください。

## プロジェクトの現状 (Context)
- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Auth, PostgreSQL)
- **Styling:** Tailwind CSS v4
- **External API:** LINE Messaging API (実装済み), GitHub API
- **Utilities:** `src/utils/supabase/server.ts` 等にSupabaseクライアントの生成関数が存在

## 実装目標
ユーザーの「テックブログ投稿」と「GitHub活動状況」を元に、OpenAI (GPT-4o) がユーザーの成長をスコアリングし、LINEを通じて「並走するパートナー」としてフィードバックを送る機能を実装する。

## 具体的な実装ステップ

### 1. 環境構築とデータベース設計
- npm パッケージ `openai` をインストールする前提でコードを作成すること。
- Supabase の SQL Editor で実行すべき以下のマイグレーションSQLを作成すること:
  1. `vector` 拡張機能の有効化。
  2. `tech_blog_posts` テーブルに、ブログ内容のベクトルデータを保存する `embedding` カラム (vector(1536)) を追加。
  3. `user_engagement_status` テーブルに、AIによる分析結果を保存するカラム (`growth_score` (int), `ai_analysis_summary` (text), `last_analyzed_at` (timestamp)) を追加。

### 2. バックエンドロジック (Server Actions / API Route)
以下の機能を持つ `src/lib/ai-mentor.ts` (または適切な場所) を作成してください。

#### A. Embedding 生成機能
- ブログ記事が投稿・更新された際に、`content` と `title` を OpenAI Embeddings API (`text-embedding-3-small` 推奨) に投げ、ベクトル化してDBに保存する処理。

#### B. 成長分析 & メッセージ生成機能 (Core Logic)
- **Input:**
  - 最新のブログ記事の内容 (定性データ)
  - 直近7日間のGitHubコミット数と活動履歴 (定量データ)
- **Process (OpenAI GPT-4oへのプロンプト):**
  - ユーザーの「内省の深さ」と「継続力」を分析し、0~100でスコアリングする。
  - **人格設定 (Persona):** 「並走するパートナー」。上から目線の教師ではなく、一緒に頑張る同僚のようなトーン。
  - **出力内容:** 分析スコア、短いフィードバック要約、およびLINEで送るべきメッセージ（100文字程度）。
  - **条件:** GitHubのコミットが途絶えている時は「スランプ？」と心配し、ブログで深い考察があれば「その視点はすごい！」と共感する。

### 3. トリガーの実装 (Action Based)
以下の既存機能を修正、または新規作成して、上記ロジックを呼び出すようにしてください。

1. **ブログ投稿時:**
   - ブログ投稿API (またはServer Action) の完了直後に、Embedding生成とAI分析を実行し、即座にLINEで「記事書いたね！お疲れ様！」といったフィードバックを送る。

2. **GitHub同期時:**
   - 既存の `src/app/api/github/sync-daily-stats/route.ts` の処理完了後に、AI分析を実行。
   - もし「コミット数が0」が3日続いた場合などは、心配するLINEメッセージを送る判定を入れる。

### 4. LINE通知の連携
- 既存の `src/app/api/webhooks/line/route.ts` や関連ユーティリティを利用し、生成されたメッセージをユーザーのLINEにプッシュ通知する処理を統合する。

## 重要な制約事項
- **Next.js 15:** `next/server` の `NextRequest`, `NextResponse` を適切に使用すること。
- **Supabase:** `createClient` を使用し、Row Level Security (RLS) を意識すること。APIルート内では `supabase-js` の管理者権限が必要な場合があるため、適切なクライアント初期化を行うこと。
- **Error Handling:** OpenAI APIのエラーやLINE送信失敗が、メインの処理（ブログ投稿など）を失敗させないように、適切に try-catch で囲むこと。

## 出力形式
- 必要なファイルパスとそのコード内容
- 実行すべきSQLコマンド
- `.env.local` に追加すべき環境変数リスト

この要件で、コピー＆ペーストで実装可能なレベルの具体的なコードを提示してください。