import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gakusei.engineer',
  appName: '学生エンジニア.com',
  webDir: 'public',
  plugins: {
    // ディープリンク設定
    App: {
      appUrlOpen: {
        enabled: true
      }
    }
  },
  // カスタムURLスキーム
  server: {
    // 本番環境ではhostname不要だがdev時のホットリロード用
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};

export default config;
