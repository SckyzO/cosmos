import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Bell,
  FileText,
  ImageIcon,
  KeyRound,
  Settings as SettingsIcon,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Tabs, type TabsProps } from './Tabs';
import { expectFocusRing, expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: {
    'Tabs.List': Tabs.List,
    'Tabs.Trigger': Tabs.Trigger,
    'Tabs.Panel': Tabs.Panel,
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'overview', onChange: () => {}, children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const ThreeTabs: Story = {
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Wrap>
        <SectionCard title="Tabs (overview / metrics / logs)">
          <Tabs value={tab} onChange={setTab}>
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
              <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
              <Tabs.Trigger value="disabled" disabled>
                Soon
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panel value="overview">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-level summary of the resource.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="metrics">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time-series charts go here.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="logs">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recent log lines from the agent.
              </p>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>
      </Wrap>
    );
  },
};

export const Vertical: Story = {
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Wrap>
        <SectionCard title="Vertical tabs (settings layout)">
          <Tabs value={tab} onChange={setTab} orientation="vertical">
            <Tabs.List className="sm:w-44">
              <Tabs.Trigger value="account" icon={User}>
                Account
              </Tabs.Trigger>
              <Tabs.Trigger value="security" icon={KeyRound}>
                Security
              </Tabs.Trigger>
              <Tabs.Trigger value="notifications" icon={Bell} badge="3">
                Notifications
              </Tabs.Trigger>
              <Tabs.Trigger value="advanced" icon={SettingsIcon}>
                Advanced
              </Tabs.Trigger>
              <Tabs.Trigger value="locked" disabled>
                Billing
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panel value="account">
              <h3 className="mb-2 text-sm font-semibold">Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your username, profile picture and display name.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="security">
              <h3 className="mb-2 text-sm font-semibold">Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Change your password and review active sessions.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="notifications">
              <h3 className="mb-2 text-sm font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick which alerts reach you and through which channels.
              </p>
            </Tabs.Panel>
            <Tabs.Panel value="advanced">
              <h3 className="mb-2 text-sm font-semibold">Advanced</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Power-user toggles, feature flags and developer options.
              </p>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>
      </Wrap>
    );
  },
};

type FileRow = { name: string; size: string; modified: string };

const FILES: Record<'documents' | 'images' | 'archives', FileRow[]> = {
  documents: [
    { name: 'capacity-plan-2026.pdf', size: '2.4 MB', modified: 'Oct 18' },
    { name: 'runbook-failover.md', size: '18 KB', modified: 'Oct 12' },
    { name: 'rack-inventory.xlsx', size: '640 KB', modified: 'Sep 30' },
  ],
  images: [
    { name: 'room-a-floorplan.png', size: '1.1 MB', modified: 'Oct 2' },
    { name: 'rack-12-front.jpg', size: '3.8 MB', modified: 'Sep 21' },
  ],
  archives: [{ name: 'logs-2026-q3.tar.gz', size: '412 MB', modified: 'Oct 1' }],
};

const FileList = ({ files }: { files: FileRow[] }) => (
  <ul className="divide-y divide-[var(--color-border)] text-sm">
    {files.map((f) => (
      <li
        key={f.name}
        className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
      >
        <span className="truncate font-medium text-[var(--color-text-primary)]">{f.name}</span>
        <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">
          {f.size} · {f.modified}
        </span>
      </li>
    ))}
  </ul>
);

// The folder panel draws its own border and background: no SectionCard around it.
export const Folder: Story = {
  render: () => {
    const [tab, setTab] = useState('documents');
    return (
      <Wrap>
        <Tabs value={tab} onChange={setTab} variant="folder">
          <Tabs.List>
            <Tabs.Trigger value="documents" icon={FileText} badge={FILES.documents.length}>
              Documents
            </Tabs.Trigger>
            <Tabs.Trigger value="images" icon={ImageIcon} badge={FILES.images.length}>
              Images
            </Tabs.Trigger>
            <Tabs.Trigger value="archives" icon={Archive}>
              Archives
            </Tabs.Trigger>
            <Tabs.Trigger value="shared" disabled>
              Shared
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="documents">
            <FileList files={FILES.documents} />
          </Tabs.Panel>
          <Tabs.Panel value="images">
            <FileList files={FILES.images} />
          </Tabs.Panel>
          <Tabs.Panel value="archives">
            <FileList files={FILES.archives} />
          </Tabs.Panel>
        </Tabs>
      </Wrap>
    );
  },
};

