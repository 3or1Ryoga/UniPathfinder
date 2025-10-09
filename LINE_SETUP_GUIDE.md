# LINE Developers セットアップガイド

このガイドでは、TechMightにLINE連携機能を実装するために必要な、LINE Developersでのチャネル作成手順を説明します。

## 📋 前提条件
- LINEアカウントを持っていること
- LINE Developersコンソールにアクセスできること

## 🚀 セットアップ手順

### Step 1: LINE Developersコンソールにアクセス

1. [LINE Developers](https://developers.line.biz/) にアクセス
2. LINEアカウントでログイン

### Step 2: プロバイダーの作成（初回のみ）

1. 「コンソール」をクリック
2. 「プロバイダー」タブで「作成」をクリック
3. プロバイダー名を入力（例: "TechMight"）
4. 「作成」をクリック

### Step 3: チャネルの作成

1. 作成したプロバイダーを選択
2. 「LINEログイン」のチャネルを作成をクリック
3. 以下の情報を入力：

#### 基本情報
- **チャネル名**: TechMight（または任意の名前）
- **チャネル説明**: プログラミング学習支援サービス TechMight
- **アプリタイプ**: ウェブアプリ

#### 業種
- カテゴリ: 教育・学習支援

#### メールアドレス
- あなたの連絡用メールアドレスを入力

4. 利用規約に同意して「作成」をクリック

### Step 4: チャネル基本設定の確認

チャネルが作成されたら、「チャネル基本設定」タブで以下の情報を確認・メモしてください：

```
Channel ID: [ここに表示される数字をメモ]
Channel Secret: [ここに表示される文字列をメモ]
```

### Step 5: LINEログイン設定

1. 「LINEログイン」タブに移動
2. 以下の設定を行います：

#### コールバックURL
本番環境（Vercel）のURL:
```
https://[あなたのVercelドメイン]/api/auth/line/callback
```

例: `https://techmight.vercel.app/api/auth/line/callback`

ローカル開発用（必要に応じて追加）:
```
http://localhost:3000/api/auth/line/callback
```

**重要**: あなたのVercelデプロイURLを使用してください

#### リンクされたボットの設定
- 特に設定不要（オプション）

#### OpenID Connect
有効にする（推奨）

#### 権限（スコープ）
以下のスコープを有効にしてください：
- ✅ `profile` （プロフィール情報の取得）
- ✅ `openid` （OpenID Connect）

3. 「更新」をクリックして保存

### Step 6: 環境変数の設定

環境変数として保存する場合：

#### Vercelの環境変数設定
1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」
4. 以下を追加：

```bash
NEXT_PUBLIC_LINE_CHANNEL_ID=[Channel ID]
LINE_CHANNEL_SECRET=[Channel Secret]
```

5. 「Save」をクリック
6. 再デプロイを実行

## ✅ 設定完了の確認

以下の情報が揃っていることを確認してください：

- ✅ LINE Channel ID
- ✅ LINE Channel Secret
- ✅ Vercelの環境変数が設定されている
- ✅ LINE DevelopersでコールバックURLが正しく設定されている

## 📝 次のステップ

LINE Developersの設定が完了したら、以下を私（Claude）に報告してください：

```
LINE Developersの設定が完了しました。
Channel ID: [あなたのChannel ID]
Channel Secret: [あなたのChannel Secret]
```

その後、LINE OAuth認証フローの実装を完了します。

## 🔒 セキュリティに関する注意

- **Channel Secret**は絶対に公開しないでください
- Gitリポジトリにコミットしないよう注意してください
- 環境変数として安全に管理してください

## 🆘 トラブルシューティング

### コールバックURLのエラー
- SupabaseのプロジェクトURLが正しいか確認
- URLの末尾に余分なスラッシュがないか確認

### 認証が失敗する
- Channel IDとChannel Secretが正しいか確認
- Supabaseでプロバイダーが有効化されているか確認
- スコープ設定が正しいか確認（profile, openid）

## 📚 参考リンク

- [LINE Developers公式ドキュメント](https://developers.line.biz/ja/docs/)
- [LINEログイン v2.1](https://developers.line.biz/ja/docs/line-login/)
- [Supabase Auth with LINE](https://supabase.com/docs/guides/auth/social-login/auth-line)
