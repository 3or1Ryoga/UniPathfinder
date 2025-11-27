/**
 * GitHub Commit Analyzer
 *
 * GitHubのコミット詳細を取得・分析し、本質的なコード変更を抽出します。
 * ドキュメント: github_doc_commit_detail.md に基づく実装
 */

// ========================================
// 型定義
// ========================================

export interface GitHubFile {
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed'
  additions: number
  deletions: number
  patch?: string
}

export interface GitHubCompareResponse {
  status: string
  ahead_by: number
  commits: Array<{
    sha: string
    commit: {
      message: string
      author: { name: string; date: string }
    }
  }>
  files: GitHubFile[]
}

export interface CodeHighlight {
  type: 'component' | 'hook' | 'type' | 'logic' | 'other'
  description: string
  filename: string
  additions: number
  deletions: number
}

export interface AnalyzedCommit {
  totalFiles: number
  relevantFiles: number
  totalAdditions: number
  totalDeletions: number
  filesChanged: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
  }>
  codeHighlights: CodeHighlight[]
  commitMessages: string[]
}

// ========================================
// ノイズ除去フィルタ（Blacklist）
// ========================================

const NOISE_PATTERNS = [
  // 依存関係ロックファイル
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,

  // 設定ファイル
  /tsconfig\.json$/,
  /\.eslintrc.*$/,
  /\.prettierrc.*$/,
  /next\.config\.(js|ts)$/,
  /tailwind\.config\.(js|ts)$/,
  /postcss\.config\.(js|ts)$/,

  // 型定義・ソースマップ
  /\.d\.ts$/,
  /\.map$/,

  // 静的アセット
  /^public\//,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(woff|woff2|ttf|eot)$/,

  // ビルド成果物
  /^\.next\//,
  /^dist\//,
  /^build\//,
  /^out\//,

  // その他
  /\.env\.example$/,
  /\.gitignore$/,
  /README\.md$/,
  /CHANGELOG\.md$/,
]

/**
 * ファイルがノイズかどうかを判定
 */
function isNoiseFile(filename: string): boolean {
  return NOISE_PATTERNS.some(pattern => pattern.test(filename))
}

// ========================================
// 本質の抽出（Whitelist Analysis）
// ========================================

interface CodePattern {
  type: 'component' | 'hook' | 'type' | 'logic'
  patterns: RegExp[]
  description: (match: string) => string
}

const CODE_PATTERNS: CodePattern[] = [
  {
    type: 'component',
    patterns: [
      /export\s+default\s+function/,
      /export\s+function\s+\w+/,
      /return\s*\(/,
      /<[A-Z]\w+/,  // JSX Component
    ],
    description: (match) => 'React Componentを実装'
  },
  {
    type: 'hook',
    patterns: [
      /useState/,
      /useEffect/,
      /useCallback/,
      /useMemo/,
      /useRef/,
      /useContext/,
      /useReducer/,
      /use\w+/,  // Custom hooks
    ],
    description: (match) => `${match}を使用`
  },
  {
    type: 'type',
    patterns: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /z\.object/,  // Zod validation
      /enum\s+\w+/,
    ],
    description: (match) => '型定義を追加'
  },
  {
    type: 'logic',
    patterns: [
      /async\s+function/,
      /await\s+/,
      /\.map\(/,
      /\.filter\(/,
      /\.reduce\(/,
      /try\s*\{/,
      /catch\s*\(/,
    ],
    description: (match) => 'ロジックを実装'
  }
]

/**
 * patchからコードハイライトを抽出
 */
function extractHighlightsFromPatch(
  filename: string,
  patch: string,
  additions: number,
  deletions: number
): CodeHighlight[] {
  const highlights: CodeHighlight[] = []

  // patch内の追加行（+で始まる行）を取得
  const addedLines = patch
    .split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .join('\n')

  // 各パターンをチェック
  for (const codePattern of CODE_PATTERNS) {
    for (const pattern of codePattern.patterns) {
      const matches = addedLines.match(pattern)
      if (matches) {
        highlights.push({
          type: codePattern.type,
          description: codePattern.description(matches[0]),
          filename,
          additions,
          deletions
        })
        break  // 1ファイルにつき各タイプ1つまで
      }
    }
  }

  return highlights
}

// ========================================
// GitHub Compare API
// ========================================

/**
 * GitHub Compare APIを使用して期間内の変更を取得
 *
 * @param repoOwner リポジトリ所有者
 * @param repoName リポジトリ名
 * @param baseRef ベース地点（例: 前日の最終コミットSHA、またはブランチ名）
 * @param headRef 比較地点（例: 今日の最終コミットSHA、またはブランチ名）
 * @param accessToken GitHub Access Token
 */
export async function fetchGitHubCompare(
  repoOwner: string,
  repoName: string,
  baseRef: string,
  headRef: string,
  accessToken: string
): Promise<GitHubCompareResponse | null> {
  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/compare/${baseRef}...${headRef}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TechMight-DevLog'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Repository or commits not found: ${repoOwner}/${repoName}`)
        return null
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching GitHub compare:', error)
    return null
  }
}

/**
 * 特定の日のコミット範囲を取得するためのSHA取得
 *
 * この関数はブランチの最新コミットを取得します。
 * 実際の日次処理では、前日と今日のコミットSHAを使用します。
 */
export async function getLatestCommitSha(
  repoOwner: string,
  repoName: string,
  branch: string,
  accessToken: string
): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/branches/${branch}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TechMight-DevLog'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.commit?.sha || null
  } catch (error) {
    console.error('Error fetching latest commit SHA:', error)
    return null
  }
}

// ========================================
// コミット分析
// ========================================

/**
 * GitHub Compareレスポンスを分析
 */
export function analyzeCommits(compareData: GitHubCompareResponse): AnalyzedCommit {
  // ノイズ除去
  const relevantFiles = compareData.files.filter(file => !isNoiseFile(file.filename))

  // ファイル変更の詳細
  const filesChanged = relevantFiles.map(file => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions
  }))

  // コードハイライトの抽出
  const codeHighlights: CodeHighlight[] = []
  for (const file of relevantFiles) {
    if (file.patch) {
      const highlights = extractHighlightsFromPatch(
        file.filename,
        file.patch,
        file.additions,
        file.deletions
      )
      codeHighlights.push(...highlights)
    }
  }

  // コミットメッセージ
  const commitMessages = compareData.commits.map(c => c.commit.message)

  // 統計
  const totalAdditions = relevantFiles.reduce((sum, f) => sum + f.additions, 0)
  const totalDeletions = relevantFiles.reduce((sum, f) => sum + f.deletions, 0)

  return {
    totalFiles: compareData.files.length,
    relevantFiles: relevantFiles.length,
    totalAdditions,
    totalDeletions,
    filesChanged,
    codeHighlights,
    commitMessages
  }
}

