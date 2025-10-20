import { Tables } from '@/app/database.types'

type Profile = Tables<'profiles'>

/**
 * プロフィール完成度を計算する関数
 *
 * 必須項目（40%）:
 * - full_name (5%)
 * - graduation_year (5%)
 * - education (5%)
 * - career_interests (10%, 最低1つ)
 * - career_goal (10%)
 * - github_username (5%)
 *
 * 任意項目（合計60%まで）:
 * - tech_stack (5%, 最低3つ興味)
 * - tech_stack_experienced (5%, 最低3つ経験)
 * - work_values (10%, 最低2つ)
 * - preferred_locations (5%, 最低1つ)
 * - experience (10%)
 * - portfolio_projects/portfolio_url (10%, どちらか1つ以上)
 * - hard_skills (5%, 最低2つ)
 * - soft_skills (5%, 最低2つ)
 * - ai_usage_scenarios (3%, 最低1つ)
 * - ai_tools_experience (3%, 最低1つ)
 * - ai_interest_direction (4%)
 * - bio (5%)
 */
export function calculateProfileCompletion(profile: Profile): number {
  let completion = 0

  // ========== 必須項目（40%） ==========

  // full_name (5%)
  if (profile.full_name && profile.full_name.trim().length > 0) {
    completion += 5
  }

  // graduation_year (5%)
  if (profile.graduation_year && profile.graduation_year > 2000) {
    completion += 5
  }

  // education (5%)
  if (profile.education && profile.education.trim().length > 0) {
    completion += 5
  }

  // career_interests (10%, 最低1つ)
  if (profile.career_interests) {
    const interests = Array.isArray(profile.career_interests)
      ? profile.career_interests
      : []
    if (interests.length >= 1) {
      completion += 10
    }
  }

  // career_goal (10%)
  if (profile.career_goal && profile.career_goal.trim().length > 0) {
    completion += 10
  }

  // github_username (5%)
  if (profile.github_username && profile.github_username.trim().length > 0) {
    completion += 5
  }

  // ========== 任意項目（合計60%まで） ==========

  // tech_stack (5%, 最低3つ興味)
  if (profile.tech_stack) {
    const techStack = Array.isArray(profile.tech_stack)
      ? profile.tech_stack
      : []
    if (techStack.length >= 3) {
      completion += 5
    }
  }

  // tech_stack_experienced (5%, 最低3つ経験)
  if (profile.tech_stack_experienced) {
    const techStackExperienced = Array.isArray(profile.tech_stack_experienced)
      ? profile.tech_stack_experienced
      : []
    if (techStackExperienced.length >= 3) {
      completion += 5
    }
  }

  // work_values (10%, 最低2つ)
  if (profile.work_values) {
    const workValues = Array.isArray(profile.work_values)
      ? profile.work_values
      : []
    if (workValues.length >= 2) {
      completion += 10
    }
  }

  // preferred_locations (5%, 最低1つ)
  if (profile.preferred_locations) {
    const locations = Array.isArray(profile.preferred_locations)
      ? profile.preferred_locations
      : []
    if (locations.length >= 1) {
      completion += 5
    }
  }

  // experience (10%)
  if (profile.experience && profile.experience.trim().length > 0) {
    completion += 10
  }

  // portfolio_projects/portfolio_url (10%, どちらか1つ以上)
  const hasPortfolioProjects = profile.portfolio_projects &&
    Array.isArray(profile.portfolio_projects) &&
    profile.portfolio_projects.length >= 1
  const hasPortfolioUrl = profile.portfolio_url &&
    profile.portfolio_url.trim().length > 0

  if (hasPortfolioProjects || hasPortfolioUrl) {
    completion += 10
  }

  // hard_skills (5%, 最低2つ)
  if (profile.hard_skills) {
    const hardSkills = Array.isArray(profile.hard_skills)
      ? profile.hard_skills
      : []
    if (hardSkills.length >= 2) {
      completion += 5
    }
  }

  // soft_skills (5%, 最低2つ)
  if (profile.soft_skills) {
    const softSkills = Array.isArray(profile.soft_skills)
      ? profile.soft_skills
      : []
    if (softSkills.length >= 2) {
      completion += 5
    }
  }

  // ai_usage_scenarios (3%, 最低1つ)
  if (profile.ai_usage_scenarios) {
    const aiUsageScenarios = Array.isArray(profile.ai_usage_scenarios)
      ? profile.ai_usage_scenarios
      : []
    if (aiUsageScenarios.length >= 1) {
      completion += 3
    }
  }

  // ai_tools_experience (3%, 最低1つ)
  if (profile.ai_tools_experience) {
    const aiToolsExperience = Array.isArray(profile.ai_tools_experience)
      ? profile.ai_tools_experience
      : []
    if (aiToolsExperience.length >= 1) {
      completion += 3
    }
  }

  // ai_interest_direction (4%)
  if (profile.ai_interest_direction && profile.ai_interest_direction.trim().length > 0) {
    completion += 4
  }

  // bio (5%)
  if (profile.bio && profile.bio.trim().length > 0) {
    completion += 5
  }

  return Math.min(completion, 100)
}

/**
 * 必須項目が完了しているかチェックする関数（40%）
 */
