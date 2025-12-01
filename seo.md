あなたはNext.js (App Router) とSEOの専門家です。
現在開発中のWebサービス「学生エンジニア.com」のSEO設定において、重大な設定ミスと不足があるため、以下の修正と新規ファイルの作成を行ってください。

## 📍 プロジェクト情報
- **サービス名**: 学生エンジニア.com
- **運用ドメイン**: https://gakusei-engineer.com
- **技術スタック**: Next.js (App Router), TypeScript

## 🛠️ 依頼内容

### 1. src/app/layout.tsx の修正
現在、`metadataBase` が誤ったドメイン（techmight.com）になっています。これを正しいドメインに修正し、さらにGoogleが推奨する構造化データ（JSON-LD）を追加してください。

- **修正点**:
  - `metadataBase` を `new URL('https://gakusei-engineer.com')` に変更。
- **追加点**:
  - `<body>` タグの直下に、以下の内容のJSON-LDを `<script>` タグで埋め込んでください。
  ```json
  {
    "@context": "[https://schema.org](https://schema.org)",
    "@type": "WebSite",
    "name": "学生エンジニア.com",
    "url": "[https://gakusei-engineer.com](https://gakusei-engineer.com)",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "[https://gakusei-engineer.com/search?q=](https://gakusei-engineer.com/search?q=){search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }