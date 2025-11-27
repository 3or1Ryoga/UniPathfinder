# GitHub Access Token 取得手順（暫定対策）

## 概要

現在、Supabase OAuthで`provider_token`が取得できない問題があるため、
ユーザーに**Personal Access Token**を作成してもらう必要があります。

---

## ユーザー向け手順

### Step 1: GitHub Personal Access Tokenを作成

1. **GitHubにログイン**
   - https://github.com/settings/tokens

2. **「Generate new token」→「Generate new token (classic)」**

3. **設定**:
   - Note: `TechMight Access`
   - Expiration: `90 days`（または無期限）
   - **Scopes（重要）**:
     - ✅ `repo` - Full control of private repositories
     - ✅ `read:user` - Read ALL user profile data
     - ✅ `read:org` - Read org and team membership

4. **「Generate token」をクリック**

5. **トークンをコピー**（`ghp_xxxxxxxxxxxx...`）
   - ⚠️ 一度しか表示されません

### Step 2: プロフィール設定でトークンを入力

1. **TechMightにログイン**
2. **Settings → Developer Settings**
3. **GitHub Access Token** 欄にペースト
4. **Save**

---

## 将来の改善案

### UI実装: プロフィール設定にトークン入力欄

`src/app/settings/page.tsx`に以下を追加：

```typescript
// GitHub Access Token入力フィールド
<div>
  <label>GitHub Access Token</label>
  <input
    type="password"
    value={githubToken}
    onChange={(e) => setGithubToken(e.target.value)}
    placeholder="ghp_xxxxxxxxxxxx..."
  />
  <button onClick={handleSaveToken}>Save</button>
</div>
```

### API実装: トークン更新エンドポイント

`src/app/api/user/update-github-token/route.ts`:

```typescript
export async function POST(request: Request) {
  const { token } = await request.json()

  // バリデーション
  if (!token.startsWith('ghp_')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  // データベース更新
  await supabase
    .from('profiles')
    .update({ github_access_token: token })
    .eq('id', userId)
}
```

---

## 根本的な解決策

Supabaseの設定で`provider_token`を有効化する：

1. Supabaseサポートに問い合わせ
2. または、Supabase Authの代わりにNextAuth.jsを使用
3. または、GitHub App（OAuth Appではない）を使用
