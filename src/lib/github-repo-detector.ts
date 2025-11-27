/**
 * GitHub Repository Auto Detector
 *
 * ユーザーのGitHubリポジトリを自動検出し、
 * user_github_reposテーブルに登録します。
 */

import { createClient } from '@supabase/supabase-js'

// Supabase Admin クライアント
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is missing')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ========================================
// 型定義
// ========================================

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    type: 'User' | 'Organization'
  }
  private: boolean
  fork: boolean
  pushed_at: string
  updated_at: string
  default_branch: string
}

// ========================================
// GitHub API: リポジトリ一覧取得
// ========================================

/**
 * GitHub APIでユーザーのアクティブなリポジトリを取得
 *
 * 条件：
 * - ユーザー所有 + 組織のリポジトリ
 * - Forkは除外
 * - 最近プッシュされた順（pushed_atでソート）
 * - 上位3つまで
 *
 * @param accessToken GitHub Access Token
 * @returns リポジトリ一覧（最大3つ）
 */
export async function fetchActiveRepositories(
  accessToken: string
): Promise<GitHubRepository[]> {
  try {
    // GitHub API: /user/repos
    // affiliation=owner,organization_member でユーザー所有+組織を取得
    // sort=pushed で最近プッシュされた順
    // direction=desc で降順
    // per_page=100 で最大100件取得（後でフィルタリング）
    const url = 'https://api.github.com/user/repos?affiliation=owner,organization_member&sort=pushed&direction=desc&per_page=100'

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TechMight-RepoDetector'
      }
    })

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`)
      return []
    }

    const repos: GitHubRepository[] = await response.json()

    // Forkを除外し、上位3つを取得
    const activeRepos = repos
      .filter(repo => !repo.fork)  // Forkは除外
      .slice(0, 3)  // 上位3つ

    return activeRepos
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return []
  }
}

// ========================================
// リポジトリ登録
// ========================================

/**
 * user_github_reposテーブルにリポジトリを登録
 *
 * @param userId ユーザーID
 * @param repos リポジトリ一覧
 */
async function registerRepositories(
  userId: string,
  repos: GitHubRepository[]
): Promise<void> {
  if (repos.length === 0) {
    console.log(`[Repo Detector] No repositories found for user ${userId}`)
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    // 既存のリポジトリを削除（常に最新の状態に更新）
    const { error: deleteError } = await supabase
      .from('user_github_repos')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[Repo Detector] Failed to delete existing repos:', deleteError)
      // エラーでも続行（新規登録の場合は既存データがない）
    }

    // 新しいリポジトリを登録
    const reposToInsert = repos.map((repo, index) => ({
      user_id: userId,
      repo_owner: repo.owner.login,
      repo_name: repo.name,
      is_primary: index === 0  // 1つ目をプライマリに設定
    }))

    const { error: insertError } = await supabase
      .from('user_github_repos')
      .insert(reposToInsert)

    if (insertError) {
      console.error('[Repo Detector] Failed to insert repos:', insertError)
      throw insertError
    }

    console.log(`[Repo Detector] Successfully registered ${repos.length} repositories for user ${userId}`)
    console.log(`[Repo Detector] Primary repo: ${repos[0].owner.login}/${repos[0].name}`)
  } catch (error) {
    console.error('[Repo Detector] Error registering repositories:', error)
    throw error
  }
}

// ========================================
// メイン処理
// ========================================

/**
 * ユーザーのリポジトリを自動検出・登録
 *
 * @param userId ユーザーID
 * @param accessToken GitHub Access Token
 */
export async function detectAndRegisterRepositories(
  userId: string,
  accessToken: string
): Promise<{ success: boolean; repoCount: number; primaryRepo?: string }> {
  try {
    console.log(`[Repo Detector] Detecting repositories for user ${userId}`)

    // GitHub APIでリポジトリ一覧を取得
    const repos = await fetchActiveRepositories(accessToken)

    if (repos.length === 0) {
      console.warn(`[Repo Detector] No active repositories found for user ${userId}`)
      return { success: false, repoCount: 0 }
    }

    // user_github_reposに登録
    await registerRepositories(userId, repos)

    return {
      success: true,
      repoCount: repos.length,
      primaryRepo: `${repos[0].owner.login}/${repos[0].name}`
    }
  } catch (error) {
    console.error('[Repo Detector] Error in detectAndRegisterRepositories:', error)
    return { success: false, repoCount: 0 }
  }
}

/**
 * 全ユーザーのリポジトリを自動検出（Cronジョブ用）
 *
 * GitHub連携済みで、まだリポジトリが登録されていないユーザーを対象
 */
export async function detectRepositoriesForAllUsers(): Promise<{
  processed: number
  success: number
  failed: number
}> {
  try {
    const supabase = getSupabaseAdmin()

    // GitHub連携済みのユーザーを取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, github_username, github_access_token')
      .not('github_username', 'is', null)
      .not('github_access_token', 'is', null)

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('[Repo Detector] No GitHub-connected users found')
      return { processed: 0, success: 0, failed: 0 }
    }

    let successCount = 0
    let failedCount = 0

    for (const profile of profiles) {
      try {
        // 既にリポジトリが登録されているかチェック
        const { data: existingRepos } = await supabase
          .from('user_github_repos')
          .select('id')
          .eq('user_id', profile.id)
          .limit(1)

        // 既に登録されている場合はスキップ（定期更新は別の仕組みで実装可能）
        if (existingRepos && existingRepos.length > 0) {
          console.log(`[Repo Detector] User ${profile.id} already has repos registered, skipping`)
          continue
        }

        // リポジトリを自動検出・登録
        const result = await detectAndRegisterRepositories(
          profile.id,
          profile.github_access_token
        )

        if (result.success) {
          successCount++
        } else {
          failedCount++
        }

        // GitHub APIのレート制限対策（100ms待機）
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[Repo Detector] Error processing user ${profile.id}:`, error)
        failedCount++
      }
    }

    console.log(`[Repo Detector] Batch detection completed: ${successCount} success, ${failedCount} failed`)

    return {
      processed: profiles.length,
      success: successCount,
      failed: failedCount
    }
  } catch (error) {
    console.error('[Repo Detector] Error in detectRepositoriesForAllUsers:', error)
    return { processed: 0, success: 0, failed: 0 }
  }
}

