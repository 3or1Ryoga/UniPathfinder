export const ThemeType = {
  LIGHT: 'light',
  DARK: 'dark',
} as const

export type ThemeType = typeof ThemeType[keyof typeof ThemeType]

export const isThemeType = (value: string): value is ThemeType => {
  return Object.values(ThemeType).includes(value as ThemeType)
}
