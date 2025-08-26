# Nanoconnect

## アプリ概要

発表 / 説明会 / 勉強会などで「発表者」と「参加者」が同じルームに入り、リアルタイムにアンケート（投票）・コメント・簡易実況（AI生成テキスト）を共有できるインタラクティブ Web アプリです。Nuxt 3 + Firebase Realtime Database を用いて低レイテンシな更新を実現し、OpenAI API を利用して実況テキストやキャラクターコメントを自動生成します。

主な利用シナリオ:

- 発表中にその場で質問（アンケート）を作成し参加者の反応を把握
- 投票推移を即時集計し画面上に共有
- コメント欄で匿名フィードバックやリアクション
- AI が投票状況を短い日本語実況にまとめ、マスコットが選択肢に沿った一言コメントを生成

## 主要機能

1. ルーム作成 / 参加

- 発表者は6桁コードでルーム作成
- 参加者はトップ画面からコード入力で即参加（匿名 ID 自動付与）

2. スライド(アンケート)編集 / 保存

- タイトル + 選択肢（カラー付き）を複数スライドとして追加・削除・並行編集

3. リアルタイム投票

- Realtime Database で投票/集計を即反映
- 二重投票対策: 同一 anonId の上書き + 集計をトランザクション更新（submitVoteSafe）

4. 集計表示 (Live Results)

- 選択肢別カウントと合計を Chart.js + datalabels plugin で可視化

5. コメント機能

- 匿名コメント投稿 / いいね / ソフトデリート
- likes と userLikes をトランザクションで安全更新

6. AI 生成コンテンツ

- 実況: 投票割合から短い要約 (リンカ)
- 選択肢に合わせたキャラクターコメント (ナノすけ)
- OpenAI レスポンスはメモリ内キャッシュで短期再利用

7. UI/UX

- Tailwind CSS + カスタムコンポーネント (Glass / Gradient / 小さなアニメーション)
- Presenter / Audience でレイアウト最適化

## リポジトリ構成

```text
.
├─ app.vue                # ルートアプリシェル
├─ nuxt.config.ts         # Nuxt 設定 (モジュール, runtimeConfig 等)
├─ tailwind.config.ts     # Tailwind 設定
├─ vitest.config.ts       # テスト設定
├─ plugins/
│   └─ firebase.client.ts # Firebase 初期化 (クライアント専用)
├─ composables/
│   ├─ useRoom.ts         # ルーム・投票・コメント操作のドメインロジック
│   └─ useDbListener.ts   # Realtime DB リスナーラッパ（存在前提）
├─ pages/
│   ├─ index.vue          # トップ (発表者/参加者エントリ)
│   ├─ presenter.vue      # 発表者 UI (編集 + 集計 + コメント)
│   └─ audience.vue       # 参加者 UI (投票 + コメント + 実況)
├─ components/            # UI/機能コンポーネント
│   ├─ ui/                # 汎用 UI (AppShell, UiButton, UiCard ...)
│   ├─ VoteChart.vue
│   ├─ VoteOption.vue
│   ├─ OptionList.vue / OptionItem.vue
│   ├─ CommentItem.vue
│   ├─ LiveComment.vue    # AI コメント表示
│   └─ PlayByPlay.vue     # 実況テキスト表示
├─ server/
│   ├─ api/openai.ts      # OpenAI 呼び出し API (実況/コメント生成)
│   └─ utils/openaiClient.ts # OpenAI クライアント生成
└─ types/                 # 型定義 (models, openai リクエスト/レス等)
```

## 主要ファイル解説

### `nuxt.config.ts`

Runtime Config (public.firebase) を利用し Firebase 設定を注入。Tailwind / Vue コンポーネントトランスパイルやテスト設定と連携。

### `plugins/firebase.client.ts`

`runtimeConfig.public.firebase` を元にクライアント側で Firebase App / Realtime Database / Auth を初期化。HMR 二重初期化防止のため `getApps()` とグローバルフラグを併用。Nuxt プラグイン経由で `nuxtApp.$firebaseDb` 等を提供。

### `composables/useRoom.ts`

ドメインロジックの中心。提供 API:

- `createRoom()` / `joinRoom()` ルーム管理
- `saveSlides()` スライド一括保存 (UI→DB 正規化: slide_N / choice_M)
- `setSlideIndex()` 現在表示スライド番号更新
- `submitVoteSafe()` 投票 & 集計トランザクション（前回投票差分調整）
- `pushComment()` 匿名コメント追加
- `likeComment()` いいねトグル（userLikes マップで去/来判定）
- `deleteComment()` ソフトデリート（テキスト null + メタ付与）
匿名 ID は LocalStorage 永続化 (`getAnonId`) しセッション跨ぎを実現。

### `pages/presenter.vue`

発表者がスライド（アンケート）を編集・保存し、スライドインデックス移動やリアルタイム集計/コメント監視を行う画面。スライド保存前のローカル編集モデルと、DB 反映後の同期を行う差分マージ処理を含む。AI 実況生成ボタンから `/api/openai` を呼び出し。

### `pages/audience.vue`

参加者がクエリパラメータのルームコードで自動参加し、現在スライドを購読、投票・コメント・いいね操作。投票は `submitVoteSafe` を利用し集計整合性を担保。AI 実況 / コメント生成もここから呼び出し。

### `components/VoteChart.vue`

`counts` と `choices` を受け取り Chart.js (datalabels plugin) で Live 集計を描画。

### `components/VoteOption.vue`

単一選択肢の投票 UI。選択状態 / 無効状態表示とクリックハンドラを担当。

### `components/CommentItem.vue`

コメント表示・いいね・削除操作。自身の anonId と比較し削除ボタン表示可否を制御。

### `components/LiveComment.vue` / `components/PlayByPlay.vue`

OpenAI 生成テキスト（キャラクターコメント / 実況）の表示とロード状態スピナー等を管理。

### `server/api/openai.ts`

実況(play-by-play) / コメント生成を兼ねる API。特徴:

- リクエスト本体の曖昧な形に耐える多層パース (Nuxt ランタイム差異対応)
- 投票 0 件時は OpenAI 呼び出しを回避し固定レスポンス
- タイトル + 選択肢割合 / 選択肢テキストから Prompt 構築
- 最近の組合せを in-memory Map で短期キャッシュしコスト削減

### `server/utils/openaiClient.ts`

環境変数/API Key から OpenAI クライアントを生成（エラー時のフォールバック実装が存在する前提）。

### `types/models.ts` / `types/openai.ts`

スライド・コメント・集計・OpenAI リクエスト/レスポンスの型を定義し、Vue & サーバー間の整合性を確保。

## 今後の改善候補

- Firebase セキュリティルールでコメント削除/いいね権限を厳密化
- スライド並び替え / 複製機能
- 投票履歴のタイムライン可視化
- SSR 時の初期データプレフェッチと Skeleton UI
- OpenAI 呼び出しのレート制御 / 永続キャッシュ層