/**
 * 定期的なリポジトリ更新（週1回などの頻度で実行）
 *
 * 既存ユーザーも含め、全員のリポジトリを更新
 */
export async function updateRepositoriesForAllUsers(): Promise<{
  processed: number
  success: number
  failed: number
}> {
  try {
    const supabase = getSupabaseAdmin()

    // GitHub連携済みの全ユーザーを取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, github_username, github_access_token')
      .not('github_username', 'is', null)
      .not('github_access_token', 'is', null)

    if (profilesError || !profiles || profiles.length === 0) {
      return { processed: 0, success: 0, failed: 0 }
    }

    let successCount = 0
    let failedCount = 0

    for (const profile of profiles) {
      try {
        const result = await detectAndRegisterRepositories(
          profile.id,
          profile.github_access_token
        )

        if (result.success) {
          successCount++
        } else {
          failedCount++
        }

        // GitHub APIのレート制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[Repo Detector] Error updating repos for user ${profile.id}:`, error)
        failedCount++
      }
    }

    console.log(`[Repo Detector] Batch update completed: ${successCount} success, ${failedCount} failed`)

    return {
      processed: profiles.length,
      success: successCount,
      failed: failedCount
    }
  } catch (error) {
    console.error('[Repo Detector] Error in updateRepositoriesForAllUsers:', error)
    return { processed: 0, success: 0, failed: 0 }
  }
}
