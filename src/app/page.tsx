'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // システム設定からダークモードを検知
  useEffect(() => {
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(systemDarkMode)
  }, [])

  // ダークモードの切り替え
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleGitHubLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        console.error('GitHub login error:', error)
        setError('GitHubログインに失敗しました。もう一度お試しください。')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('予期しないエラーが発生しました。')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setError(null)
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        console.error('Google login error:', error)
        setError('Googleログインに失敗しました。もう一度お試しください。')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('予期しないエラーが発生しました。')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:bg-black transition-colors duration-300">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/gakusei_engineer_com.jpeg"
                alt="学生エンジニア.com Logo"
                width={180}
                height={180}
                className="h-12 w-auto"
              />
            </motion.div>

            <div className="flex items-center gap-4">
              {/* デスクトップナビゲーション */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-cyan-400 transition-colors font-medium">
                  サービスについて
                </a>
                <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-cyan-400 transition-colors font-medium">
                  ご利用の流れ
                </a>
                <a href="#faq" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-cyan-400 transition-colors font-medium">
                  FAQ
                </a>
              </nav>

              {/* ダークモード切り替えボタン */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="ダークモード切り替え"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* モバイルメニューボタン */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors font-medium">
                サービスについて
              </a>
              <a href="#how-it-works" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors font-medium">
                ご利用の流れ
              </a>
              <a href="#faq" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors font-medium">
                FAQ
              </a>
            </div>
          </motion.div>
        )}
      </header>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
            {/* 左側：テキストコンテンツ（PCのみ表示） */}
            <div className="hidden lg:block">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <Image
                  src="/gakusei_engineer_com.jpeg"
                  alt="学生エンジニア.com Logo"
                  width={400}
                  height={400}
                  className="w-auto h-32 object-contain"
                />
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-200 leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="block whitespace-nowrap">エンジニアを目指す・</span>
                <span className="block whitespace-nowrap">
                  成長したい
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-400">
                    学生
                  </span>
                  のための
                </span>
                <span className="block whitespace-nowrap text-2xl sm:text-2xl lg:text-3xl">
                  ポテンシャル就活/キャリア支援サービス
                </span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                バイト・インターン・イベント探しにも対応
              </motion.p>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* ログインボタン */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* GitHub認証ボタン */}
                  <button
                    onClick={handleGitHubLogin}
                    disabled={loading || googleLoading}
                    className="flex-1 px-6 py-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    {loading ? '処理中...' : 'GitHubでログイン'}
                  </button>

                  {/* Google認証ボタン */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading || googleLoading}
                    className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <svg height="20" width="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleLoading ? '処理中...' : 'Googleでログイン'}
                  </button>
                </div>

                {/* 訴求ポイント */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">ずっと完全無料</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">最新のAIを用いた技術診断</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">バイトやインターン探しにも</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 右側：モックアップとスカウトメッセージ */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* メインモックアップ（実際のアプリ画像） */}
              <motion.div
                className="relative z-10 mx-auto w-full max-w-[280px] sm:max-w-xs lg:max-w-sm"
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/TechMight_SmartPhone.png"
                  alt="TechMight アプリ画面"
                  width={1080}
                  height={1920}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </motion.div>

              {/* 浮かぶスカウトメッセージ - 右上 */}
              <motion.div
                className="absolute right-2 top-8 sm:right-4 sm:top-10 md:-right-8 md:top-12 bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-xl max-w-[160px] sm:max-w-[180px] md:max-w-xs z-20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Image
                    src="/gakusei_engineer_com.jpeg"
                    alt="学生エンジニア.com"
                    width={40}
                    height={40}
                    className="rounded-full w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-200">学生エンジニア.com</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-1">あなたの学習意欲に目が止まりました。弊社のミッションとも通じる部分も多いので、ぜひお話ししたいです！！</p>
                  </div>
                </div>
              </motion.div>

              {/* 浮かぶスカウトメッセージ - 左下 */}
              <motion.div
                className="absolute left-2 bottom-16 sm:left-4 sm:bottom-20 md:-left-8 md:bottom-24 bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 shadow-xl max-w-[160px] sm:max-w-[180px] md:max-w-xs z-20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-200">AI Startup</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-1">私たちもAIベースで開発をしています<br></br>あなたと知見を共有したいです！！</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* スマホ専用コンテンツ */}
            <div className="lg:hidden space-y-6 w-full">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* ログインボタン */}
              <div className="flex flex-col gap-4">
                {/* GitHub認証ボタン */}
                <button
                  onClick={handleGitHubLogin}
                  disabled={loading || googleLoading}
                  className="w-full px-6 py-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  {loading ? '処理中...' : 'GitHubでログイン'}
                </button>

                {/* Google認証ボタン */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="w-full px-6 py-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <svg height="20" width="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {googleLoading ? '処理中...' : 'Googleでログイン'}
                </button>
              </div>

              {/* 訴求ポイント */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">ずっと完全無料</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">最新のAIを用いた技術診断</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">バイトやインターン探しにも</span>
                </div>
              </div>

              {/* ロゴ画像 */}
              <div className="mb-6">
                <Image
                  src="/gakusei_engineer_com.jpeg"
                  alt="学生エンジニア.com Logo"
                  width={400}
                  height={400}
                  className="w-auto h-24 object-contain"
                />
              </div>

              {/* キャッチコピー */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-200 leading-tight">
                <span className="block whitespace-nowrap">エンジニアを目指す・</span>
                <span className="block whitespace-nowrap">
                  成長したい
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-400">
                    20代
                  </span>
                  のための
                </span>
                <span className="block whitespace-nowrap text-xl sm:text-2xl">
                  ポテンシャル就活/キャリア支援サービス
                </span>
              </h1>

              {/* サブコピー */}
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                バイト・インターン・イベント探しにも対応
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ストーリーテリングセクション */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 課題提起 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-200 mb-12">
              こんな就活、してませんか？
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '😵‍💫',
                  text: '企業の求めるスキルが分からず、何から学べばいいか分からない'
                },
                {
                  icon: '🤔',
                  text: 'スカウトが来ても、自分の技術レベルに合っているか不安'
                },
                {
                  icon: '🤯',
                  text: '自分のプロジェクトをどう企業にアピールすればいいか分からない'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 解決策提示 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              TechMightなら、納得のいくキャリアが見つかる
            </h2>
            {/* <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 text-white">
              <p className="text-2xl font-bold mb-4">TechMight AI</p>
              <p className="text-xl">あなたの技術スタックと成長意欲を教えてください。</p>
            </div> */}
          </motion.div>

          {/* 機能紹介: AI技術診断 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-32"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  <span className="text-blue-600">Point:</span> AIが「未来のポテンシャル」を引き出すお手伝い
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  AIからの質問に答えるだけで、採用担当者に響く
                  <span className="font-bold text-blue-600">「技術スタック」</span>と
                  <span className="font-bold text-cyan-500">「キャリアビジョン」</span>
                  が完成！🗺
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-12 h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">AI Based Matching</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 機能紹介: 成長の可視化 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-32"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-12 h-80 flex items-center justify-center">
                  <div className="w-full h-full flex flex-col justify-center">
                    <div className="space-y-4">
                      {[60, 80, 90, 70].map((width, index) => (
                        <motion.div
                          key={index}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  GitHub連携で「あなたの成長」を可視化
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  GitHubのコミット履歴や利用言語から生成された
                  <span className="font-bold text-blue-600">スキル成長グラフ</span>
                  が描画されるアニメーションを表示。学歴や過去の活動経験だけじゃなく、あなたの
                  <span className="font-bold text-cyan-500">「成長の軌跡」</span>
                  が企業に伝わる！🚀
                </p>
              </div>
            </div>
          </motion.div>

          {/* 機能紹介: スカウトとメンタリング */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  あなたのビジョンに共感してもらえる
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  企業から直接スカウトが来て、
                  <span className="font-bold text-green-600">現役エンジニアによるメンタリング</span>
                  の機会も得られる✨
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-8">
                <div className="space-y-4">
                  {[
                    { company: 'Mega Venture', message: 'あなたの技術に興味があります' },
                    { company: 'AI Startup', message: '一緒に働きませんか？' },
                    { company: 'Web Agency', message: 'メンタリングのご案内' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="bg-white rounded-xl p-4 shadow-md"
                    >
                      <p className="font-semibold text-gray-900 text-sm">{item.company}</p>
                      <p className="text-gray-600 text-xs mt-1">{item.message}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 信頼性・実績セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* 提携企業ロゴ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8">提携企業</h3>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
              {['TechCorp', 'Startup', 'WebDev', 'AILab', 'CloudTech'].map((company, index) => (
                <div key={index} className="text-2xl font-bold text-gray-600">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ユーザー体験談 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">ユーザーの声</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'ーーー',
                  role: '新卒エンジニア',
                  comment: '技術スタックが明確になり、自信を持って面接に臨めました！'
                },
                {
                  name: 'ーーー',
                  role: '未経験からエンジニア転職',
                  comment: 'GitHub連携で自分の成長が可視化されて、モチベーションが上がりました。'
                },
                {
                  name: 'ーーー',
                  role: '大学生',
                  comment: 'メンタリングのおかげで、理想のインターン先が見つかりました！'
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{testimonial.comment}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-12"
          >
            よくある質問
          </motion.h2>
          <div className="space-y-6">
            {[
              {
                q: '他のエンジニア向けサービスとの違いは？',
                a: 'TechMightはAI技術診断とGitHub連携による成長可視化が特徴です。学歴だけでなく、あなたの技術的な成長の軌跡を企業に伝えることができます。'
              },
              {
                q: 'GitHub連携の安全性は？',
                a: '最新のセキュリティ技術を採用しており、必要最小限の権限のみでアクセスします。また、いつでも連携を解除することができます。'
              },
              {
                q: 'メンタリングは有料ですか？',
                a: '基本的なメンタリングは完全無料です。企業からのスカウト経由で、より専門的なメンタリングを受けることも可能です。'
              },
              {
                q: '未経験でも利用できますか？',
                a: 'はい、未経験の方でも大歓迎です！AIがあなたの学習意欲や成長の軌跡を評価し、適切な企業とマッチングします。'
              }
            ].map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 group"
              >
                <summary className="cursor-pointer font-semibold text-lg text-gray-900 dark:text-gray-200 list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
          >
            あなたのエンジニアキャリアをTechMightで始めよう！
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 mb-8"
          >
            無料登録は30秒で完了。今すぐ始めて、理想のキャリアへの第一歩を踏み出そう。
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleGitHubLogin}
              disabled={loading || googleLoading}
              className="inline-block px-12 py-5 bg-white dark:bg-gray-900 text-blue-600 dark:text-cyan-400 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : '今すぐ無料で始める'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 dark:bg-black text-white dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image
                src="/gakusei_engineer_com.jpeg"
                alt="学生エンジニア.com Logo"
                width={180}
                height={180}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400">
                エンジニアを目指す・成長したい20代のためのポテンシャル就活/キャリア支援サービス。バイト・インターン・イベント探しにも対応。
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">サービス</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">サービスについて</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">ご利用の流れ</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">法的情報</h4>
              <ul className="space-y-2 text-gray-400">
                <li><span className="cursor-not-allowed opacity-50">利用規約（準備中）</span></li>
                <li><span className="cursor-not-allowed opacity-50">プライバシーポリシー（準備中）</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-900 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2025 TechMight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
