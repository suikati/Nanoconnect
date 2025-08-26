// Central color palette & helpers
export const PALETTE = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'] as const;
export type PaletteColor = typeof PALETTE[number];

export function withFallbackColor(raw: string | undefined, index: number): string {
  const r = (raw || '').trim();
  if (!r || r.toLowerCase() === '#f3f4f6') return PALETTE[index % PALETTE.length];
  return r;
}

export function mixWithWhite(hex: string, ratio = 0.55) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const nr = Math.round(r + (255 - r) * ratio);
  const ng = Math.round(g + (255 - g) * ratio);
  const nb = Math.round(b + (255 - b) * ratio);
  return `rgb(${nr}, ${ng}, ${nb})`;
}
