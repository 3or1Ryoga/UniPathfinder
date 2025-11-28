なぜこんなに難しい？！ Next.js15 によるダーク / ライトモード切り替え
TypeScript
Next.js
tailwindcss
daisyui
最終更新日 2025年03月09日
投稿日 2025年03月08日
概要 :information_source:
普段バックエンドエンジニアとして従事している身ですが、プライベートでフロントエンドの勉強をしています。

そんな中、Next.js で作っている Web アプリにテーマ（いわゆるダーク :crescent_moon: / ライト :sunny: ）切り替えボタンを実装しました。

...が、これがまた結構な曲者で、daisyUI の公式サイトを見ながらできたものの リダイレクトおよびページリフレッシュで画面がチラつくという問題 だけが解決できませんでした |||orz

苦節1ヶ月...ようやく解決しました :sob:
そんなに時間かけたの！？と諸兄方に怒られそうですが、解決できたので自分としてはヨシとしています :innocent:

本記事に含まれるコードや本文について検証を行なった上で記載しておりますが、当方 Next.js の初心者ゆえ一部の誤りなどが含まれている可能性がありますのでご了承ください。

メインとなるパッケージとバージョン :package:
next : 15.1.3
js-cookie : 3.0.5
daisyui : 4.12.23
material-icons : 1.13.12
御託はいいからソースを見せろ :floppy_disk:
...という方はこちら :point_down:



（コードがイマイチなのはご容赦ください :confounded:）

画面のチラつきって？ :desktop:
画面リフレッシュ（あるいは画面遷移）の時、以下のように発生します。

out_1024p_24f.gif

修正後はどうなった？ :tools:
画面のチラつきと、テーマ切り替えボタンも表示中のテーマとの相違が解消されていますね。

out_20250301_1024p_24f.gif

一筋縄では行かない :sweat:
クライアント / サーバーサイドが絡み合っている関係で、状態の維持に混乱します :dizzy:

当初は LocalStorage のみを使って実装していたのですが、概要でもお伝えしたとおり、リフレッシュしたりページングを行うと一瞬だけ異なるテーマが表示されてしまい、Gemini や有識者の記事を巡ってもこの問題がいつまで経っても解決できませんでした。

そして、ようやく以下の記事に辿り着きました。
（悩んでいることはみんな一緒なんですね :rolling_eyes:）



紹介されている実装方法の多くが LocalStorage を使った手法だったので、Cookie のことをすっかり忘れていました :sweat_drops:
（ Cookie を状態保存に使うことについても議論がありそうですが...）

この記事を書いてくれた方、この場を借りてお礼申し上げます :bow:

Next.js における Cookie の取り扱いについて :cookie:
Next.js にはデフォルトで Cookie を操作する標準機能（ next/headers ）が入っています。
しかし、これは サーバーサイド でしか使えません。

これは Next.js の設計思想として、基本はサーバーサイドでの処理を推奨しています。
確かにセキュリティ的な側面でも、クライアントサイドで操作はさせないのだと思います。



"next/headers" をクライアントサイドで呼び出すと以下のエラーが発生します

You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.

そのため、クライアントサイドからのCookieの読み出しは js-cookie を使用しています。

なので、これから紹介する実装方法は、Next.js からの観点としては イレギュラーな実装方法 になるとも言えます。
（他に良い実装方法があればコメントください :bow:）

next-theme を使えばよかったのでは？ :thinking:


確かにこのパッケージを使えば楽に実装できそうです。
...が、suppressHydrationWarning を使うことが明記されています。
これは簡単言えば、一つ下の要素に発生する警告を無視させる機能です。

PHP で言うところの @をつけて警告を無視させる のと同じようなものでしょうか？



...うーん :slight_frown: :thought_balloon:
警告を握り潰すと言う点がどうにも気になって却下の判断に至りました。。。

ただ、パッケージのリポジトリを見ると、issue でこの問題は取り上げられていました 。
ですが、この記事を投稿した時点でも問題の解決はしていませんでした。

なぜ suppressHydrationWarning を使うのか？ :non-potable_water:
フロントエンドエンジニアの方々にとっては当たり前だと思いますが、window や LocalStorage はブラウザのAPIなので、サーバーサイドでこの情報を得ることはできません。

したがって以下の現象が起きます。

1: サーバーサイドで HTML の生成を行う
（ここでの初期値は "light" とします）
↓
2: クライアントサイドで JavaScript(React) の適応が行われる
（ LocalStorage には "dark" が設定されている）
↓
3: "1:" と "2:" で設定値が異なる
↓
4: Hydration failed が発生する


確かに suppressHydrationWarning を外すと Hydration failed が発生しますね。

スクリーンショット 2025-03-08 12.57.49.png

next-themes のソースコードを確認すると LocalStorage を使っているところがあり、この辺りで発生していると思われます。



参考にさせていただいた資料



解説
登場するファイルは以下の３つです

app
│ └ layout.tsx
...
contexts
├ ThemeChanger.tsx
└ ThemeProvider.tsx
やっていることは（今思えば）単純で

1: 画面ロード時に Cookie に記録されているテーマのタイプ値を読み取る
   [app/layout.tsx]

