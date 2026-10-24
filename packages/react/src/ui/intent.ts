/**
 * The meaning a component carries, as a color: the one vocabulary behind every
 * `intent` prop. A component may accept a documented subset (a `Button` only
 * knows `brand` and `danger`), but never a synonym: `danger`, not `error` or
 * `crit`; `warning`, not `warn`.
 *
 * `variant` is the other axis: it describes structure or emphasis (`solid`,
 * `outline`, `ghost`), never meaning.
 */
export type Intent = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';
