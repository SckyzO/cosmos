import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DataTable } from '../table/DataTable';
import type { ColumnDef } from '../table/types';
import { LogEntryDetail } from './LogEntryDetail';
import { LOG_LEVEL_LABEL, LogLevelBadge } from './LogLevelBadge';
import { parseLogLevel } from './log-lines';
import { fakeLines } from './storybook-logs';
import type { LogLine } from './types';

/**
 * Structured logs read as a table: no component of their own, a `DataTable` with a
 * `LogLevelBadge` column and expandable rows that show a `LogEntryDetail`. Sort by time, filter by
 * level or source, search the messages.
 */
const meta = {
  title: 'Monitoring/Structured Logs',
  component: DataTable,
  parameters: { layout: 'padded' },
  args: { rows: [], columns: [], rowKey: () => '' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const LINES = fakeLines(60);
const ERROR_LINE = LINES.slice(0, 10).find((l) => parseLogLevel(l.level) === 'error' && l.fields)!;

const TIME = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
  timeZone: 'UTC',
});
const ms = (line: LogLine) => new Date(line.time).getTime();
const keyOf = (line: LogLine) => `line ${line.id}`;

const columns: ColumnDef<LogLine>[] = [
  {
    key: 'time',
    label: 'Time',
    width: '140px',
    sortable: true,
    sortValue: ms,
    render: (line) => (
      <span className="font-mono text-xs text-[var(--color-text-secondary)] tabular-nums">
        {TIME.format(ms(line))}
      </span>
    ),
  },
  {
    key: 'level',
    label: 'Level',
    width: '110px',
    filterable: true,
    filterValue: (line) => LOG_LEVEL_LABEL[parseLogLevel(line.level)],
    render: (line) => <LogLevelBadge level={line.level} />,
  },
  {
    key: 'source',
    label: 'Source',
    width: '140px',
    filterable: true,
    filterValue: (line) => line.source ?? '',
    render: (line) => <span className="font-mono text-xs">{line.source}</span>,
  },
  {
    key: 'message',
    label: 'Message',
    // Takes what the other columns leave, and never less than a readable line: on a phone the
    // table scrolls to it.
    minWidth: '20rem',
    searchValue: (line) => line.message,
    render: (line) => <span className="font-mono text-xs break-words">{line.message}</span>,
  },
];

const LogTable = () => (
  <DataTable
    aria-label="Logs"
    rows={LINES}
    columns={columns}
    rowKey={keyOf}
    pageSize={10}
    defaultSearchValue=""
    searchPlaceholder="Search messages…"
    renderExpandedRow={(line) => <LogEntryDetail line={line} timeZone="UTC" />}
    defaultExpandedRows={new Set([keyOf(ERROR_LINE)])}
  />
);

/** An error opened on its fields, stack trace and raw record. */
export const Default: Story = { render: () => <LogTable /> };

export const ARowOpensOnItsDetail: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Logs' });
    await expect(within(table).getByRole('heading', { name: 'Fields' })).toBeVisible();
    const toggle = within(table).getByRole('button', {
      name: new RegExp(`details for ${keyOf(ERROR_LINE)}$`),
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(within(table).queryByRole('heading', { name: 'Fields' })).toBeNull();
  },
};
