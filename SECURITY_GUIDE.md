# 🛡️ セキュリティガイド - UniPath Finder

## 📋 本番環境デプロイ前のセキュリティチェックリスト

### 1. **環境変数とシークレット管理**

#### ✅ 適切に保護されている項目
- `NEXT_PUBLIC_SUPABASE_URL` - 公開されても安全（Anon Key で制御）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 公開用キー（RLSで保護）

#### ⚠️ 絶対に公開してはいけない項目
- Supabase Service Key（使用していませんが今後注意）
- プライベートAPIキー
- データベース接続文字列
- JWT シークレット

#### 🔐 環境変数のベストプラクティス
```bash
# ✅ 良い例 - 公開可能
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...

# ❌ 悪い例 - 絶対に公開しない
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
DATABASE_PASSWORD=secret123
JWT_SECRET=mysecret
```

### 2. **Supabase Row Level Security (RLS)**

#### 現在の設定状況の確認
```sql
-- profilesテーブルのRLS状態確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

#### 必要なRLSポリシー
```sql
-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のプロフィールのみアクセス可能
CREATE POLICY "Enable read access for own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);
```

### 3. **認証セキュリティ**

#### パスワードポリシー設定（Supabase）
1. Supabase Dashboard → Authentication → Settings
2. **Password requirements**:
   - Minimum length: 8文字以上
   - Require uppercase: 有効
   - Require lowercase: 有効
   - Require numbers: 有効
   - Require special characters: 推奨

#### セッション管理
- JWT有効期限: 1時間（デフォルト）
- Refresh token: 24時間
- 自動ログアウト: アクティブでない場合

### 4. **Next.js セキュリティ設定**

#### セキュリティヘッダー（next.config.ts で設定済み）
```typescript
// ✅ 設定済みのセキュリティヘッダー
X-Frame-Options: DENY              // クリックジャッキング防止
X-Content-Type-Options: nosniff    // MIME sniffing 防止
X-XSS-Protection: 1; mode=block    // XSS保護
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### Content Security Policy (CSP) - 今後実装推奨
```typescript
// より厳密なCSP（必要に応じて追加）
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
`;
```

### 5. **フロントエンドセキュリティ**

#### XSS（クロスサイトスクリプティング）対策
```typescript
// ✅ 安全なデータ表示
const UserProfile = ({ user }) => (
  <div>
    {/* React は自動的にエスケープ */}
    <h1>{user.name}</h1>
    <p>{user.bio}</p>
  </div>
);

// ❌ 危険な例（使用禁止）
<div dangerouslySetInnerHTML={{__html: user.bio}} />
```

#### 入力値検証
```typescript
// ✅ 入力値の検証例
const validateGitHubUsername = (username: string) => {
  const regex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  return regex.test(username);
};

const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

### 6. **API セキュリティ**

#### レート制限（Supabase で自動実装済み）
- Anonymous users: 1時間あたり100リクエスト
- Authenticated users: 1時間あたり1000リクエスト

#### SQLインジェクション対策
```typescript
// ✅ Supabase のクエリビルダー使用（安全）
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('github_username', username); // 自動的にサニタイズ

// ❌ 生のSQL（絶対に使用禁止）
// 現在のプロジェクトでは使用していません
```

### 7. **データプライバシー**

#### 個人情報の取り扱い
- ✅ メールアドレス: ハッシュ化不要（Supabase Auth で管理）
- ✅ パスワード: 自動的にハッシュ化
- ✅ プロフィール情報: 暗号化不要（公開情報）

#### GDPR コンプライアンス
```typescript
// ユーザーデータ削除機能（今後実装）
const deleteUserAccount = async (userId: string) => {
  // 1. プロフィールデータ削除
  await supabase.from('profiles').delete().eq('id', userId);
  
  // 2. 認証データ削除（Supabase Admin API）
  // 実装時は適切な権限チェックが必要
};
```

### 8. **監視とロギング**

#### セキュリティイベントの監視
```typescript
// セキュリティイベントのログ記録例
const logSecurityEvent = (event: string, userId?: string) => {
  console.log({
    timestamp: new Date().toISOString(),
    event,
    userId,
    userAgent: navigator.userAgent,
    ip: 'masked' // プライバシー保護
  });
};

// 使用例
logSecurityEvent('login_attempt', user.id);
logSecurityEvent('profile_update', user.id);
```

### 9. **本番環境での追加セキュリティ対策**

#### HTTPS 強制（Vercel で自動設定）
- ✅ 自動的にHTTPS証明書が発行される
- ✅ HTTP → HTTPS リダイレクト

#### ドメインセキュリティ
```typescript
// Vercel でのカスタムドメイン使用時
const allowedDomains = [
  'unipath-finder.com',
  'www.unipath-finder.com',
  'unipath-finder.vercel.app'
];
```

### 10. **セキュリティテスト**

#### 本番デプロイ前の確認事項
- [ ] RLS ポリシーが正しく設定されている
- [ ] 不正アクセスが防止されている
- [ ] XSS 攻撃に対して保護されている
- [ ] CSRF 攻撃に対して保護されている
- [ ] セキュリティヘッダーが設定されている
- [ ] HTTPS が強制されている
- [ ] 環境変数が適切に管理されている

#### セキュリティテストツール
```bash
# セキュリティ脆弱性スキャン
npm audit

# TypeScript の型チェック
npm run type-check

# Lighthouse セキュリティスコア確認
# Chrome DevTools → Lighthouse → Security
```

### 11. **インシデント対応計画**

#### セキュリティインシデント発生時の対応
1. **即座に対応**: 影響範囲の特定
2. **一時的な対策**: 問題のある機能の無効化
3. **根本原因の調査**: ログの確認と分析
4. **修正とテスト**: セキュリティパッチの適用
5. **事後確認**: 再発防止策の実装

#### 緊急連絡先
- Vercel サポート
- Supabase サポート
- 開発チーム

---

## ✅ セキュリティチェックリスト（デプロイ前）

- [ ] 環境変数が適切に設定されている
- [ ] RLS ポリシーが有効になっている
- [ ] セキュリティヘッダーが設定されている
- [ ] XSS 対策が実装されている
- [ ] 入力値検証が実装されている
- [ ] HTTPS が有効になっている
- [ ] 監視とロギングが設定されている
- [ ] セキュリティテストが完了している

**🔒 このガイドに従うことで、UniPath Finder の本番環境セキュリティが確保されます。**