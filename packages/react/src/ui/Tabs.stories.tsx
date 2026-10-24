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
import { expect, fn, userEvent, within } from 'storybook/test';
import { Tabs, type TabsProps } from './Tabs';
import { expectFocusRing } from '../storybook-helpers';
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
            <Tabs.List className="w-44">
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
          <Tabs.List className="w-44">
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
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};
