🚀 実装指示書：企業向けタレント詳細ページ (The Evidence Profile)
1. ページ概要
企業の採用担当者が閲覧する学生プロフィールページ (src/app/talent/[userId]/page.tsx) を実装してください。 **「自己申告（Onboarding）」と「実態（GitHub/Blog）」を突き合わせ、その学生の「現在地」と「成長の軌跡（Path）」**を可視化します。

2. データソース定義
A. Static Profile (Onboarding Data)
profiles テーブルを使用。

Role: main_role (例: フルスタックエンジニア)

Experience: experience (例: 独学で勉強中)

Interests: career_interests (例: AI/機械学習, Web開発)

Work Style: work_values / preferred_locations (例: フルリモート希望, 東京)

B. Dynamic Activity (GitHub & Blog)
Quantitative: github_daily_stats (日次活動量)

Qualitative: tech_blog_posts (思考・定性データ)

AI Summary: github_daily_stats 内の以下のカラムを活用する（src/lib/github-summary-generator.ts で生成済みと想定）。

commit_summary

activity_description

file_changed

code_highlights

3. 実装コンポーネント仕様
Section 1: The "NOW" Card (現在地の定義)
ファーストビューで「この人は今、何をしている何者か」を端的に表示する。

Primary Role: profiles.main_role を大きく表示。

Current Focus (AI生成):

直近3日間の github_daily_stats.activity_description と commit_summary を参照し、**「ズバリ今やっていること」**を20文字以内で表示。

例: "Next.jsでの認証機能の実装" / "Docker環境のパフォーマンス改善"

Tech Stack:

profiles.tech_stack (習得済み) と code_highlights (直近使用) を表示。

Work Preference:

profiles.graduation_year (卒業年度) と work_values (勤務形態) をタグ表示。

Section 2: Vertical Growth Path (成長の軌跡)
「現在」から「過去」へ遡る垂直タイムライン。 github_daily_stats と tech_blog_posts をマージし、以下のルールで表示する。

Layout: 左に時系列ライン、右にカード。上部が「最新（Current）」。

Highlight Filtering:

全ての日を表示せず、以下の条件を満たす日を「ハイライト」として抽出。

Blog Post: tech_blog_posts がある日 (思考の言語化)。

Dev Milestone: github_daily_stats.code_highlights が存在する、または commit_summary が「機能実装」「解決」などのキーワードを含む日。

Card Content:

Header: 日付 + アクティビティ種別アイコン。

Body:

GitHubの場合: activity_description をタイトルとし、commit_summary を詳細として表示。

Blogの場合: 記事タイトルと、本文の要約（content の先頭100文字等）。

Evidence: file_changed 数や code_highlights のタグ（例: useSWR, Prisma）を添える。

Section 3: AI Growth Assessment (定性評価)
Concept: 自己申告(experience)と実態(github)のギャップを埋めるAIコメント。

Logic:

「独学」としているがGitHub活動が活発な場合 → **「驚異的な自走力：実務レベルに到達」**と評価。

tech_blog_posts が多い場合 → **「高い言語化能力：チーム開発での貢献が期待できる」**と評価。

4. 技術要件
Server Component: データ取得はサーバーサイドで行う。

UI Framework: Tailwind CSS。企業向けのため、白ベースで清潔感のあるデザイン (bg-white, text-slate-800, border-slate-200)。

Visual Hierarchy: 「Current Focus」を最も目立たせ、スクロールで詳細（Path）を読ませる構成。

この仕様に基づき、ページコンポーネントと必要なUIパーツを実装してください。

このプロンプトで、**「この学生は『独学』と言っているが、直近では『Next.jsの高度な機能』を触っており、その過程を『ブログ』に残している。つまり採用すべきだ」**というロジックが、企業の採用担当者に一瞬で伝わるページになります。
