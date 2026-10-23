/**
 * Compute the list of pages to show with ellipsis markers.
 * `0` represents an ellipsis. Always includes first + last.
 *   < 8 pages: render all.
 *   page near start: 1 2 3 4 5 ... N
 *   page near end:   1 ... N-4 N-3 N-2 N-1 N
 *   middle:          1 ... p-1 p p+1 ... N
 */
export const buildRange = (page: number, total: number): number[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 0, total];
  if (page >= total - 3) return [1, 0, total - 4, total - 3, total - 2, total - 1, total];
  return [1, 0, page - 1, page, page + 1, 0, total];
};
