import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

export default defineNuxtPlugin(() => {
  // SSRガード: クライアントでのみ初期化
  if (!process.client) return;

  const config = useRuntimeConfig();
  const firebaseConfig = config.public.firebase as Record<string, any> | undefined;
  if (!firebaseConfig) {
    // 開発中に設定を忘れた場合は早期リターン
    // eslint-disable-next-line no-console
    console.warn("Firebase config not found in runtimeConfig.public.firebase");
    return;
  }

  // 二重初期化を防止
  if (!getApps().length) {
    const app: FirebaseApp = initializeApp(firebaseConfig as any);
    const db: Database = getDatabase(app);
    const auth: Auth = getAuth(app);

    return {
      provide: {
        firebaseApp: app,
        firebaseDb: db,
        firebaseAuth: auth,
      },
    };
  }
  // 既に初期化済みの場合は既存のインスタンスを提供
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
});