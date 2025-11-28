'use client'

import { useEffect, useState, createContext, useCallback } from 'react'
import Cookies from 'js-cookie'
import { ThemeType } from '@/types/theme'

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

    // Cookieに保存
    Cookies.set('theme', theme, {
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

  // 初期表示時にselectedThemeを適用（サーバーから渡された値を信頼）
  useEffect(() => {
    // サーバーサイドで既にHTMLにdarkクラスを設定しているため、
    // クライアントサイドでは何もしなくてよい
    // ただし、stateは同期させる必要がある
    setTheme(selectedTheme)
  }, [selectedTheme])

  return <ThemeContext.Provider value={{ theme, changer }}>{children}</ThemeContext.Provider>
}