2: "1:" の値を ThemeProvider に渡す
   [app/layout.tsx]

3: useEffect で初期表示またはテーマの値が変わったら発火するハンドラー内でタグの "data-theme" 要素を書き換える
   [contexts/ThemeProvider.tsx]

4: useCallback でテーマ切り替えボタンが押された際のイベント（ Cookie の更新、"data-theme" 要素の書き換え）を設定
   [contexts/ThemeProvider.tsx]

5: daisyUI のテーマ切り替えコンポーネントから "4:" を呼び出す
   [contexts/ThemeChanger.tsx]
という流れです。

ソースの中身は以下のとおりです。
（ import 文などは一部省略しています）

app/layout.tsx
import "./globals.css"
import "material-icons/iconfont/material-icons.css"
...
import ThemeChanger from "@/contexts/ThemeChanger"
import ThemeProvider from "@/contexts/ThemeProvider"
import { cookies } from "next/headers"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // cookieからテーマの設定値を読み込む
  const nowSetTheme = (await cookies()).get("theme")?.value
  const theme = () => {
    /*
     * // themeType(= "light" | "dark" | "none")に一致しているかを判定
     * export const isIncludesType = (value: string): value is themeType => {
     *   return Object.values(ThemeType).includes(value as themeType)
     * }
     */
    if (nowSetTheme && isIncludesType(nowSetTheme)) {
      return nowSetTheme
    }
    return ThemeType.NONE
  }

  return (
    <html lang="ja">
      <body>
        ...
            {/* NextAuthProviderは認証機能なので、今回の記事との関係はありません */}
            <NextAuthProvider>
              {/* ThemeProvierコンポーネントにテーマの設定値を渡す */}
              <ThemeProvider selectedTheme={theme()}>
                <ThemeChanger session={session}>
                  {children}
                </ThemeChanger>
              </ThemeProvider>
            </NextAuthProvider>
        ...
      </body>
    </html>
  )
}
contexts/ThemeProvider.tsx
"use client"
import { useEffect, useState, createContext, useCallback } from "react"
...
import Cookies from "js-cookie"

interface Theme {
  theme: themeType // "light" | "dark" | "none"
  changer: (theme: themeType) => void
}

export const ThemeContext = createContext<Theme>({
  theme: ThemeType.DARK,
  changer: () => {},
})

export default function ThemeProvider({
  children,
  selectedTheme,
}: {
  children: React.ReactNode
  selectedTheme: themeType
}) {
  // Cookieからの初期値を受け取る
  const [theme, setTheme] = useState<themeType>(selectedTheme)

  // テーマ切り替えボタンを押下した時のハンドラー
  const changer = useCallback((theme: themeType) => {
    setTheme(theme)
    Cookies.set("theme", theme, { secure: true })
    /*
     * daisyUIのテーマ切り替えは"data-theme"要素にテーマ名を設定すると反映される
     * https://daisyui.com/docs/themes/
     */
    document.documentElement.setAttribute("data-theme", theme)
  }, [])

  // 初期表示およびテーマ切り替え時のハンドラー
  useEffect(() => {
    console.log("[ThemeProvider] call useEffect.")
    const cookieTheme = Cookies.get("theme")
    if (cookieTheme && isIncludesType(ThemeType, cookieTheme)) {
      setTheme(cookieTheme)
      document.documentElement.setAttribute("data-theme", cookieTheme)
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, changer }}>{children}</ThemeContext.Provider>
}
contexts/ThemeChanger.tsx
"use client"
import { useContext } from "react"
...
import { ThemeContext } from "./ThemeProvider"

/*
 * 共通ヘッダー部
 */
export default function ThemeChanger({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const { theme, changer } = useContext(ThemeContext)

  // テーマ切り替えボタンを押下した時のハンドラー
  const handleToggle = (e: { target: { checked: boolean } }) => {
    if (e.target.checked) {
      changer(ThemeType.DARK)
    } else {
      changer(ThemeType.LIGHT)
    }
  }

  /*
   * テーマの切り替えボタンはdaisyUIより、アイコンはパッケージを使用しています
   * https://daisyui.com/components/theme-controller/#theme-controller-using-a-swap
   */
  return (
    <>
      <div data-theme={theme}>
        <div className="navbar bg-base-300 w-full mb-5">
          <div className="mx-2 flex-1 px-2">
            ...
          </div>
          <div className="flex-none">
            ...
            <label className="swap swap-rotate btn btn-circle btn-sm m-2">
              {/* checkedでデフォルトの表示を制御 */}
              <input type="checkbox" checked={theme === ThemeType.DARK} onChange={handleToggle} />
              <span className="swap-off material-icons">light_mode</span>
              <span className="swap-on material-icons">dark_mode</span>
            </label>
          </div>
        </div>
        {children}
      </div>
    </>
  )
}
振り返ってみて
クライアントの設定を持ち回るだけで結構な手間があって、実装コストが高いなぁという感想です :thinking:

（自分からPR出せればそれが一番いいんですけど）公式でこの問題をサポートしてくれることを願います。

自分と同じように学習中で苦労している方も多いと思いますが、この記事が何かのお役に立てれば幸いです :bow: