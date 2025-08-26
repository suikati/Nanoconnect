import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase/database before importing useRoom
interface Store { [k: string]: any }
const store: Store = {};

function segs(path: string) { return path.split('/').filter(Boolean); }
function getPath(path: string) {
  let cur: any = store;
  for (const s of segs(path)) {
    if (cur[s] === undefined) return undefined;
    cur = cur[s];
  }
  return cur;
}
function setPath(path: string, val: any) {
  let cur: any = store;
  const arr = segs(path);
  arr.forEach((s, i) => {
    if (i === arr.length - 1) { cur[s] = val; return; }
    cur[s] = cur[s] || {}; cur = cur[s];
  });
}

vi.mock('firebase/database', () => {
  const ref = (_db: any, path: string) => ({ path });
  const set = async (r: any, value: any) => { setPath(r.path, value); };
  const get = async (r: any) => {
    const v = getPath(r.path);
    return { exists: () => v !== undefined, val: () => v };
  };
  const runTransaction = async (r: any, updateFn: (cur: any)=> any) => {
    const cur = getPath(r.path);
    const updated = updateFn(cur);
    setPath(r.path, updated);
    return { committed: true, snapshot: { val: () => updated } };
  };
  const push = async (r: any, value: any) => {
    const key = 'id_' + Math.random().toString(36).slice(2,10);
    const parent = getPath(r.path) || {};
    parent[key] = value;
    setPath(r.path, parent);
    return { key };
  };
  return { ref, set, get, runTransaction, push };
});

// Mock Nuxt app firebase db object (not used by stub functions but required by useRoom)
beforeEach(() => {
  (global as any).useNuxtApp = () => ({ $firebaseDb: { dummy: true } });
  // reset store between tests
  for (const k of Object.keys(store)) delete store[k];
});

describe('submitVoteSafe', () => {
  it('increments counts and total for first vote', async () => {
    const mod = await import('~/composables/useRoom');
    const api = mod.default();
    await api.createRoom('ROOM');
    const ok = await api.submitVoteSafe('ROOM', 'slide_1', 'ch_x');
    expect(ok).toBe(true);
    const agg = getPath('rooms/ROOM/aggregates/slide_1');
    expect(agg.total).toBe(1);
    expect(agg.counts['ch_x']).toBe(1);
  });

  it('switching vote decrements previous and increments new', async () => {
    const mod = await import('~/composables/useRoom');
    const api = mod.default();
    await api.createRoom('ROOM');
    await api.submitVoteSafe('ROOM', 'slide_1', 'ch_a');
    await api.submitVoteSafe('ROOM', 'slide_1', 'ch_b');
    const agg = getPath('rooms/ROOM/aggregates/slide_1');
    expect(agg.total).toBe(1);
    expect(agg.counts['ch_a']).toBe(0);
    expect(agg.counts['ch_b']).toBe(1);
  });

  it('re-voting same choice is no-op (returns false)', async () => {
    const mod = await import('~/composables/useRoom');
    const api = mod.default();
    await api.createRoom('ROOM');
    await api.submitVoteSafe('ROOM', 'slide_1', 'ch_a');
    const second = await api.submitVoteSafe('ROOM', 'slide_1', 'ch_a');
    expect(second).toBe(false);
    const agg = getPath('rooms/ROOM/aggregates/slide_1');
    expect(agg.total).toBe(1);
    expect(agg.counts['ch_a']).toBe(1);
  });
});
