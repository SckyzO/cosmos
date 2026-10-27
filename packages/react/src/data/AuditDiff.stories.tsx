import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ActivityFeed } from '../lists/ActivityFeed';
import {
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { Pencil } from 'lucide-react';
import { AuditDiff, type AuditChange } from './AuditDiff';
import { Timeline } from './Timeline';
import { InEachDensity, expectDensitySteps } from '../storybook-density';

const meta = {
  title: 'Data/Audit Diff',
  component: AuditDiff,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { changes: [] },
} satisfies Meta<typeof AuditDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

const userChanges: AuditChange[] = [
  { field: 'role', label: 'Role', before: 'Viewer', after: 'Admin' },
  { field: 'email', label: 'Email', before: 'bob@old.example', after: 'bob@example.com' },
  { field: 'phone', label: 'Phone', after: '+33 1 23 45 67 89' },
  { field: 'department', label: 'Department', before: 'Support' },
  { field: 'mfa', label: 'Two-factor', before: false, after: true },
  { field: 'seats', label: 'Seats', before: 5, after: 12 },
];

/** A changed, an added and a removed field. The side that has no value shows "—". */
export const Table: Story = {
  args: { changes: userChanges, 'aria-label': 'Changes to Bob' },
};

/** One line per field, for the entry of a feed or a timeline. */
export const Inline: Story = {
  args: { changes: userChanges, variant: 'inline', 'aria-label': 'Changes to Bob' },
};

const BEFORE_TEXT =
  'Our team reviews every request within two business days. Urgent incidents are handled by the on-call engineer at any hour, and enterprise customers also get a named contact.';
const AFTER_TEXT =
  'Our team reviews every request within one business day. Urgent incidents are handled by the on-call engineer at any hour, and all customers also get a shared Slack channel.';

/**
 * A long text shows what moved: the removed words in the Before cell, the added ones in the After
 * cell, each wrapped in `<del>` / `<ins>` with a hidden "removed:" / "added:".
 */
export const LongText: Story = {
  args: {
    changes: [
      { field: 'sla', label: 'Support policy', before: BEFORE_TEXT, after: AFTER_TEXT },
      { field: 'title', label: 'Title', before: 'Support', after: 'Customer support' },
    ],
  },
};

/** Objects and arrays are compact JSON on each side; there is no nested diff. */
export const JsonValues: Story = {
  args: {
    changes: [
      {
        field: 'limits',
        label: 'Limits',
        before: { requests: 100, burst: 10 },
        after: { requests: 500, burst: 10, window: '1m' },
      },
      { field: 'scopes', label: 'Scopes', before: ['read'], after: ['read', 'write'] },
      { field: 'tags', label: 'Tags', after: [] },
    ],
  },
};

/** `formatValue` draws the values itself, here a status as a coloured word and a size in MB. */
export const CustomFormat: Story = {
  args: {
    changes: [
      { field: 'quota', label: 'Quota', before: 512, after: 2048 },
      { field: 'name', label: 'Name', before: 'bob', after: 'bobby' },
    ],
    formatValue: (value, change) =>
      change.field === 'quota' ? `${value as number} MB` : <strong>{String(value)}</strong>,
  },
};

/** `labels` rewords every text the component writes. */
export const Translated: Story = {
  args: {
    changes: userChanges.slice(0, 3),
    labels: { field: 'Champ', before: 'Avant', after: 'Après', empty: 'vide' },
  },
};

/** Below `sm` each change stacks: the field, then Before and After under it, labelled. */
export const Mobile: Story = {
  args: { changes: userChanges.concat(LongText.args!.changes!.slice(0, 1)) },
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
    const table = canvasElement.querySelector('table') as HTMLElement;
    const first = table.querySelector('tbody tr') as HTMLElement;
    expect(getComputedStyle(first).display).toBe('block');
    // Every cell shows its own Before / After label once the header row is gone.
    const labels = Array.from(first.querySelectorAll('td > span[aria-hidden]')).map(
      (el) => getComputedStyle(el as HTMLElement).display
    );
    expect(labels).toEqual(['block', 'block']);
  },
};

export const InlineMobile: Story = {
  args: {
    changes: [
      {
        field: 'url',
        label: 'Webhook URL',
        before: 'https://a.example/hooks/very/long/path/to/hook/endpoint/one',
        after: 'https://b.example/hooks/very/long/path/to/hook/endpoint/two',
      },
    ],
    variant: 'inline',
  },
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => expectNoHorizontalOverflow(canvasElement),
};

