const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The accessible name of a day button, given the label react-day-picker built for it
 * (`"Thursday, October 1st, 2026"`, in the locale of the calendar) and the text the
 * button shows (`"1"`).
 *
 * WCAG 2.5.3 wants the visible text in the name, as a word of its own: the ordinal of
 * `"1st"` does not count, and a voice user who says "click 1" is not understood. A label
 * that already holds the text as a word (`"Donnerstag, 1. Oktober 2026"`) is kept as it
 * is; otherwise the text goes in front of the full date, which stays whole, in the
 * language of the calendar, with its "today" and "selected" parts.
 */
export const dayButtonName = (
  label: string | undefined,
  visibleText: string
): string | undefined => {
  const text = visibleText.trim();
  if (!label || !text) return label;
  const asWord = new RegExp(
    `(?<![\\p{L}\\p{M}\\p{N}])${escapeRegExp(text)}(?![\\p{L}\\p{M}\\p{N}])`,
    'u'
  );
  return asWord.test(label) ? label : `${text}, ${label}`;
};