export function isRequiredFieldsComplete(profile: Profile): boolean {
  return (
    profile.full_name !== null && profile.full_name.trim().length > 0 &&
    profile.graduation_year !== null && profile.graduation_year > 2000 &&
    profile.education !== null && profile.education.trim().length > 0 &&
    profile.career_interests !== null &&
      Array.isArray(profile.career_interests) &&
      profile.career_interests.length >= 1 &&
    profile.career_goal !== null && profile.career_goal.trim().length > 0 &&
    profile.github_username !== null && profile.github_username.trim().length > 0
  )
}

/**
 * プロフィール完成度が60%以上かチェックする関数
 */
export function isProfileSufficient(profile: Profile): boolean {
  return calculateProfileCompletion(profile) >= 60
}

/**
 * 未完了の項目を取得する関数
 */
export interface MissingField {
  field: string
  label: string
  weight: number
  required: boolean
}

export function getMissingFields(profile: Profile): MissingField[] {
  const missing: MissingField[] = []

  // 必須項目
  if (!profile.full_name || profile.full_name.trim().length === 0) {
    missing.push({ field: 'full_name', label: '氏名', weight: 5, required: true })
  }
  if (!profile.graduation_year || profile.graduation_year <= 2000) {
    missing.push({ field: 'graduation_year', label: '卒業予定年', weight: 5, required: true })
  }
  if (!profile.education || profile.education.trim().length === 0) {
    missing.push({ field: 'education', label: '学歴', weight: 5, required: true })
  }
  if (!profile.career_interests || !Array.isArray(profile.career_interests) || profile.career_interests.length === 0) {
    missing.push({ field: 'career_interests', label: 'キャリアの関心', weight: 10, required: true })
  }
  if (!profile.career_goal || profile.career_goal.trim().length === 0) {
    missing.push({ field: 'career_goal', label: '仕事を通して実現したいこと', weight: 10, required: true })
  }
  if (!profile.github_username || profile.github_username.trim().length === 0) {
    missing.push({ field: 'github_username', label: 'GitHubユーザー名', weight: 5, required: true })
  }

  // 任意項目
  if (!profile.tech_stack || !Array.isArray(profile.tech_stack) || profile.tech_stack.length < 3) {
    missing.push({ field: 'tech_stack', label: '興味のある技術スタック（3つ以上）', weight: 5, required: false })
  }
  if (!profile.tech_stack_experienced || !Array.isArray(profile.tech_stack_experienced) || profile.tech_stack_experienced.length < 3) {
    missing.push({ field: 'tech_stack_experienced', label: '使用経験のある技術スタック（3つ以上）', weight: 5, required: false })
  }
  if (!profile.work_values || !Array.isArray(profile.work_values) || profile.work_values.length < 2) {
    missing.push({ field: 'work_values', label: 'キャリアで重視すること（2つ以上）', weight: 10, required: false })
  }
  if (!profile.preferred_locations || !Array.isArray(profile.preferred_locations) || profile.preferred_locations.length === 0) {
    missing.push({ field: 'preferred_locations', label: '希望勤務地', weight: 5, required: false })
  }
  if (!profile.experience || profile.experience.trim().length === 0) {
    missing.push({ field: 'experience', label: '活動・職務経験', weight: 10, required: false })
  }

  const hasPortfolioProjects = profile.portfolio_projects && Array.isArray(profile.portfolio_projects) && profile.portfolio_projects.length >= 1
  const hasPortfolioUrl = profile.portfolio_url && profile.portfolio_url.trim().length > 0
  if (!hasPortfolioProjects && !hasPortfolioUrl) {
    missing.push({ field: 'portfolio', label: 'ポートフォリオ/プロジェクトURL', weight: 10, required: false })
  }

  if (!profile.hard_skills || !Array.isArray(profile.hard_skills) || profile.hard_skills.length < 2) {
    missing.push({ field: 'hard_skills', label: 'ハードスキル（開発手法、2つ以上）', weight: 5, required: false })
  }
  if (!profile.soft_skills || !Array.isArray(profile.soft_skills) || profile.soft_skills.length < 2) {
    missing.push({ field: 'soft_skills', label: 'ソフトスキル（2つ以上）', weight: 5, required: false })
  }
  if (!profile.ai_usage_scenarios || !Array.isArray(profile.ai_usage_scenarios) || profile.ai_usage_scenarios.length === 0) {
    missing.push({ field: 'ai_usage_scenarios', label: '日常的なAI使用用途', weight: 3, required: false })
  }
  if (!profile.ai_tools_experience || !Array.isArray(profile.ai_tools_experience) || profile.ai_tools_experience.length === 0) {
    missing.push({ field: 'ai_tools_experience', label: 'AIツール使用経験', weight: 3, required: false })
  }
  if (!profile.ai_interest_direction || profile.ai_interest_direction.trim().length === 0) {
    missing.push({ field: 'ai_interest_direction', label: 'AI技術への関心方向', weight: 4, required: false })
  }
  if (!profile.bio || profile.bio.trim().length === 0) {
    missing.push({ field: 'bio', label: '自己紹介', weight: 5, required: false })
  }

  return missing
}