export const FolderVertical: Story = {
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Wrap>
        <Tabs value={tab} onChange={setTab} orientation="vertical" variant="folder">
          <Tabs.List className="sm:w-44">
            <Tabs.Trigger value="account" icon={User}>
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="security" icon={KeyRound}>
              Security
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" icon={Bell} badge="3">
              Notifications
            </Tabs.Trigger>
            <Tabs.Trigger value="locked" disabled>
              Billing
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="account">
            <h3 className="mb-2 text-sm font-semibold">Account</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Manage your username, profile picture and display name.
            </p>
          </Tabs.Panel>
          <Tabs.Panel value="security">
            <h3 className="mb-2 text-sm font-semibold">Security</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Change your password and review active sessions.
            </p>
          </Tabs.Panel>
          <Tabs.Panel value="notifications">
            <h3 className="mb-2 text-sm font-semibold">Notifications</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pick which alerts reach you and through which channels.
            </p>
          </Tabs.Panel>
        </Tabs>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SwitchesPanelOnTabClick: Story = {
  tags: ['!dev'],
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p data-testid="panel">overview-panel-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="metrics">
          <p data-testid="panel">metrics-panel-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    // Initial panel is "overview"
    await expect(canvas.getByTestId('panel')).toHaveTextContent('overview-panel-content');
    // Click "Metrics" → panel switches
    await userEvent.click(canvas.getByRole('tab', { name: 'Metrics' }));
    await expect(canvas.getByTestId('panel')).toHaveTextContent('metrics-panel-content');
    // aria-selected wires correctly
    await expect(canvas.getByRole('tab', { name: 'Metrics' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const DisabledTabIsNotClickable: Story = {
  tags: ['!dev'],
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="soon" disabled>
            Soon
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p data-testid="panel">overview-panel-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="soon">
          <p data-testid="panel">soon-panel-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    const soon = canvas.getByRole('tab', { name: 'Soon' });
    await expect(soon).toBeDisabled();
    await userEvent.click(soon);
    // Panel did not switch
    await expect(canvas.getByTestId('panel')).toHaveTextContent('overview-panel-content');
  },
};

export const VerticalAriaOrientation: Story = {
  tags: ['!dev'],
  render: () => {
    const [tab, setTab] = useState('one');
    return (
      <Tabs value={tab} onChange={setTab} orientation="vertical">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="one">
          <p data-testid="panel">one-content</p>
        </Tabs.Panel>
        <Tabs.Panel value="two">
          <p data-testid="panel">two-content</p>
        </Tabs.Panel>
      </Tabs>
    );
  },
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.click(canvas.getByRole('tab', { name: 'Two' }));
    await expect(canvas.getByTestId('panel')).toHaveTextContent('two-content');
  },
};

const FolderTrio = () => {
  const [tab, setTab] = useState('documents');
  return (
    <Tabs value={tab} onChange={setTab} variant="folder">
      <Tabs.List>
        <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
        <Tabs.Trigger value="images">Images</Tabs.Trigger>
        <Tabs.Trigger value="archives">Archives</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="documents">
        <p>documents-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="images">
        <p>images-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="archives">
        <p>archives-panel-content</p>
      </Tabs.Panel>
    </Tabs>
  );
};

export const FolderSwitchesPanel: Story = {
  tags: ['!dev'],
  render: () => <FolderTrio />,
  play: async ({ canvas }) => {
    const documents = canvas.getByRole('tab', { name: 'Documents' });
    const images = canvas.getByRole('tab', { name: 'Images' });
    const archives = canvas.getByRole('tab', { name: 'Archives' });
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('documents-panel-content');
    // Click "Images" → panel switches and aria-selected moves
    await userEvent.click(images);
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('images-panel-content');
    await expect(images).toHaveAttribute('aria-selected', 'true');
    await expect(documents).toHaveAttribute('aria-selected', 'false');
    // Keyboard: the arrow key moves focus to the next tab and selects it
    await userEvent.keyboard('{ArrowRight}');
    await expect(archives).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('archives-panel-content');
    await expect(archives).toHaveAttribute('aria-selected', 'true');
    await expect(images).toHaveAttribute('aria-selected', 'false');
  },
};

export const FolderActiveTabJoinsPanel: Story = {
  tags: ['!dev'],
  render: () => <FolderTrio />,
  play: async ({ canvas }) => {
    const active = canvas.getByRole('tab', { name: 'Documents' });
    const inactive = canvas.getByRole('tab', { name: 'Images' });
    const panel = canvas.getByRole('tabpanel');
    const listBottom = canvas.getByRole('tablist').getBoundingClientRect().bottom;
    // The list's bottom border is the panel's top edge
    await expect(panel.getBoundingClientRect().top).toBeCloseTo(listBottom, 0);
    // The active tab covers that border with the panel's background: no line under it
    await expect(active.getBoundingClientRect().bottom).toBeCloseTo(listBottom, 0);
    await expect(getComputedStyle(active).borderBottomColor).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(active).backgroundColor).toBe(
      getComputedStyle(panel).backgroundColor
    );
    // Inactive tabs are lower, on another background, with the border under them
    await expect(inactive.getBoundingClientRect().top).toBeGreaterThan(
      active.getBoundingClientRect().top
    );
    await expect(getComputedStyle(inactive).backgroundColor).not.toBe(
      getComputedStyle(panel).backgroundColor
    );
    await expect(getComputedStyle(inactive).borderBottomColor).toBe(
      getComputedStyle(panel).borderLeftColor
    );
  },
};

const KeyboardTabs = ({ orientation }: { orientation?: 'horizontal' | 'vertical' }) => {
  const [tab, setTab] = useState('overview');
  return (
    <Tabs value={tab} onChange={setTab} orientation={orientation}>
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="soon" disabled>
          Soon
        </Tabs.Trigger>
        <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
        <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="overview">
        <p>overview-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="metrics">
        <p>metrics-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="logs">
        <p>logs-panel-content</p>
      </Tabs.Panel>
    </Tabs>
  );
};

export const ArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <KeyboardTabs />,
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const metrics = canvas.getByRole('tab', { name: 'Metrics' });
    const logs = canvas.getByRole('tab', { name: 'Logs' });
    // Only the selected tab is in the tab sequence
    await expect(overview).toHaveAttribute('tabindex', '0');
    await expect(metrics).toHaveAttribute('tabindex', '-1');
    await expect(logs).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    // ArrowRight skips the disabled tab, focuses and selects the next one
    await userEvent.keyboard('{ArrowRight}');
    await expect(metrics).toHaveFocus();
    await expect(metrics).toHaveAttribute('aria-selected', 'true');
    await expect(metrics).toHaveAttribute('tabindex', '0');
    await expect(overview).toHaveAttribute('tabindex', '-1');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('metrics-panel-content');
    await userEvent.keyboard('{ArrowRight}');
    await expect(logs).toHaveFocus();
    // Wraps from the last tab to the first, and back
    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('overview-panel-content');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(logs).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('logs-panel-content');
    // Home and End jump to the first and last tabs
    await userEvent.keyboard('{Home}');
    await expect(overview).toHaveFocus();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    await expect(logs).toHaveFocus();
    await expect(logs).toHaveAttribute('aria-selected', 'true');
  },
};