/** Markup in a value or a label is text, never HTML. */
export const HostileValues: Story = {
  args: {
    changes: [
      {
        field: '<img src=x onerror=alert(1)>',
        before: '<img src=x onerror=alert(1)>',
        after: '<script>alert(1)</script>',
      },
      {
        field: 'note',
        label: '<b>bold label</b>',
        before: { html: '<img src=x onerror=alert(1)>' },
        after: 'one two three <img src=x onerror=alert(2)> four five',
      },
    ],
  },
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('img, script, b')).toBeNull();
    expect(canvasElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(canvasElement.textContent).toContain('<b>bold label</b>');
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** The history of a record: `Timeline` entries, each with its changes inline. */
export const HistoryOfARecord: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="max-w-xl">
      <Timeline
        variant="dot"
        items={[
          {
            id: '1',
            title: 'Alice updated user Bob',
            time: '5m ago',
            icon: Pencil,
            description: (
              <AuditDiff
                variant="inline"
                changes={[
                  { field: 'role', label: 'Role', before: 'Viewer', after: 'Admin' },
                  { field: 'mfa', label: 'Two-factor', before: false, after: true },
                ]}
              />
            ),
          },
          {
            id: '2',
            title: 'Carol updated user Bob',
            time: '2d ago',
            icon: Pencil,
            description: (
              <AuditDiff
                variant="inline"
                changes={[{ field: 'phone', label: 'Phone', after: '+33 1 23 45 67 89' }]}
              />
            ),
          },
        ]}
      />
    </div>
  ),
  globals: mobileViewport,
  play: async ({ canvasElement }) => expectNoHorizontalOverflow(canvasElement),
};

/** The same inline lines in an `ActivityFeed`. */
export const InActivityFeed: Story = {
  render: () => (
    <div className="max-w-xl">
      <ActivityFeed>
        <ActivityFeed.Item icon={Pencil} timestamp="5m ago">
          Alice updated the billing contact
          <div className="mt-1">
            <AuditDiff
              variant="inline"
              changes={[
                {
                  field: 'email',
                  label: 'Email',
                  before: 'ap@old.example',
                  after: 'ap@example.com',
                },
              ]}
            />
          </div>
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** A real table: header cells name the columns and the rows. */
export const TableSemantics: Story = {
  tags: ['!dev', '!autodocs'],
  args: { changes: userChanges, 'aria-label': 'Changes to Bob' },
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Changes to Bob' });
    const headers = canvas.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['Field', 'Before', 'After']);
    expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(userChanges.length);
    expect(canvas.getAllByRole('rowheader')[0].textContent).toBe('Role');
  },
};

/** An absent side reads "empty", not a dash; the dash is decorative. */
export const AbsentValuesReadEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    changes: [
      { field: 'phone', label: 'Phone', after: '+33 1' },
      { field: 'dept', label: 'Dept', before: 'Support', after: null },
      { field: 'fax', label: 'Fax', before: '', after: undefined },
    ],
    labels: { empty: 'none' },
  },
  play: async ({ canvasElement }) => {
    const dashes = canvasElement.querySelectorAll('span[aria-hidden="true"]:not(.text-2xs)');
    expect(dashes.length).toBe(4);
    dashes.forEach((dash) => {
      expect(dash.textContent).toBe('—');
      expect(dash.nextElementSibling?.textContent).toBe('none');
      expect(dash.nextElementSibling?.classList.contains('sr-only')).toBe(true);
    });
  },
};

/** The inline line reads "Role, before Viewer, after Admin"; the colon and arrow are hidden. */
export const InlineScreenReaderText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    variant: 'inline',
    changes: [{ field: 'role', label: 'Role', before: 'Viewer', after: 'Admin' }],
  },
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('[role="listitem"]') as HTMLElement;
    const decorative = Array.from(li.querySelectorAll('[aria-hidden="true"]')).map(
      (el) => el.textContent
    );
    expect(decorative).toEqual([': ', ' → ']);
    const read = Array.from(li.querySelectorAll('.sr-only')).map((el) => el.textContent);
    expect(read).toEqual([', Before ', ', After ']);
    const hidden = li.querySelector('.sr-only') as HTMLElement;
    expect(getComputedStyle(hidden).position).toBe('absolute');
    expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

