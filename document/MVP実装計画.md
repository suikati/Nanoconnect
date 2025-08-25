# MVP実装計画

## Step 1: 環境構築と基盤機能

- **Nuxt.jsプロジェクト作成**：必要なモジュールをインストール。
- **Firebase初期設定**：プロジェクト作成、データベーススキーマ定義。
- **リアルタイム通信設定**：Firebase Realtime DatabaseまたはServer-Sent Eventsの接続確認。
- **基本的なルーティング設定**：プレゼンター用とオーディエンス用のページを作成。

## Step 2: プレゼンター機能

- **ルーム作成機能**：ランダムなルームコードを生成し、データベースに登録。
- **アンケート/クイズ作成**：スライドのタイトルと選択肢をフォームから入力し、データベースに保存。
- **スライド切り替え機能**：プレゼンターの操作に応じて、オーディエンス画面のスライドが切り替わるようリアルタイム通信を実装。

---

## Step 3: オーディエンス機能

- **ルーム参加機能**：ルームコードを入力して匿名で参加。
- **回答機能**：選択肢をタップすると、投票データがデータベースに登録される。
- **コメント投稿機能**：コメントを入力して送信すると、データベースに保存される。
- **コメント一覧表示**：投稿されたコメントをリアルタイムで表示。

---

## Step 4: リアルタイムグラフ表示

- **Chart.js導入**：VueコンポーネントとしてChart.jsを導入。
- **投票結果のリアルタイム更新**：Firebase Realtime Databaseで投票データの変更を検知し、グラフを動的に更新。
- **プレゼンター/オーディエンス両画面への反映**：投票結果のグラフが両方の画面でリアルタイムに表示されるように実装。

## Step 5: ゲーミフィケーション要素
<!-- 育成要素やポイントシステムの実装は後回し
- **ナノすけ育成**：
  - オーディエンスの回答数をカウントするシステムを実装。
  - 回答数に応じてナノすけの表示を切り替える（画像差し替え）。
  - 最終形態に進化したら、ポイント付与のフラグを立てる。
- **ポイントシステム**：
  - 「横切るナノすけ」のランダム出現ロジックを実装（`setInterval`などで一定時間ごとに表示）。
  - タップ時のポイント付与処理を実装。 -->

## Step 6: AI連携機能

- **OpenAI API連携**：環境変数にAPIキーを設定。
- **リンカの実況AI**：投票結果の割合に応じて、事前定義したプロンプトでAIにテキストを生成させる。
- **ナノすけのコメントAI**：オーディエンスが選んだ選択肢の内容をプロンプトとしてAIに送り、コメントを生成・表示。

---

## Step 7: テストとデプロイ

- **単体テスト・結合テスト**：各機能の動作を確認。
- **UI/UX改善**：レスポンシブデザインの調整。
- **StackBlitzでのデプロイ**：最終的な動作確認と公開。

---

## MVP実装計画(copilot改訂版)

目的：最短で動くプロトタイプを作りつつ、各機能を分割・並行実装できるようにする。

共通方針

- Firebase Realtime Database を単一の信頼できるデータソースにする（読み取りは onValue / push / transaction を活用）。
- クライアントは最小のロジック（表示・イベント送信）に留め、複雑な整合性は Firebase のトランザクションかサーバーAPIで処理。
- 環境変数（OpenAIキー等）は [nuxt.config.ts](nuxt.config.ts) の runtimeConfig に設定。Firebase 初期化は [plugins/firebase.ts](plugins/firebase.ts) で一元化。
- UI/状態管理は Vue の composition API + Pinia（必要になれば）を検討。まずは components + props/emit で進める。

優先度とスプリント（例）

- Sprint A (1週) : 環境構築 + Firebase接続 + ルーム作成/参加（最小限）
- Sprint B (1週) : オーディエンス回答 + 保存 + コメント基盤
- Sprint C (1週) : リアルタイムグラフ（Chart.js） + プレゼンターのスライド切替同期
- Sprint D (1週) : ゲーミフィケーション（ナノすけ進化/横切り） + AI連携プロトタイプ
- Sprint E (残り) : テスト・調整・デプロイ

