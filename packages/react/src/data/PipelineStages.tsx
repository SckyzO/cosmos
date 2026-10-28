import { clsx } from 'clsx';
import { ArrowDown, ArrowRight } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { onRadioGroupKeyDown, radioTabIndex } from '../forms/radioGroupA11y';
import { useControllableState } from '../hooks/useControllableState';
import type { Intent } from '../ui/intent';
import { conversionRate, formatRate } from './pipeline-stages';

export type PipelineStageIntent = Extract<
  Intent,
  'brand' | 'success' | 'warning' | 'danger' | 'info'
>;

export type PipelineStage = {
  /** Stable key of the stage. */
  id: string;
  /** Name of the stage ("Qualified"). A string also names it in the conversion read aloud. */
  label: ReactNode;
  count: number;
  /** Value of the stage, written by the host ("$842k"). */
  amount?: ReactNode;
  /** A colored dot before the label. None by default. */
  intent?: PipelineStageIntent;
};

export type PipelineStagesProps = {
  /** The stages in pipeline order, first to last. */
  stages: PipelineStage[];
  /**
   * Shows, between two stages, the share of the previous stage that made it to the next one
   * (`54.8%`). A stage that follows a stage at 0 has none. Default `true`.
   */
  showConversion?: boolean;
  /** Writes a count. Default: grouped digits, `1,240`. */
  formatCount?: (count: number) => string;
  /** The picked stage, when controlled. */
  selectedId?: string;
  /** The picked stage, when uncontrolled. None is picked when omitted. */
  defaultSelectedId?: string;
  /** Called with the id of the stage the user picks. */
  onSelectedChange?: (id: string) => void;
  /** Names the list, or the group of stages when they can be picked. */
  'aria-label'?: string;
  className?: string;
  /** Ref to the root: an `ol`, or a `div` when the stages can be picked. */
  ref?: Ref<HTMLElement>;
};

const DOT: Record<PipelineStageIntent, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

// A fixed locale keeps the default output the same on every machine.
const GROUPED = new Intl.NumberFormat('en-US');
const defaultFormat = (count: number) => GROUPED.format(count);

// The 1px inside the border, drawn on a pseudo-element: the picked stage reads 2px wide without
// moving the layout, and the focus ring (a box-shadow) is left alone.
const SELECTED_EDGE =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-brand-500 before:content-['']";

/**
 * PipelineStages — a deal or hiring pipeline as a row of stages: one card per stage with its
 * count and amount, and between two cards an arrow with the share of the previous stage that
 * made it there. Below `sm` the stages stack, one row each. Without selection props it is an
 * `ol`; with `selectedId`, `defaultSelectedId` or `onSelectedChange` it is a `radiogroup` where
 * one stage stays picked once the user has picked one: a host that needs an "All" choice adds it
 * next to the strip.
 */
export const PipelineStages = ({
  stages,
  showConversion = true,
  formatCount = defaultFormat,
  selectedId: selectedIdProp,
  defaultSelectedId,
  onSelectedChange,
  'aria-label': ariaLabel,
  className,
  ref,
}: PipelineStagesProps) => {
  const selectable =
    selectedIdProp !== undefined ||
    defaultSelectedId !== undefined ||
    onSelectedChange !== undefined;
  const [selectedId, setSelectedId] = useControllableState({
    value: selectedIdProp,
    defaultValue: defaultSelectedId,
    onChange: onSelectedChange,
    name: 'PipelineStages.selectedId',
  });

  if (stages.length === 0) return null;

  const anyChecked = stages.some((stage) => stage.id === selectedId);
  const rootClass = clsx('m-0 flex list-none flex-col p-0 sm:flex-row', className);

  const items = stages.map((stage, index) => {
    const previous = index > 0 ? stages[index - 1] : undefined;
    const rate = previous ? conversionRate(previous.count, stage.count) : null;
    const rateText = showConversion && rate !== null ? formatRate(rate) : null;
    const from = typeof previous?.label === 'string' ? previous.label : 'the previous stage';
    const checked = stage.id === selectedId;

    const content = (
      <>
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          {stage.intent && (
            <span aria-hidden className={clsx('size-2 shrink-0 rounded-full', DOT[stage.intent])} />
          )}
          <span
            title={typeof stage.label === 'string' ? stage.label : undefined}
            className={clsx(
              'min-w-0 truncate',
              checked ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--color-text-secondary)]'
            )}
          >
            <bdi>{stage.label}</bdi>
          </span>
        </span>
        <span className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0">
          <span className="text-base font-semibold text-[var(--color-text-primary)] tabular-nums sm:text-2xl">
            <bdi>{formatCount(stage.count)}</bdi>
          </span>
          {stage.amount !== undefined && (
            <span
              className={clsx(
                'text-sm tabular-nums',
                // Secondary text on the tint of the picked card falls just under 4.5:1 in light.
                checked ? 'text-gray-700 dark:text-gray-300' : 'text-[var(--color-text-secondary)]'
              )}
            >
              <bdi>{stage.amount}</bdi>
            </span>
          )}
        </span>
        {rateText && <span className="sr-only">{`${rateText} from ${from}`}</span>}
      </>
    );

    const cardClass = clsx(
      'relative flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-start sm:flex-1 sm:flex-col sm:items-stretch sm:justify-start sm:gap-1',
      selectable && 'transition-colors',
      selectable && checked
        ? clsx('border-brand-500 bg-brand-50 dark:bg-brand-500/10', SELECTED_EDGE)
        : clsx(
            'border-[var(--color-border)] bg-[var(--color-bg-panel)]',
            selectable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5'
          ),
      selectable && 'focus-visible:focus-indicator'
    );

    // The arrow stays when there is no rate, so the order still reads; the chip goes.
    const connector = previous && (
      <div
        aria-hidden
        className="flex items-center gap-2 py-1.5 ps-5 text-[var(--color-text-muted)] sm:w-16 sm:shrink-0 sm:flex-col sm:justify-center sm:gap-1 sm:py-0 sm:ps-0"
      >
        <ArrowDown className="size-4 sm:hidden" />
        <ArrowRight className="hidden size-[18px] sm:block rtl:-scale-x-100" />
        {rateText && (
          <span className="text-2xs rounded-full bg-gray-100 px-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums dark:bg-gray-800">
            {rateText}
          </span>
        )}
      </div>
    );

    // Every stage after the first brings its connector: a 4rem basis on top of the share the first
    // one gets, so the cards come out equal.
    const wrapperClass = clsx(
      'flex min-w-0 flex-col sm:flex-row',
      index === 0 ? 'sm:flex-1' : 'sm:grow sm:basis-16'
    );

    if (!selectable)
      return (
        <li key={stage.id} className={wrapperClass}>
          {connector}
          <div className={cardClass}>{content}</div>
        </li>
      );

    return (
      <div key={stage.id} className={wrapperClass}>
        {connector}
        <button
          type="button"
          role="radio"
          aria-checked={checked}
          tabIndex={radioTabIndex(checked, index, anyChecked)}
          // Strict: picking the picked stage changes nothing.
          onClick={() => !checked && setSelectedId(stage.id)}
          className={cardClass}
        >
          {content}
        </button>
      </div>
    );
  });

  if (!selectable)
    return (
      <ol ref={ref as Ref<HTMLOListElement>} aria-label={ariaLabel} className={rootClass}>
        {items}
      </ol>
    );

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onRadioGroupKeyDown}
      className={rootClass}
    >
      {items}
    </div>
  );
};
