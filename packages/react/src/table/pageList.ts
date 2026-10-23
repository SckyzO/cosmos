/**
 * Computes a compact page list with ellipsis for long sequences.
 * Always shows first/last and a window of 3 around the active page.
 */
export const buildPageList = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: (number | '...')[] = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  if (start > 1) out.push('...');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push('...');
  out.push(total - 1);
  return out;
};
