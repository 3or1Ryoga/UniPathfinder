# LINE Messaging API セットアップガイド

このガイドでは、ユーザーにLINE公式アカウントを友だち追加してもらうための設定手順を説明します。

## 📋 前提条件
- LINE Developersアカウント
- LINE Loginチャネルが作成済み（Channel ID: 2008263279）

---

## 🚀 セットアップ手順

### Step 1: LINE公式アカウント（Messaging API）チャネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. あなたのプロバイダーを選択
3. 「新規チャネル作成」をクリック
4. **「Messaging API」** を選択

### Step 2: チャネル情報の入力

以下の情報を入力してください：

#### 基本情報
- **チャネル名**: TechMight（または任意の名前）
- **チャネル説明**: プログラミング学習支援サービス TechMight の公式アカウント
- **大業種**: 情報通信業
- **小業種**: ソフトウェア業

#### アイコン画像（推奨）
- 正方形の画像（最低512x512px）
- TechMightのロゴまたはアイコン

#### メールアドレス
- あなたの連絡用メールアドレス

5. プライバシーポリシーと利用規約のURLを入力（任意）
6. 利用規約に同意して「作成」をクリック

---

### Step 3: Messaging API設定の確認

チャネル作成後、以下の情報を確認・メモしてください：

#### 「Messaging API」タブ

1. **Channel ID（チャネルID）**
   ```
   Channel ID: [ここに表示される数字をメモ]
   ```

2. **Channel secret（チャネルシークレット）**
   ```
   Channel secret: [ここに表示される文字列をメモ]
   ```

3. **Channel access token（チャネルアクセストークン）**
   - 「発行」ボタンをクリック
   - 長期トークンが生成されます
   ```
   Channel access token: [生成されたトークンをメモ]
   ```

   ⚠️ **重要**: このトークンは二度と表示されないため、必ず安全な場所にコピーしてください

4. **ベーシックID または LINE ID**
   ```
   LINE ID: @xxx-xxxxx
   ```
   このIDは友だち追加URLに使用します

---

### Step 4: Webhook設定

1. 「Messaging API」タブで下にスクロール
2. **「Webhook設定」** セクションを見つける
3. 「編集」をクリック
4. Webhook URLを入力：
   ```
   https://uni-pathfinder-lf9w.vercel.app/api/webhooks/line
   ```
5. 「Webhookの利用」を **ON** にする
6. 「更新」をクリック

---

### Step 5: 応答設定

1. **「LINE公式アカウント機能」** セクションを見つける
2. 「編集」または「LINE Official Account Manager」リンクをクリック
3. 新しいタブでLINE Official Account Managerが開きます

#### 応答設定の変更
1. 左メニューから「応答設定」を選択
2. 以下のように設定：
   - **応答メッセージ**: OFF（アプリで制御するため）
   - **Webhook**: ON
   - **あいさつメッセージ**: ON（推奨）

#### あいさつメッセージの編集（推奨）
1. 「あいさつメッセージ」の「編集」をクリック
2. 以下のようなメッセージを設定：

```
TechMight公式アカウントへようこそ！🎉

友だち追加ありがとうございます。

TechMightでは、あなたのプログラミング学習をサポートするため、以下の通知をお送りします：

📚 おすすめの学習リソース
🔔 学習の進捗リマインド
✨ 新機能のお知らせ

引き続きよろしくお願いします！
```

3. 「保存」をクリック

---

### Step 6: 友だち追加URL の確認

1. LINE Developers Consoleに戻る
2. 「Messaging API」タブで「QRコード」セクションを確認
3. 友だち追加URLは以下の形式です：

```
https://line.me/R/ti/p/@YOUR_LINE_ID
```

または

```
https://line.me/R/ti/p/~YOUR_CHANNEL_ID
```

https://line.me/R/ti/p/@409fwjcr

このURLをメモしてください。

---

## 📝 取得した情報のまとめ

以下の情報を私（Claude）に報告してください：

```
■ LINE Loginチャネル（既存）
- Channel ID: 2008263279
- Channel Secret: b2a2629160b84b74406cc5d30fec5565

■ Messaging APIチャネル（新規作成）
- Channel ID: [ここに入力]
- Channel Secret: [ここに入力]
- Channel Access Token: [ここに入力]
- LINE ID: @xxx-xxxxx
- 友だち追加URL: https://line.me/R/ti/p/@xxx-xxxxx
```

---

## ⚙️ 環境変数の追加

後ほど、以下の環境変数をVercelに追加します：

```bash
# LINE Messaging API
LINE_MESSAGING_CHANNEL_ID=[Messaging APIのChannel ID]
LINE_MESSAGING_CHANNEL_SECRET=[Messaging APIのChannel Secret]
LINE_CHANNEL_ACCESS_TOKEN=[Channel Access Token]
LINE_ADD_FRIEND_URL=https://line.me/R/ti/p/@xxx-xxxxx
```

---

## 🔒 セキュリティに関する注意

- **Channel Access Token**は絶対に公開しないでください
- Gitリポジトリにコミットしないよう注意してください
- 環境変数として安全に管理してください

---

## 🆘 トラブルシューティング

### Webhookの検証が失敗する
- Webhook URLが正しいか確認
- HTTPSを使用しているか確認
- Vercelにデプロイされているか確認

### 友だち追加ができない
- LINE IDが正しいか確認
- チャネルが「公開」されているか確認
- ブロックリストに入っていないか確認

---

## 📚 参考リンク

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [友だち追加の実装](https://developers.line.biz/ja/docs/messaging-api/building-bot/#adding-as-friend)
- [Webhook イベント](https://developers.line.biz/ja/docs/messaging-api/receiving-messages/)

---

## ✅ 設定完了チェックリスト

- [ ] Messaging APIチャネル作成完了
- [ ] Channel Access Token取得完了
- [ ] Webhook URL設定完了
- [ ] 応答設定を変更完了
- [ ] あいさつメッセージ設定完了
- [ ] 友だち追加URLを確認完了

すべて完了したら、取得した情報を私に報告してください！
