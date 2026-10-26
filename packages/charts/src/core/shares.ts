/**
 * The share of each value in their sum, as whole percents that add up to 100
 * (the largest remainders take the rounding). All zero when the sum is zero.
 * A negative value counts as zero.
 */
export const shares = (values: readonly number[]): number[] => {
  const parts = values.map((v) => Math.max(0, v));
  const total = parts.reduce((sum, v) => sum + v, 0);
  if (total === 0) return parts.map(() => 0);
  const exact = parts.map((v) => (v / total) * 100);
  const whole = exact.map(Math.floor);
  const byRemainder = exact
    .map((v, i) => ({ i, rest: v - whole[i] }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  const missing = 100 - whole.reduce((sum, v) => sum + v, 0);
  for (let k = 0; k < missing; k++) whole[byRemainder[k].i]++;
  return whole;
};
