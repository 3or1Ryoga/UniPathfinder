import Link from 'next/link'

export default function PrivacyPolicyPage() {
    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '3rem 2rem',
            lineHeight: '1.8',
            color: '#2d3748'
        }}>
            <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#1a202c'
            }}>
                プライバシーポリシー
            </h1>

            <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '2rem' }}>
                最終更新日: 2025年10月10日
            </p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    1. はじめに
                </h2>
                <p>
                    TechMight（以下「当サービス」）は、ユーザーの皆様のプライバシーを尊重し、個人情報の保護に努めます。
                    本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、保護するかについて説明します。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    2. 収集する情報
                </h2>
                <p style={{ marginBottom: '1rem' }}>当サービスは以下の情報を収集します：</p>
                <ul style={{ paddingLeft: '2rem', marginBottom: '1rem' }}>
                    <li>GitHubアカウント情報（ユーザー名、メールアドレス、プロフィール画像）</li>
                    <li>GitHubリポジトリ情報（パブリックリポジトリのみ）</li>
                    <li>LINEアカウント情報（ユーザーID、表示名、プロフィール画像）</li>
                    <li>サービス利用履歴</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    3. 情報の利用目的
                </h2>
                <p style={{ marginBottom: '1rem' }}>収集した情報は以下の目的で利用します：</p>
                <ul style={{ paddingLeft: '2rem', marginBottom: '1rem' }}>
                    <li>プログラミングスキルの分析と評価</li>
                    <li>パーソナライズされた学習リソースの提案</li>
                    <li>サービス改善のための分析</li>
                    <li>LINEを通じた通知の送信</li>
                    <li>お問い合わせへの対応</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    4. 情報の共有
                </h2>
                <p>
                    当サービスは、法律で要求される場合を除き、ユーザーの個人情報を第三者と共有することはありません。
                    ただし、以下のサービスプロバイダーと必要最小限の情報を共有する場合があります：
                </p>
                <ul style={{ paddingLeft: '2rem', marginBottom: '1rem' }}>
                    <li>GitHub（認証およびリポジトリ分析のため）</li>
                    <li>LINE（通知送信のため）</li>
                    <li>Supabase（データ保存のため）</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    5. セキュリティ
                </h2>
                <p>
                    当サービスは、ユーザーの個人情報を保護するために適切な技術的・組織的セキュリティ対策を実施しています。
                    すべての通信はHTTPSで暗号化され、データベースへのアクセスは厳重に管理されています。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    6. Cookie（クッキー）の使用
                </h2>
                <p>
                    当サービスは、ユーザー体験の向上とセキュリティのためにCookieを使用します。
                    Cookieを無効にすることも可能ですが、一部の機能が正常に動作しない場合があります。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    7. ユーザーの権利
                </h2>
                <p style={{ marginBottom: '1rem' }}>ユーザーには以下の権利があります：</p>
                <ul style={{ paddingLeft: '2rem', marginBottom: '1rem' }}>
                    <li>個人情報へのアクセス権</li>
                    <li>個人情報の訂正権</li>
                    <li>個人情報の削除権</li>
                    <li>サービスの利用停止権</li>
                </ul>
                <p>
                    これらの権利を行使する場合は、アカウント設定ページから手続きを行うか、
                    お問い合わせフォームよりご連絡ください。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    8. プライバシーポリシーの変更
                </h2>
                <p>
                    当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
                    重要な変更がある場合は、サービス内またはLINEを通じてユーザーに通知します。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    9. お問い合わせ
                </h2>
                <p>
                    プライバシーポリシーに関するご質問やご不明な点がございましたら、
                    以下までお問い合わせください：
                </p>
                <p style={{ marginTop: '1rem' }}>
                    <strong>サービス名:</strong> TechMight<br />
                    <strong>URL:</strong> https://gakusei-engineer.com/
                </p>
            </section>

            <div style={{
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center'
            }}>
                <Link
                    href="/"
                    style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    ← トップページに戻る
                </Link>
            </div>
        </div>
    )
}
