import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Database, LayoutDashboard, Server, Settings } from 'lucide-react';
import { expect, within } from 'storybook/test';
import {
  Button,
  COSMOS_DENSITIES,
  Input,
  Row,
  SegmentedControl,
  Select,
  Sidebar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  applyAppearance,
  type CosmosDensity,
} from '../../../packages/react/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
} from '../../../packages/react/src/storybook-helpers';

const meta = {
  title: 'Foundations/Density',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`data-density` on `<html>` (or on any element, for one part of a page) tightens or loosens ' +
          'the vertical rhythm of every control and row at once: `compact` takes 4px off a control ' +
          'and 2px off each side of a row, `comfortable` adds as much; no attribute is the default. ' +
          'Panel padding, gaps and the horizontal padding stay. `applyAppearance` sets it, and the ' +
          'toolbar has a Density menu.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const REGIONS = [
  { value: 'eu', label: 'Europe' },
  { value: 'us', label: 'United States' },
];
const VIEWS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

/** The same page: a form, tabs, a table, a list of rows and a sidebar. */
const DensityPage = ({ density, label }: { density: CosmosDensity; label: string }) => (
  <section
    data-density={density}
    aria-label={`${label} density`}
    className="min-w-0 space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4"
  >
    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</h3>
    <div className="space-y-3">
      <Input label="Name" defaultValue="prod-eu-01" />
      <Select label="Region" options={REGIONS} defaultValue="eu" />
      <SegmentedControl aria-label="View" options={VIEWS} defaultValue="list" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
    <Tabs defaultValue="overview">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
        <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
    <Table aria-label={`Nodes, ${label}`}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Node</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>alpha-01</TableCell>
          <TableCell>Compute</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>alpha-02</TableCell>
          <TableCell>Storage</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <div className="divide-y divide-[var(--color-border)]">
      <Row icon={Server} title="Server alpha-01" subtitle="Rack 01-A" />
      <Row icon={Database} title="DB primary" subtitle="Rack 01-B" />
    </div>
    {/* A picture of the sidebar: inert, since a page has one navigation landmark. */}
    <div inert className="flex h-64 overflow-hidden rounded-xl border border-[var(--color-border)]">
      <Sidebar>
        <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" />
        <div className="py-2">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
          <Sidebar.SubMenu icon={Server} label="Library" defaultOpen>
            <Sidebar.Item label="Tokens" />
            <Sidebar.Item label="Components" />
          </Sidebar.SubMenu>
          <Sidebar.Item icon={Settings} label="Settings" />
        </div>
      </Sidebar>
    </div>
  </section>
);

const AllDensities = () => (
  <div className="grid gap-4 lg:grid-cols-3">
    {COSMOS_DENSITIES.map(({ id, label }) => (
      <DensityPage key={id} density={id} label={label} />
    ))}
  </div>
);

/**
 * One page in each density. Each column carries its own `data-density`, so the default column
 * stays default whatever the toolbar says: the toolbar's menu moves the whole page.
 */
export const SamePageInEachDensity: Story = {
  render: () => <AllDensities />,
};

// ── Tests ────────────────────────────────────────────────────────────────────

const heightOf = (el: Element) => el.getBoundingClientRect().height;

/** A control: anything a pointer or a key lands on. */
const CONTROLS =
  'button, input:not([type="hidden"]), select, [role="tab"], [role="radio"], a[href]';

/** The tokens the density attribute rebuilds: 28 to 48px controls, 4 to 24px of row padding. */
export const TokensFollowTheAttribute: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      {COSMOS_DENSITIES.map(({ id }) => (
        <div key={id} data-density={id} data-testid={id}>
          <div data-testid={`${id}-control`} className="h-ctrl-36" />
          <div data-testid={`${id}-small`} className="h-ctrl-28" />
          <div data-testid={`${id}-row`} className="py-row-8" />
          <div data-testid={`${id}-cell`} className="py-cell-body" />
        </div>
      ))}
      <div data-density="compact">
        <div data-density="default" data-testid="reset">
          <div data-testid="reset-control" className="h-ctrl-36" />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const px = (id: string, prop: 'height' | 'paddingTop') =>
      getComputedStyle(canvas.getByTestId(id))[prop];
    await expect(px('compact-control', 'height')).toBe('32px');
    await expect(px('default-control', 'height')).toBe('36px');
    await expect(px('comfortable-control', 'height')).toBe('40px');
    // The smallest control stays on the 24px floor of WCAG 2.5.8.
    await expect(px('compact-small', 'height')).toBe('24px');
    await expect(px('default-small', 'height')).toBe('28px');
    await expect(px('compact-row', 'paddingTop')).toBe('6px');
    await expect(px('default-row', 'paddingTop')).toBe('8px');
    await expect(px('comfortable-row', 'paddingTop')).toBe('10px');
    await expect(px('compact-cell', 'paddingTop')).toBe('10px');
    await expect(px('default-cell', 'paddingTop')).toBe('14px');
    await expect(px('comfortable-cell', 'paddingTop')).toBe('20px');
    // `default` on a part of a compact page opts that part out.
    await expect(px('reset-control', 'height')).toBe('36px');
  },
};

