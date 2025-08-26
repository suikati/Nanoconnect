import { update, ref as dbRef } from 'firebase/database';
import { slidePathById, aggregatesPathById } from '~/utils/paths';

/** Shape of a legacy slide node as stored in RTDB */
type LegacyChoice = { text: string; index: number; color?: string };
type LegacySlide = { title: string; slideNumber: number; chartType?: 'bar' | 'pie'; choices: Record<string, LegacyChoice> };

export interface MigrationResult {
  performed: boolean;
  reason?: string;
  newIds?: Record<string, string>; // oldKey -> newId
}

/**
 * Decide whether to migrate: if any choice key starts with `choice_` and no votes yet (aggregates.total==0).
 */
export function needsChoiceIdMigration(slide: LegacySlide | null | undefined, aggregates: any): boolean {
  if (!slide || !slide.choices) return false;
  const hasLegacy = Object.keys(slide.choices).some(k => /^choice_\d+$/.test(k));
  if (!hasLegacy) return false;
  const total = (aggregates && typeof aggregates.total === 'number') ? aggregates.total : 0;
  if (total > 0) return false; // avoid breaking existing votes
  return true;
}

/**
 * Build update payload mapping legacy keys to stable ch_ ids. Only run when safe (no votes yet).
 * We keep ordering by original choice index.
 */
export function buildChoiceIdMigrationUpdates(roomCode: string, slideId: string, slide: LegacySlide): { updates: Record<string, any>; mapping: Record<string,string> } {
  const mapping: Record<string, string> = {};
  const ordered = Object.entries(slide.choices).sort((a,b)=> (a[1].index - b[1].index));
  const newChoices: Record<string, LegacyChoice> = {};
  ordered.forEach(([oldKey, val]) => {
    const newId = 'ch_' + Math.random().toString(36).slice(2,10);
    mapping[oldKey] = newId;
    newChoices[newId] = val;
  });
  const updates: Record<string, any> = {};
  updates[`${slidePathById(roomCode, slideId)}/choices`] = newChoices;
  // reset aggregates counts (since there were no votes) to empty keyed by new ids (all zero)
  updates[`${aggregatesPathById(roomCode, slideId)}`] = { counts: {}, total: 0 };
  return { updates, mapping };
}

/**
 * Execute migration if needed. Returns result object.
 */
export async function migrateLegacyChoiceIds(db: any, roomCode: string, slideId: string, slide: LegacySlide | null, aggregates: any): Promise<MigrationResult> {
  if (!needsChoiceIdMigration(slide, aggregates)) {
    return { performed: false, reason: 'not-needed-or-has-votes' };
  }
  if (!slide) return { performed: false, reason: 'no-slide' };
  const { updates, mapping } = buildChoiceIdMigrationUpdates(roomCode, slideId, slide);
  await update(dbRef(db), updates);
  return { performed: true, newIds: mapping };
}
