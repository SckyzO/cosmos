import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { LogToolbar } from './LogToolbar';
import { LogConsole } from './storybook-logs';
import type { LogLevelKey } from './types';

const meta = {
  title: 'Monitoring/Log Toolbar',
  component: LogToolbar,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
} satisfies Meta<typeof LogToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const LEVELS: LogLevelKey[] = ['debug', 'info', 'warn', 'error'];

/** The toolbar and a viewer wired together, the way a host does. */
export const WithViewer: Story = {
  render: () => <LogConsole count={300} height={300} />,
};

/** Each control is there only when its props are given: here Live and the search. */
export const LiveAndSearchOnly: Story = {
  render: () => {
    const [search, setSearch] = useState('');
    return <LogToolbar onLiveChange={() => {}} search={search} onSearchChange={setSearch} />;
  },
};

/** Every control, with a regular expression that does not compile. */
export const InvalidPattern: Story = {
  render: () => (
    <LogToolbar
      search="("
      onSearchChange={() => {}}
      searchRegex
      onSearchRegexChange={() => {}}
      matchCount={0}
      activeMatch={0}
      onActiveMatchChange={() => {}}
      levels={LEVELS}
      levelCounts={{ debug: 1204, info: 8412, warn: 214, error: 37 }}
      onActiveLevelsChange={() => {}}
    />
  ),
};

/** Below `sm`, Live and the search stay in the bar; levels, sources and the view options go into Filters. */
export const Mobile: Story = {
  globals: mobileViewport,
  render: () => <LogConsole count={200} height={380} search="timeout" />,
  play: () => expectNoHorizontalOverflow(),
};

/** The test of `Mobile`, hidden: the popover opens, and its button counts the active filters. */
export const NarrowFiltersCountActiveFilters: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expect(canvas.queryByRole('group', { name: 'Levels' })).toBeNull();
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    const panel = within(await within(document.body).findByRole('dialog', { name: 'Log filters' }));

    await userEvent.click(panel.getByRole('checkbox', { name: /Debug/ }));
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Filters, 1 active' })).toBeVisible()
    );
    await userEvent.click(panel.getByRole('checkbox', { name: /Trace/ }));
    // Still one filter: the levels, whatever number of them are off.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Filters, 1 active' })).toBeVisible()
    );
    await userEvent.click(panel.getByRole('checkbox', { name: /Debug/ }));
    await userEvent.click(panel.getByRole('checkbox', { name: /Trace/ }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Filters' })).toBeVisible());
  },
};

/** The bar with every control, a search that finds twelve lines, and a width that is not the screen's. */
const FullBar = ({ width }: { width: number }) => {
  const [search, setSearch] = useState('');
  return (
    <div style={{ width }}>
      <LogToolbar
        onLiveChange={() => {}}
        levels={LEVELS}
        levelCounts={{ debug: 1204, info: 8412, warn: 214, error: 37 }}
        onActiveLevelsChange={() => {}}
        search={search}
        onSearchChange={setSearch}
        onSearchRegexChange={() => {}}
        matchCount={search === '' ? undefined : 12}
        activeMatch={2}
        onActiveMatchChange={() => {}}
        sources={['api', 'worker', 'scheduler']}
        onWrapChange={() => {}}
        onOrderChange={() => {}}
        onDownload={() => {}}
        onClear={() => {}}
      />
    </div>
  );
};

const FullBarWide: Story = { render: () => <FullBar width={1100} /> };

/** The icon of an icon-only toggle keeps its size, in a square button of the control height. */
export const IconToggleKeepsItsSize: Story = {
  ...FullBarWide,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    for (const name of ['Regular expression', 'Wrap lines', 'Newest first']) {
      const button = canvas.getByRole('button', { name });
      const box = button.getBoundingClientRect();
      const icon = button.querySelector('svg')!.getBoundingClientRect();
      expect(icon.width).toBeCloseTo(16, 0);
      expect(icon.height).toBeCloseTo(16, 0);
      expect(box.width).toBeCloseTo(36, 0);
      expect(box.height).toBeCloseTo(36, 0);
    }
  },
};
