'use client'

import { useEffect, useState, createContext, useCallback } from 'react'
import Cookies from 'js-cookie'
import { ThemeType } from '@/types/theme'
import AuthDeepLinkHandler from '@/components/AuthDeepLinkHandler'

interface Theme {
  theme: ThemeType
  changer: (theme: ThemeType) => void
}

export const ThemeContext = createContext<Theme>({
  theme: ThemeType.LIGHT,
  changer: () => {},
})

export default function ThemeProvider({
  children,
  selectedTheme,
}: {
  children: React.ReactNode
  selectedTheme: ThemeType
}) {
  // Cookieからの初期値を受け取る
  const [theme, setTheme] = useState<ThemeType>(selectedTheme)

  // テーマ切り替えボタンを押下した時のハンドラー
  const changer = useCallback((theme: ThemeType) => {
    console.log('[ThemeProvider] changer called with theme:', theme)
    setTheme(theme)

    // Cookieに保存（path: '/'を追加してサイト全体で利用可能にする）
    Cookies.set('theme', theme, {
      path: '/',
      sameSite: 'lax',
      expires: 365 // 1年間有効
    })
    console.log('[ThemeProvider] Cookie set to:', theme)
    console.log('[ThemeProvider] Cookie read back:', Cookies.get('theme'))

    // Tailwindのdarkクラスを設定
    if (theme === ThemeType.DARK) {
      document.documentElement.classList.add('dark')
      console.log('[ThemeProvider] Added dark class to html')
    } else {
      document.documentElement.classList.remove('dark')
      console.log('[ThemeProvider] Removed dark class from html')
    }
  }, [])

  // 初期表示時にselectedThemeを適用
  useEffect(() => {
    console.log('[ThemeProvider] useEffect: Initial theme setup with selectedTheme:', selectedTheme)

    // Cookieから最新の値を取得（クライアントサイドで変更された可能性があるため）
    const cookieTheme = Cookies.get('theme')
    console.log('[ThemeProvider] useEffect: Cookie theme:', cookieTheme)

    // Cookieの値がある場合はそちらを優先、なければselectedThemeを使用
    const finalTheme = (cookieTheme && (cookieTheme === ThemeType.DARK || cookieTheme === ThemeType.LIGHT))
      ? cookieTheme as ThemeType
      : selectedTheme

    console.log('[ThemeProvider] useEffect: Final theme:', finalTheme)
    setTheme(finalTheme)

    // darkクラスを確実に適用
    if (finalTheme === ThemeType.DARK) {
      document.documentElement.classList.add('dark')
      console.log('[ThemeProvider] useEffect: Added dark class to html')
    } else {
      document.documentElement.classList.remove('dark')
      console.log('[ThemeProvider] useEffect: Removed dark class from html')
    }
  }, [selectedTheme])

  return (
    <ThemeContext.Provider value={{ theme, changer }}>
      <AuthDeepLinkHandler />
      {children}
    </ThemeContext.Provider>
  )
}
