import { describe, it, expect } from 'vitest';
import { needsChoiceIdMigration, buildChoiceIdMigrationUpdates } from '~/utils/migration';

const makeSlide = () => ({
  title: 't',
  slideNumber: 1,
  choices: {
    'choice_0': { text: 'A', index: 0 },
    'choice_1': { text: 'B', index: 1 },
  },
});

describe('choice id migration', () => {
  it('detects need when legacy keys and no votes', () => {
    const slide = makeSlide();
    expect(needsChoiceIdMigration(slide as any, { total: 0 })).toBe(true);
  });
  it('does not need when votes exist', () => {
    const slide = makeSlide();
    expect(needsChoiceIdMigration(slide as any, { total: 3 })).toBe(false);
  });
  it('builds updates mapping keys to ch_ ids', () => {
    const slide = makeSlide();
    const { updates, mapping } = buildChoiceIdMigrationUpdates('ROOM', 'slide_1', slide as any);
    const updatedChoices = updates['rooms/ROOM/slides/slide_1/choices'];
    expect(Object.keys(updatedChoices).length).toBe(2);
    expect(Object.keys(mapping)).toEqual(['choice_0','choice_1']);
    Object.values(updatedChoices).forEach((c: any, i: number) => {
      expect(c.text).toBe(['A','B'][i]);
    });
  });
});
