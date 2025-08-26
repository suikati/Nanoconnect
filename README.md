# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

## Development Server

Start the development server on <http://localhost:3000>

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## UI デザインシステム概要 (Tailwind 再構築済み)

ライトテーマ / ノンダークモード。フォント: DotGothic16 (本文) + Press Start 2P (見出し / ロゴ)。

### カラートークン

primary (Indigo), secondary (Pink), playful (補助: pink/yellow/green/blue/purple), surface / surface-alt.

### ユーティリティ追加

`.glass` ガラス効果, `.text-gradient` グラデーションテキスト, `hocus:` カスタムバリアント (hover + focus-visible)。

### コンポーネント方針

Buttons: variant = primary | secondary | ghost | outline | danger | play | pill
VoteOption: 選択時グラデーション / カスタム color fallback
AppShell: 背景ラジアル + メッシュ、ガラスカード。

### アクセシビリティセルフチェック

- コントラスト: primary-500 (#6366f1) on white → 5.37:1 (AA 準拠) / secondary-500 (#ec4899) on white → 4.63:1 (AA ボディOK)
- フォーカス: ring-2 ring-primary-500 + offset
- ホバーとフォーカスは `hocus:` で統一、色依存情報にはテキスト/アイコンを併用予定。

今後の改善候補: Vote 状態アイコン追加, キーボードショートカットヘルプ, Storybook 導入。
