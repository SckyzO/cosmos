import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperSize = 'sm' | 'md';
export type StepStatus = 'done' | 'active' | 'pending';
/**
 * Visual variant. `indicators` (default, existing): numbered circles with a
 * horizontal connector. `bars` (TUI "Simple"): coloured top bar above each
 * column with a label/description below — no circle indicator. `panels`
 * (TUI "Panels"): row of bordered panels separated by `>` chevrons, each
 * panel hosting a circle indicator + label.
 *
 * `bars` and `panels` are horizontal-only. Default falls back to existing
 * `indicators` rendering for full backward compat.
 */
export type StepperVariant = 'indicators' | 'bars' | 'panels';

// ── Step ─────────────────────────────────────────────────────────────────────

export type StepperStepProps = {
  /** Step label (the headline). */
  children: ReactNode;
  /** Optional secondary text shown under the label. */
  description?: string;
  /** Optional icon shown inside the step indicator. Overridden by a Check when status is `done`. */
  icon?: ComponentType<{ className?: string }>;
  /** Disable user interaction for this step (only meaningful when the parent is `clickable`). */
  disabled?: boolean;

  // Internal — set by the parent <Stepper> via cloneElement.
  /** @internal */
  __index?: number;
  /** @internal */
  __status?: StepStatus;
  /** @internal */
  __orientation?: StepperOrientation;
  /** @internal */
  __size?: StepperSize;
  /** @internal */
  __variant?: StepperVariant;
  /** @internal */
  __clickable?: boolean;
  /** @internal */
  __onClick?: (index: number) => void;
  /** @internal */
  __isLast?: boolean;
};

const INDICATOR_SIZE: Record<StepperSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
};

const STATUS_INDICATOR: Record<StepStatus, string> = {
  done: 'border-brand-500 bg-brand-500 text-white',
  active:
    'border-brand-500 text-brand-600 bg-white ring-4 ring-brand-500/15 dark:bg-gray-900 dark:text-brand-400',
  pending:
    'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500',
};

const STATUS_LABEL: Record<StepStatus, string> = {
  done: 'text-gray-700 dark:text-gray-200',
  active: 'text-gray-900 dark:text-white font-semibold',
  pending: 'text-gray-400 dark:text-gray-500',
};

