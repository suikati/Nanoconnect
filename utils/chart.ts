import type { Choice } from '~/types/models';
import { mixWithWhite } from './colors';

// Build data arrays
export function buildChartData(choices: Choice[], counts: Record<string, number>) {
  const labels = choices.map(c => c.text);
  const data = choices.map(c => counts[c.key] ?? 0);
  return { labels, data };
}

// Compute background colors (includes zero stripe pattern externally)
export function computeBgColors(data: number[], choices: Choice[], palette: string[], activeIndex: number | null, stripe: CanvasPattern | null) {
  return data.map((v, i) => {
    if (v === 0) return stripe || '#e5e7eb';
    const choice = choices[i] as any;
    const base = choice && choice.color ? choice.color : palette[i % palette.length];
    const isDim = activeIndex !== null && activeIndex !== i;
    if (isDim) return mixWithWhite(base, 0.75);
    return base;
  });
}

export function truncateLabel(label: string, max = 6) {
  return label.length > max ? label.slice(0, max - 1) + '…' : label;
}
