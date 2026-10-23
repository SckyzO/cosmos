/**
 * A file size for display: bytes below 1 KB, then KB and MB with one decimal,
 * GB with two. Units are binary (1 KB = 1024 B). The unit is picked after
 * rounding, so 1 MB minus a byte reads `1.0 MB`, not `1024.0 KB`.
 */
export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  const kb = (n / 1024).toFixed(1);
  if (Number(kb) < 1024) return `${kb} KB`;
  const mb = (n / 1024 / 1024).toFixed(1);
  if (Number(mb) < 1024) return `${mb} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