const StepperStep = ({
  children,
  description,
  icon: Icon,
  disabled,
  __index = 0,
  __status = 'pending',
  __orientation = 'horizontal',
  __size = 'md',
  __variant = 'indicators',
  __clickable = false,
  __onClick,
  __isLast = false,
}: StepperStepProps) => {
  const interactive = __clickable && !disabled;
  const renderAsButton = __clickable;
  const handleClick = () => {
    if (interactive && __onClick) __onClick(__index);
  };

  // ── Variant: bars (TUI "Simple") ─────────────────────────────────────────
  // <li class="md:flex-1">
  //   <a class="group flex flex-col border-l-4 border-brand-500 py-2 pl-4
  //             hover:border-brand-700 md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0">
  //     <span class="text-sm font-medium text-brand-600">Step N</span>
  //     <span class="text-sm font-medium">{label}</span>
  //   </a>
  // </li>
  if (__variant === 'bars') {
    const barColor =
      __status === 'done'
        ? 'border-brand-500'
        : __status === 'active'
          ? 'border-brand-500'
          : 'border-gray-200 dark:border-white/10';
    const stepLabel =
      __status === 'done' || __status === 'active'
        ? 'text-brand-600 dark:text-brand-400'
        : 'text-gray-500 dark:text-gray-400';
    return (
      <li className="md:flex-1">
        <div
          aria-current={__status === 'active' ? 'step' : undefined}
          className={clsx(
            'group flex flex-col border-l-4 py-2 pl-4 md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0',
            barColor,
          )}
        >
          <span className={clsx('text-sm font-medium', stepLabel)}>Step {__index + 1}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{children}</span>
          {description && (
            <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </div>
      </li>
    );
  }

  // ── Variant: panels (TUI "Panels") ───────────────────────────────────────
  // <li class="relative flex md:flex-1">
  //   <span class="flex items-center px-6 py-4 text-sm">
  //     <span class="flex size-10 items-center justify-center rounded-full {indicator}">…</span>
  //     <span class="ml-4 text-sm font-medium">{label}</span>
  //   </span>
  //   <ChevronRight class="absolute top-0 right-0 hidden md:block" />
  // </li>
  if (__variant === 'panels') {
    const dotColor =
      __status === 'done'
        ? 'bg-brand-500 text-white border-transparent'
        : __status === 'active'
          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
          : 'border-gray-300 text-gray-500 dark:border-white/10 dark:text-gray-400';
    const labelColor =
      __status === 'active'
        ? 'text-brand-600 dark:text-brand-400'
        : 'text-gray-900 dark:text-white';
    return (
      <li className="relative md:flex md:flex-1">
        <div
          aria-current={__status === 'active' ? 'step' : undefined}
          className="group flex w-full items-center"
        >
          <span className="flex items-center px-6 py-4 text-sm font-medium">
            <span
              className={clsx(
                'flex size-10 shrink-0 items-center justify-center rounded-full border-2',
                dotColor,
              )}
            >
              {__status === 'done' ? (
                <Check className="size-5" aria-hidden />
              ) : (
                <span>{String(__index + 1).padStart(2, '0')}</span>
              )}
            </span>
            <span className={clsx('ml-4 text-sm font-medium', labelColor)}>{children}</span>
          </span>
        </div>
        {!__isLast && (
          <div className="absolute top-0 right-0 hidden h-full w-5 md:block" aria-hidden>
            <svg
              className="size-full text-gray-200 dark:text-white/10"
              viewBox="0 0 22 80"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 -2L20 40L0 82" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </li>
    );
  }

  const indicator = (
    <span
      className={clsx(
        'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors',
        INDICATOR_SIZE[__size],
        STATUS_INDICATOR[__status],
      )}
    >
      {__status === 'done' ? (
        <Check className={clsx(__size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
      ) : Icon ? (
        <Icon className={clsx(__size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      ) : (
        <span>{__index + 1}</span>
      )}
    </span>
  );

  const labelBlock = (
    <div className={clsx(__orientation === 'horizontal' ? 'mt-2 text-center' : 'flex-1')}>
      <p className={clsx('text-sm', STATUS_LABEL[__status])}>{children}</p>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );

  const content = (
    <>
      {indicator}
      {labelBlock}
    </>
  );

  // Horizontal: indicator + label stacked, connector to the right of indicator.
  if (__orientation === 'horizontal') {
    return (
      <li className="relative flex-1">
        {/* Connector to the next step (drawn from this step's center to the next). */}
        {!__isLast && (
          <span
            aria-hidden
            className={clsx(
              'absolute top-0 left-1/2 h-0.5 w-full',
              __status === 'done' ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
              __size === 'sm' ? 'mt-[14px]' : 'mt-[18px]',
            )}
          />
        )}
        {renderAsButton ? (
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-current={__status === 'active' ? 'step' : undefined}
            className="relative flex w-full flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:rounded-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {content}
          </button>
        ) : (
          <div
            aria-current={__status === 'active' ? 'step' : undefined}
            className="flex flex-col items-center"
          >
            {content}
          </div>
        )}
      </li>
    );
  }

  // Vertical: indicator on the left, label on the right, connector below indicator.
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!__isLast && (
        <span
          aria-hidden
          className={clsx(
            'absolute left-[17px] top-9 h-full w-0.5 -translate-x-1/2',
            __status === 'done' ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
            __size === 'sm' && 'left-[13px] top-7',
          )}
        />
      )}
      {renderAsButton ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-current={__status === 'active' ? 'step' : undefined}
          className="flex w-full items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:rounded-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {content}
        </button>
      ) : (
        <div
          aria-current={__status === 'active' ? 'step' : undefined}
          className="flex w-full items-start gap-3"
        >
          {content}
        </div>
      )}
    </li>
  );
};

// ── Stepper root ─────────────────────────────────────────────────────────────

export type StepperProps = {
  /** Current step (0-indexed). Steps before are `done`, equal is `active`, after are `pending`. */
  current: number;
  orientation?: StepperOrientation;
  size?: StepperSize;
  variant?: StepperVariant;
  /** Make steps clickable for back-navigation. */
  clickable?: boolean;
  onStepClick?: (index: number) => void;
  className?: string;
  children: ReactNode;
};

export const StepperRoot = ({
  current,
  orientation = 'horizontal',
  size = 'md',
  variant = 'indicators',
  clickable = false,
  onStepClick,
  className,
  children,
}: StepperProps) => {
  const steps = Children.toArray(children).filter(isValidElement) as ReactElement<StepperStepProps>[];

  // 'bars' and 'panels' are horizontal-only; force the orientation.
  const effectiveOrientation: StepperOrientation =
    variant === 'indicators' ? orientation : 'horizontal';

  const rootClass =
    variant === 'panels'
      ? 'divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-300 md:flex md:divide-x md:divide-y-0 dark:divide-white/10 dark:border-white/10'
      : variant === 'bars'
        ? 'space-y-4 md:flex md:space-y-0 md:space-x-8'
        : effectiveOrientation === 'horizontal'
          ? 'flex w-full items-start'
          : 'flex flex-col';

  return (
    <ol className={clsx(rootClass, className)} aria-label="Progress">
      {steps.map((step, i) => {
        const status: StepStatus = i < current ? 'done' : i === current ? 'active' : 'pending';
        return cloneElement(step, {
          key: step.key ?? i,
          __index: i,
          __status: status,
          __orientation: effectiveOrientation,
          __size: size,
          __variant: variant,
          __clickable: clickable,
          __onClick: onStepClick,
          __isLast: i === steps.length - 1,
        });
      })}
    </ol>
  );
};

export const Stepper = Object.assign(StepperRoot, { Step: StepperStep });
