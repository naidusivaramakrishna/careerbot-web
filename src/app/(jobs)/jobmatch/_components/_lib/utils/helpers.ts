export const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const clamp01 = (x: number): number => Math.max(0, Math.min(100, x));
