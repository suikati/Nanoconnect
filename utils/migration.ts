import { update, ref as dbRef } from 'firebase/database';
import { slidePathById, aggregatesPathById } from '~/utils/paths';

// 旧形式スライドノードの型定義（RTDB 上の生データ）
type LegacyChoice = { text: string; index: number; color?: string };
type LegacySlide = { title: string; slideNumber: number; chartType?: 'bar' | 'pie'; choices: Record<string, LegacyChoice> };

export interface MigrationResult {
  performed: boolean;        // 実際にマイグレーションを行ったか
  reason?: string;           // 実行しなかった理由（必要なし / 票が既にある 等）
  newIds?: Record<string, string>; // 旧キー -> 新 ch_ ID のマッピング
}

// マイグレーション必要判定: choice キーに legacy (`choice_#`) が含まれ、かつ投票総数が 0 のときのみ許可
export function needsChoiceIdMigration(slide: LegacySlide | null | undefined, aggregates: any): boolean {
  if (!slide || !slide.choices) return false;
  const hasLegacy = Object.keys(slide.choices).some(k => /^choice_\d+$/.test(k));
  if (!hasLegacy) return false; // 旧形式キーが無ければ不要
  const total = (aggregates && typeof aggregates.total === 'number') ? aggregates.total : 0;
  if (total > 0) return false; // 票が存在するなら破壊的変更を避ける
  return true;
}

// 実際の更新ペイロード生成: index 順を維持しつつ新しい ch_ ID を採番し choices を差し替える
export function buildChoiceIdMigrationUpdates(roomCode: string, slideId: string, slide: LegacySlide): { updates: Record<string, any>; mapping: Record<string,string> } {
  const mapping: Record<string, string> = {};
  const ordered = Object.entries(slide.choices).sort((a,b)=> (a[1].index - b[1].index));
  const newChoices: Record<string, LegacyChoice> = {};
  ordered.forEach(([oldKey, val]) => {
    const newId = 'ch_' + Math.random().toString(36).slice(2,10);
    mapping[oldKey] = newId;
    newChoices[newId] = val; // 値本体はそのまま、キーのみ更新
  });
  const updates: Record<string, any> = {};
  updates[`${slidePathById(roomCode, slideId)}/choices`] = newChoices;
  // 票が無い前提なので集計はゼロ初期化（空 counts & total=0）
  updates[`${aggregatesPathById(roomCode, slideId)}`] = { counts: {}, total: 0 };
  return { updates, mapping };
}

// 必要ならマイグレーションを実行して結果を返す
export async function migrateLegacyChoiceIds(db: any, roomCode: string, slideId: string, slide: LegacySlide | null, aggregates: any): Promise<MigrationResult> {
  if (!needsChoiceIdMigration(slide, aggregates)) {
    return { performed: false, reason: 'not-needed-or-has-votes' };
  }
  if (!slide) return { performed: false, reason: 'no-slide' };
  const { updates, mapping } = buildChoiceIdMigrationUpdates(roomCode, slideId, slide);
  await update(dbRef(db), updates);
  return { performed: true, newIds: mapping };
}
