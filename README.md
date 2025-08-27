# NanoPoll

## アプリ概要

リアルタイム・アンケートサービスです。Firebase Realtime Databaseでリアルタイム同期、OpenAI API でライブ実況 / コメント生成、Chart.js でグラフ描画を行っています。Presenter (発表者) と Audience (参加者) の 2 画面構成です。

## 使い方

1. Presenter 画面でルーム作成 → 投票スライド追加・編集
2. 表示された参加コードを共有し、Audience が参加
3. Audienceは選択肢をタップして投票。投票状況はリアルタイム更新・グラフで視覚化
4. 投票後や進行中にAIによるライブコメントが自動生成されます // APIキーはStackBlitz Environment Variables で管理しているため、この共有URLからは利用できません。

## 主な機能

- スライド(アンケート)作成 / 編集
- リアルタイム投票集計 / 視覚化
- AI ライブ実況 / コメント自動生成
- コメント投稿 / いいね機能

## 技術選定
- フレームワーク： Nuxt.js (Vue 3) + TypeScript
- ライブラリ：
  - UI/CSS: Tailwind CSS
  - グラフ：Chart.js
  - AI機能：openai
- データベース：Firebase Realtime Database

## リポジトリ構成

```text
app.vue
nuxt.config.ts
tailwind.config.ts
components/      UI・投票・ライブコメント関連
composables/     ルーム状態 / リスナー / AI コメント生成
pages/           index.vue / presenter.vue / audience.vue
server/api/      OpenAI 経由コメント生成 API
server/utils/    OpenAI クライアント
utils/           Chart ヘルパ / パス定義
types/           型定義
document/        仕様・スキーマメモ
```

## 主要ファイル

- `pages/presenter.vue`: 発表者 UI（スライド操作 / ライブ表示 / コメント確認）
- `pages/audience.vue`: 参加者 UI（投票 / ライブ表示 / コメント投票）

- `server/api/openai.ts`: OpenAI へのプロンプト組立とレスポンス整形
- `composables/useRoom.ts`: 投票処理・スライド編集・コメント CRUD・トランザクション制御
- `composables/useDbListener.ts`: Realtime DB リスナー登録と重複防止管理
- `utils/paths.ts`: Firebase パス管理

- `components/LiveResultsPanel.vue`: チャート,リンカ
- `components/LiveComment.vue`: ナノすけ

## データベーススキーマ

基点: `/rooms/{roomId}`

```ts
rooms/{roomId} = {
 code: string,                // 参加コード
 createdAt: number,
 currentSlideId: string,      // 表示中スライド
 slides: {
  [slideId]: {
   id: string,
   title: string,
   choices: {               // 選択肢
    [choiceId]: {
     id: string,
     label: string,
     order: number
    }
   },
   aggregates: {            // 投票集計（choiceId -> count）
    [choiceId]: number
   },
   createdAt: number,
   updatedAt: number
  }
 },
 votes: {
  [userId]: {                // ユーザごとの現在スライド選択
   slideId: string,
   choiceId: string,
   updatedAt: number
  }
 },
 comments: {                  // 通常コメント
  [commentId]: {
   id: string,
   userId: string,
   text: string,
   likes: number,
   likedBy?: { [userId]: true },
   createdAt: number
  }
 },
 liveComment: {               // 最新 AI ライブコメント（単一）
  id: string,
  text: string,
  role: 'nanosuke' | 'commentator',
  createdAt: number
 }
}
```
