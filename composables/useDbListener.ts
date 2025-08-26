import { ref as dbRef, onValue } from 'firebase/database';
import type { Database } from 'firebase/database';

// (db,path) ごとのアクティブリスナー数を記録し重複登録を可視化するレジストリ
const registry: WeakMap<Database, Map<string, number>> = new WeakMap();

// Realtime Database リスナーを登録し解除関数を返すユーティリティ
export const createDbListener = (db: Database, path: string, cb: (snap: any) => void) => {
  const ref = dbRef(db, path);
  // マップ初期化
  let map = registry.get(db);
  if (!map) {
    map = new Map();
    registry.set(db, map);
  }
  const prev = map.get(path) || 0;
  map.set(path, prev + 1);
  if (prev + 1 > 1) {
    // 重複登録警告（リークや二重購読検出用）
    // eslint-disable-next-line no-console
    console.warn(`[useDbListener] パス重複登録 path=${path} count=${prev + 1}`);
  }

  const off = onValue(ref, cb);
  let unsubbed = false;
  return () => {
    if (unsubbed) return;
    try {
      off();
    } catch (e) {
      /* ignore */
    }
    unsubbed = true;
  // 登録カウント減算 / 0 ならクリーンアップ
    try {
      const m = registry.get(db);
      if (m) {
        const v = (m.get(path) || 1) - 1;
        if (v <= 0) m.delete(path);
        else m.set(path, v);
      }
    } catch (e) {
      /* ignore */
    }
  };
};

export default createDbListener;
