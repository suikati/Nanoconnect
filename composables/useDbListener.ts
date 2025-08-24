import { ref as dbRef, onValue } from 'firebase/database';
import type { Database } from 'firebase/database';

// Registry to count active listeners per (db,path) for runtime diagnostics
const registry: WeakMap<Database, Map<string, number>> = new WeakMap();

// Simple helper to register a realtime listener and return an unsubscribe
export const createDbListener = (db: Database, path: string, cb: (snap: any) => void) => {
  const ref = dbRef(db, path);
  // ensure map exists
  let map = registry.get(db);
  if (!map) {
    map = new Map();
    registry.set(db, map);
  }
  const prev = map.get(path) || 0;
  map.set(path, prev + 1);
  if (prev + 1 > 1) {
    // warn in console to help locate duplicate registration at runtime
    // eslint-disable-next-line no-console
    console.warn(
      `[useDbListener] multiple listeners registered for path=${path} count=${prev + 1}`,
    );
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
    // decrement registry
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
