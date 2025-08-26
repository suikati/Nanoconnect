# NanoPoll

## アプリ概要

リアルタイム投票 & ライブコメント生成を行うアンケートアプリです。Firebase Realtime Database を用いた低レイテンシ同期、リンカによるライブ実況/ナノすけによるコメント生成、Chart.js による動的グラフ描画を組み合わせています。Presenter (発表者) と Audience (参加者) の 2 画面構成。

## 簡単な使い方

1. Presenter 画面でルーム作成 → 投票スライド追加・編集
2. 表示された参加コード / URL を共有し、Audience が参加
3. Audience は選択肢をタップして投票。結果はリアルタイム更新
4. 投票後や進行中に AI ライブコメントが自動生成されます

## 主要機能

- リアルタイム投票（選択肢入替 / 追加 / 削除対応）
- Chart.js + datalabels によるレスポンシブ棒 / 円グラフ切替
- AI ライブ実況 / コメント自動生成
- ドラッグ＆ドロップでスライド並び替え / 選択肢順序変更
- コメント投稿 / いいね / 削除

## リポジトリ構成（抜粋）

```text
app.vue
nuxt.config.ts
tailwind.config.ts
components/      UI・投票・ライブコメント関連
composables/     ルーム状態 / リスナー / AI コメント生成
pages/           presenter.vue / audience.vue / index.vue
server/api/      OpenAI 経由コメント生成 API
server/utils/    OpenAI クライアント
utils/           マイグレーション / Chart ヘルパ / パス定義
types/           型定義
tests/           単体テスト (migration / vote / chart 等)
document/        追加仕様・プロンプト・スキーマ
```

## 主要ファイル解説

- `composables/useRoom.ts`: 投票処理・スライド編集・コメント CRUD・トランザクション制御の中核。
- `composables/useDbListener.ts`: Realtime DB リスナー登録と重複防止管理。
- `composables/useLiveCommentGenerator.ts`: AI ライブコメント生成ロック & クールダウン。
- `utils/chart.ts`: グラフデータ生成・色 / ラベル整形・ゼロ票ストライプ処理。
- `utils/paths.ts`: Firebase パス集中管理（typo/分散防止）。
- `components/VoteChart.vue`: Chart.js 描画 & rAF バッチ更新・タイプ切替。
- `components/OptionList.vue` / `OptionItem.vue`: 選択肢編集・順序管理。
- `components/LiveComment.vue`: アニメ表示・クリック変化。
- `pages/presenter.vue`: 発表者 UI（スライド操作・結果監視・AI コメントトリガ）。
- `pages/audience.vue`: 参加者 UI（投票 / ライブ表示）。
- `server/api/openai.ts`: OpenAI へのプロンプト組立とレスポンス整形。

## データベーススキーマ (Firebase Realtime Database)

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
   choices: {               // 安定 ID: ch_xxxxx
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
  role: 'mascot' | 'commentator',
  createdAt: number
 }
}
```
