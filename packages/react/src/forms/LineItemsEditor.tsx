import { clsx } from 'clsx';
import { CircleAlert, Plus, Receipt, Trash2 } from 'lucide-react';
import {
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Amount } from '../data/Amount';
import { formatMoney } from '../data/money';
import { Totals } from '../data/Totals';
import { EmptyState } from '../feedback/EmptyState';
import { useControllableState } from '../hooks/useControllableState';
import { Button } from '../ui/Button';
import { Combobox, type ComboboxOption } from './Combobox';
import { Input } from './Input';
import {
  currencySymbol,
  focusAfterRemove,
  lineAmount,
  minorUnitDigits,
  subtotalOf,
  summarizeLineItems,
  type LineControl,
  type LineItem,
  type LineItemsSummary,
} from './lineItems';
import { NumberInput } from './NumberInput';

export { summarizeLineItems } from './lineItems';
export type { LineItem, LineItemsSummary } from './lineItems';

/** Error messages of one line, by cell. A cell with a message is marked invalid and describes it. */
export type LineItemErrors = { item?: string; quantity?: string; rate?: string };

/** An entry of the catalogue the item field suggests. */
export type LineItemsCatalogueEntry = {
  /** What the line says once picked, and what the field suggests. Keep the labels unique. */
  label: string;
  /** Unit price, in units of the currency: shown in the list, and copied to the line when picked. */
  rate?: number;
};

/** The words of the editor, for another language. Every one has an English default. */
export type LineItemsLabels = {
  /** Column titles, and the names of the fields ("Quantity, line 2"). */
  item: string;
  quantity: string;
  rate: string;
  amount: string;
  /** Placeholder of the item field. Default: "Select or type an item" with a catalogue, else "Describe the item". */
  itemPlaceholder?: string;
  add: string;
  /** The row of the default totals block. */
  subtotal: string;
  emptyTitle: string;
  emptyDescription: string;
  /** The title of a line in the stacked layout. */
  line: (n: number) => string;
  /** The name of the field of `column` on line `n`. */
  fieldName: (column: string, n: number) => string;
  /** The name of the remove button of line `n`, whose item is `item` (possibly empty). */
  remove: (n: number, item: string) => string;
  /** Announced once line `n` is added, with the number of lines now. */
  added: (n: number, count: number) => string;
  /** Announced once line `n` is removed, with the number of lines left. */
  removed: (n: number, count: number) => string;
  /** Announced when a cell is committed and the subtotal changed. `amount` is written. */
  subtotalAnnouncement: (amount: string) => string;
};

const plural = (count: number) => (count === 1 ? 'line' : 'lines');

const DEFAULT_LABELS: LineItemsLabels = {
  item: 'Item',
  quantity: 'Quantity',
  rate: 'Rate',
  amount: 'Amount',
  add: 'Add line',
  subtotal: 'Subtotal',
  emptyTitle: 'No lines yet',
  emptyDescription: 'Add the first item to start the total.',
  line: (n) => `Line ${n}`,
  fieldName: (column, n) => `${column}, line ${n}`,
  remove: (n, item) => `Remove line ${n}${item ? `: ${item}` : ''}`,
  added: (n, count) => `Line ${n} added. ${count} ${plural(count)}.`,
  removed: (n, count) => `Line ${n} removed. ${count} ${plural(count)} left.`,
  subtotalAnnouncement: (amount) => `Subtotal ${amount}`,
};

