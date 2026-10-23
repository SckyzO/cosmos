const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * A copy of `value` that shares no plain object or array with it. Functions and
 * other values (a `Date`, a class instance) keep their identity: ApexCharts
 * compares the functions in its options by identity.
 */
const copy = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(copy);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== '__proto__')
      .map(([key, entry]) => [key, copy(entry)])
  );
};

/**
 * `override` merged over `base`, deeply, in a new object. Plain objects merge
 * key by key; anything else in `override` (a value, an array, a function)
 * replaces what `base` has there, and `undefined` leaves it. Neither argument
 * is changed, and nothing taken from `override` is shared with it: ApexCharts
 * writes to the options it is given.
 */
export const mergeOptions = <T extends object>(base: T, override: object): T => {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    // `merged.__proto__ = …` would swap the prototype of `merged`.
    if (value === undefined || key === '__proto__') continue;
    const current = merged[key];
    merged[key] =
      isPlainObject(current) && isPlainObject(value) ? mergeOptions(current, value) : copy(value);
  }
  return merged as T;
};