export const VerticalArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <KeyboardTabs orientation="vertical" />,
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const metrics = canvas.getByRole('tab', { name: 'Metrics' });
    const logs = canvas.getByRole('tab', { name: 'Logs' });
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(metrics).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('metrics-panel-content');
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowUp}');
    await expect(logs).toHaveFocus();
    await expect(logs).toHaveAttribute('aria-selected', 'true');
  },
};

export const TabAndPanelAreLinked: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <KeyboardTabs />,
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const panel = canvas.getByRole('tabpanel');
    await expect(overview.id).not.toBe('');
    await expect(panel.id).not.toBe('');
    await expect(overview).toHaveAttribute('aria-controls', panel.id);
    await expect(panel).toHaveAttribute('aria-labelledby', overview.id);
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toBe(panel);
    // Tab from the selected tab goes to the panel, not to the next tab
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.tab();
    await expect(panel).toHaveFocus();
  },
};

/**
 * Tabs that navigate (the page below changes by itself) have no `Tabs.Panel`: a tab must not
 * point at a panel that doesn't exist, which is an invalid ID reference.
 */
export const TabsWithoutPanelsHaveNoAriaControls: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <Tabs value="overview" onChange={() => {}}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    for (const tab of tabs) await expect(tab).not.toHaveAttribute('aria-controls');
    await expect(canvas.queryByRole('tabpanel')).toBeNull();
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

