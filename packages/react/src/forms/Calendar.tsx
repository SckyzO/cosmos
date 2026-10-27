import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createContext, use, type ReactNode, type RefCallback } from 'react';
import {
  Day,
  DayButton,
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type DayPickerProps,
  type DayProps,
  type RootProps,
} from 'react-day-picker';
import { useParentDirection } from '../hooks/direction';
import { mergeRefs } from '../ui/mergeRefs';
import { dayButtonName } from './calendarLabels';

export type CalendarProps = DayPickerProps & {
  className?: string;
};

// A day shows its number and is named by the full date of the calendar's locale.
// The number goes in front of that name when the date holds it only as part of a
// word ("1st"), so the visible text is in the name (WCAG 2.5.3). The cell of a
// calendar with no `mode` is named too, and holds the number as text; one with a
// `mode` holds a button, named by `NamedDayButton`.
const nameOfDay = (label: string | undefined, content: ReactNode) =>
  typeof content === 'string' || typeof content === 'number'
    ? dayButtonName(label, String(content))
    : label;

const NamedDayButton = ({ children, ...props }: DayButtonProps) => (
  <DayButton {...props} aria-label={nameOfDay(props['aria-label'], children)}>
    {children}
  </DayButton>
);

const NamedDay = ({ children, ...props }: DayProps) => (
  <Day {...props} aria-label={nameOfDay(props['aria-label'], children)}>
    {children}
  </Day>
);

// DayPicker takes its direction from a `dir` prop (the arrow keys, the side of the previous and
// next month chevrons), not from the page. Its root is where `Calendar` measures the direction it
// sits in, and it gives it back as that prop.
const DirectionRef = createContext<RefCallback<HTMLDivElement> | null>(null);

const CalendarRoot = ({ rootRef, ...props }: RootProps) => (
  <div {...props} ref={mergeRefs(rootRef, use(DirectionRef))} />
);

/**
 * Thin Cosmos wrapper around react-day-picker's `<DayPicker>`. All DayPicker
 * props are accepted (see https://daypicker.dev). Cosmos applies its own
 * Tailwind class names on top of the defaults so the calendar matches the
 * rest of the design system.
 *
 * A day is named by the full date in the calendar's `locale`, prefixed with the
 * number it shows when the date writes it as an ordinal ("1, Thursday, October
 * 1st, 2026"), so a voice user can say "click 1". Pass your own `components.Day`
 * and `components.DayButton` to name the days yourself.
 *
 * react-day-picker's structural styles are not imported here (a CSS import in
 * the bundle breaks `require` in Node): load `@sckyzo/cosmos-react/calendar.css`
 * once in your app.
 */
export const Calendar = ({ classNames, components, className, ...rest }: CalendarProps) => {
  const def = getDefaultClassNames();
  const [direction, directionRef] = useParentDirection<HTMLDivElement>();
  const showLabel = (rest.captionLayout ?? 'label') === 'label';
  return (
    // `animate` is intentionally OFF: with our custom caption (mode/year
    // dropdowns), the cross-fade transition renders the outgoing caption on
    // top of the incoming one for ~150 ms, producing a visible ghost of
    // "May 2026" overlapping the dropdowns. Static caption swaps look clean.
    <DirectionRef value={directionRef}>
      <DayPicker
        // Left alone in left to right, so that markup is what it was.
        dir={direction === 'rtl' ? 'rtl' : undefined}
        classNames={{
          root: clsx(def.root, 'p-3 text-sm', className),
          months: clsx(def.months, 'gap-4'),
          month: clsx(def.month, 'space-y-2'),
          // Reserve horizontal padding so the absolute Nav prev/next chevrons sit
          // OUTSIDE of the caption content (dropdowns or label), never overlapping.
          month_caption: clsx(
            def.month_caption,
            'min-h-ctrl-36 flex items-center justify-center px-9'
          ),
          // The `label` layout (the default) shows the month and year here. A dropdown
          // layout shows them in its selects, so the raw label would double them: it
          // stays for screen readers only (`sr-only`).
          caption_label: showLabel
            ? 'text-sm font-medium text-gray-700 select-none dark:text-gray-200'
            : 'sr-only',
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
            'pointer-events-auto inline-flex h-ctrl-28 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:focus-indicator disabled:opacity-30 aria-disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
          button_next:
            'pointer-events-auto inline-flex h-ctrl-28 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:focus-indicator disabled:opacity-30 aria-disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200',
          // Caption dropdowns (when `captionLayout="dropdown"` etc.)
          // The `dropdown` key targets the actual `<select>` element. `appearance-none`
          // hides the browser-native chevron; we layer a Lucide ChevronDown via a
          // background-image SVG so the chevron matches the rest of the design system.
          dropdowns: 'flex items-center justify-center gap-1.5',
          dropdown_root: 'relative inline-flex items-center',
          dropdown: clsx(
            'py-row-4 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white ps-2.5 pe-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50',
            'focus:field-focus',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
            // Custom chevron-down via inline SVG (text-gray-400 in light, text-gray-500 in dark — single SVG, neutral color works for both).
            "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:12px] bg-[position:right_6px_center] bg-no-repeat rtl:bg-[position:left_6px_center]"
          ),
          months_dropdown: '',
          years_dropdown: '',
          weekdays: clsx(def.weekdays, ''),
          weekday:
            'h-ctrl-32 w-8 text-center text-2xs font-medium text-gray-500 dark:text-gray-400',
          week: clsx(def.week, ''),
          day: 'h-ctrl-32 w-8 p-0 text-center align-middle',
          day_button:
            'inline-flex h-ctrl-32 w-8 items-center justify-center rounded-md text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:ring-inset focus-visible:focus-indicator dark:text-gray-200 dark:hover:bg-white/5',
          today: 'font-semibold text-brand-600 dark:text-brand-400',
          selected:
            '[&_button]:bg-brand-500 [&_button]:text-white [&_button]:hover:bg-brand-600 dark:[&_button]:hover:bg-brand-400 [&_button:focus-visible]:ring-white',
          outside: 'text-gray-300 dark:text-gray-600',
          disabled: 'opacity-30',
          range_start: '[&_button]:rounded-e-none',
          range_end: '[&_button]:rounded-s-none',
          // The days between the ends are `selected` too: `!` puts the tint and its
          // text over the solid fill, or white text landed on the light tint.
          range_middle:
            '[&_button]:bg-brand-500/15! [&_button]:text-brand-700! [&_button]:hover:bg-brand-500/25! [&_button]:rounded-none dark:[&_button]:text-brand-300!',
          footer: 'pt-2 text-center text-xs text-gray-500 dark:text-gray-400',
          ...classNames,
        }}
        components={{
          Root: CalendarRoot,
          Day: NamedDay,
          DayButton: NamedDayButton,
          // The default navigation always asks for `left` on the previous month and `right` on the
          // next one, and leaves it to react-day-picker's own stylesheet to turn them around in
          // right to left. Cosmos draws its own icons, so it turns them. With `navLayout="around"`
          // the library already swaps the orientation itself.
          Chevron: ({ orientation }) => {
            const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
            return (
              <Icon
                className={clsx('h-4 w-4', rest.navLayout !== 'around' && 'rtl:-scale-x-100')}
              />
            );
          },
          ...components,
        }}
        {...rest}
      />
    </DirectionRef>
  );
};
