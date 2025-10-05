# Vercelデプロイガイド - TechMight

## 🔐 デプロイ前のセキュリティチェックリスト

### 1. **機密情報の確認と保護**

#### ✅ 現在の機密情報
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### ✅ 既に保護されている項目
- ✅ `.gitignore`で`.env*`が除外済み
- ✅ 環境変数がGitにコミットされていない

### 2. **Vercelデプロイ手順**

#### **Step 1: Vercelアカウント準備**
1. [Vercel](https://vercel.com)でアカウント作成/ログイン
2. GitHubアカウントと連携

#### **Step 2: プロジェクトのGitHubプッシュ**
```bash
# プロジェクトルートで実行
git add .
git commit -m "feat: complete TechMight landing page and auth system"
git push origin main
```

#### **Step 3: Vercelでプロジェクトインポート**
1. Vercel Dashboard → "New Project"
2. GitHub リポジトリ`TechMight`を選択
3. Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `unipath/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### **Step 4: 環境変数の設定**
Vercel Dashboard → Project Settings → Environment Variables

| Variable Name | Value | Environment |
|--------------|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wfvcxxpasvgrzhexoylx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

**⚠️ 重要**: 各環境で同じ値を設定してください。

#### **Step 5: デプロイ実行**
1. "Deploy" ボタンをクリック
2. ビルド完了を待機（通常2-3分）
3. デプロイ完了後、URLが生成される

## 🌐 ドメイン設定（オプション）

### **カスタムドメインの設定**
1. Vercel Dashboard → Project → Settings → Domains
2. カスタムドメインを追加（例: `unipath-finder.com`）
3. DNS設定でCNAMEレコードを追加

## 🔧 Supabase設定の更新

### **認証リダイレクトURLの更新**

デプロイ後、Supabaseダッシュボードで以下を設定：

1. **Supabase Dashboard** → Authentication → URL Configuration
2. **Site URL**を更新:
   ```
   https://your-vercel-domain.vercel.app
   ```
3. **Redirect URLs**に追加:
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   https://your-vercel-domain.vercel.app
   ```

### **CORS設定の確認**
1. Supabase → Settings → API
2. CORS Origins に本番URLを追加

## 🛡️ セキュリティ設定

### **1. 環境変数のベストプラクティス**
- ✅ `NEXT_PUBLIC_`プレフィックス付きの変数のみクライアントに公開
- ✅ Anon Keyは公開されても問題ない（Row Level Security で保護）
- ✅ Service Key は**絶対に**フロントエンドで使用しない

### **2. Supabase Row Level Security (RLS)**
profilesテーブルでRLSが有効になっているか確認：

```sql
-- RLS有効化の確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- RLSポリシーの設定（必要に応じて）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のプロフィールのみアクセス可能
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### **3. 本番環境でのセキュリティヘッダー**
`next.config.ts`で追加できるセキュリティヘッダー：

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 📊 監視とメンテナンス

### **1. Vercel Analytics**
1. Vercel Dashboard → Project → Analytics
2. 有効化してユーザー行動を監視

### **2. エラー監視**
1. Vercel Dashboard → Functions → Logs
2. リアルタイムエラー監視

### **3. Supabase使用量監視**
1. Supabase Dashboard → Settings → Usage
2. API リクエスト数とデータベース使用量をチェック

## 🚀 デプロイ後の確認項目

### **機能テスト**
- [ ] ホームページの表示
- [ ] ユーザー登録（メール/パスワード）
- [ ] マジックリンクログイン
- [ ] プロフィール設定
- [ ] ログアウト
- [ ] レスポンシブデザイン

### **パフォーマンステスト**
- [ ] Lighthouse スコア（90+推奨）
- [ ] Core Web Vitals
- [ ] モバイル表示速度

### **SEO確認**
- [ ] メタタグの表示
- [ ] OGP画像の表示
- [ ] サイトマップ生成

## ⚠️ トラブルシューティング

### **よくある問題と解決策**

#### 1. **環境変数が読み込まれない**
- Vercelで環境変数を再設定
- プロジェクトを再デプロイ

#### 2. **Supabase認証エラー**
- リダイレクトURLが正しく設定されているか確認
- Site URLが本番URLになっているか確認

#### 3. **ビルドエラー**
- ローカルで`npm run build`が成功するか確認
- TypeScriptエラーがないか確認

#### 4. **CSS/スタイルが適用されない**
- Tailwind CSS の設定確認
- globals.css のインポート確認

## 📝 デプロイ後のチェックリスト

- [ ] 環境変数が正しく設定されている
- [ ] Supabase リダイレクトURLが更新されている
- [ ] 全ての機能が動作している
- [ ] HTTPS接続が有効
- [ ] カスタムドメイン設定（必要に応じて）
- [ ] 監視ツールが設定されている
- [ ] バックアップ戦略が準備されている

---

**🎉 デプロイ完了後、TechMightが世界中からアクセス可能になります！**