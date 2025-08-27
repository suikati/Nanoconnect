# Style and conventions

- Language: TypeScript + Vue 3 (composition API). Files use .ts/.vue and follow Nuxt conventions.
- Formatting: Prettier is configured and used via "pnpm format" script.
- Modules: TailwindCSS via @nuxtjs/tailwindcss.
- Runtime config: Secrets via runtimeConfig in `nuxt.config.ts`.
- Firebase initialization: single plugin at `plugins/firebase.client.ts`.
- Tests: No test framework found yet; recommend Vitest/Jest if adding tests.

Conventions to follow:

- Keep logic in composables (`composables/`) and UI in `components/`.
- Use props/emit and composition API; introduce Pinia only if state complexity grows.
- Keep Firebase calls in composables or plugins, avoid direct DB calls in templates.
- 関数の定義はアロー関数で統一して。