const TwoTabs = (props: Omit<TabsProps, 'children'>) => (
  <Tabs {...props}>
    <Tabs.List>
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Panel value="overview">Overview panel</Tabs.Panel>
    <Tabs.Panel value="logs">Logs panel</Tabs.Panel>
  </Tabs>
);

export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <Wrap>
      <div className="space-y-6">
        <div role="group" aria-label="Uncontrolled">
          <TwoTabs defaultValue="logs" onChange={args.onChange} />
        </div>
        <div role="group" aria-label="Controlled">
          <TwoTabs value="overview" onChange={args.onChange} />
        </div>
      </div>
    </Wrap>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('group', { name: 'Uncontrolled' }));
    await expect(own.getByRole('tab', { name: 'Logs' })).toHaveAttribute('aria-selected', 'true');
    await expect(own.getByRole('tabpanel')).toHaveTextContent('Logs panel');
    await userEvent.click(own.getByRole('tab', { name: 'Overview' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('overview');
    await expect(own.getByRole('tabpanel')).toHaveTextContent('Overview panel');

    const held = within(canvas.getByRole('group', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('tab', { name: 'Logs' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('logs');
    await expect(held.getByRole('tabpanel')).toHaveTextContent('Overview panel');
  },
};

export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => {
    const [tab, setTab] = useState('overview');
    return (
      <Wrap>
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="overview">Overview content</Tabs.Panel>
        </Tabs>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('tab', { name: 'Overview' }), { inset: true });
  },
};

export const FocusShowsRingInLight: Story = {
  tags: ['!dev'],
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};

// ── Disabled and folder tabs (#303) ──────────────────────────────────────────

// The computed value of a CSS color, read through a probe so both sides use the same serialization.
const colorOf = (value: string) => {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

/** A disabled tab is the theme's muted text at full opacity, not the idle gray faded by half. */
export const DisabledTabIsMuted: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <KeyboardTabs />,
  play: async ({ canvas }) => {
    const disabled = canvas.getByRole('tab', { name: 'Soon' });
    await expect(disabled).toBeDisabled();
    await expect(getComputedStyle(disabled).color).toBe(colorOf('var(--color-text-muted)'));
    await expect(getComputedStyle(disabled).opacity).toBe('1');
    await expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
    // It is no hover target: the idle tabs darken on hover, this one stays.
    await userEvent.hover(disabled);
    await expect(getComputedStyle(disabled).color).toBe(colorOf('var(--color-text-muted)'));
  },
};

const folderBorders = (canvas: ReturnType<typeof within>) => ({
  tab: getComputedStyle(canvas.getByRole('tab', { name: 'Images' })).borderTopColor,
  list: getComputedStyle(canvas.getByRole('tablist')).borderBottomColor,
  panel: getComputedStyle(canvas.getByRole('tabpanel')).borderLeftColor,
});

/** In dark, the outline of the tabs and the panel is one step above the theme's border. */
export const FolderOutlineIsStrongerInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => <FolderTrio />,
  play: async ({ canvas }) => {
    const strong = colorOf('var(--color-gray-600)');
    await expect(strong).not.toBe(colorOf('var(--color-border)'));
    await expect(folderBorders(canvas)).toEqual({ tab: strong, list: strong, panel: strong });
  },
};

/** In light, the folder keeps the theme's own border. */
export const FolderOutlineKeepsBorderInLight: Story = {
  tags: ['!dev'],
  ...FolderOutlineIsStrongerInDark,
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    const plain = colorOf('var(--color-border)');
    await expect(folderBorders(canvas)).toEqual({ tab: plain, list: plain, panel: plain });
  },
};

// ── Narrow screens (#291) ────────────────────────────────────────────────────

const SECTIONS = ['Overview', 'Metrics', 'Logs', 'Alerts', 'Deployments', 'Settings', 'Billing'];

const ManyTabs = ({ variant }: { variant: 'underline' | 'folder' | 'pills' }) => {
  const [tab, setTab] = useState(SECTIONS[0]);
  return (
    <Wrap>
      <Tabs value={tab} onChange={setTab} variant={variant}>
        <Tabs.List>
          {SECTIONS.map((section) => (
            <Tabs.Trigger key={section} value={section}>
              {section}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Panel value={tab}>
          <p className="text-sm text-[var(--color-text-secondary)]">{tab} panel.</p>
        </Tabs.Panel>
      </Tabs>
    </Wrap>
  );
};

// The strip scrolls by itself, so the page does not; picking the last tab brings it into view.
const expectStripScrollsToActiveTab = async (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas']
) => {
  expectNoHorizontalOverflow();
  const tablist = canvas.getByRole('tablist');
  const strip = tablist.parentElement!;
  await expect(getComputedStyle(strip).overflowX).toBe('auto');
  await expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
  await expect(strip.scrollLeft).toBe(0);
  const last = canvas.getByRole('tab', { name: 'Billing' });
  await userEvent.click(last);
  await waitFor(() => expect(strip.scrollLeft).toBeGreaterThan(0));
  await waitFor(() =>
    expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(
      strip.getBoundingClientRect().right + 1
    )
  );
  expectNoHorizontalOverflow();
};

export const MobileScrollingTabs: Story = {
  globals: mobileViewport,
  render: () => <ManyTabs variant="underline" />,
  play: async ({ canvas }) => expectStripScrollsToActiveTab(canvas),
};

export const MobileFolder: Story = {
  globals: mobileViewport,
  render: () => <ManyTabs variant="folder" />,
  play: async ({ canvas }) => expectStripScrollsToActiveTab(canvas),
};

export const MobileVertical: Story = {
  globals: mobileViewport,
  render: () => {
    const [tab, setTab] = useState('account');
    return (
      <Wrap>
        <Tabs value={tab} onChange={setTab} orientation="vertical">
          <Tabs.List>
            <Tabs.Trigger value="account" icon={User}>
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="security" icon={KeyRound}>
              Security
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" icon={Bell}>
              Notifications
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="account">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Manage your username, profile picture and display name.
            </p>
          </Tabs.Panel>
          <Tabs.Panel value="security">
            <p className="text-sm text-[var(--color-text-secondary)]">Change your password.</p>
          </Tabs.Panel>
        </Tabs>
      </Wrap>
    );
  },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    // Below `sm` a vertical list is a strip above the panel, and works as one.
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(tablist.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      canvas.getByRole('tabpanel').getBoundingClientRect().top
    );
    const account = canvas.getByRole('tab', { name: 'Account' });
    account.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Security' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const StripWithNoSelectedTabIsReachable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Tabs value="" onChange={() => {}}>
      <Tabs.List>
        <Tabs.Trigger value="off" disabled>
          Off
        </Tabs.Trigger>
        <Tabs.Trigger value="first">First</Tabs.Trigger>
        <Tabs.Trigger value="second">Second</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByRole('tab', { name: 'First' });
    const second = canvas.getByRole('tab', { name: 'Second' });
    // No tab is selected: the first enabled one is the strip's tab stop.
    await expect(canvas.queryAllByRole('tab', { selected: true })).toHaveLength(0);
    await expect(first).toHaveAttribute('tabindex', '0');
    await expect(second).toHaveAttribute('tabindex', '-1');
    await expect(canvas.getByRole('tab', { name: 'Off' })).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    await expect(first).toHaveFocus();
  },
};

// ── Pills variant ────────────────────────────────────────────────────────────

const PillsDemo = ({
  orientation,
  badge,
  defaultTab = 'overview',
}: {
  orientation?: 'horizontal' | 'vertical';
  badge?: boolean;
  defaultTab?: string;
}) => {
  const [tab, setTab] = useState(defaultTab);
  return (
    <Tabs value={tab} onChange={setTab} orientation={orientation} variant="pills">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="alerts" badge={badge ? '12' : undefined}>
          Alerts
        </Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
        <Tabs.Trigger value="audit" disabled>
          Audit
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="overview">
        <p className="text-sm text-[var(--color-text-secondary)]">overview-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="alerts">
        <p className="text-sm text-[var(--color-text-secondary)]">alerts-panel-content</p>
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        <p className="text-sm text-[var(--color-text-secondary)]">billing-panel-content</p>
      </Tabs.Panel>
    </Tabs>
  );
};

/** Rounded triggers on a tinted track; the active one is filled with the accent. */
export const Pills: Story = {
  render: () => (
    <Wrap>
      <PillsDemo />
    </Wrap>
  ),
};

/** The count keeps its small pill: translucent dark on the active tab, so white text holds 4.5:1. */
export const PillsWithBadge: Story = {
  render: () => (
    <Wrap>
      <PillsDemo badge defaultTab="alerts" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    // The count is read with the tab's name.
    await expect(canvas.getByRole('tab', { name: 'Alerts 12' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const PillsVertical: Story = {
  render: () => {
    const [tab, setTab] = useState('notifications');
    return (
      <Wrap>
        <Tabs value={tab} onChange={setTab} orientation="vertical" variant="pills">
          <Tabs.List className="sm:w-44">
            <Tabs.Trigger value="profile" icon={User}>
              Profile
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" icon={Bell} badge="3">
              Notifications
            </Tabs.Trigger>
            <Tabs.Trigger value="security" icon={KeyRound}>
              Security
            </Tabs.Trigger>
            <Tabs.Trigger value="billing" disabled>
              Billing
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="notifications">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pick which alerts reach you and through which channels.
            </p>
          </Tabs.Panel>
        </Tabs>
      </Wrap>
    );
  },
};

export const PillsDisabled: Story = {
  render: () => (
    <Wrap>
      <PillsDemo />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const disabled = canvas.getByRole('tab', { name: 'Audit' });
    await expect(disabled).toBeDisabled();
    await expect(getComputedStyle(disabled).color).toBe(colorOf('var(--color-text-muted)'));
    await userEvent.click(disabled);
    await expect(disabled).toHaveAttribute('aria-selected', 'false');
  },
};

/** The track and the active pill: gray tint behind, the accent fill with white text. */
export const PillsActiveIsFilled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <PillsDemo />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const active = canvas.getByRole('tab', { name: 'Overview' });
    await expect(getComputedStyle(active).backgroundColor).toBe(colorOf('var(--color-brand-500)'));
    await expect(getComputedStyle(active).color).toBe(colorOf('var(--color-white)'));
    const idle = canvas.getByRole('tab', { name: 'Billing' });
    await expect(getComputedStyle(idle).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(canvas.getByRole('tablist')).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)'
    );
  },
};

/** Pills keep the Tabs keyboard model: arrows skip the disabled tab, wrap, Home and End jump. */
export const PillsArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <PillsDemo />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const alerts = canvas.getByRole('tab', { name: 'Alerts' });
    const billing = canvas.getByRole('tab', { name: 'Billing' });
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(alerts).toHaveFocus();
    await expect(alerts).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('alerts-panel-content');
    await userEvent.keyboard('{ArrowRight}');
    await expect(billing).toHaveFocus();
    // The disabled tab is skipped: the next stop wraps to the first.
    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(billing).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(overview).toHaveAttribute('aria-selected', 'true');
  },
};

export const PillsVerticalArrowKeysMoveSelection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <PillsDemo orientation="vertical" />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('tab', { name: 'Alerts' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

/** The active pill sits on the accent, so its ring is the white one with no halo. */
export const PillsFocusRing: Story = {
  tags: ['!dev', '!autodocs'],
  // The ring helper reads rgb() shadows: pinned to the theme whose white is one.
  globals: { theme: 'dark' },
  render: () => (
    <Wrap>
      <PillsDemo />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('tab', { name: 'Overview' }), {
      token: '--color-white',
      inset: true,
      halo: false,
    });
    // Arrow keys select on focus: the pill that takes the focus is the active one.
    await userEvent.keyboard('{ArrowRight}');
    await expectFocusRing(canvas.getByRole('tab', { name: 'Alerts' }), {
      token: '--color-white',
      inset: true,
      halo: false,
    });
  },
};

export const MobilePills: Story = {
  globals: mobileViewport,
  render: () => <ManyTabs variant="pills" />,
  play: async ({ canvas }) => expectStripScrollsToActiveTab(canvas),
};
