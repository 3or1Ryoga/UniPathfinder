あなたはNext.js (App Router), Supabase, Vercel AI SDKの専門家です。
現在開発中の「学生エンジニア.com (TechMight)」において、ユーザーの学習を伴走し、対話データ蓄積する**「AIメンターチャット機能」**を実装してください。

## 1. 機能の目的
ユーザーが学習中や開発中に気軽に相談できるチャットインターフェースを提供します。
重要な要件は、AIが**「ユーザーの直近のアウトプット（GitHub/ブログ）」を知った状態で会話すること**です。これにより、ユーザーから能動的な発言を引き出します。

## 2. 実装コンポーネント

### A. Database (Supabase)
会話履歴を保存するためのテーブルを作成するSQLを用意してください。
- `chat_sessions`: セッション管理 (id, user_id, title, created_at)
- `chat_messages`: メッセージ履歴 (id, session_id, role, content, created_at)

### B. API Route (`src/app/api/chat/route.ts`)
Vercel AI SDK (`streamText`) を使用してチャットAPIを実装してください。

**重要：コンテキスト注入ロジック**
ユーザーからのメッセージをOpenAIに投げる直前に、以下のデータをDBから取得し、System Promptに動的に挿入してください。
1. **GitHub Activity:** 直近24時間の `github_daily_stats` (コミット数、触ったリポジトリ名)。
2. **Recent Thoughts:** 直近の `tech_blog_posts` のタイトル1件。
3. **User Profile:** `profiles` テーブルの `main_role` (例: バックエンド志向)。

**System Promptの指示:**
「あなたはユーザーの専属メンターです。以下のユーザー状況を踏まえて会話してください。
- 今日は {commit_count} 回コミットしており、{repo_name} に取り組んでいます。
- 直近では {blog_title} について考えています。
ユーザーが技術的な質問をした場合は答え、停滞している場合は『今日の進捗はどうですか？』と優しく問いかけてください。」

### C. UI Component (`src/components/chat/AiMentorChat.tsx`)
添付画像のような、シンプルでモダンなチャットUIを実装してください。

- **配置:** 画面右下のフローティングボタン（FAB）。クリックするとチャットウィンドウがポップアップ展開される。
- **デザイン:**
  - ヘッダー: AIアイコンと「AI Mentor」の文字。
  - メッセージエリア: ユーザー（右側・青）、AI（左側・グレー）。
  - 入力エリア: テキストエリアと送信ボタン。
- **機能:** `useChat` フック (Vercel AI SDK) を使用し、ストリーミング応答を表示する。

## 3. 技術要件
- **Framework:** Next.js 15, Tailwind CSS
- **Library:** `ai` (Vercel AI SDK), `lucide-react` (Icons)
- **Model:** `gpt-4o` (推奨)

## 4. 開発プロセス
1. 必要なパッケージ (`ai @ai-sdk/openai`) のインストールコマンドを提示。
2. SupabaseのマイグレーションSQL (`migrations/005_create_chat_tables.sql`) を作成。
3. APIルートの実装。
4. UIコンポーネントの実装。
5. `src/app/layout.tsx` または `dashboard/layout.tsx` にコンポーネントを配置。

この仕様に基づき、コピー＆ペーストで動作するコードを作成してください。