import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { Filter, LayoutDashboard, LayoutGrid, List, Map } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  endOffset,
  expectFocusRing,
  expectRefFocuses,
  keyToEnd,
  keyToStart,
  startOffset,
} from '../storybook-helpers';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'Forms/Segmented Control',
  component: SegmentedControl,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'map', label: 'Map' },
] as const;

const VIEWS_WITH_ICONS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'list', label: 'List', icon: List },
  { value: 'map', label: 'Map', icon: Map },
] as const;

export const TextOnly: Story = {
  args: { options: VIEWS as unknown as never, value: 'list' },
};

export const TextAndIcon: Story = {
  args: { options: VIEWS_WITH_ICONS as unknown as never, value: 'overview' },
};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState<'list' | 'grid' | 'map'>('list');
    return (
      <div>
        <SegmentedControl options={VIEWS as unknown as never} value={v} onChange={setV} />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Selected: <code>{v}</code>
        </p>
      </div>
    );
  },
};

export const ClickFiresOnChange: Story = {
  tags: ['!dev'],
  args: { options: VIEWS as unknown as never, value: 'list', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Grid' }));
    await expect(args.onChange).toHaveBeenCalledWith('grid');
  },
};

export const SelectedSegmentIsChecked: Story = {
  tags: ['!dev'],
  args: { options: VIEWS as unknown as never, value: 'grid', 'aria-label': 'View' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveAttribute(
      'tabindex',
      '0'
    );
    await expect(canvas.getByRole('radio', { name: 'List', checked: false })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  },
};

const ControlledView = () => {
  const [v, setV] = useState<'list' | 'grid' | 'map'>('list');
  return (
    <SegmentedControl
      aria-label="View"
      options={VIEWS as unknown as never}
      value={v}
      onChange={setV}
    />
  );
};

export const ArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledView />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'List' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}{${keyToStart()}}`);
    await expect(canvas.getByRole('radio', { name: 'Map', checked: true })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
  },
};

// Browser shortcuts such as Alt+ArrowLeft (back) must reach the browser.
export const ModifiedArrowKeysAreIgnored: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledView />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}{Control>}{ArrowRight}{/Control}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
  },
};

const tabStopRef = createRef<HTMLButtonElement>();

/**
 * The ref gets the segment the group's Tab stop is on, the first one while none
 * is selected, and it follows the selection.
 */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [v, setV] = useState('');
    return (
      <SegmentedControl<string>
        ref={tabStopRef}
        options={[...VIEWS]}
        value={v}
        onChange={setV}
        aria-label="View"
      />
    );
  },
  play: async ({ canvas }) => {
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'List' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Map' }));
    await expectRefFocuses(tabStopRef, canvas.getByRole('radio', { name: 'Map' }));
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="space-y-3">
      <SegmentedControl<string>
        aria-label="Uncontrolled"
        options={[...VIEWS]}
        defaultValue="grid"
        onChange={args.onChange}
      />
      <SegmentedControl<string>
        aria-label="Controlled"
        options={[...VIEWS]}
        value="list"
        onChange={args.onChange}
      />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('radiogroup', { name: 'Uncontrolled' }));
    await expect(own.getByRole('radio', { name: 'Grid' })).toBeChecked();
    await userEvent.click(own.getByRole('radio', { name: 'Map' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('map');
    await expect(own.getByRole('radio', { name: 'Map' })).toBeChecked();

    const held = within(canvas.getByRole('radiogroup', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('radio', { name: 'Grid' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('grid');
    await expect(held.getByRole('radio', { name: 'List' })).toBeChecked();
  },
};

// Roving tabindex puts focus on the checked segment, which is filled with the accent:
// its ring is white and inside. Any other segment gets the accent ring.

export const FocusShowsWhiteRingOnCheckedSegmentInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { options: VIEWS as unknown as never, value: 'list' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('radio', { name: 'List' }), {
      token: '--color-white',
      inset: true,
      halo: false,
    });
  },
};

export const FocusShowsWhiteRingOnCheckedSegmentInLight: Story = {
  tags: ['!dev'],
  ...FocusShowsWhiteRingOnCheckedSegmentInDark,
  globals: { theme: 'light' },
};

export const FocusShowsAccentRingOnOtherSegmentInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { options: VIEWS as unknown as never, value: 'list' },
  play: async ({ canvas }) => {
    // Tab first, so the keyboard is the last input and :focus-visible matches.
    await userEvent.tab();
    const grid = canvas.getByRole('radio', { name: 'Grid' });
    grid.focus();
    await expectFocusRing(grid, { inset: true });
  },
};

// ── Pills (merged from FilterPills, #298) ────────────────────────────────────

const SEVERITY = [
  { value: 'all', label: 'All' },
  { value: 'crit', label: 'CRIT' },
  { value: 'warn', label: 'WARN' },
  { value: 'ok', label: 'OK' },
];

export const Pills: Story = {
  args: { options: SEVERITY, value: 'all', appearance: 'pills' },
};

export const PillsWithGroupIcon: Story = {
  args: { options: SEVERITY, value: 'all', appearance: 'pills', icon: Filter },
};

export const PillsFullWidth: Story = {
  parameters: { layout: 'padded' },
  args: { options: SEVERITY, value: 'all', appearance: 'pills', icon: Filter, fullWidth: true },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-3">
      <SegmentedControl<string> options={[...VIEWS]} value="list" size="sm" />
      <SegmentedControl<string> options={[...VIEWS]} value="list" />
      <div>
        <SegmentedControl<string> options={SEVERITY} value="all" appearance="pills" size="sm" />
      </div>
      <div>
        <SegmentedControl<string> options={SEVERITY} value="all" appearance="pills" />
      </div>
    </div>
  ),
};

const ControlledSeverity = () => {
  const [v, setV] = useState('all');
  return (
    <SegmentedControl
      aria-label="Severity"
      appearance="pills"
      options={SEVERITY}
      value={v}
      onChange={setV}
    />
  );
};

export const PillsArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledSeverity />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'All' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'CRIT', checked: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('radio', { name: 'OK', checked: true })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'All', checked: true })).toHaveFocus();
  },
};

export const PillsSelectedHasAccentBackground: Story = {
  tags: ['!dev', '!autodocs'],
  args: { options: SEVERITY, value: 'warn', appearance: 'pills', 'aria-label': 'Severity' },
  play: async ({ canvas }) => {
    const selected = getComputedStyle(canvas.getByRole('radio', { name: 'WARN' }));
    const other = getComputedStyle(canvas.getByRole('radio', { name: 'All' }));
    const probe = document.createElement('span');
    probe.className = 'bg-brand-500 text-white';
    document.body.append(probe);
    const accent = getComputedStyle(probe);
    await expect(selected.backgroundColor).toBe(accent.backgroundColor);
    await expect(selected.color).toBe(accent.color);
    probe.remove();
    await expect(other.backgroundColor).not.toBe(selected.backgroundColor);
    await expect(other.color).not.toBe(selected.color);
  },
};

export const FullWidthFillsItsContainer: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box" style={{ width: 480 }}>
      <SegmentedControl<string>
        aria-label="Severity"
        appearance="pills"
        options={SEVERITY}
        value="all"
        fullWidth
      />
      <div className="mt-3">
        <SegmentedControl<string> aria-label="Shrunk" options={SEVERITY} value="all" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('box').getBoundingClientRect().width;
    const full = canvas.getByRole('radiogroup', { name: 'Severity' }).getBoundingClientRect().width;
    const shrunk = canvas.getByRole('radiogroup', { name: 'Shrunk' }).getBoundingClientRect().width;
    await expect(full).toBe(box);
    await expect(shrunk).toBeLessThan(box);
  },
};

// ── Badges ───────────────────────────────────────────────────────────────────

const STATUS_COUNTS = [
  { value: 'all', label: 'All', badge: 128 },
  { value: 'active', label: 'Active', badge: 4 },
  { value: 'archived', label: 'Archived', badge: 32 },
] as const;

export const WithBadges: Story = {
  args: {
    options: STATUS_COUNTS as unknown as never,
    value: 'all',
    'aria-label': 'Status',
  },
};

export const PillsWithBadges: Story = {
  args: {
    options: STATUS_COUNTS as unknown as never,
    value: 'all',
    appearance: 'pills',
    'aria-label': 'Status',
  },
};

/** The count is part of the radio's accessible name, on a segment and on a pill. */
export const BadgeIsPartOfTheName: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <SegmentedControl<string>
        aria-label="Status"
        options={[...STATUS_COUNTS]}
        defaultValue="all"
      />
      <div>
        <SegmentedControl<string>
          aria-label="Status, pills"
          appearance="pills"
          options={[...STATUS_COUNTS]}
          defaultValue="all"
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const group of ['Status', 'Status, pills']) {
      const radios = within(canvas.getByRole('radiogroup', { name: group }));
      await expect(radios.getByRole('radio', { name: 'All 128', checked: true })).toBeVisible();
      await expect(radios.getByRole('radio', { name: 'Active 4' })).toBeVisible();
      await expect(radios.getByRole('radio', { name: 'Archived 32' })).toBeVisible();
    }
  },
};

/** The pill of the active segment is a veil over the accent; the others sit on a gray tint. */
export const BadgeOfTheActiveSegmentIsTinted: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    options: STATUS_COUNTS as unknown as never,
    value: 'active',
    'aria-label': 'Status',
  },
  play: async ({ canvas }) => {
    const badge = (name: string) =>
      canvas.getByRole('radio', { name }).querySelector('span') as HTMLElement;
    await expect(getComputedStyle(badge('Active 4')).color).toBe(
      getComputedStyle(canvas.getByRole('radio', { name: 'Active 4' })).color
    );
    await expect(getComputedStyle(badge('Active 4')).backgroundColor).not.toBe(
      getComputedStyle(badge('All 128')).backgroundColor
    );
    await expect(getComputedStyle(badge('All 128')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * In right to left the first segment is on the right and ArrowLeft moves to the next one; Up and
 * Down do not change.
 */
export const ArrowKeysFollowTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div dir="rtl">
      <ControlledView />
    </div>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'View' });
    const [list, grid] = ['List', 'Grid'].map((name) => canvas.getByRole('radio', { name }));
    await expect(startOffset(list!, group)).toBeLessThan(startOffset(grid!, group));
    await userEvent.tab();
    await expect(list).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
  },
};

// ── Icon only ────────────────────────────────────────────────────────────────

const LAYOUTS = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
] as const;

/** A grid / list switch: each segment is its icon, the label is its name and its tooltip. */
export const IconOnly: Story = {
  args: {
    options: LAYOUTS as unknown as never,
    value: 'grid',
    iconOnly: true,
    'aria-label': 'Layout',
  },
};

export const IconOnlyPills: Story = {
  args: { ...IconOnly.args, appearance: 'pills' },
};

export const IconOnlySizes: Story = {
  render: () => (
    <div className="space-y-3">
      <SegmentedControl<string> options={[...LAYOUTS]} value="grid" iconOnly size="sm" />
      <SegmentedControl<string> options={[...LAYOUTS]} value="grid" iconOnly />
      <div>
        <SegmentedControl<string>
          options={[...LAYOUTS]}
          value="grid"
          iconOnly
          appearance="pills"
          size="sm"
        />
      </div>
      <div>
        <SegmentedControl<string> options={[...LAYOUTS]} value="grid" iconOnly appearance="pills" />
      </div>
    </div>
  ),
};

const ControlledLayout = () => {
  const [v, setV] = useState<'grid' | 'list'>('grid');
  return (
    <SegmentedControl
      aria-label="Layout"
      iconOnly
      options={LAYOUTS as unknown as never}
      value={v}
      onChange={setV}
    />
  );
};

export const IconOnlyChecks: Story = {
  ...IconOnly,
  tags: ['!dev', '!autodocs'],
  // The label names the radio, the segment holds the icon and no text, and the label shows as a
  // tooltip on hover and on keyboard focus.
  play: async ({ canvas }) => {
    const page = within(document.body);
    const grid = canvas.getByRole('radio', { name: 'Grid', checked: true });
    const list = canvas.getByRole('radio', { name: 'List', checked: false });
    for (const radio of [grid, list]) {
      await expect(radio.textContent).toBe('');
      await expect(radio.querySelector('svg')).not.toBeNull();
    }

    await userEvent.hover(list);
    const tip = page.getByRole('tooltip', { name: 'List' });
    await waitFor(() => expect(tip).toBeVisible());
    await expect(list).toHaveAccessibleDescription('List');
    await userEvent.unhover(list);
    await waitFor(() => expect(tip).not.toBeVisible());

    await userEvent.tab();
    await expect(grid).toHaveFocus();
    await waitFor(() => expect(page.getByRole('tooltip', { name: 'Grid' })).toBeVisible());
    await userEvent.tab();
    await waitFor(() => expect(page.getByRole('tooltip', { name: 'Grid' })).not.toBeVisible());
  },
};

export const IconOnlySegmentsAreSquare: Story = {
  ...IconOnlySizes,
  tags: ['!dev', '!autodocs'],
  // Segments take the height of a control of their size, pills those of the pill; both as wide.
  play: async ({ canvasElement }) => {
    const groups = canvasElement.querySelectorAll<HTMLElement>('[role="radiogroup"]');
    const sizes = [...groups].map((group) => {
      const box = group.querySelector('[role="radio"]')!.getBoundingClientRect();
      return [box.width, box.height];
    });
    await expect(sizes).toEqual([
      [32, 32],
      [36, 36],
      [24, 24],
      [28, 28],
    ]);
  },
};

export const IconOnlyPillsKeepTheirInset: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <SegmentedControl<string>
        aria-label="Labelled"
        appearance="pills"
        options={[...LAYOUTS]}
        value="grid"
      />
      <div>
        <SegmentedControl<string>
          aria-label="Icons"
          appearance="pills"
          iconOnly
          options={[...LAYOUTS]}
          value="grid"
        />
      </div>
    </div>
  ),
  // The first and last pill sit in from the track's ends by the same 6px as labelled ones.
  play: async ({ canvas }) => {
    const inset = (name: string) => {
      const group = canvas.getByRole('radiogroup', { name });
      const radios = within(group).getAllByRole('radio');
      return [startOffset(radios[0]!, group), endOffset(radios[radios.length - 1]!, group)];
    };
    await expect(inset('Icons')).toEqual(inset('Labelled'));
    await expect(inset('Icons')[0]).toBeCloseTo(7, 0);
  },
};

export const IconOnlyArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledLayout />,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'List', checked: true })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Grid', checked: true })).toHaveFocus();
  },
};

/** An option with no icon keeps its text and has no tooltip; the others show their icon. */
export const IconOnlyKeepsTextWithoutAnIcon: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <SegmentedControl<string>
      aria-label="Layout"
      iconOnly
      options={[
        { value: 'grid', label: 'Grid', icon: LayoutGrid },
        { value: 'table', label: 'Table' },
      ]}
      value="grid"
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Grid' }).textContent).toBe('');
    await expect(canvas.getByRole('radio', { name: 'Table' })).toHaveTextContent('Table');
    await expect(within(document.body).getAllByRole('tooltip')).toHaveLength(1);
  },
};
