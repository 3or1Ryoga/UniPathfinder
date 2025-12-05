'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import LineSuggestionModal from '@/components/modals/LineSuggestionModal'
import { Tables } from '@/app/database.types'
// import IcebergVisualization from '@/components/growth/IcebergVisualization' // 氷山ビジュアライゼーション - デザインが分かりづらいためコメントアウト

type Profile = Tables<'profiles'>
type BlogPost = Tables<'tech_blog_posts'> & { profiles?: Profile }
type Comment = Tables<'post_comments'> & { profiles?: Profile }

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)

  // URLパラメータから表示するユーザーIDを取得
  const viewingUserId = searchParams.get('user')

  // 新UI用のstate
  const [connectionsCount, setConnectionsCount] = useState(0)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingSchool, setIsEditingSchool] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedSchool, setEditedSchool] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // テックブログ用のstate
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [publicPosts, setPublicPosts] = useState<BlogPost[]>([])
  const [leftPosts, setLeftPosts] = useState<BlogPost[]>([])
  const [rightPosts, setRightPosts] = useState<BlogPost[]>([])
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [showReferenceUrl, setShowReferenceUrl] = useState(false)
  const [showEditReferenceUrl, setShowEditReferenceUrl] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const editCoverInputRef = useRef<HTMLInputElement>(null)

  // いいね・コメント用のstate
  const [postLikes, setPostLikes] = useState<{ [postId: string]: { count: number; hasLiked: boolean } }>({})
  const [postComments, setPostComments] = useState<{ [postId: string]: number }>({})

  // コメント管理用のstate
  const [commentsData, setCommentsData] = useState<{ [postId: string]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({})
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState<string>('')

  // コメントモーダル用のstate
  const [commentModalPostId, setCommentModalPostId] = useState<string | null>(null)

  // 投稿詳細モーダル用のstate
  const [viewingPostId, setViewingPostId] = useState<string | null>(null)

  // 無限スクロール用のstate（2列表示用）
  const [isLeftPaused, setIsLeftPaused] = useState(false)
  const [isRightPaused, setIsRightPaused] = useState(false)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)

  // 3D tilt効果用のstate
  const [cardTransforms, setCardTransforms] = useState<{ [postId: string]: string }>({})
  const [newPost, setNewPost] = useState({
    topic: '',
    title: '',
    content: '',
    reference_url: '',
    cover_image_url: ''
  })
  const [editPost, setEditPost] = useState({
    topic: '',
    title: '',
    content: '',
    reference_url: '',
    cover_image_url: ''
  })

  // 事前定義されたトピック
  const TOPICS = [
    '開発',
    '募集',
    '報告',
    'ディープ',
    'ホビー',
    'ウェルネス・健康',
    '失敗と内省',
    '道具・環境',
    'AI',
    'デザイン',
    'その他'
  ]

  // トピックごとのplaceholder画像を返す関数
  function getTopicPlaceholder(topic: string): string {
    const placeholders: { [key: string]: { gradient: string; icon: string } } = {
      '開発': {
        gradient: 'from-blue-400 to-blue-600',
        icon: '💻'
      },
      '募集': {
        gradient: 'from-green-400 to-green-600',
        icon: '📢'
      },
      '報告': {
        gradient: 'from-amber-400 to-amber-600',
        icon: '🪧'
      },
      'ディープ': {
        gradient: 'from-purple-400 to-purple-600',
        icon: '💬'
      },
      'ホビー': {
        gradient: 'from-pink-400 to-pink-600',
        icon: '🎨'
      },
      'ウェルネス・健康': {
        gradient: 'from-teal-400 to-teal-600',
        icon: '🌿'
      },
      '失敗と内省': {
        gradient: 'from-orange-400 to-orange-600',
        icon: '💭'
      },
      '道具・環境': {
        gradient: 'from-yellow-400 to-yellow-600',
        icon: '🛠️'
      },
      'AI': {
        gradient: 'from-indigo-400 to-indigo-600',
        icon: '🤖'
      },
      'デザイン': {
        gradient: 'from-rose-400 to-rose-600',
        icon: '✨'
      },
      'その他': {
        gradient: 'from-gray-400 to-gray-600',
        icon: '📝'
      }
    }

    return placeholders[topic] ? `bg-gradient-to-br ${placeholders[topic].gradient}` : 'bg-gradient-to-br from-gray-400 to-gray-600'
  }

  function getTopicIcon(topic: string): string {
    const icons: { [key: string]: string } = {
      '開発': '💻',
      '募集': '📢',
      '報告': '🪧',
      'ディープ': '💬',
      'ホビー': '🎨',
      'ウェルネス・健康': '🌿',
      '失敗と内省': '💭',
      '道具・環境': '🛠️',
      'AI': '🤖',
      'デザイン': '✨',
      'その他': '📝'
    }

    return icons[topic] || '📝'
  }

  useEffect(() => {
    loadProfile()
    loadConnections()
    loadBlogPosts()
    loadPublicPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingUserId])

  // 投稿が読み込まれたらいいねとコメント数を読み込む
  useEffect(() => {
    if (blogPosts.length > 0 || publicPosts.length > 0) {
      loadLikesAndComments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogPosts.length, publicPosts.length])

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commentModalPostId) {
        closeCommentModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [commentModalPostId])

  // publicPostsを左右にランダムに振り分ける
  useEffect(() => {
    if (publicPosts.length === 0) {
      setLeftPosts([])
      setRightPosts([])
      return
    }

    // シャッフルしてから左右に分ける
    const shuffled = [...publicPosts].sort(() => Math.random() - 0.5)
    const left: BlogPost[] = []
    const right: BlogPost[] = []

    shuffled.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post)
      } else {
        right.push(post)
      }
    })

    setLeftPosts(left)
    setRightPosts(right)
  }, [publicPosts])

  async function loadProfile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        console.log('📊 プロフィールデータ読み込み:')
        console.log('  - avatar_url:', data.avatar_url)
        console.log('  - full_name:', data.full_name)

        setProfile(data)
        setEditedName(data.full_name || '')
        setEditedSchool(data.education || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadConnections() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // 承認済みの繋がりの数を取得
      const { count, error } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error
      setConnectionsCount(count || 0)
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  async function loadBlogPosts() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // 表示するユーザーIDを決定（URLパラメータがあればそれを、なければ自分）
      const targetUserId = viewingUserId || user.id

      // 表示するユーザーのプロフィール情報を取得
      if (viewingUserId && viewingUserId !== user.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', viewingUserId)
          .single()

        if (profileError) throw profileError
        setViewingProfile(profileData)
      } else {
        setViewingProfile(null)
      }

      const { data, error } = await supabase
        .from('tech_blog_posts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBlogPosts(data || [])
    } catch (error) {
      console.error('Error loading blog posts:', error)
    }
  }

  async function loadPublicPosts() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // 公開されている投稿を取得（自分の投稿も含む）
      const { data, error } = await supabase
        .from('tech_blog_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setPublicPosts(data || [])
    } catch (error) {
      console.error('Error loading public posts:', error)
    }
  }

  async function loadLikesAndComments() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // すべての投稿IDを取得
      const allPostIds = [...blogPosts.map(p => p.id), ...publicPosts.map(p => p.id)]

      if (allPostIds.length === 0) return

      // いいね数と自分がいいねしているかを取得
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', allPostIds)

      // コメント数を取得
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', allPostIds)

      // いいねデータを整形
      const likesMap: { [postId: string]: { count: number; hasLiked: boolean } } = {}
      allPostIds.forEach(postId => {
        const postLikesData = likesData?.filter(l => l.post_id === postId) || []
        likesMap[postId] = {
          count: postLikesData.length,
          hasLiked: postLikesData.some(l => l.user_id === user.id)
        }
      })

      // コメントデータを整形
      const commentsMap: { [postId: string]: number } = {}
      allPostIds.forEach(postId => {
        commentsMap[postId] = commentsData?.filter(c => c.post_id === postId).length || 0
      })

      setPostLikes(likesMap)
      setPostComments(commentsMap)
    } catch (error) {
      console.error('Error loading likes and comments:', error)
    }
  }

  async function handleLike(postId: string) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentLikeState = postLikes[postId]

      if (currentLikeState?.hasLiked) {
        // いいねを取り消す
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error

        // ローカル状態を更新
        setPostLikes(prev => ({
          ...prev,
          [postId]: {
            count: (prev[postId]?.count || 1) - 1,
            hasLiked: false
          }
        }))
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }])

        if (error) throw error

        // ローカル状態を更新
        setPostLikes(prev => ({
          ...prev,
          [postId]: {
            count: (prev[postId]?.count || 0) + 1,
            hasLiked: true
          }
        }))
      }
    } catch (error) {
      console.error('Error handling like:', error)
      alert('いいねの処理に失敗しました')
    }
  }

  // コメントモーダルを開く
  async function openCommentModal(postId: string) {
    setCommentModalPostId(postId)

    // コメントがまだ読み込まれていない場合は読み込む
    if (!commentsData[postId]) {
      await loadComments(postId)
    }
  }

  // コメントモーダルを閉じる
  function closeCommentModal() {
    setCommentModalPostId(null)
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  // 投稿詳細モーダルを開く
  async function openPostDetail(postId: string) {
    setViewingPostId(postId)

    // コメントがまだ読み込まれていない場合は読み込む
    if (!commentsData[postId]) {
      await loadComments(postId)
    }
  }

  // 投稿詳細モーダルを閉じる
  function closePostDetail() {
    setViewingPostId(null)
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  // 同じお題で投稿する（投稿詳細を閉じて、同じトピックで新規投稿モーダルを開く）
  function handleCreateSameTopic(topic: string) {
    closePostDetail()
    setNewPost({
      topic: topic,
      title: '',
      content: '',
      reference_url: '',
      cover_image_url: ''
    })
    setIsCreatingPost(true)
  }

  // 特定の投稿のコメント一覧を取得
  async function loadComments(postId: string) {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }) // 古い順

      if (error) throw error

      setCommentsData(prev => ({
        ...prev,
        [postId]: data || []
      }))
    } catch (error) {
      console.error('Error loading comments:', error)
      alert('コメントの読み込みに失敗しました')
    }
  }

  // コメントを投稿
  async function handleAddComment(postId: string) {
    const content = newComment[postId]?.trim()
    if (!content) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // コメントを挿入
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: content
        }])
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      // ローカル状態を更新
      setCommentsData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }))

      // コメント数を更新
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }))

      // 入力欄をクリア
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }))
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('コメントの投稿に失敗しました')
    }
  }

  // コメント編集を開始
  function startEditComment(commentId: string, content: string) {
    setEditingCommentId(commentId)
    setEditingCommentContent(content)
  }

  // コメント編集をキャンセル
  function cancelEditComment() {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  // コメントを更新
  async function handleUpdateComment(postId: string, commentId: string) {
    if (!editingCommentContent.trim()) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('post_comments')
        .update({
          content: editingCommentContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      // ローカル状態を更新
      setCommentsData(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(comment =>
          comment.id === commentId
            ? { ...comment, content: editingCommentContent.trim(), updated_at: new Date().toISOString() }
            : comment
        )
      }))

      // 編集モードを終了
      setEditingCommentId(null)
      setEditingCommentContent('')
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('コメントの更新に失敗しました')
    }
  }

  // コメントを削除
  async function handleDeleteComment(postId: string, commentId: string) {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // ローカル状態を更新
      setCommentsData(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(comment => comment.id !== commentId)
      }))

      // コメント数を更新
      setPostComments(prev => ({
        ...prev,
        [postId]: Math.max((prev[postId] || 1) - 1, 0)
      }))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  // 3D tilt効果を適用する関数
  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>, postId: string) {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -10 // -10〜10度
    const rotateY = ((x - centerX) / centerX) * 10 // -10〜10度

    setCardTransforms(prev => ({
      ...prev,
      [postId]: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05) translateY(-8px)`
    }))
  }

  function handleCardMouseLeave(postId: string) {
    setCardTransforms(prev => ({
      ...prev,
      [postId]: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)'
    }))
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    setUploadingCover(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 新しい画像をアップロード
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('blog_covers')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('blog_covers')
        .getPublicUrl(filePath)

      // プレビュー表示
      if (isEdit) {
        setEditCoverPreview(publicUrl)
        setEditPost({ ...editPost, cover_image_url: publicUrl })
      } else {
        setCoverPreview(publicUrl)
        setNewPost({ ...newPost, cover_image_url: publicUrl })
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      alert('カバー画像のアップロードに失敗しました')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleCreatePost() {
    if (!profile || !newPost.topic || !newPost.title || !newPost.content) {
      alert('トピック、タイトル、本文は必須です')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const postData = {
        user_id: user.id,
        topic: newPost.topic,
        title: newPost.title,
        content: newPost.content,
        reference_url: showReferenceUrl && newPost.reference_url ? newPost.reference_url : null,
        cover_image_url: newPost.cover_image_url || null,
        is_public: true // 常に公開
      }

      const { data: insertedPost, error } = await supabase
        .from('tech_blog_posts')
        .insert([postData])
        .select('id')
        .single()

      if (error) throw error

      // AI分析を非同期で実行（エラーが発生しても投稿処理には影響させない）
      if (insertedPost?.id) {
        fetch('/api/ai-mentor/analyze-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: insertedPost.id })
        }).catch((error) => {
          console.error('AI analysis request failed:', error)
        })
      }

      // リセット
      setNewPost({
        topic: '',
        title: '',
        content: '',
        reference_url: '',
        cover_image_url: ''
      })
      setShowReferenceUrl(false)
      setCoverPreview(null)
      setIsCreatingPost(false)

      // 再読み込み
      await loadBlogPosts()
      await loadPublicPosts()
      alert('投稿を公開しました')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('投稿の作成に失敗しました')
    }
  }

  function handleStartEdit(post: BlogPost) {
    setEditingPostId(post.id)
    setEditPost({
      topic: post.topic,
      title: post.title,
      content: post.content,
      reference_url: post.reference_url || '',
      cover_image_url: post.cover_image_url || ''
    })
    setShowEditReferenceUrl(!!post.reference_url)
    setEditCoverPreview(post.cover_image_url || null)
    setIsEditingPost(true)
  }

  async function handleUpdatePost() {
    if (!editPost.topic || !editPost.title || !editPost.content || !editingPostId) {
      alert('トピック、タイトル、本文は必須です')
      return
    }

    try {
      const supabase = createClient()

      const updateData = {
        topic: editPost.topic,
        title: editPost.title,
        content: editPost.content,
        reference_url: showEditReferenceUrl && editPost.reference_url ? editPost.reference_url : null,
        cover_image_url: editPost.cover_image_url || null
      }

      const { error } = await supabase
        .from('tech_blog_posts')
        .update(updateData)
        .eq('id', editingPostId)

      if (error) throw error

      // リセット
      setEditPost({
        topic: '',
        title: '',
        content: '',
        reference_url: '',
        cover_image_url: ''
      })
      setShowEditReferenceUrl(false)
      setEditCoverPreview(null)
      setIsEditingPost(false)
      setEditingPostId(null)

      // 再読み込み
      await loadBlogPosts()
      await loadPublicPosts()
      alert('投稿を更新しました')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('投稿の更新に失敗しました')
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('この投稿を削除しますか？')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tech_blog_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      await loadBlogPosts()
      await loadPublicPosts()
      alert('投稿を削除しました')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    setUploadingAvatar(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 古い画像を削除（存在する場合）
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // 新しい画像をアップロード
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('🔍 アップロード情報:')
      console.log('  - ファイルパス:', filePath)
      console.log('  - 公開URL:', publicUrl)

      // プロフィールを更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // ローカルstateを更新
      setProfile({ ...profile, avatar_url: publicUrl })
      console.log('✅ プロフィール更新成功')
      alert('プロフィール写真を更新しました')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('アップロードに失敗しました')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveName() {
    if (!profile || !editedName.trim()) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName.trim() })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, full_name: editedName.trim() })
      setIsEditingName(false)
    } catch (error) {
      console.error('Error updating name:', error)
      alert('名前の更新に失敗しました')
    }
  }

  async function handleSaveSchool() {
    if (!profile || !editedSchool.trim()) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ education: editedSchool.trim() })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, education: editedSchool.trim() })
      setIsEditingSchool(false)
    } catch (error) {
      console.error('Error updating school:', error)
      alert('学校名の更新に失敗しました')
    }
  }

  function getInitials(name: string | null): string {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">プロフィールが見つかりません</p>
      </div>
    )
  }

  // 表示するプロフィール（自分 or 他のユーザー）
  const displayProfile = viewingProfile || profile
  // 自分のプロフィールかどうか
  const isOwnProfile = !viewingProfile || viewingProfile.id === profile.id

  return (
    <MainLayout>
      {/* LINE登録サジェストモーダル */}
      <LineSuggestionModal />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 新しいプロフィールカード */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-6 flex-1">
              {/* プロフィール写真 */}
              <div className="relative group flex-shrink-0">
                {isOwnProfile && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                )}
                {isOwnProfile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="relative block"
                  >
                    {displayProfile?.avatar_url ? (
                      <img
                        src={displayProfile.avatar_url}
                        alt="プロフィール写真"
                        className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-2 sm:border-4 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 dark:hover:border-blue-400 transition-all aspect-square"
                        onLoad={() => console.log('✅ 画像読み込み成功:', displayProfile.avatar_url)}
                        onError={(e) => {
                          console.error('❌ 画像読み込み失敗:', displayProfile.avatar_url)
                          console.error('  - エラー詳細:', e)
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold border-2 sm:border-4 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 dark:hover:border-blue-400 transition-all aspect-square">
                        {getInitials(displayProfile?.full_name)}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="relative block">
                    {displayProfile?.avatar_url ? (
                      <img
                        src={displayProfile.avatar_url}
                        alt="プロフィール写真"
                        className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-2 sm:border-4 border-gray-200 dark:border-gray-700 aspect-square"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold border-2 sm:border-4 border-gray-200 dark:border-gray-700 aspect-square">
                        {getInitials(displayProfile?.full_name)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 名前・学校情報 */}
              <div className="flex-1 min-w-0">
                {/* 名前 */}
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  {isEditingName && isOwnProfile ? (
                    <div className="flex items-center gap-1 sm:gap-2 w-full">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName()
                          if (e.key === 'Escape') {
                            setEditedName(displayProfile?.full_name || '')
                            setIsEditingName(false)
                          }
                        }}
                        className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-blue-500 outline-none bg-transparent w-full"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm sm:text-base flex-shrink-0"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditedName(displayProfile?.full_name || '')
                          setIsEditingName(false)
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm sm:text-base flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2 group">
                      <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">
                        {displayProfile?.full_name || '名前未設定'}
                      </h1>
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 flex-shrink-0"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ユーザーID */}
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">@{displayProfile?.id.substring(0, 17)}</p>

                {/* 学校 */}
                {isEditingSchool && isOwnProfile ? (
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    <input
                      type="text"
                      value={editedSchool}
                      onChange={(e) => setEditedSchool(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSchool()
                        if (e.key === 'Escape') {
                          setEditedSchool(displayProfile?.education || '')
                          setIsEditingSchool(false)
                        }
                      }}
                      className="text-xs sm:text-base text-gray-700 dark:text-gray-300 border-b border-blue-500 outline-none bg-transparent w-full"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveSchool}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs sm:text-sm flex-shrink-0"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditedSchool(displayProfile?.education || '')
                        setIsEditingSchool(false)
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs sm:text-sm flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 group mb-2">
                    <p className="text-xs sm:text-base text-gray-700 dark:text-gray-300 truncate">{displayProfile?.education || '学校未設定'}</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditingSchool(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 flex-shrink-0"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* 繋がり */}
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                  つながり <span className="font-bold text-gray-800 dark:text-white">{connectionsCount}人</span>
                </p>
              </div>
            </div>

            {/* プロフィールが見られた数 */}
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 flex items-center justify-between sm:block">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">一般公開</span>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">プロフィールが見られた数</p>
                <p className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white">0<span className="text-sm sm:text-lg">回</span></p>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">(近日実装予定)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 連携セクション */}
        {isOwnProfile && (
          <div className="mb-8">
            {/* 見出し */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
              サービス連携でポテンシャルを可視化し、企業とつながる
            </p>

            {/* 連携ボタン */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* GitHub連携ボタン */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    if (displayProfile?.github_username) {
                      // 連携済み：GitHubデータページへ遷移
                      router.push('/dashboard')
                    } else {
                      // 未連携：連携画面へ遷移
                      router.push('/settings')
                    }
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                    displayProfile?.github_username
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 hover:bg-gray-500 dark:hover:bg-gray-500 animate-ripple'
                  }`}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
                <span className={`text-[10px] sm:text-xs ${displayProfile?.github_username ? 'text-blue-600' : 'text-gray-400'}`}>
                  {displayProfile?.github_username ? '連携済み' : '未連携'}
                </span>
              </div>

              {/* LINE連携ボタン */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    if (displayProfile?.line_user_id) {
                      // 連携済み：公式LINEに遷移
                      window.open('https://line.me/R/ti/p/@409fwjcr', '_blank')
                    } else {
                      // 未連携：連携画面へ遷移
                      router.push('/settings')
                    }
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                    displayProfile?.line_user_id
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 hover:bg-gray-500 dark:hover:bg-gray-500 animate-ripple'
                  }`}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">LINE</span>
                <span className={`text-[10px] sm:text-xs ${displayProfile?.line_user_id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {displayProfile?.line_user_id ? '連携済み' : '未連携'}
                </span>
              </div>

              {/* プラスアイコン（追加連携用） */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    router.push('/settings')
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">追加</span>
                <span className="text-[10px] sm:text-xs text-transparent">　</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* 氷山ビジュアライゼーション（コメントアウト） */}
        {/* デザインが分かりづらいため非表示 */}
        {/* =========================================== */}
        {/*
        {isOwnProfile && (
          <div className="mb-8">
            <div
              onClick={() => router.push('/growth')}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(6, 182, 212, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <IcebergVisualization compact={true} />
              <div style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                クリックして詳細を見る →
              </div>
            </div>
          </div>
        )}
        */}

        {/* =========================================== */}
        {/* プロフィール完成度カード（コメントアウト） */}
        {/* =========================================== */}
        {/*
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">プロフィール完成度</h2>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{completion}%</div>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {completion < 40 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                必須項目が未入力です。まずは必須項目を入力して40%を目指しましょう！
              </p>
            </div>
          )}

          {completion >= 40 && completion < 60 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-medium">
                もう少しです！60%以上で企業からの注目度が3倍にアップします！
              </p>
            </div>
          )}

          {completion >= 60 && completion < 100 && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                素晴らしい！企業からのオファーが届きやすくなっています。100%を目指してさらに充実させましょう！
              </p>
            </div>
          )}

          {completion === 100 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                完璧です！あなたのプロフィールは100%完成しています。企業からのオファーをお待ちください！
              </p>
            </div>
          )}

          {missingFields.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">未入力項目</h3>
              <div className="space-y-2">
                {missingFields.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {field.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                          必須
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300">{field.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">+{field.weight}%</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/onboarding')}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                プロフィールを更新する
              </button>
            </div>
          )}
        </div>
        */}

        {/* =========================================== */}
        {/* プロフィールプレビュー（コメントアウト） */}
        {/* =========================================== */}
        {/*
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">プロフィールプレビュー</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">企業からはこのように見えています</p>

          <div className="space-y-6">
            基本情報
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">氏名</span>
                  <p className="font-medium text-gray-900 dark:text-white">{profile.full_name || '未設定'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">卒業予定年</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile.graduation_year ? `${profile.graduation_year}年卒` : '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">学歴</span>
                  <p className="font-medium text-gray-900 dark:text-white">{profile.education || '未設定'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">GitHubユーザー名</span>
                  <p className="font-medium text-gray-900 dark:text-white">{profile.github_username || '未設定'}</p>
                </div>
              </div>
            </div>

            キャリア
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">キャリア・価値観</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">キャリアの関心</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.career_interests) && profile.career_interests.length > 0 ? (
                      (profile.career_interests as string[]).map((interest) => (
                        <span key={interest} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">仕事を通して実現したいこと</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 whitespace-pre-line">
                    {profile.career_goal || '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">重視する価値観</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.work_values) && profile.work_values.length > 0 ? (
                      (profile.work_values as string[]).map((value) => (
                        <span key={value} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {value}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            技術
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">技術スタック・スキル</h3>
              <div className="space-y-4">
                使用経験のある技術スタック・言語
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">使用経験のある技術スタック・言語</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.tech_stack_experienced) && profile.tech_stack_experienced.length > 0 ? (
                      (profile.tech_stack_experienced as string[]).map((tech) => (
                        <span key={tech} className="px-3 py-1 bg-blue-700 text-white rounded-full text-sm font-medium">
                          {tech}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>

                興味のある技術スタック・言語
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">興味のある技術スタック・言語</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.tech_stack) && profile.tech_stack.length > 0 ? (
                      (profile.tech_stack as string[])
                        .filter(tech => !Array.isArray(profile.tech_stack_experienced) || !(profile.tech_stack_experienced as string[]).includes(tech))
                        .map((tech) => (
                          <span key={tech} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {tech}
                          </span>
                        ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ハードスキル（開発手法）</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.hard_skills) && profile.hard_skills.length > 0 ? (
                      (profile.hard_skills as string[]).map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ソフトスキル</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.soft_skills) && profile.soft_skills.length > 0 ? (
                      (profile.soft_skills as string[]).map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            経験
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">経験・実績</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">活動・職務経験</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 whitespace-pre-line">
                    {profile.experience || '未設定'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ポートフォリオ</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {profile.portfolio_url ? (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {profile.portfolio_url}
                      </a>
                    ) : (
                      '未設定'
                    )}
                  </p>
                </div>
              </div>
            </div>

            AI/LLM活用
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">AI/LLM活用</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">日常的な使用用途</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.ai_usage_scenarios) && profile.ai_usage_scenarios.length > 0 ? (
                      (profile.ai_usage_scenarios as string[]).map((scenario) => (
                        <span key={scenario} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                          {scenario}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">使用経験のあるAIツール</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(profile.ai_tools_experience) && profile.ai_tools_experience.length > 0 ? (
                      (profile.ai_tools_experience as string[]).map((tool) => (
                        <span key={tool} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                          {tool}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">AI技術への関心</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {profile.ai_interest_direction || '未設定'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* テックブログセクション */}
        <div className="mt-8">
          {/* 訴求文言 */}
          <div className="mb-6 text-center sm:text-left">
            {/* <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">あなたのことをもっと教えてください</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              書くことで、あなたの想いや考えが少しずつ形になっていきます。<br className="hidden sm:inline" />
              その記録が、思いがけない出会いにつながるかもしれません。
            </p> */}
          </div>

          {/* 左右レイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：自分の投稿 */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-2 sm:gap-8 p-2 sm:p-6">
                {/* 自分の投稿カード */}
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    onMouseMove={(e) => handleCardMouseMove(e, post.id)}
                    onMouseLeave={() => handleCardMouseLeave(post.id)}
                    style={{
                      transform: cardTransforms[post.id] || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      transformStyle: 'preserve-3d'
                    }}
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-visible hover:shadow-2xl relative border border-gray-200 dark:border-gray-700 group"
                  >
                    {/* 編集・削除ボタン */}
                    {isOwnProfile && (
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(post)}
                          className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full p-2 shadow-lg hover:bg-blue-50 dark:hover:bg-gray-600 dark:bg-blue-900/30 transition-colors"
                          title="編集"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-white dark:bg-gray-800 text-red-500 rounded-full p-2 shadow-lg hover:bg-red-50 dark:hover:bg-gray-600 dark:bg-red-900/30 transition-colors"
                          title="削除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* トピックバッジ（カードの外にはみ出す） */}
                    <div className="absolute -top-4 -left-4 z-10 hidden sm:block">
                      <span className="inline-block px-5 py-3 bg-gray-500/60 dark:bg-gray-600/60 backdrop-blur-sm text-white rounded-2xl text-base font-bold shadow-xl transform rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
                        {post.topic}
                      </span>
                    </div>

                    {/* カバー画像 */}
                    <div className="w-full aspect-square sm:aspect-[16/9] relative overflow-hidden rounded-2xl sm:rounded-t-2xl">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${getTopicPlaceholder(post.topic)} flex items-center justify-center`}>
                          <span className="text-5xl">{getTopicIcon(post.topic)}</span>
                        </div>
                      )}

                      {/* ハート・チャットアイコン（カバー画像の右下） */}
                      <div className="absolute bottom-1 right-1 sm:bottom-3 sm:right-3 flex items-center gap-1 sm:gap-3">
                        {/* いいねボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLike(post.id)
                          }}
                          className="flex items-center gap-0.5 sm:gap-1.5 bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-1.5 py-1 sm:px-3 sm:py-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        >
                          <svg
                            className={`w-3 h-3 sm:w-5 sm:h-5 transition-colors ${
                              postLikes[post.id]?.hasLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                            }`}
                            fill={postLikes[post.id]?.hasLiked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white">
                            {postLikes[post.id]?.count || 0}
                          </span>
                        </button>

                        {/* コメントボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openCommentModal(post.id)
                          }}
                          className="flex items-center gap-0.5 sm:gap-1.5 bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-1.5 py-1 sm:px-3 sm:py-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        >
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white">
                            {postComments[post.id] || 0}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* コンテンツ */}
                    <div className="p-4 hidden sm:block">
                      {/* タイトル */}
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base line-clamp-2 leading-tight">{post.title}</h3>

                      {/* 本文（プレビュー） */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-4 leading-relaxed">{post.content}</p>

                      {/* 参照URL */}
                      {post.reference_url && (
                        <a
                          href={post.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block mb-3 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="text-sm text-blue-600 dark:text-blue-400 truncate font-medium">{new URL(post.reference_url).hostname}</span>
                          </div>
                        </a>
                      )}

                      {/* 投稿日時 */}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 新規投稿カード（自分のプロフィールのみ表示） */}
                {isOwnProfile && (
                  <button
                    onClick={() => setIsCreatingPost(true)}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:from-blue-50 hover:to-indigo-50 transition-all flex flex-col items-center justify-center aspect-square sm:min-h-[320px] sm:aspect-auto group"
                  >
                    <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 flex items-center justify-center mb-2 sm:mb-4 transition-all shadow-lg">
                      <svg className="w-4 h-4 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-base font-bold text-gray-800 dark:text-white group-hover:text-blue-700 dark:hover:text-blue-300 transition-colors">投稿を作成</p>
                    <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-center px-2 sm:px-4">今日のあなたをシェアしよう</p>
                  </button>
                )}
              </div>
            </div>

            {/* 右側：みんなのテックブログ */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl p-4 border border-blue-100 dark:border-blue-800 sticky top-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="font-bold text-gray-800 dark:text-white">皆の小さなテックブログ</h3>
                </div>

                {publicPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">まだ投稿がありません</p>
                  </div>
                ) : (
                  <div className="relative h-[600px] overflow-hidden">
                    {/* 2列グリッドレイアウト */}
                    <div className="grid grid-cols-2 gap-2 h-full">
                      {/* 左列（下→上） */}
                      <div className="relative h-full overflow-hidden">
                        <div
                          className="space-y-2 animate-scroll-up"
                          style={{
                            animationPlayState: isLeftPaused ? 'paused' : 'running'
                          }}
                          onMouseEnter={() => setIsLeftPaused(true)}
                          onMouseLeave={() => {
                            setIsLeftPaused(false)
                            setHoveredPostId(null)
                          }}
                        >
                          {/* 左列の投稿（2回繰り返して無限スクロール） */}
                          {[...leftPosts, ...leftPosts].map((post: BlogPost, index: number) => (
                            <div
                              key={`left-${post.id}-${index}`}
                              className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                              onMouseEnter={() => setHoveredPostId(`left-${post.id}-${index}`)}
                              onMouseLeave={() => setHoveredPostId(null)}
                              onClick={() => {
                                // 自分の投稿ならプロフィールに遷移、他人の投稿なら詳細モーダルを開く
                                if (post.user_id === profile?.id) {
                                  router.push(`/home?user=${post.user_id}`)
                                } else {
                                  openPostDetail(post.id)
                                }
                              }}
                            >
                              {/* 正方形の写真 or 本文プレビュー */}
                              <div className="relative w-full aspect-square">
                            {post.cover_image_url ? (
                              <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full ${getTopicPlaceholder(post.topic)} flex items-center justify-center p-4`}>
                                <p className="text-white text-sm text-center line-clamp-6">
                                  {post.content}
                                </p>
                              </div>
                            )}

                                {/* ホバー時のオーバーレイ */}
                                {hoveredPostId === `left-${post.id}-${index}` && (
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-2 transition-opacity duration-300">
                                    {/* ユーザー情報 */}
                                    <div className="flex flex-col items-center mb-2">
                                      {post.profiles?.avatar_url ? (
                                        <img
                                          src={post.profiles.avatar_url}
                                          alt="プロフィール写真"
                                          className="w-8 h-8 rounded-full object-cover mb-1 border-2 border-white"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mb-1 border-2 border-white">
                                          {post.profiles?.full_name?.[0] || 'U'}
                                        </div>
                                      )}
                                      <span className="text-white text-xs font-medium">
                                        {post.profiles?.full_name || '匿名ユーザー'}
                                      </span>
                                    </div>

                                    {/* いいね・コメントボタン */}
                                    <div className="flex items-center gap-2">
                                      {/* いいねボタン */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleLike(post.id)
                                        }}
                                        className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg hover:bg-white dark:bg-gray-800 transition-all"
                                      >
                                        <svg
                                          className={`w-3 h-3 transition-colors ${
                                            postLikes[post.id]?.hasLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                                          }`}
                                          fill={postLikes[post.id]?.hasLiked ? 'currentColor' : 'none'}
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                          />
                                        </svg>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">
                                          {postLikes[post.id]?.count || 0}
                                        </span>
                                      </button>

                                      {/* コメントボタン */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openCommentModal(post.id)
                                        }}
                                        className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg hover:bg-white dark:bg-gray-800 transition-all"
                                      >
                                        <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                          />
                                        </svg>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">
                                          {postComments[post.id] || 0}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                            )}
                          </div>

                                  {/* タイトル */}
                                  <div className="p-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white text-xs line-clamp-2 leading-tight">
                                      {post.title}
                                    </h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 右列（上→下） */}
                          <div className="relative h-full overflow-hidden">
                            <div
                              className="space-y-2 animate-scroll-down"
                              style={{
                                animationPlayState: isRightPaused ? 'paused' : 'running'
                              }}
                              onMouseEnter={() => setIsRightPaused(true)}
                              onMouseLeave={() => {
                                setIsRightPaused(false)
                                setHoveredPostId(null)
                              }}
                            >
                              {/* 右列の投稿（2回繰り返して無限スクロール） */}
                              {[...rightPosts, ...rightPosts].map((post: BlogPost, index: number) => (
                                <div
                                  key={`right-${post.id}-${index}`}
                                  className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                                  onMouseEnter={() => setHoveredPostId(`right-${post.id}-${index}`)}
                                  onMouseLeave={() => setHoveredPostId(null)}
                                  onClick={() => {
                                    // 自分の投稿ならプロフィールに遷移、他人の投稿なら詳細モーダルを開く
                                    if (post.user_id === profile?.id) {
                                      router.push(`/home?user=${post.user_id}`)
                                    } else {
                                      openPostDetail(post.id)
                                    }
                                  }}
                                >
                                  {/* 正方形の写真 or 本文プレビュー */}
                                  <div className="relative w-full aspect-square">
                                    {post.cover_image_url ? (
                                      <img
                                        src={post.cover_image_url}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className={`w-full h-full ${getTopicPlaceholder(post.topic)} flex items-center justify-center p-4`}>
                                        <p className="text-white text-xs text-center line-clamp-6">
                                          {post.content}
                                        </p>
                                      </div>
                                    )}

                                    {/* ホバー時のオーバーレイ */}
                                    {hoveredPostId === `right-${post.id}-${index}` && (
                                      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-2 transition-opacity duration-300">
                                        {/* ユーザー情報 */}
                                        <div className="flex flex-col items-center mb-2">
                                          {post.profiles?.avatar_url ? (
                                            <img
                                              src={post.profiles.avatar_url}
                                              alt="プロフィール写真"
                                              className="w-8 h-8 rounded-full object-cover mb-1 border-2 border-white"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mb-1 border-2 border-white">
                                              {post.profiles?.full_name?.[0] || 'U'}
                                            </div>
                                          )}
                                          <span className="text-white text-xs font-medium">
                                            {post.profiles?.full_name || '匿名ユーザー'}
                                          </span>
                                        </div>

                                        {/* いいね・コメントボタン */}
                                        <div className="flex items-center gap-2">
                                          {/* いいねボタン */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleLike(post.id)
                                            }}
                                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg hover:bg-white dark:bg-gray-800 transition-all"
                                          >
                                            <svg
                                              className={`w-3 h-3 transition-colors ${
                                                postLikes[post.id]?.hasLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                                              }`}
                                              fill={postLikes[post.id]?.hasLiked ? 'currentColor' : 'none'}
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                              />
                                            </svg>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white">
                                              {postLikes[post.id]?.count || 0}
                                            </span>
                                          </button>

                                          {/* コメントボタン */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openCommentModal(post.id)
                                            }}
                                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg hover:bg-white dark:bg-gray-800 transition-all"
                                          >
                                            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                              />
                                            </svg>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white">
                                              {postComments[post.id] || 0}
                                            </span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* タイトル */}
                                  <div className="p-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white text-xs line-clamp-2 leading-tight">
                                      {post.title}
                                    </h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
              </div>
            </div>
          </div>
        </div>

        {/* 投稿作成モーダル */}
        {isCreatingPost && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">テックブログを投稿</h3>
                  <button
                    onClick={() => {
                      setIsCreatingPost(false)
                      setNewPost({
                        topic: '',
                        title: '',
                        content: '',
                        reference_url: '',
                        cover_image_url: ''
                      })
                      setCoverPreview(null)
                      setShowReferenceUrl(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* トピック選択 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    トピックは？
                  </label>
                  <select
                    value={newPost.topic}
                    onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">トピックを選択...</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* カバー画像 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    カバー画像（任意）
                  </label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e, false)}
                    className="hidden"
                  />
                  {coverPreview ? (
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <img
                        src={coverPreview}
                        alt="カバー画像プレビュー"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setCoverPreview(null)
                          setNewPost({ ...newPost, cover_image_url: '' })
                        }}
                        className="absolute top-2 right-2 bg-red-50 dark:bg-red-900/300 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-600 dark:bg-blue-900/30"
                    >
                      {uploadingCover ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-300">クリックして画像を選択</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">横長の画像を推奨（5MB以下）</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* タイトル */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="例: Next.js 15の新機能を試してみた"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* 本文 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    本文
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="今日のあなたをシェアしよう"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* 参照URLチェックボックス */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReferenceUrl}
                      onChange={(e) => setShowReferenceUrl(e.target.checked)}
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">参照URLを追加</span>
                  </label>
                </div>

                {/* 参照URL入力（チェックボックスがONの場合のみ表示） */}
                {showReferenceUrl && (
                  <div className="mb-4 pl-6 animate-in slide-in-from-top duration-200">
                    <input
                      type="url"
                      value={newPost.reference_url}
                      onChange={(e) => setNewPost({ ...newPost, reference_url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setIsCreatingPost(false)
                      setNewPost({
                        topic: '',
                        title: '',
                        content: '',
                        reference_url: '',
                        cover_image_url: ''
                      })
                      setCoverPreview(null)
                      setShowReferenceUrl(false)
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    公開する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 投稿編集モーダル */}
        {isEditingPost && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">投稿を編集</h3>
                  <button
                    onClick={() => {
                      setIsEditingPost(false)
                      setEditPost({
                        topic: '',
                        title: '',
                        content: '',
                        reference_url: '',
                        cover_image_url: ''
                      })
                      setEditCoverPreview(null)
                      setShowEditReferenceUrl(false)
                      setEditingPostId(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* トピック選択 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    トピックは？
                  </label>
                  <select
                    value={editPost.topic}
                    onChange={(e) => setEditPost({ ...editPost, topic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="">トピックを選択...</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* カバー画像 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    カバー画像（任意）
                  </label>
                  <input
                    ref={editCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e, true)}
                    className="hidden"
                  />
                  {editCoverPreview ? (
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <img
                        src={editCoverPreview}
                        alt="カバー画像プレビュー"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setEditCoverPreview(null)
                          setEditPost({ ...editPost, cover_image_url: '' })
                        }}
                        className="absolute top-2 right-2 bg-red-50 dark:bg-red-900/300 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => editCoverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-600 dark:bg-blue-900/30"
                    >
                      {uploadingCover ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-300">クリックして画像を選択</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">横長の画像を推奨（5MB以下）</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* タイトル */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                    placeholder="例: Next.js 15の新機能を試してみた"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* 本文 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    本文
                  </label>
                  <textarea
                    value={editPost.content}
                    onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                    placeholder="今日のあなたをシェアしよう"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* 参照URLチェックボックス */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEditReferenceUrl}
                      onChange={(e) => setShowEditReferenceUrl(e.target.checked)}
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">参照URLを追加</span>
                  </label>
                </div>

                {/* 参照URL入力（チェックボックスがONの場合のみ表示） */}
                {showEditReferenceUrl && (
                  <div className="mb-4 pl-6 animate-in slide-in-from-top duration-200">
                    <input
                      type="url"
                      value={editPost.reference_url}
                      onChange={(e) => setEditPost({ ...editPost, reference_url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setIsEditingPost(false)
                      setEditPost({
                        topic: '',
                        title: '',
                        content: '',
                        reference_url: '',
                        cover_image_url: ''
                      })
                      setEditCoverPreview(null)
                      setShowEditReferenceUrl(false)
                      setEditingPostId(null)
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdatePost}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    更新する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* コメントモーダル */}
        {commentModalPostId && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
            onClick={closeCommentModal}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">コメント</h3>
                <button
                  onClick={closeCommentModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* コメント一覧 */}
              <div className="flex-1 overflow-y-auto p-6">
                {commentsData[commentModalPostId]?.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">まだコメントがありません</p>
                ) : (
                  <div className="space-y-4">
                    {commentsData[commentModalPostId]?.map((comment: Comment) => (
                      <div key={comment.id} className="flex gap-3">
                        {/* アバター */}
                        <div className="flex-shrink-0">
                          {comment.profiles?.avatar_url ? (
                            <img
                              src={comment.profiles.avatar_url}
                              alt={comment.profiles.full_name ?? 'User avatar'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                              {comment.profiles?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>

                        {/* コメント内容 */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {comment.profiles?.full_name || '名前未設定'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>

                          {/* 編集モード */}
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateComment(commentModalPostId, comment.id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={cancelEditComment}
                                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 dark:hover:bg-gray-500 dark:bg-gray-600 transition-colors"
                                >
                                  キャンセル
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>

                              {/* 編集・削除ボタン（自分のコメントのみ） */}
                              {comment.user_id === profile?.id && (
                                <div className="flex gap-3 mt-2">
                                  <button
                                    onClick={() => startEditComment(comment.id, comment.content)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                  >
                                    編集
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(commentModalPostId, comment.id)}
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                  >
                                    削除
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 新規コメント入力欄 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <div className="flex gap-3">
                  {/* アバター */}
                  <div className="flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="あなた"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {profile?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  {/* 入力欄 */}
                  <div className="flex-1">
                    <textarea
                      value={newComment[commentModalPostId] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [commentModalPostId]: e.target.value }))}
                      placeholder="コメントを入力..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleAddComment(commentModalPostId)}
                        disabled={!newComment[commentModalPostId]?.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        投稿
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 投稿詳細モーダル（他人の投稿用） */}
        {viewingPostId && (() => {
          // viewingPostIdから投稿データを取得
          const viewingPost = [...publicPosts, ...leftPosts, ...rightPosts].find(p => p.id === viewingPostId)

          if (!viewingPost) return null

          return (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closePostDetail}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {/* 投稿者アバター */}
                    {viewingPost.profiles?.avatar_url ? (
                      <img
                        src={viewingPost.profiles.avatar_url}
                        alt={viewingPost.profiles.full_name ?? 'User avatar'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {viewingPost.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{viewingPost.profiles?.full_name || '匿名ユーザー'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(viewingPost.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePostDetail}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 投稿内容 */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* お題タグ */}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 dark:bg-gray-9000/60 backdrop-blur-sm text-white">
                        {viewingPost.topic}
                      </span>
                    </div>

                    {/* 投稿画像（中程度サイズ） */}
                    {viewingPost.cover_image_url && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={viewingPost.cover_image_url}
                          alt={viewingPost.title}
                          className="w-full max-h-96 object-cover"
                        />
                      </div>
                    )}

                    {/* タイトル */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{viewingPost.title}</h2>

                    {/* 本文 */}
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{viewingPost.content}</p>
                    </div>

                    {/* 参考リンク */}
                    {viewingPost.reference_url && (
                      <a
                        href={viewingPost.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-sm text-blue-600 dark:text-blue-400 truncate font-medium">{new URL(viewingPost.reference_url).hostname}</span>
                        </div>
                      </a>
                    )}

                    {/* いいね・コメント数と「同じお題で投稿」ボタン */}
                    <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        {/* いいね */}
                        <button
                          onClick={() => handleLike(viewingPost.id)}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg
                            className={`w-6 h-6 transition-colors ${
                              postLikes[viewingPost.id]?.hasLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                            }`}
                            fill={postLikes[viewingPost.id]?.hasLiked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="font-semibold">{postLikes[viewingPost.id]?.count || 0}</span>
                        </button>

                        {/* コメント */}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="font-semibold">{postComments[viewingPost.id] || 0}</span>
                        </div>
                      </div>

                      {/* 同じお題で投稿ボタン */}
                      <button
                        onClick={() => handleCreateSameTopic(viewingPost.topic)}
                        className="px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium text-sm shadow-lg"
                      >
                        同じお題で投稿
                      </button>
                    </div>

                    {/* コメント一覧 */}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4">コメント</h4>
                      {commentsData[viewingPostId]?.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">まだコメントがありません</p>
                      ) : (
                        <div className="space-y-4 mb-6">
                          {commentsData[viewingPostId]?.map((comment: Comment) => (
                            <div key={comment.id} className="flex gap-3">
                              {/* アバター */}
                              <div className="flex-shrink-0">
                                {comment.profiles?.avatar_url ? (
                                  <img
                                    src={comment.profiles.avatar_url}
                                    alt={comment.profiles.full_name ?? 'User avatar'}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {comment.profiles?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>

                              {/* コメント内容 */}
                              <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {comment.profiles?.full_name || '名前未設定'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>

                                {/* 編集モード */}
                                {editingCommentId === comment.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingCommentContent}
                                      onChange={(e) => setEditingCommentContent(e.target.value)}
                                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows={3}
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateComment(viewingPostId, comment.id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        保存
                                      </button>
                                      <button
                                        onClick={cancelEditComment}
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 dark:hover:bg-gray-500 dark:bg-gray-600 transition-colors"
                                      >
                                        キャンセル
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                      {comment.content}
                                    </p>

                                    {/* 編集・削除ボタン（自分のコメントのみ） */}
                                    {comment.user_id === profile?.id && (
                                      <div className="flex gap-3 mt-2">
                                        <button
                                          onClick={() => startEditComment(comment.id, comment.content)}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                        >
                                          編集
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(viewingPostId, comment.id)}
                                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                        >
                                          削除
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 新規コメント入力欄 */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex gap-3">
                          {/* アバター */}
                          <div className="flex-shrink-0">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt="あなた"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                {profile?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>

                          {/* 入力欄 */}
                          <div className="flex-1">
                            <textarea
                              value={newComment[viewingPostId] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [viewingPostId]: e.target.value }))}
                              placeholder="コメントを入力..."
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleAddComment(viewingPostId)}
                                disabled={!newComment[viewingPostId]?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                投稿
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </MainLayout>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">読み込み中...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
