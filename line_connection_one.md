実装指示書：LINE連携フローの「ワンタップ化」と「オンボーディング直行」の実装
概要
LINEログイン機能を改修し、ユーザー体験を劇的に向上させます。 現在は「ログイン」→「友だち追加画面へ遷移」→「追加」という多段階のステップになっていますが、これを**「連携ボタン1つでログインと友だち追加を同時に完了」させ、そのまま「Webアプリのオンボーディング画面へ即座に遷移」**させるフローに変更します。

🎯 目指すUX（ユーザー体験）
ユーザーが「LINE連携」ボタンを押す。

LINEの認証画面が表示される（ここで「公式アカウントを友だち追加」のチェックが最初からONになっている）。

ユーザーが「許可する」を押す。

処理完了。即座にWebアプリのオンボーディング画面（/onboarding）が表示される。

🛠 手順1: LINE Developersコンソールでの設定（必須）
※コード修正の前に、必ずこの設定を行ってください。これがないとコード側の設定が機能しません。

LINE Developersコンソールにログイン。

対象のプロバイダーを選択し、「LINEログイン」チャネルを選択。

「チャネル基本設定」タブ内の最下部付近にある**「リンクされたボット」**項目を探す。

「編集」をクリックし、運用している**LINE公式アカウント（Messaging APIチャネル）**を選択して「更新」する。

🛠 手順2: バックエンド実装の修正
1. 認証URL生成ロジックの変更
対象ファイル: src/app/api/auth/line/route.ts

変更内容: デバイス判定による条件分岐を廃止し、全ユーザーに対して bot_prompt=aggressive を適用します。これにより、ログイン同意画面に「友だち追加」オプションがチェック済みの状態で表示されます。

TypeScript

// 修正前（削除またはコメントアウト）
// const userAgent = request.headers.get('user-agent') || ''
// const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent)
// const botPrompt = isMobile ? '&bot_prompt=normal' : ''

// 修正後（追加）
// 全ユーザーに対し、ログイン同意画面で友だち追加を「強制的に（デフォルトONで）」提案する
const botPrompt = '&bot_prompt=aggressive'

// URL生成部分（botPrompt変数が常にaggressiveを含むようになる）
const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${channelId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=profile%20openid` +
    botPrompt
)
2. コールバック後のリダイレクト先変更
対象ファイル: src/app/api/auth/line/callback/route.ts

変更内容: ログイン処理完了後のリダイレクト先を、LINE公式アカウントの追加URLからWebアプリのオンボーディングページへ変更します。 （手順1と手順2-1の設定により、この時点で友だち追加は完了している前提で進めます）

TypeScript

// 修正前
// LINE友達追加ページに直接リダイレクト
// const response = NextResponse.redirect('https://line.me/R/ti/p/@409fwjcr')

// 修正後
// ログインフロー内で友だち追加は完了しているため、
// アプリの学習開始画面（オンボーディング）へ直接戻して離脱を防ぐ
// ※ origin変数は request.nextUrl.origin から取得済み
const response = NextResponse.redirect(`${origin}/onboarding`)
✅ 動作確認チェックリスト
実装後、以下の挙動になるかを確認してください。

[ ] PC/スマホ両方で「LINE連携」ボタンを押した際、LINEの認可画面（同意画面）が表示されるか。

[ ] その同意画面の中に、「TechMight（公式アカウント名）」を友だち追加する という項目があり、最初からチェックが入っているか。

表示されない場合: 手順1の「リンクされたボット」の設定を見直してください。

チェックが入っていない場合: bot_prompt が aggressive になっているか確認してください。

[ ] 「許可する」を押した後、LINEアプリや友だち追加完了画面ではなく、Webアプリの /onboarding ページ に戻ってくるか。

[ ] （確認可能であれば）LINEアプリを開き、公式アカウントが実際に友だち追加されているか。

[ ] 友だち追加時のWebhookが正常に動作し、ウェルカムメッセージが届いているか。