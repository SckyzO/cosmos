import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type DayPickerProps,
} from 'react-day-picker';
import { dayButtonName } from './calendarLabels';

export type CalendarProps = DayPickerProps & {
  className?: string;
};

// A day button shows its number and is named by the full date of the calendar's
// locale. The number goes in front of that name when the date holds it only as
// part of a word ("1st"), so the visible text is in the name (WCAG 2.5.3).
const NamedDayButton = ({ children, ...props }: DayButtonProps) => (
  <DayButton
    {...props}
    aria-label={
      typeof children === 'string' || typeof children === 'number'
        ? dayButtonName(props['aria-label'], String(children))
        : props['aria-label']
    }
  >
    {children}
  </DayButton>
);

/**
 * Thin Cosmos wrapper around react-day-picker's `<DayPicker>`. All DayPicker
 * props are accepted (see https://daypicker.dev). Cosmos applies its own
 * Tailwind class names on top of the defaults so the calendar matches the
 * rest of the design system.
 *
 * A day button is named by the full date in the calendar's `locale`, prefixed
 * with the number it shows when the date writes it as an ordinal ("1, Thursday,
 * October 1st, 2026"), so a voice user can say "click 1". Pass your own
 * `components.DayButton` to name the days yourself.
 *
 * react-day-picker's structural styles are not imported here (a CSS import in
 * the bundle breaks `require` in Node): load `@sckyzo/cosmos-react/calendar.css`
 * once in your app.
 */
export const Calendar = ({ classNames, components, className, ...rest }: CalendarProps) => {
  const def = getDefaultClassNames();
  return (
    // `animate` is intentionally OFF: with our custom caption (mode/year
    // dropdowns), the cross-fade transition renders the outgoing caption on
    // top of the incoming one for ~150 ms, producing a visible ghost of
    // "May 2026" overlapping the dropdowns. Static caption swaps look clean.
    <DayPicker
      classNames={{
        root: clsx(def.root, 'p-3 text-sm', className),
        months: clsx(def.months, 'gap-4'),
        month: clsx(def.month, 'space-y-2'),
        // Reserve horizontal padding so the absolute Nav prev/next chevrons sit
        // OUTSIDE of the caption content (dropdowns or label), never overlapping.
        month_caption: clsx(def.month_caption, 'flex min-h-9 items-center justify-center px-9'),
        // Hide the textual caption visually — react-day-picker still emits it
        // for screen readers, but our `Dropdowns` (when `captionLayout` is set)
        // already show the month + year, so the raw label produces a visual
        // doubling. `sr-only` keeps the a11y guarantee, kills the ghost text.
        caption_label: 'sr-only',
        // Nav stays absolutely positioned but vertically centered with the caption
        // (top-1.5 lines up with the caption baseline; pointer-events-none on wrapper
        //  keeps the inner space click-through, then re-enables on the buttons).
        nav: clsx(
          def.nav,
          'pointer-events-none absolute inset-x-0 top-1 flex items-center justify-between px-1'
        ),
        // At its first or last month react-day-picker sets `aria-disabled`, not
        // `disabled`: the dimming has to follow both.
        button_previous:
          'pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:focus-indicator disabled:opacity-30 aria-disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
        button_next:
          'pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:focus-indicator disabled:opacity-30 aria-disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
        // Caption dropdowns (when `captionLayout="dropdown"` etc.)
        // The `dropdown` key targets the actual `<select>` element. `appearance-none`
        // hides the browser-native chevron; we layer a Lucide ChevronDown via a
        // background-image SVG so the chevron matches the rest of the design system.
        dropdowns: 'flex items-center justify-center gap-1.5',
        dropdown_root: 'relative inline-flex items-center',
        dropdown: clsx(
          'cursor-pointer appearance-none rounded-md border border-gray-200 bg-white py-1 pr-6 pl-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50',
          'focus:field-focus',
          'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          // Custom chevron-down via inline SVG (text-gray-400 in light, text-gray-500 in dark — single SVG, neutral color works for both).
          "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:12px] bg-[position:right_6px_center] bg-no-repeat"
        ),
        months_dropdown: '',
        years_dropdown: '',
        weekdays: clsx(def.weekdays, ''),
        weekday: 'h-8 w-8 text-center text-2xs font-medium text-gray-500 dark:text-gray-400',
        week: clsx(def.week, ''),
        day: 'h-8 w-8 p-0 text-center align-middle',
        day_button:
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:ring-inset focus-visible:focus-indicator dark:text-gray-200 dark:hover:bg-white/5',
        today: 'font-semibold text-brand-600 dark:text-brand-400',
        selected:
          '[&_button]:bg-brand-500 [&_button]:text-white [&_button]:hover:bg-brand-600 dark:[&_button]:hover:bg-brand-400 [&_button:focus-visible]:ring-white',
        outside: 'text-gray-300 dark:text-gray-600',
        disabled: 'opacity-30',
        range_start: '[&_button]:rounded-r-none',
        range_end: '[&_button]:rounded-l-none',
        range_middle:
          '[&_button]:bg-brand-500/15 [&_button]:text-brand-700 [&_button]:rounded-none dark:[&_button]:text-brand-300',
        footer: 'pt-2 text-center text-xs text-gray-500 dark:text-gray-400',
        ...classNames,
      }}
      components={{
        DayButton: NamedDayButton,
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
        ...components,
      }}
      {...rest}
    />
  );
};