export type LineItemsEditorProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange' | 'defaultValue'
> & {
  /** The lines, when controlled. An empty list is `[]`: only `undefined` means uncontrolled. */
  value?: LineItem[];
  /** The lines to start from, when uncontrolled. Default none: the empty state. */
  defaultValue?: LineItem[];
  /**
   * Called with the lines after every edit (a keystroke, a pick, a line added or removed) and
   * what they add up to, for a page that shows the total itself (`footer={false}`).
   */
  onChange?: (lines: LineItem[], summary: LineItemsSummary) => void;
  /** ISO 4217 code (`'EUR'`) of the rates and the amounts. Without it, they are plain numbers. */
  currency?: string;
  /** BCP 47 locale of the figures. Default: the user's. Pass it when the page is in one. */
  locale?: string;
  /**
   * Entries the item field suggests: it becomes a `Combobox` that also takes what the user types,
   * and picking an entry copies its `rate` to the line. Without a catalogue, a plain text field.
   */
  catalogue?: LineItemsCatalogueEntry[];
  /** Bounds of the quantity: `min` (default 1) and `step` (default 1). `{ min: 0.5, step: 0.5 }` for hours. */
  quantity?: { min?: number; step?: number };
  /** Messages of the cells, by line `id`. */
  errors?: Record<string, LineItemErrors>;
  /** A message about the editor as a whole ("Add at least one line"), under the lines. */
  error?: string;
  /**
   * Rows added to the totals block under the lines, after the subtotal: `Totals.Row` and
   * `Totals.Total` for tax, a discount, the total due. They take the editor's currency and
   * locale. `false` draws no block, for a page that shows the summary elsewhere and reads it from
   * `onChange`. The block is hidden while there is no line.
   */
  footer?: false | ((summary: LineItemsSummary) => ReactNode);
  /** Shows the lines as text, with no field, no "Add line" and no remove button. */
  readOnly?: boolean;
  labels?: Partial<LineItemsLabels>;
};

// The grid of a row from `@2xl` (42rem of the editor's own width): item, quantity, rate, amount
// and, when it can be edited, the remove button. Below it the row is a card.
const GRID_EDIT = '@2xl:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_7rem_2.25rem]';
const GRID_READ = '@2xl:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_7rem]';

// Where each part of a row sits in the card (mobile first), and that it goes back to the next
// free cell of the grid from `@2xl`.
const AT_LINE = 'col-start-1 row-start-1 @2xl:hidden';
const AT_ITEM = 'col-span-2 row-start-2 @2xl:col-auto @2xl:row-auto';
const AT_QUANTITY = 'col-start-1 row-start-3 @2xl:col-auto @2xl:row-auto';
const AT_RATE = 'col-start-2 row-start-3 @2xl:col-auto @2xl:row-auto';
const AT_AMOUNT = 'col-span-2 row-start-4 @2xl:col-auto @2xl:row-auto';
const AT_REMOVE =
  'col-start-2 row-start-1 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:justify-self-auto';

const MUTED = 'text-[var(--color-text-muted)]';
const ERROR_TEXT = 'text-red-700 dark:text-red-400';

/**
 * The title of a cell in the stacked layout, where the column titles are gone: above a field, or
 * beside a figure with `inline`.
 */
const CellTitle = ({ children, inline = false }: { children: ReactNode; inline?: boolean }) => (
  <span
    aria-hidden
    className={clsx(
      'text-xs font-medium text-[var(--color-text-secondary)] @2xl:hidden',
      inline ? 'shrink-0' : 'mb-1.5 block'
    )}
  >
    {children}
  </span>
);

const ColumnTitle = ({ children, end }: { children: ReactNode; end?: boolean }) => (
  <span className={clsx('truncate', end && 'text-end')}>{children}</span>
);

/**
 * LineItemsEditor — the lines of an invoice or an order: an item (free text, or picked from a
 * catalogue), a quantity, a rate, and the amount worked out from them, with lines added and
 * removed, and the subtotal under them. From 42rem of its own width the lines are a grid with
 * the amounts aligned in a column; below, each line is a stacked card.
 *
 * Each amount is rounded to the minor unit of the currency, then the amounts shown are added up,
 * so the subtotal is always what the rows say. Enter in a field does not add a line (it submits
 * the form around, or picks the option of the list): "Add line" is one Tab after the last field.
 * A removed line hands the focus to the remove button of the line that took its place, the one
 * of the new last line when it was the last, or "Add line" when none is left. A polite status
 * announces a line added or removed, and the subtotal once a cell is committed (focus leaves it,
 * or Enter), never on each keystroke.
 */
