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
    Cookies.set('theme', theme, { secure: true, sameSite: 'strict' })

    // Tailwindのdarkクラスを設定
    if (theme === ThemeType.DARK) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 初期表示およびテーマ切り替え時のハンドラー
  useEffect(() => {
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
  }, [])

  return <ThemeContext.Provider value={{ theme, changer }}>{children}</ThemeContext.Provider>
}
