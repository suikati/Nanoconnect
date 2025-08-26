import { describe, it, expect } from 'vitest';
import { buildChartData, computeBgColors, truncateLabel } from '~/utils/chart';

// Minimal Choice type stub matching utils/chart expectation
interface Choice { key: string; text: string; color?: string }

const palette = ['#ff0000', '#00ff00', '#0000ff'];

describe('chart utils', () => {
  it('buildChartData maps labels and counts in order', () => {
    const choices: Choice[] = [
      { key: 'ch_a', text: 'Apple' },
      { key: 'ch_b', text: 'Banana' },
      { key: 'ch_c', text: 'Cherry' }
    ];
    const counts = { ch_b: 2, ch_c: 5 } as Record<string, number>;
    const { labels, data } = buildChartData(choices as any, counts);
    expect(labels).toEqual(['Apple','Banana','Cherry']);
    expect(data).toEqual([0,2,5]);
  });

  it('computeBgColors uses palette, dims inactive, stripes zeros', () => {
    const choices: Choice[] = [
      { key: 'ch_a', text: 'A' },
      { key: 'ch_b', text: 'B', color: '#123456' },
      { key: 'ch_c', text: 'C' }
    ];
    const data = [0, 3, 1];
    const stripe = '#eeeeee' as any; // pattern stub
    const colors = computeBgColors(data, choices as any, palette, 1, stripe);
    // zero value -> stripe
    expect(colors[0]).toBe('#eeeeee');
    // active (index 1) keeps original (choice color prioritized)
    expect(colors[1]).toBe('#123456');
    // dimmed others (index 2) should be lightened: mixWithWhite(#0000ff, 0.75) -> approximated
    expect(colors[2]).not.toBe(palette[2]);
  });

  it('truncateLabel shortens with ellipsis', () => {
    expect(truncateLabel('ABCDEFG', 6)).toBe('ABCDE…');
    expect(truncateLabel('短い', 6)).toBe('短い');
  });
});
