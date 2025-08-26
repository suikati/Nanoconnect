import { ref } from 'vue';
import { runTransaction, update, ref as dbRef } from 'firebase/database';
import { liveCommentPath } from '~/utils/paths';

interface Options {
  cooldownMs?: number;
  lockTimeoutMs?: number;
}

export function useLiveCommentGenerator(db: any, code: string, anonId: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const text = ref('');

  const cooldownMs = 10000;
  const lockTimeoutMs = 30000;

  async function generate(index: number, title: string, choiceKey: string, choiceText: string) {
    if (!code || !choiceText) return;
    const path = liveCommentPath(code, index);
    const now = Date.now();
    const startedAtIso = new Date().toISOString();
    let acquired = false;
    try {
      await runTransaction(dbRef(db, path), (current: any) => {
        const cur = current || null;
        const canSteal = cur && cur.generating && cur.startedAt && (now - Date.parse(cur.startedAt)) > lockTimeoutMs;
        if (cur && cur.generating && !canSteal) return cur;
        if (cur && cur.text && cur.choiceKey === choiceKey) {
          const last = cur.updatedAt ? Date.parse(cur.updatedAt) : 0;
            if (now - last < cooldownMs) return cur;
        }
        acquired = true;
        return {
          choiceKey,
          choiceText,
          generating: true,
          text: null,
          error: null,
          startedAt: startedAtIso,
          updatedAt: startedAtIso,
          lockOwner: anonId || 'unknown'
        };
      });
    } catch (e) {
      error.value = 'lock error';
      return;
    }
    if (!acquired) return;
    loading.value = true;
    try {
      const resp = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, selectedChoice: choiceText })
      });
      const data = await resp.json();
      const t = data?.text || '(生成失敗)';
      await update(dbRef(db, path), { text: t, generating: false, updatedAt: new Date().toISOString(), error: null });
      text.value = t;
    } catch (e: any) {
      await update(dbRef(db, path), { generating: false, error: e?.message || 'error', updatedAt: new Date().toISOString() });
      error.value = e?.message || 'error';
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, text, generate };
}

export default useLiveCommentGenerator;
