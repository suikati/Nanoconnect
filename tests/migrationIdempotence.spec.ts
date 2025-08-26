import { describe, it, expect } from 'vitest';
import { needsChoiceIdMigration, buildChoiceIdMigrationUpdates } from '~/utils/migration';

// We only test pure / deterministic aspects: needsChoiceIdMigration false after update mapping applied

describe('migration idempotence', () => {
  it('second evaluation is no-op after applying mapping', () => {
    const slide: any = {
      title: 'Q1',
      slideNumber: 1,
      choices: {
        choice_0: { text: 'A', index: 0 },
        choice_1: { text: 'B', index: 1 }
      }
    };
    const aggregates: any = { counts: {}, total: 0 };
    expect(needsChoiceIdMigration(slide, aggregates)).toBe(true);
    const { updates } = buildChoiceIdMigrationUpdates('ROOM','slide_1', slide);
    const newChoices = updates['rooms/ROOM/slides/slide_1/choices'];
    const migrated = { ...slide, choices: newChoices };
    expect(needsChoiceIdMigration(migrated, aggregates)).toBe(false);
  });
});
