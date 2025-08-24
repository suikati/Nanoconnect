import { ref as dbRef, onValue } from 'firebase/database';
import type { Database } from 'firebase/database';

// Simple helper to register a realtime listener and return an unsubscribe
export const createDbListener = (db: Database, path: string, cb: (snap: any) => void) => {
  const ref = dbRef(db, path);
  const off = onValue(ref, cb);
  return () => off();
};

export default createDbListener;
