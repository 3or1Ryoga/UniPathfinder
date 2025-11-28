import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gakusei.engineer',
  appName: '学生エンジニア.com',
  webDir: 'public',
  // カスタムURLスキーム設定
  server: {
    // 本番環境のスキーム設定
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};

export default config;
