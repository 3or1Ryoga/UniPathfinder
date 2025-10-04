# プレゼンテーション資料の追加ガイド

## ランディングページへのプレゼン資料の追加方法

### 1. 資料の配置場所
`src/app/page.js` の「プレゼン資料セクション」（142-177行目）を編集してください。

### 2. 対応ファイル形式

#### 画像ファイル（推奨）
```jsx
// 画像の場合
<div style={{...}}>
    <img 
        src="/presentation-slide.png" 
        alt="UniPath Finder プレゼンテーション"
        style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
    />
</div>
```

#### PDFファイル
```jsx
// PDFの場合
<div style={{...}}>
    <iframe
        src="/presentation.pdf"
        width="100%"
        height="600px"
        style={{
            border: 'none',
            borderRadius: '8px'
        }}
    />
    <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <a 
            href="/presentation.pdf" 
            download
            style={{ color: '#667eea', textDecoration: 'none' }}
        >
            📥 プレゼン資料をダウンロード
        </a>
    </p>
</div>
```

#### 動画ファイル
```jsx
// 動画の場合
<div style={{...}}>
    <video
        controls
        width="100%"
        style={{
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
    >
        <source src="/demo-video.mp4" type="video/mp4" />
        お使いのブラウザは動画の再生をサポートしていません。
    </video>
</div>
```

#### 外部埋め込み（YouTube、Googleスライドなど）
```jsx
// YouTube埋め込みの場合
<div style={{...}}>
    <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden'
    }}>
        <iframe
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
            }}
            allowFullScreen
        />
    </div>
</div>

// Googleスライド埋め込みの場合
<div style={{...}}>
    <iframe
        src="https://docs.google.com/presentation/d/YOUR_PRESENTATION_ID/embed"
        width="100%"
        height="500px"
        style={{
            border: 'none',
            borderRadius: '8px'
        }}
        allowFullScreen
    />
</div>
```

### 3. ファイルの配置場所

#### 静的ファイルの場合
1. `public/` フォルダに資料ファイルを配置
2. ファイル名の例：
   - `presentation-slide.png`
   - `demo-video.mp4`
   - `product-overview.pdf`

#### ファイル構造例
```
public/
├── presentation-slide.png
├── demo-video.mp4
├── product-overview.pdf
└── og-image.jpg
```

### 4. 複数のプレゼン資料を表示する場合

```jsx
<div style={{...}}>
    <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#4a5568' }}>
        プレゼンテーション資料
    </h3>
    
    {/* スライド画像 */}
    <div style={{ marginBottom: '2rem' }}>
        <img 
            src="/presentation-slide.png" 
            alt="サービス概要"
            style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
        />
    </div>
    
    {/* デモ動画 */}
    <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>デモ動画</h4>
        <video controls width="100%" style={{ borderRadius: '8px' }}>
            <source src="/demo-video.mp4" type="video/mp4" />
        </video>
    </div>
    
    {/* ダウンロードリンク */}
    <div style={{ textAlign: 'center' }}>
        <a 
            href="/product-overview.pdf" 
            download
            style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold'
            }}
        >
            📥 詳細資料をダウンロード
        </a>
    </div>
</div>
```

### 5. レスポンシブ対応

スマートフォンでも見やすくするため、以下のスタイルを追加できます：

```jsx
<style jsx>{`
    @media (max-width: 768px) {
        .presentation-container {
            padding: 1rem;
        }
        
        .presentation-container iframe {
            height: 300px;
        }
    }
`}</style>
```

### 6. アクセシビリティの考慮

```jsx
<img 
    src="/presentation-slide.png" 
    alt="UniPath Finderの機能説明：GitHubリポジトリ分析からAI推奨学習パスまでの流れを示したスライド"
    style={{...}}
/>
```

### 7. 実装例

現在のページの142-177行目を以下のように置き換えてください：

```jsx
{/* プレゼン資料セクション */}
<div style={{ padding: '4rem 0' }}>
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            marginBottom: '2rem',
            color: '#2d3748'
        }}>
            プロダクト詳細
        </h2>
        
        {/* ここに実際のプレゼン資料を配置 */}
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center'
        }}>
            <img 
                src="/your-presentation-slide.png" 
                alt="UniPath Finder サービス概要"
                style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    maxWidth: '900px'
                }}
            />
        </div>
    </div>
</div>
```

これで、プロフェッショナルな見た目でプレゼン資料を表示できます！