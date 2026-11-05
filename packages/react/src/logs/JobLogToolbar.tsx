import { clsx } from 'clsx';
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Download,
  Ellipsis,
  Search,
  WrapText,
  type LucideIcon,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Menu } from '../ui/Menu';
import { FRAME } from './job-log-styles';
import { type JobLogLabels } from './labels';
import { useJobLogLabels } from './useLogLabels';
import type { JobLogControl } from './job-log';
import type { LogTone } from './LogLevelBadge';

export type JobLogToolbarProps = {
  tone: LogTone;
  /** The controls to draw. */
  controls: ReadonlySet<JobLogControl>;
  search: string;
  onSearchChange: (search: string) => void;
  /** How many lines match the search. */
  matchCount: number;
  /** The active match, counted from 0 (`-1` when there is none). */
  activeMatch: number;
  /** Go to the next (`1`) or the previous (`-1`) match, wrapping around the ends. */
  onStep: (direction: 1 | -1) => void;
  timestamps: boolean;
  onTimestampsChange: (timestamps: boolean) => void;
  wrap: boolean;
  onWrapChange: (wrap: boolean) => void;
  /** Every step is open: the button collapses them, otherwise it expands them. */
  allExpanded: boolean;
  onToggleAll: () => void;
  onDownload: () => void;
  /** The texts it writes, over `LabelsProvider`'s `jobLog` and the English defaults. */
  labels?: Partial<JobLogLabels>;
};

const ICON_BUTTON =
  'focus-visible:focus-indicator inline-flex size-ctrl-32 shrink-0 items-center justify-center rounded-lg';

/** An icon button, with its name as `aria-label` and tooltip. `pressed` makes it a toggle. */
const IconButton = ({
  tone,
  icon: Icon,
  label,
  pressed,
  onClick,
  rtlFlip = false,
}: {
  tone: LogTone;
  icon: LucideIcon;
  label: string;
  pressed?: boolean;
  onClick: () => void;
  /** The icon points along the line: turn it around in right to left. */
  rtlFlip?: boolean;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    title={label}
    onClick={() => onClick()}
    className={clsx(ICON_BUTTON, pressed ? FRAME[tone].iconButtonOn : FRAME[tone].iconButton)}
  >
    <Icon aria-hidden className={clsx('size-4', rtlFlip && 'rtl:-scale-x-100')} />
  </button>
);

/**
 * The bar of `JobLog`: the search with its match count and previous / next, then the timestamps
 * and wrap toggles, expand or collapse all, and download. Below `md` of the log's own width the
 * search stays and the rest moves into a "More options" menu.
 */
export const JobLogToolbar = ({
  tone,
  controls,
  search,
  onSearchChange,
  matchCount,
  activeMatch,
  onStep,
  timestamps,
  onTimestampsChange,
  wrap,
  onWrapChange,
  allExpanded,
  onToggleAll,
  onDownload,
  labels: ownLabels,
}: JobLogToolbarProps) => {
  const labels = useJobLogLabels(ownLabels);
  const look = FRAME[tone];
  const toggleLabel = allExpanded ? labels.collapseAll : labels.expandAll;
  const ToggleIcon = allExpanded ? ChevronsDownUp : ChevronsUpDown;
  const hasMore =
    controls.has('timestamps') ||
    controls.has('wrap') ||
    controls.has('expand') ||
    controls.has('download');

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onStep(event.shiftKey ? -1 : 1);
  };
  const matchText =
    search === '' ? null : matchCount === 0 ? labels.noMatches : `${activeMatch + 1}/${matchCount}`;

  return (
    <div
      role="group"
      aria-label={labels.controls}
      className={clsx('py-row-6 flex items-center gap-1 border-b px-3', look.border)}
    >
      {controls.has('search') && (
        <div
          className={clsx(
            'h-ctrl-32 focus-within:field-focus flex min-w-0 flex-1 items-center gap-2 rounded-lg border ps-2.5 pe-1 @md:max-w-xs',
            look.field
          )}
        >
          <Search aria-hidden className="size-4 shrink-0" />
          <input
            type="text"
            aria-label={labels.search}
            placeholder={labels.search}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onKeyDown}
            className={clsx(
              'min-w-0 flex-1 border-0 bg-transparent text-sm outline-hidden',
              look.input
            )}
          />
          {matchText !== null && (
            <span
              aria-live="polite"
              className="text-xs whitespace-nowrap tabular-nums [unicode-bidi:isolate]"
            >
              {matchText}
            </span>
          )}
          {search !== '' && (
            <>
              <button
                type="button"
                aria-label={labels.previousMatch}
                disabled={matchCount === 0}
                onClick={() => onStep(-1)}
                className={clsx(
                  'focus-visible:focus-indicator size-ctrl-28 inline-flex shrink-0 items-center justify-center rounded-md disabled:opacity-50',
                  look.iconButton
                )}
              >
                <ChevronUp aria-hidden className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={labels.nextMatch}
                disabled={matchCount === 0}
                onClick={() => onStep(1)}
                className={clsx(
                  'focus-visible:focus-indicator size-ctrl-28 inline-flex shrink-0 items-center justify-center rounded-md disabled:opacity-50',
                  look.iconButton
                )}
              >
                <ChevronDown aria-hidden className="size-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      <span className="flex-1 @max-md:hidden" aria-hidden />
      {hasMore && (
        <>
          <div className="flex items-center gap-1 @max-md:hidden">
            {controls.has('timestamps') && (
              <IconButton
                tone={tone}
                icon={Clock}
                label={labels.timestamps}
                pressed={timestamps}
                onClick={() => onTimestampsChange(!timestamps)}
              />
            )}
            {controls.has('wrap') && (
              <IconButton
                tone={tone}
                icon={WrapText}
                label={labels.wrapLines}
                pressed={wrap}
                onClick={() => onWrapChange(!wrap)}
                rtlFlip
              />
            )}
            {controls.has('expand') && (
              <IconButton tone={tone} icon={ToggleIcon} label={toggleLabel} onClick={onToggleAll} />
            )}
            {controls.has('download') && (
              <IconButton
                tone={tone}
                icon={Download}
                label={labels.download}
                onClick={onDownload}
              />
            )}
          </div>
          <div className="ms-auto @md:hidden">
            <Menu align="end">
              <Menu.Trigger
                aria-label={labels.moreOptions}
                className={clsx(ICON_BUTTON, look.iconButton)}
              >
                <Ellipsis aria-hidden className="size-4" />
              </Menu.Trigger>
              <Menu.Content aria-label={labels.logOptions} width="w-56">
                {controls.has('timestamps') && (
                  <Menu.CheckboxItem checked={timestamps} onCheckedChange={onTimestampsChange}>
                    {labels.timestamps}
                  </Menu.CheckboxItem>
                )}
                {controls.has('wrap') && (
                  <Menu.CheckboxItem checked={wrap} onCheckedChange={onWrapChange}>
                    {labels.wrapLines}
                  </Menu.CheckboxItem>
                )}
                {controls.has('expand') && (
                  <Menu.Item icon={ToggleIcon} onSelect={onToggleAll}>
                    {toggleLabel}
                  </Menu.Item>
                )}
                {controls.has('download') && (
                  <Menu.Item icon={Download} onSelect={onDownload}>
                    {labels.download}
                  </Menu.Item>
                )}
              </Menu.Content>
            </Menu>
          </div>
        </>
      )}
    </div>
  );
};