/**
 * Commits APIから特定日のコミット一覧を取得
 */
async function fetchCommitsByDate(
  repoOwner: string,
  repoName: string,
  date: string,  // YYYY-MM-DD
  accessToken: string,
  branch: string = 'main'
): Promise<string[]> {
  try {
    // 日付の範囲を設定（JST基準）
    const targetDate = new Date(date + 'T00:00:00+09:00')  // JST開始
    const nextDate = new Date(date + 'T23:59:59+09:00')    // JST終了

    const since = targetDate.toISOString()
    const until = nextDate.toISOString()

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?sha=${branch}&since=${since}&until=${until}&per_page=100`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TechMight-DevLog'
      }
    })

    if (!response.ok) {
      console.warn(`Failed to fetch commits: ${response.status}`)
      return []
    }

    const commits = await response.json()
    return commits.map((c: any) => c.sha)
  } catch (error) {
    console.error('Error fetching commits by date:', error)
    return []
  }
}

/**
 * 日次コミット分析のメイン関数
 *
 * @param repoOwner リポジトリ所有者
 * @param repoName リポジトリ名
 * @param date 分析対象の日付（YYYY-MM-DD）
 * @param accessToken GitHub Access Token
 * @param branch ブランチ名（デフォルト: main）
 */
export async function analyzeDailyCommits(
  repoOwner: string,
  repoName: string,
  date: string,  // YYYY-MM-DD
  accessToken: string,
  branch: string = 'main'
): Promise<AnalyzedCommit | null> {
  try {
    // その日のコミットSHAを取得
    const commitShas = await fetchCommitsByDate(repoOwner, repoName, date, accessToken, branch)

    if (commitShas.length === 0) {
      // コミットがない場合
      return {
        totalFiles: 0,
        relevantFiles: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        filesChanged: [],
        codeHighlights: [],
        commitMessages: []
      }
    }

    // その日の最初のコミットと最後のコミットで比較
    const baseRef = commitShas[commitShas.length - 1] + '^'  // 最初のコミットの親
    const headRef = commitShas[0]  // 最後のコミット

    // Compare APIで差分を取得
    const compareData = await fetchGitHubCompare(
      repoOwner,
      repoName,
      baseRef,
      headRef,
      accessToken
    )

    if (!compareData) {
      console.warn(`Failed to fetch compare data for ${date}`)
      return null
    }

    // 分析
    return analyzeCommits(compareData)
  } catch (error) {
    console.error('Error analyzing daily commits:', error)
    return null
  }
}