export const LineItemsEditor = ({
  value: valueProp,
  defaultValue,
  onChange,
  currency,
  locale,
  catalogue,
  quantity,
  errors,
  error,
  footer,
  readOnly = false,
  labels: labelsProp,
  className,
  ref,
  ...rest
}: LineItemsEditorProps) => {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const digits = useMemo(() => minorUnitDigits(currency, locale), [currency, locale]);
  const symbol = useMemo(() => currencySymbol(currency, locale), [currency, locale]);
  const quantityFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const write = (amount: number) => formatMoney(amount, { currency, locale });

  const [lines, setLines] = useControllableState<LineItem[]>({
    value: valueProp,
    defaultValue: () => defaultValue ?? [],
    onChange: (next) => onChange?.(next, summarizeLineItems(next, { currency, locale })),
    name: 'LineItemsEditor.value',
  });
  const subtotal = subtotalOf(lines, digits);
  const { min: quantityMin = 1, step: quantityStep = 1 } = quantity ?? {};

  const options = useMemo<ComboboxOption[] | undefined>(
    () =>
      catalogue?.map((entry) => ({
        value: entry.label,
        label: entry.label,
        secondary:
          entry.rate === undefined ? undefined : formatMoney(entry.rate, { currency, locale }),
      })),
    [catalogue, currency, locale]
  );
  const rateOf = (label: string) => catalogue?.find((entry) => entry.label === label)?.rate;

  // ── Focus and announcements ────────────────────────────────────────────────

  const [message, setMessage] = useState('');
  const rows = useRef(new Map<string, HTMLElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  // Where the focus goes once the render that adds or removes a line has drawn it.
  const focusRequest = useRef<{ line: string; control: LineControl } | 'add' | null>(null);
  const serial = useRef(0);
  // The subtotal as last announced (or as it was when the editor mounted).
  const announced = useRef(subtotal);
  // What `commit` reads once React has applied the edit that caused it.
  const latest = useRef({ subtotal, labels, write });
  useInsertionEffect(() => {
    latest.current = { subtotal, labels, write };
  });

  useEffect(() => {
    const request = focusRequest.current;
    if (!request) return;
    focusRequest.current = null;
    const target =
      request === 'add'
        ? addButton.current
        : rows.current
            .get(request.line)
            ?.querySelector<HTMLElement>(
              request.control === 'remove' ? '[data-line-remove]' : 'input'
            );
    target?.focus();
  });

  // A cell is committed when focus leaves it or on Enter: say the subtotal if it moved. Read
  // after the edit that came with the event (a number clamped on blur, an option picked on Enter).
  const commit = () =>
    queueMicrotask(() => {
      const now = latest.current;
      if (now.subtotal === announced.current) return;
      announced.current = now.subtotal;
      setMessage(now.labels.subtotalAnnouncement(now.write(now.subtotal)));
    });

  // ── Edits ──────────────────────────────────────────────────────────────────

  const patch = (id: string, changes: Partial<Omit<LineItem, 'id'>>) =>
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...changes } : line)));

  const add = () => {
    let id = `${baseId}-${serial.current++}`;
    while (lines.some((line) => line.id === id)) id = `${baseId}-${serial.current++}`;
    setLines([...lines, { id, item: '', quantity: Math.max(1, quantityMin), rate: 0 }]);
    focusRequest.current = { line: id, control: 'item' };
    setMessage(labels.added(lines.length + 1, lines.length + 1));
  };

  const remove = (index: number) => {
    const next = lines.filter((_, i) => i !== index);
    setLines(next);
    const target = focusAfterRemove(index, lines.length);
    focusRequest.current =
      target === 'add' ? 'add' : { line: next[target.line].id, control: target.control };
    // Removing moves the subtotal: say it here, not as a second message when the button goes.
    announced.current = subtotalOf(next, digits);
    setMessage(
      `${labels.removed(index + 1, next.length)} ${labels.subtotalAnnouncement(write(announced.current))}`
    );
  };

  // ── Pieces ─────────────────────────────────────────────────────────────────

  const addLine = (
    <Button
      ref={addButton}
      variant="secondary"
      icon={Plus}
      onClick={add}
      aria-describedby={error ? errorId : undefined}
      className="@max-2xl:w-full"
    >
      {labels.add}
    </Button>
  );

  const header = (
    <div
      aria-hidden
      className={clsx(
        'hidden gap-x-3 pb-2 text-xs font-medium text-[var(--color-text-secondary)] @2xl:grid',
        readOnly ? GRID_READ : GRID_EDIT
      )}
    >
      <ColumnTitle>{labels.item}</ColumnTitle>
      <ColumnTitle>{labels.quantity}</ColumnTitle>
      <ColumnTitle>{labels.rate}</ColumnTitle>
      <ColumnTitle end>{labels.amount}</ColumnTitle>
      {!readOnly && <span />}
    </div>
  );

  const rowClass = clsx(
    'grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg border border-gray-200 p-3 dark:border-white/10',
    '@2xl:items-start @2xl:gap-y-0 @2xl:rounded-none @2xl:border-0 @2xl:p-0',
    readOnly ? GRID_READ : GRID_EDIT
  );

  const renderLine = (line: LineItem, index: number) => {
    const n = index + 1;
    const cellErrors = errors?.[line.id] ?? {};
    const name = (column: string) => labels.fieldName(column, n);
    const amount = lineAmount(line.quantity, line.rate, digits);
    const quantityErrorId = `${baseId}-${index}-quantity-error`;
    const rateErrorId = `${baseId}-${index}-rate-error`;
    const itemPlaceholder =
      labels.itemPlaceholder ?? (options ? 'Select or type an item' : 'Describe the item');

    return (
      <li
        key={line.id}
        ref={(element) => {
          if (element) rows.current.set(line.id, element);
          return () => {
            rows.current.delete(line.id);
          };
        }}
        className={rowClass}
      >
        <span className={clsx('self-center text-xs font-medium', MUTED, AT_LINE)}>
          {labels.line(n)}
        </span>

        {readOnly ? (
          <>
            <div className={clsx('min-w-0 text-sm text-[var(--color-text-primary)]', AT_ITEM)}>
              <span className="sr-only">{labels.item}: </span>
              <span className="break-words">{line.item}</span>
            </div>
            <div className={clsx('flex justify-between gap-2 text-sm', AT_QUANTITY)}>
              <CellTitle inline>{labels.quantity}</CellTitle>
              <span className="sr-only">{labels.quantity}: </span>
              <bdi className="tabular-nums">{quantityFormat.format(line.quantity)}</bdi>
            </div>
            <div className={clsx('flex justify-between gap-2 text-sm', AT_RATE)}>
              <CellTitle inline>{labels.rate}</CellTitle>
              <span className="sr-only">{labels.rate}: </span>
              <Amount value={line.rate} currency={currency} locale={locale} />
            </div>
            <div
              className={clsx(
                'flex items-baseline justify-between gap-2 text-sm font-medium text-[var(--color-text-primary)] @2xl:justify-end',
                AT_AMOUNT
              )}
            >
              <CellTitle inline>{labels.amount}</CellTitle>
              <span className="sr-only">{labels.amount}: </span>
              <Amount value={amount} currency={currency} locale={locale} />
            </div>
          </>
        ) : (
          <>
            <div className={clsx('min-w-0', AT_ITEM)}>
              <CellTitle>{labels.item}</CellTitle>
              {options ? (
                <Combobox
                  aria-label={name(labels.item)}
                  allowCustomValue
                  options={options}
                  value={line.item}
                  onChange={(item) => patch(line.id, { item })}
                  onSelect={(option) => {
                    const rate = rateOf(option.label);
                    patch(line.id, { item: option.label, ...(rate === undefined ? {} : { rate }) });
                  }}
                  placeholder={itemPlaceholder}
                  error={cellErrors.item}
                />
              ) : (
                <Input
                  aria-label={name(labels.item)}
                  value={line.item}
                  onChange={(event) => patch(line.id, { item: event.target.value })}
                  placeholder={itemPlaceholder}
                  error={cellErrors.item}
                  autoComplete="off"
                />
              )}
            </div>

            <div className={clsx('min-w-0', AT_QUANTITY)}>
              <CellTitle>{labels.quantity}</CellTitle>
              <NumberInput
                aria-label={name(labels.quantity)}
                aria-describedby={cellErrors.quantity ? quantityErrorId : undefined}
                controls="stacked"
                fullWidth
                value={line.quantity}
                onChange={(quantityValue) => patch(line.id, { quantity: quantityValue })}
                min={quantityMin}
                step={quantityStep}
                error={!!cellErrors.quantity}
              />
              {cellErrors.quantity && (
                <p id={quantityErrorId} className={clsx('mt-1 text-xs', ERROR_TEXT)}>
                  {cellErrors.quantity}
                </p>
              )}
            </div>

            <div className={clsx('min-w-0', AT_RATE)}>
              <CellTitle>{labels.rate}</CellTitle>
              <NumberInput
                aria-label={name(labels.rate)}
                aria-describedby={cellErrors.rate ? rateErrorId : undefined}
                controls="none"
                fullWidth
                value={line.rate}
                onChange={(rate) => patch(line.id, { rate })}
                min={0}
                step={10 ** -digits}
                prefix={symbol}
                error={!!cellErrors.rate}
              />
              {cellErrors.rate && (
                <p id={rateErrorId} className={clsx('mt-1 text-xs', ERROR_TEXT)}>
                  {cellErrors.rate}
                </p>
              )}
            </div>

            <div
              className={clsx(
                'flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-sm font-medium text-[var(--color-text-primary)] dark:border-white/10',
                '@2xl:h-ctrl-36 @2xl:justify-end @2xl:border-t-0 @2xl:pt-0',
                AT_AMOUNT
              )}
            >
              <CellTitle inline>{labels.amount}</CellTitle>
              <span className="sr-only">{name(labels.amount)}: </span>
              <Amount value={amount} currency={currency} locale={locale} />
            </div>

            <div className={clsx('flex', AT_REMOVE)}>
              <Button
                variant="ghost"
                shape="square"
                icon={Trash2}
                aria-label={labels.remove(n, line.item)}
                data-line-remove
                onClick={() => remove(index)}
              />
            </div>
          </>
        )}
      </li>
    );
  };

  const summary: LineItemsSummary = { subtotal };

  return (
    <div
      ref={ref}
      role="group"
      aria-describedby={error ? errorId : undefined}
      className={clsx('@container w-full', className)}
      {...rest}
    >
      <div role="status" className="sr-only">
        {message}
      </div>

      {lines.length === 0 ? (
        <EmptyState
          compact
          icon={Receipt}
          title={labels.emptyTitle}
          description={readOnly ? undefined : labels.emptyDescription}
          action={readOnly ? undefined : addLine}
          className="rounded-lg border border-dashed border-gray-300 dark:border-white/15"
        />
      ) : (
        <>
          {header}
          <ul
            role="list"
            className="space-y-3"
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
            }}
          >
            {lines.map(renderLine)}
          </ul>
          {!readOnly && <div className="mt-3">{addLine}</div>}
        </>
      )}

      {error && (
        <p id={errorId} className={clsx('mt-3 flex items-start gap-1.5 text-sm', ERROR_TEXT)}>
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {footer !== false && lines.length > 0 && (
        <Totals
          currency={currency}
          locale={locale}
          className={clsx('ms-auto mt-4 @2xl:max-w-sm', !readOnly && '@2xl:pe-12')}
        >
          <Totals.Row label={labels.subtotal} value={subtotal} />
          {footer?.(summary)}
        </Totals>
      )}
    </div>
  );
};