/** On `<html>`, as the toolbar and `applyAppearance` put it, and back to the default. */
export const AttributeOnTheRootMovesTheTokens: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <div data-testid="probe" className="h-ctrl-36" />,
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const before = root.getAttribute('data-density');
    const probe = canvas.getByTestId('probe');
    try {
      applyAppearance({ theme: 'dark', accent: 'blue', density: 'compact' });
      await expect(root).toHaveAttribute('data-density', 'compact');
      await expect(heightOf(probe)).toBe(32);
      applyAppearance({ theme: 'dark', accent: 'blue', density: 'comfortable' });
      await expect(heightOf(probe)).toBe(40);
      applyAppearance({ theme: 'dark', accent: 'blue', density: 'default' });
      await expect(root).not.toHaveAttribute('data-density');
      await expect(heightOf(probe)).toBe(36);
    } finally {
      if (before === null) delete root.dataset.density;
      else root.dataset.density = before;
    }
  },
};

/** applyAppearance sets and clears data-density, and leaves it when omitted. */
export const ApplyAppearanceDensity: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <p>applyAppearance on a detached element.</p>,
  play: async () => {
    const el = document.createElement('div');
    applyAppearance({ theme: 'dark', accent: 'blue', density: 'compact' }, el);
    await expect(el).toHaveAttribute('data-density', 'compact');
    applyAppearance({ theme: 'sand', accent: 'blue' }, el);
    await expect(el).toHaveAttribute('data-density', 'compact');
    applyAppearance({ theme: 'sand', accent: 'blue', density: 'default' }, el);
    await expect(el).not.toHaveAttribute('data-density');
  },
};

/** Compact keeps every control at 24px or more, whatever the control. */
export const CompactControlsAreAtLeast24px: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AllDensities />,
  play: async ({ canvas }) => {
    const page = canvas.getByRole('region', { name: 'Compact density' });
    const controls = [...page.querySelectorAll<HTMLElement>(CONTROLS)].filter(
      (el) => el.getClientRects().length > 0
    );
    await expect(controls.length).toBeGreaterThan(8);
    for (const el of controls) {
      const name = el.getAttribute('aria-label') ?? el.textContent ?? el.tagName;
      await expect(heightOf(el), `${el.tagName} ${name}`).toBeGreaterThanOrEqual(24);
    }
  },
};

/** Comfortable controls and rows are taller than the default ones, compact ones shorter. */
export const DensityStepsHeights: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <AllDensities />,
  play: async ({ canvas }) => {
    type Page = ReturnType<typeof within>;
    const probes: Record<string, (page: Page, region: HTMLElement) => Element> = {
      input: (page) => page.getByRole('textbox', { name: 'Name' }),
      select: (page) => page.getByRole('combobox', { name: 'Region' }),
      button: (page) => page.getByRole('button', { name: 'Save' }),
      segment: (page) => page.getByRole('radio', { name: 'List' }),
      tab: (page) => page.getByRole('tab', { name: 'Overview' }),
      tableRow: (page) => page.getByRole('cell', { name: 'alpha-01' }).closest('tr')!,
      listRow: (page) => page.getByText('Server alpha-01').closest('[class*="py-row-10"]')!,
      // The sidebar is inert, so the roles cannot find its rows.
      sidebarRow: (_page, region) => region.querySelector('[data-sidebar-item]')!,
    };
    const heightsOf = (query: (page: Page, region: HTMLElement) => Element) =>
      ['Compact', 'Default', 'Comfortable'].map((label) => {
        const region = canvas.getByRole('region', { name: `${label} density` });
        return heightOf(query(within(region), region));
      });
    for (const [name, query] of Object.entries(probes)) {
      const [compact, normal, comfortable] = heightsOf(query);
      await expect(compact, `${name}: compact < default`).toBeLessThan(normal);
      await expect(comfortable, `${name}: comfortable > default`).toBeGreaterThan(normal);
    }
  },
};

/** The page does not scroll sideways at phone width in any density. */
export const NoHorizontalOverflowInEachDensity: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="p-4">
      <AllDensities />
    </div>
  ),
  play: async () => {
    expectNoHorizontalOverflow();
  },
};