Step 1: 環境構築と基盤機能（詳細タスク）

- nuxt プロジェクト設定確認、runtimeConfig に OpenAI キーを追加（短時間）
- Firebase 初期化（[plugins/firebase.ts](plugins/firebase.ts)）と最小スキーマ設計：
  - /rooms/{roomId} : { presenterId, slideIndex, createdAt }
  - /rooms/{roomId}/slides/{slideId} : { title, choices[] }
  - /rooms/{roomId}/votes/{choiceId}/{voteId} : { anonId, ts }
  - /rooms/{roomId}/comments/{commentId} : { text, anonId, likes, ts }
  - /users/{anonId}/nanosuke : { exp, evolved, points }
  - 受信時は security rules で書き込み範囲を制限
- acceptance: 新規ルーム作成 → Firebase に /rooms/xxx が作られる

Step 2: プレゼンター機能（並行実装可能）

- UI: スライド作成フォーム → 保存して /rooms/{roomId}/slides に登録
- ルーム作成時にランダムコード生成（6文字推奨）
- スライド切り替えは /rooms/{roomId}/slideIndex を更新、オーディエンスは onValue で監視
- acceptance: プレゼンターが切り替えるとオーディエンス画面が即時更新される

Step 3: オーディエンス機能（優先）

- 匿名参加フロー：ルームコード入力 → /rooms/{roomId} 存在確認 → 参加
- 回答処理：choice を押したら transaction または push で /votes に保存（重複防止は anonId+slideId index）
- コメント：push /comments、表示は onValue（最新100件程度）
- acceptance: 回答後 Firebase に vote が追加され、全クライアントのグラフが更新される

Step 4: リアルタイムグラフ表示（同時実装推奨）

- Chart.js をコンポーネント化（props: choices, votesCount）
- Firebase の変更イベントで votesCount を再計算して Chart.update()
- 最適化：投票数が多い場合は集計用ノード（/rooms/{id}/aggregates）を使う
- acceptance: 投票で即座にグラフの棒/割合が変わる

<!-- 育成要素やポイントシステムの実装は後回し
Step 5: ゲーミフィケーション要素（段階的導入）

- ナノすけ進化（最小実装）
  - 回答回数を /users/{anonId}/nanosuke/exp に累積
  - 進化閾値は slideTotal ÷ 2（要件に従う）
  - 表示切替はクライアントで行う（画像の差し替え）
- 横切るナノすけ（軽量）
  - プレゼン中にクライアント側で setInterval で一定確率で表示（同期不要）
  - タップで /users/{anonId}/points をインクリメント（ポイント付与はサーバー側で検証する余地あり）
- acceptance: 回答で exp が増え、閾値到達で表示が変わる。横切りタップでポイント反映。 -->

Step 6: AI連携（安全に段階導入）

- フロー：クライアント → サーバーAPI (/api/openai生成) → OpenAI にリクエスト（キーはサーバーで管理） → 結果を返す
- まずはプレーンなサンプル（投票割合をプロンプトにして短文を生成）を作る。OpenAI連携は RateLimit・コストを考慮してキャッシュ（短TTL）する。
- 実装案：server/api/openai.ts でプロキシ実装、Nuxt runtimeConfig の OPENAI_KEY を参照
- acceptance: 投票データで簡易実況文が得られる（最初は手動トリガーで）

Step 7: テストとデプロイ

- 単体テスト：コンポーネントのスナップショット、主要ユースケースの統合テスト（Firebase はエミュレータ推奨）
- CI: GitHub Actions で lint + build（StackBlitz デプロイ要件に合わせる）
- リリース前に負荷想定（同時50人）で主要フローを確認

実装の効率化メモ（短く）

- 最初は認証や複雑なセキュリティを簡素化し、動作確認後に Firebase Security Rules を強化する。
- AI 呼び出しは必ずサーバー経由にしてクライアントに鍵を渡さない。
- データ構造は read-heavy を想定して冗長にしておく（集計ノードを用意）。
- UI は mobile-first で作る（オーディエンスがスマホ利用想定）。
