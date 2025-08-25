# Project overview

- name: リアルタイムアンケートアプリ with ナノすけ&リンカ
- path: C:\Users\feles\Desktop\Nanosuke-Linka
- purpose: リアルタイム投票とAIによる実況・コメントを組み合わせたプレゼン/オーディエンスアプリ（Nuxt3 + Firebase）
- short summary: Nuxt 3 frontend with Firebase Realtime Database for real-time voting, comments, and gamification; Chart.js for graphs; optional OpenAI features for commentary.

Priority update:

- 優先機能: 実況AI（投票割合に応じた実況テキスト生成）とコメントAI（選択肢や回答内容をプロンプトにしたコメント生成）を優先実装します。
- 後回し: ナノすけ育成要素やポイントシステムなどのゲーミフィケーションは MVP 初期フェーズでは後回しにします。

Developer notes:

- 開発/動作確認は StackBlitz を主な実行環境とするため、ローカルではフォーマットのみを行う方針です。
- OpenAI 連携はサーバー経由で行う（`server/api/openai` 等のプロキシ）。APIキーはサーバー側で管理すること。
