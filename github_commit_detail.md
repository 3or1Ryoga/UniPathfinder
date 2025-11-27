選択（B: 登録リポジトリのみ、B: 要約のみ保存）ありがとうございます。
この方針であれば、API制限を回避しつつ、DB容量も圧迫しない、非常に現実的でスケーラブルな設計になります。

以下に、**「明日までに動く成長解析システム」をAI（Cursor/Windsurf等）に実装させるための確定版プロンプト**を作成しました。

このプロンプトでは、\*\*「登録されたリポジトリのイベントだけを拾い、その差分を取得して整形し、AIに渡す直前の状態にする」\*\*までの処理を完結させます。

-----

### 🚀 実装用プロンプト (確定版)

この以下のテキストをコピーして、AIエディタに貼り付けてください。

````markdown
あなたはNext.js (App Router) とSupabaseを用いたバックエンド実装の専門家です。
現在開発中のプラットフォーム「TechMight」において、ユーザーの1日のコーディング活動を解析するための**「GitHubデータ収集・整形モジュール」**を実装してください。

このモジュールは、最終的にLLM (ChatGPT) が「今日の活動要約」を生成するための**中間データ**を作成するものです。
DB容量を圧迫しないよう、Rawデータ（差分テキスト）は永続化せず、解析後に破棄する設計とします。

## 1. 実装する機能: `fetchDailyActivityDiff`
`src/lib/github/fetch-activity.ts` に、以下の処理を行う関数を実装してください。

**関数シグネチャ:**
```typescript
type FetchOptions = {
  githubUsername: string;
  githubToken: string;
  targetDate: Date;
  allowedRepos: string[]; // 解析対象とするリポジトリ名のリスト (例: ["owner/repoA", "owner/repoB"])
};

export async function fetchDailyActivityDiff(options: FetchOptions) { ... }
````

## 2\. 処理フロー (Pipeline)

### Step 1: イベント取得とフィルタリング

  - GitHub API `GET /users/{username}/events` を使用し、ユーザーの直近のアクティビティを取得する。
  - 以下の条件でフィルタリングを行う:
    1.  `type` が `PushEvent` であること。
    2.  `created_at` が `targetDate` の範囲内であること。
    3.  `repo.name` が `allowedRepos` リストに含まれていること（**重要: 未登録リポジトリは無視**）。

### Step 2: コミット詳細の取得 (Rate Limit考慮)

  - フィルタリングされたイベントからコミットSHAを抽出する。
  - 各コミットに対し `GET /repos/{owner}/{repo}/commits/{ref}` を実行し、ファイル変更詳細を取得する。
  - **並列制御:** `p-limit` 等を使用し、同時に投げるAPIリクエスト数を5程度に制限すること。

### Step 3: ノイズ除去 (Smart Filtering)

取得した `files` 配列に対し、以下の「解析価値のないファイル」を除外する。

  - **除外リスト:**
      - ロックファイル: `package-lock.json`, `yarn.lock`
      - 設定ファイル: `tsconfig.json`, `*.config.js`, `.eslintrc`
      - 自動生成/静的ファイル: `next-env.d.ts`, `public/**`, 画像(`*.png`, `*.svg`)
      - **インポートのみ:** `patch` の追加行(`+`)が `import` 文のみで構成されるファイル。

### Step 4: データの構造化 (For LLM)

LLMが理解しやすい形式にデータを整形して返す。

**返り値の形式:**

```typescript
type DailyActivitySummary = {
  date: string;
  stats: {
    totalCommits: number;
    affectedRepos: string[];
  };
  // この配列はLLMに投げた後に破棄される想定
  codeChanges: Array<{
    repoName: string;
    commitMessage: string;
    files: Array<{
      filename: string;
      patch: string; // フィルタリング済みのDiff
    }>;
  }>;
};
```

## 3\. 技術要件

  - **Language:** TypeScript
  - **Library:** `octokit` (未インストールの場合はインストールコマンドを提示)
  - **Environment:** Next.js Server Actions での動作を想定
  - **Optimization:** パッチテキスト(`patch`)が長すぎる場合（例: 200行以上）は、先頭50行のみを残して「...truncated」とする処理を入れること（トークン節約のため）。

## 4\. 期待する成果物

1.  `src/lib/github/fetch-activity.ts` の実装コード
2.  この関数をテストするための `src/app/api/debug/github-fetch/route.ts` (GETリクエストで動作確認できるエンドポイント)

この仕様に基づき、コピー＆ペーストで動作するコードを作成してください。

```

---

### 💡 補足：次のステップ

このコードが完成すれば、あとは以下のフローを繋げるだけでシステムが完成します。

1.  **Fetch:** 上記の関数で「今日の差分データ」を取得。
2.  **Analyze:** 取得したデータをGPT-4oに投げ、「このコード変更から、今日のユーザーの成長と学習内容を100文字で要約して」と指示。
3.  **Save:** 返ってきた「要約テキスト」だけを `daily_activities` テーブルに保存。

これで、「DBは軽いまま」「過去の活動の質は検索可能」な状態が作れます。実装頑張ってください！
```