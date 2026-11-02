// The estimator the stories of the password forms use. Cosmos ships none: the same few lines are in
// `docs/components/forms.md`, and a real app loads zxcvbn-ts instead.

/** A rough password score on zxcvbn's scale: 0 (very weak) to 4 (strong). */
export const estimateStrength = (password: string): number => {
  // Repeated characters add little: at most two count for each distinct one.
  const useful = Math.min(password.length, 2 * new Set(password).size);
  const base = useful < 8 ? 0 : Math.min(4, 1 + Math.floor((useful - 8) / 4));
  if (base === 0) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((c) => c.test(password)).length;
  // Three or four kinds of character lift the score by one, a single kind lowers it by one.
  return Math.max(0, Math.min(4, base + (classes >= 3 ? 1 : classes === 1 ? -1 : 0)));
};
