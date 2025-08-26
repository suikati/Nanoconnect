import { ref } from 'vue';
import { runTransaction, update, ref as dbRef } from 'firebase/database';
import { liveCommentPath } from '~/utils/paths';

// オプション（将来拡張用）
interface Options {
  cooldownMs?: number;    // 同一選択肢再生成クールダウン
  lockTimeoutMs?: number; // ロック強制奪取タイムアウト
}

export function useLiveCommentGenerator(db: any, code: string, anonId: string) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const text = ref('');

  const cooldownMs = 10000;
  const lockTimeoutMs = 30000;

  // ライブコメント生成: 楽観ロック + クールダウン制御
  async function generate(index: number, title: string, choiceKey: string, choiceText: string) {
    if (!code || !choiceText) return;
    const path = liveCommentPath(code, index);
    const now = Date.now();
    const startedAtIso = new Date().toISOString();
    let acquired = false;
    try {
      await runTransaction(dbRef(db, path), (current: any) => {
        const cur = current || null;
        // 既存ロックが一定時間超過なら奪取可能
        const canSteal = cur && cur.generating && cur.startedAt && (now - Date.parse(cur.startedAt)) > lockTimeoutMs;
        if (cur && cur.generating && !canSteal) return cur; // まだ他ユーザ生成中
        // 直前生成済み & 同一選択肢 & クールダウン未経過
        if (cur && cur.text && cur.choiceKey === choiceKey) {
          const last = cur.updatedAt ? Date.parse(cur.updatedAt) : 0;
          if (now - last < cooldownMs) return cur;
        }
        // ロック取得
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
      error.value = 'ロック取得失敗';
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
  error.value = e?.message || 'エラー';
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, text, generate };
}

export default useLiveCommentGenerator;
