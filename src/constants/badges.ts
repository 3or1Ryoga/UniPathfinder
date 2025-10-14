// バッジの定義

import { Badge } from '@/types/dashboard'

export const BADGE_DEFINITIONS: Omit<Badge, 'achievedAt'>[] = [
  // 第一章：大地の探求者編
  { id: 1, threshold: 1, name: '始まりの灯火', emoji: '🌱', chapter: '第一章：大地の探求者編', concept: 'ようこそ冒険者。あなたの世界に、最初の記録の灯がともった。' },
  { id: 2, threshold: 3, name: 'パスの発見者', emoji: '📍', chapter: '第一章：大地の探求者編', concept: 'ファイルへの道筋 (path) を見つけた。世界の構造が見え始めた証。' },
  { id: 3, threshold: 5, name: 'ディレクトリの住人', emoji: '⛺', chapter: '第一章：大地の探求者編', concept: '自分の拠点 (directory) を作り出した。ここから冒険が広がる。' },
  { id: 4, threshold: 8, name: 'リストの閲覧者', emoji: '📜', chapter: '第一章：大地の探求者編', concept: '周囲の状況 (list) を把握する力を手に入れた。' },
  { id: 5, threshold: 12, name: 'ファイルの創造主', emoji: '✨', chapter: '第一章：大地の探求者編', concept: '無から有を生み出し、新しいファイル (file) を創造した。' },
  { id: 6, threshold: 15, name: 'コピーの術士', emoji: '📋', chapter: '第一章：大地の探求者編', concept: '知識や成果を複製する魔法 (copy) を覚えた。' },
  { id: 7, threshold: 20, name: '移動の魔法使い', emoji: '🚀', chapter: '第一章：大地の探求者編', concept: 'ファイルやディレクトリを意のままに動かす (move) 力を得た。' },

  // 第二章：時空の記録者編
  { id: 8, threshold: 25, name: 'ステージへの選定者', emoji: '✍️', chapter: '第二章：時空の記録者編', concept: '記録すべき変更点（ステージ）を見極める眼を持つ者。' },
  { id: 9, threshold: 35, name: '時の記録者', emoji: '💾', chapter: '第二章：時空の記録者編', concept: '変更を歴史の一点（コミット）として刻む力を得た。' },
  { id: 10, threshold: 50, name: 'ブランチの開拓者', emoji: '🌿', chapter: '第二章：時空の記録者編', concept: '新たな可能性（ブランチ）を切り開く、勇気ある開拓者。' },
  { id: 11, threshold: 75, name: 'リモートの交信者', emoji: '📡', chapter: '第二章：時空の記録者編', concept: 'ローカルの世界から、遥か彼方のサーバー（リモート）と交信した。' },
  { id: 12, threshold: 100, name: '歴史の統合者', emoji: '🤝', chapter: '第二章：時空の記録者編', concept: '分岐した歴史（ブランチ）を再び一つに束ねる者。' },
  { id: 13, threshold: 125, name: 'プルリクエストの使者', emoji: '📬', chapter: '第二章：時空の記録者編', concept: '世界に対して、敬意ある貢献の提案（プルリクエスト）を行った。' },

  // 第三章：創造の魔法編
  { id: 14, threshold: 175, name: 'APIの召喚士', emoji: '📞', chapter: '第三章：創造の魔法編', concept: '外部の力（API）を呼び出し、そのデータを自在に操る召喚士。' },
  { id: 15, threshold: 250, name: 'ライブラリの探求者', emoji: '🗺️', chapter: '第三章：創造の魔法編', concept: '古代の書庫（ライブラリ）から、強力な魔法の巻物を発見した。' },
  { id: 16, threshold: 350, name: '非同期の詠唱者', emoji: '⏳', chapter: '第三章：創造の魔法編', concept: '時間の制約を超越し、複数の処理を同時に進める魔法を詠唱する。' },
  { id: 17, threshold: 500, name: 'コンポーネントの錬金術師', emoji: '🧩', chapter: '第三章：創造の魔法編', concept: 'UIの断片を組み合わせ、ユーザーを魅了する体験を錬成する。' },
  { id: 18, threshold: 750, name: 'データベースの接続者', emoji: '🗄️', chapter: '第三章：創造の魔法編', concept: '巨大な知識の倉庫（DB）への扉を開け、情報を永続させる。' },
  { id: 19, threshold: 1000, name: 'テストコードの守護騎士', emoji: '🛡️', chapter: '第三章：創造の魔法編', concept: '自らが創造した魔法が暴走しないよう、品質を守る聖なる騎士。' },

  // 第四章以降：熟練者から伝説へ
  { id: 20, threshold: 1500, name: 'アルゴリズムの使徒', emoji: '🧠', chapter: '第四章：熟練者から伝説へ', concept: '効率的な問題解決の道を見出す、知恵の使徒。' },
  { id: 21, threshold: 2000, name: 'リファクタリングの賢者', emoji: '🦉', chapter: '第四章：熟練者から伝説へ', concept: 'コードの美しさと保守性を追求する賢者。' },
  { id: 22, threshold: 3000, name: 'デザインパターンの伝道師', emoji: '🎨', chapter: '第四章：熟練者から伝説へ', concept: '先人の知恵を学び、最適な設計を実現する伝道師。' },
  { id: 23, threshold: 4000, name: 'CI/CDの自動化人形師', emoji: '🤖', chapter: '第四章：熟練者から伝説へ', concept: '開発プロセスを自動化し、効率を極限まで高める人形師。' },
  { id: 24, threshold: 5000, name: 'パフォーマンスの調律師', emoji: '💨', chapter: '第四章：熟練者から伝説へ', concept: 'システムの速度を限界まで引き出す、精密な調律師。' },
  { id: 25, threshold: 7500, name: 'インフラの建築家', emoji: '🏗️', chapter: '第四章：熟練者から伝説へ', concept: '堅牢なシステム基盤を設計し、構築する建築家。' },
  { id: 26, threshold: 10000, name: 'オープンソースの貢献者', emoji: '🌍', chapter: '第四章：熟練者から伝説へ', concept: '世界中の開発者と共に、より良いソフトウェアを創る貢献者。' },
  { id: 27, threshold: 15000, name: 'コード・マスター', emoji: '👑', chapter: '第四章：熟練者から伝説へ', concept: 'あらゆる技術を使いこなす、真のマスター。' },
  { id: 28, threshold: 20000, name: '伝説のエンジニア', emoji: '🏆', chapter: '第四章：熟練者から伝説へ', concept: '後世に語り継がれる、偉大なるエンジニア。' },
]

// 週次コミット目標（固定値）
export const WEEKLY_COMMIT_GOAL = 30
