// Minimal test setup
import { beforeAll } from 'vitest';

// Provide a noop useNuxtApp if not overridden inside tests
if (!(global as any).useNuxtApp) {
  (global as any).useNuxtApp = () => ({ $firebaseDb: null });
}

beforeAll(() => {
  // Any global polyfills can be placed here
});
