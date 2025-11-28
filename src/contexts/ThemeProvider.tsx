'use client'

import { useEffect, useState, createContext, useCallback } from 'react'
import Cookies from 'js-cookie'
import { ThemeType, isThemeType } from '@/types/theme'

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
    setTheme(theme)
    // 開発環境ではHTTPなのでsecure: falseにする必要がある
    Cookies.set('theme', theme, {
      sameSite: 'lax',
      expires: 365 // 1年間有効
    })

    // Tailwindのdarkクラスを設定
    if (theme === ThemeType.DARK) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 初期表示時にselectedThemeを適用
  useEffect(() => {
    // サーバーから渡された初期テーマを適用
    if (selectedTheme === ThemeType.DARK) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Cookieからテーマを読み取って上書き
    const cookieTheme = Cookies.get('theme')
    if (cookieTheme && isThemeType(cookieTheme)) {
      setTheme(cookieTheme)

      // Tailwindのdarkクラスを設定
      if (cookieTheme === ThemeType.DARK) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [selectedTheme])

  return <ThemeContext.Provider value={{ theme, changer }}>{children}</ThemeContext.Provider>
}
