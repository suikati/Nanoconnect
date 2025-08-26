import { defineConfig } from 'vitest/config';
import path from 'path';
import { createRequire } from 'module';

// plugin-vue を任意化（StackBlitz / CI で未インストールでも純粋ユーティリティテストを実行可能にする）
const require = createRequire(import.meta.url);
let vuePlugin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@vitejs/plugin-vue');
  const factory = mod.default || mod; // CJS / ESM 両対応
  vuePlugin = factory();
} catch (e) {
  // オプション: Vue コンポーネントをテストしない場合はスキップして良い
  // eslint-disable-next-line no-console
  console.warn('[vitest] @vitejs/plugin-vue not found, continuing without it');
}

export default defineConfig({
  plugins: vuePlugin ? [vuePlugin] : [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname),
    },
  },
});
