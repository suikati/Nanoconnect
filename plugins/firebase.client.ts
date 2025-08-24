import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

export default defineNuxtPlugin(() => {
  // client-only plugin（.client.ts にしたので process.client チェックは不要）
  const config = useRuntimeConfig();
  const firebaseConfig = config.public?.firebase as Record<string, any> | undefined;
  if (!firebaseConfig) {
    // eslint-disable-next-line no-console
    console.warn("Firebase config not found in runtimeConfig.public.firebase");
    return;
  }

  try {
    // getApps()/global ガードで HMR による二重初期化を回避
    if (!getApps().length && !(globalThis as any).__nanosuke_firebase_initialized) {
      const app: FirebaseApp = initializeApp(firebaseConfig as any);
      const db: Database = getDatabase(app);
      const auth: Auth = getAuth(app);
      (globalThis as any).__nanosuke_firebase_initialized = true;

      return {
        provide: {
          firebaseApp: app,
          firebaseDb: db,
          firebaseAuth: auth,
        },
      };
    }

    const app = getApps()[0] as FirebaseApp;
    const db = getDatabase(app);
    const auth = getAuth(app);
    return {
      provide: {
        firebaseApp: app,
        firebaseDb: db,
        firebaseAuth: auth,
      },
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Firebase initialization error:", e);
    return;
  }
});