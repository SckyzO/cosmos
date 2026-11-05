import { DateLib, type DateLibOptions, type Labels } from 'react-day-picker';
import type { CalendarLabels } from './labels';

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

/**
 * What `Calendar` hands react-day-picker as its `labels`: the entries of the labels the app set
 * (`given`, from `LabelsProvider` and the `labels` prop), written from the resolved `labels`, then
 * the app's own react-day-picker labels (`own`: every key that starts with `label`), which win.
 *
 * A key the app left out is not handed over: react-day-picker keeps its own for it, in the
 * language of the `locale` when that has labels (the ones of `react-day-picker/locale` do), where
 * the English default of `labels` would have covered them.
 */
export const dayPickerLabels = (
  labels: CalendarLabels,
  given: Partial<CalendarLabels>,
  own: object = {}
): Partial<Labels> => {
  const day =
    (selectable: boolean) =>
    (
      date: Date,
      modifiers: { today?: boolean; selected?: boolean } | undefined,
      options?: DateLibOptions,
      dateLib?: DateLib
    ) =>
      labels.day((dateLib ?? new DateLib(options)).format(date, 'PPPP'), {
        today: !!modifiers?.today,
        selected: selectable && !!modifiers?.selected,
      });
  const mapped: Partial<Labels> = {
    ...(given.previousMonth !== undefined && { labelPrevious: () => labels.previousMonth }),
    ...(given.nextMonth !== undefined && { labelNext: () => labels.nextMonth }),
    ...(given.monthDropdown !== undefined && { labelMonthDropdown: () => labels.monthDropdown }),
    ...(given.yearDropdown !== undefined && { labelYearDropdown: () => labels.yearDropdown }),
    ...(given.day !== undefined && {
      labelDayButton: day(true),
      labelGridcell: day(false),
    }),
    ...(given.weekNumber !== undefined && {
      labelWeekNumber: (week: number) => labels.weekNumber(week),
    }),
    ...(given.weekNumberHeader !== undefined && {
      labelWeekNumberHeader: () => labels.weekNumberHeader,
    }),
  };
  const raw = Object.fromEntries(Object.entries(own).filter(([key]) => key.startsWith('label')));
  return { ...mapped, ...raw };
};