/** The word diff: removed words in the Before cell as `del`, added ones in After as `ins`. */
export const WordDiffMarks: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    changes: [{ field: 'sla', label: 'Policy', before: BEFORE_TEXT, after: AFTER_TEXT }],
  },
  play: async ({ canvasElement }) => {
    const [before, after] = Array.from(canvasElement.querySelectorAll('tbody td'));
    const removed = Array.from(before.querySelectorAll('del')).map((el) => el.textContent);
    const added = Array.from(after.querySelectorAll('ins')).map((el) => el.textContent);
    expect(removed.length).toBeGreaterThan(0);
    expect(removed.join('')).toContain('two');
    expect(removed.join('')).toContain('enterprise');
    expect(added.join('')).toContain('one');
    expect(added.join('')).toContain('Slack');
    // Each mark says what it is, as text.
    removed.forEach((text) => expect(text).toMatch(/^removed: /));
    added.forEach((text) => expect(text).toMatch(/^added: /));
    // Only the matching side carries marks, and the unchanged words are plain text.
    expect(before.querySelector('ins')).toBeNull();
    expect(after.querySelector('del')).toBeNull();
    expect(before.textContent).toContain('Urgent incidents are handled');
    // The cell text, minus the hidden words, is the original text.
    const plain = (cell: Element) =>
      (cell.lastElementChild?.textContent ?? '').replace(/(removed|added): /g, '');
    expect(plain(before)).toBe(BEFORE_TEXT);
    expect(plain(after)).toBe(AFTER_TEXT);
    // Not by colour alone: the removed words are also struck through.
    expect(getComputedStyle(before.querySelector('del') as Element).textDecorationLine).toBe(
      'line-through'
    );
    expect(getComputedStyle(after.querySelector('ins') as Element).textDecorationLine).toBe('none');
  },
};

/** A short value is not diffed: before and after, whole. */
export const ShortValuesAreNotDiffed: Story = {
  tags: ['!dev', '!autodocs'],
  args: { changes: [{ field: 'title', before: 'Support', after: 'Customer support' }] },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('del, ins')).toBeNull();
  },
};

/** Past the size limit the cell falls back to the whole values, still marked. */
export const HugeTextFallsBack: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    changes: [
      {
        field: 'body',
        before: Array.from({ length: 700 }, (_, i) => `old${i}`).join(' '),
        after: Array.from({ length: 700 }, (_, i) => `new${i}`).join(' '),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll('tbody td del')).toHaveLength(1);
    expect(canvasElement.querySelectorAll('tbody td ins')).toHaveLength(1);
  },
};

/** Markup in a value, a label or a field is text, in both variants. */
export const HostileValuesRenderAsText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const changes: AuditChange[] = [
      {
        field: '<img src=x onerror=alert(1)>',
        before: '<img src=x onerror=alert(1)>',
        after: { html: '<script>alert(1)</script>' },
      },
      {
        field: 'x',
        label: '<b>label</b>',
        before: 'a b c d <img src=x> e',
        after: 'a b c <i>d</i> e',
      },
    ];
    return (
      <>
        <AuditDiff changes={changes} />
        <AuditDiff changes={changes} variant="inline" />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('img, script, b, i')).toBeNull();
    expect(canvasElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(canvasElement.textContent).toContain('{"html":"<script>alert(1)</script>"}');
    expect(canvasElement.textContent).toContain('<b>label</b>');
  },
};

/** The old value is struck through, the new one is not, in every theme at 4.5:1. */
export const ColoursInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <AuditDiff
        changes={[
          { field: 'role', before: 'Viewer', after: 'Admin' },
          { field: 'sla', before: BEFORE_TEXT, after: AFTER_TEXT },
        ]}
      />
      <AuditDiff variant="inline" changes={[{ field: 'role', before: 'Viewer', after: 'Admin' }]} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>('tbody tr:first-child td');
    const inline = canvasElement.querySelectorAll<HTMLElement>(
      '[role="listitem"] > span.rounded-sm'
    );
    const del = canvasElement.querySelector('del') as HTMLElement;
    const ins = canvasElement.querySelector('ins') as HTMLElement;
    inEachTheme(() => {
      for (const el of [cells[0], cells[1], inline[0], inline[1], del, ins]) expectTextContrast(el);
      const struck = (cell: Element) =>
        getComputedStyle(cell.lastElementChild as Element).textDecorationLine;
      expect(struck(cells[0])).toBe('line-through');
      expect(struck(cells[1])).toBe('none');
      expect(getComputedStyle(cells[0]).backgroundColor).not.toBe(
        getComputedStyle(cells[1]).backgroundColor
      );
    });
  },
};

/** The header and the rows of the table follow the page's `data-density`. */
export const TableFollowsPageDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <InEachDensity>
      <AuditDiff changes={userChanges} aria-label="Changes to Bob" />
    </InEachDensity>
  ),
  play: async ({ canvas }) => {
    await expectDensitySteps(canvas, (scope) => scope.getAllByRole('columnheader')[0]!);
    await expectDensitySteps(canvas, (scope) => scope.getAllByRole('row')[1]!);
  },
};
