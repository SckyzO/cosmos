import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Activity, Bell, Database, FileText, Home, Server, Settings } from 'lucide-react';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { PageContainer } from '../layout/PageContainer';
import { LogEntryDetail } from '../logs/LogEntryDetail';
import { LogConsole, fakeLines } from '../logs/storybook-logs';
import type { LogLine } from '../logs/types';
import { PageHeader } from '../templates/PageHeader';
import { Drawer } from '../ui/Drawer';

// A monitoring app's logs page: the toolbar and the live viewer in a card, and the entry a row
// opens in a drawer. Composed from the Monitoring components. The volume chart of the issue is
// not here: @sckyzo/cosmos-react depends on no chart package, so that recipe belongs with the
// charts.

const meta = {
  title: 'Pages/Examples/Logs',
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LogsContent = () => {
  const [open, setOpen] = useState<LogLine | null>(null);
  return (
    <PageContainer width="full" className="space-y-6">
      <PageHeader title="Logs" description="The backend, live. Open a line to read it in full." />
      <LogConsole count={500} feed={1} height={520} onOpen={setOpen} />
      <Drawer open={open !== null} onClose={() => setOpen(null)} size="lg">
        <Drawer.Header title="Log entry" />
        <Drawer.Body>
          {open && (
            <LogEntryDetail
              line={open}
              context={{
                before: fakeLines(3, Math.max(1, Number(open.id) - 3)),
                after: fakeLines(3, Number(open.id) + 1),
              }}
            />
          )}
        </Drawer.Body>
      </Drawer>
    </PageContainer>
  );
};

const LogsPage = () => (
  <Shell
    topbar={
      <Topbar
        endActions={
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Bell className="size-5" aria-hidden />
          </button>
        }
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand title="Cosmos" />
        <Sidebar.Section>
          <Sidebar.Item icon={Home} label="Home" />
          <Sidebar.Item icon={Server} label="Nodes" />
          <Sidebar.Item icon={Database} label="Storage" />
          <Sidebar.Item icon={Activity} label="Alerts" />
          <Sidebar.Item icon={FileText} label="Logs" active />
          <Sidebar.Item icon={Settings} label="Settings" />
        </Sidebar.Section>
      </Sidebar>
    }
  >
    <LogsContent />
  </Shell>
);

/** The page at rest, with the live feed running. */
export const Default: Story = {
  tags: ['no-capture'],
  render: () => <LogsPage />,
};

/** At 375px the toolbar folds its filters into a popover and nothing widens the page. */
export const Mobile: Story = {
  tags: ['no-capture'],
  globals: mobileViewport,
  render: () => <LogsPage />,
  play: () => expectNoHorizontalOverflow(),
};
