📋 AIへの提供用データ：GitHub API仕様書 (Commit & Compare)
以下は、GitHub REST APIの「コミット取得」および「比較」に関する技術仕様の要約です。この情報を元に実装を行ってください。

1. API: Get a commit (単一コミットの詳細取得)
特定のコミットにおける「どのファイルが、どう書き換わったか（Diff）」を取得するために使用します。

Endpoint: GET /repos/{owner}/{repo}/commits/{ref}

Parameters:

owner: リポジトリの所有者名

repo: リポジトリ名

ref: コミットのSHAハッシュ、ブランチ名、またはタグ名

Response Structure (重要フィールドのみ抜粋)
レスポンスJSONのルートにある files 配列が最も重要です。

JSON

{
  "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
  "commit": {
    "message": "Fix login bug",
    "author": { "name": "Ryoga", "date": "2025-11-27T10:00:00Z" }
  },
  "files": [
    {
      "filename": "src/app/login/page.tsx",  // 変更されたファイルパス
      "status": "modified",                    // added, removed, modified, renamed
      "additions": 10,                         // 追加行数
      "deletions": 2,                          // 削除行数
      "patch": "@@ -132,7 +132,7 @@ module Test..." // 【重要】実際のコード差分テキスト
    },
    {
      "filename": "package-lock.json",
      "patch": "..." // ノイズとして除外すべきファイルもここに含まれる
    }
  ]
}
実装時の注意点
patch フィールドには git diff 形式のテキストが入っています。ここから + で始まる行を解析し、具体的な実装コード（useState や function 等）を抽出する必要があります。

画像ファイルやバイナリファイルの場合、patch フィールドは含まれません。

2. API: Compare two commits (期間内の変更一括取得)
「今日の作業開始時」と「終了時」を比較し、その日の成果物をまとめて取得するために使用します。

Endpoint: GET /repos/{owner}/{repo}/compare/{basehead}

Parameters:

basehead: ベースとなる地点と、比較対象の地点を ... で繋いだ文字列。

形式: base...head (例: main...feature-login または 古いSHA...新しいSHA)

Response Structure
単一コミット取得時と同様の files 配列が含まれますが、これは「期間全体の合計差分」です。

JSON

{
  "status": "ahead",      // baseに対してheadが進んでいるか (ahead, behind, divergent)
  "ahead_by": 5,          // 差分コミット数
  "commits": [ ... ],     // 期間内のコミット一覧
  "files": [              // 【重要】期間内で変更された全ファイルと差分
    {
      "filename": "src/components/Button.tsx",
      "status": "added",
      "additions": 45,
      "deletions": 0,
      "patch": "@@ -0,0 +1,45 @@..."
    }
  ]
}
実装時の注意点
files リストには最大300ファイルまでしか含まれません。大規模な変更の場合はページネーションや分割処理が必要ですが、個人の日次開発ログであれば通常はこの制限内で収まります。

🧠 実装ロジックへの指示（フィルタリング仕様）
APIには「特定のファイルを除外する機能」がないため、取得したJSONデータに対して以下のロジックを適用してください。

ノイズ除去フィルタ (Blacklist)
files[].filename が以下の正規表現にマッチする場合、そのファイルを解析対象から除外すること。

コード スニペット

/(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/  // 依存関係ロックファイル
/(tsconfig\.json|\.eslintrc.*|\.prettierrc.*|next\.config\.js)$/  // 設定ファイル
/(\.d\.ts|\.map)$/  // 型定義・ソースマップ
/(public\/.*|.*\.(png|jpg|svg|ico))$  // 静的アセット
本質の抽出 (Whitelist Analysis)
フィルタを通過したファイル（主に .ts, .tsx, .js）の patch プロパティを解析し、以下の要素が含まれるか検知すること。

React Component:

export default function

return (

<Component

Hooks/Logic:

useState

useEffect

useCallback

Type Definition:

interface

type

z.object

このドキュメントに基づき、src/lib/github-analyzer.ts (仮) の実装を進めてください