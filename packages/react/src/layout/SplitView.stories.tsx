import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Inbox, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/Button';
import {
  expectBorderToken,
  expectNoHorizontalOverflow,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { Shell } from './Shell';
import { Sidebar } from './Sidebar';
import { SplitView, useSplitView } from './SplitView';
import { Topbar } from './Topbar';

const meta = {
  title: 'Layout/SplitView',
  component: SplitView,
  subcomponents: { 'SplitView.Pane': SplitView.Pane },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof SplitView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Tailwind's `lg` and up: the panes sit side by side.
const laptop = { viewport: { value: 'laptop', isRotated: false } } as const;

type Mail = { id: string; from: string; subject: string; body: string };

const mails: Mail[] = Array.from({ length: 14 }, (_, i) => ({
  id: `m${i + 1}`,
  from: ['Ana Ruiz', 'Ops on-call', 'Li Wei', 'Sam Patel'][i % 4]!,
  subject: [
    'Nightly backup finished',
    'Disk alert cleared on rack B4',
    'Review request for the cooling PR',
    'Maintenance window on Friday',
  ][i % 4]!,
  body: 'The job finished at 04:20 and the dashboard lags behind. Logs are attached to the ticket; nothing needs a reply today, but check the retention settings before the window opens.',
}));

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 14 },
  { id: 'sent', label: 'Sent', icon: Send, count: 0 },
  { id: 'trash', label: 'Trash', icon: Trash2, count: 3 },
];

/** A list of focusable rows: the pane holds its own tab stops. */
const MailList = ({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) => (
  <ul className="divide-y divide-[var(--color-border)]">
    {mails.map((m) => (
      <li key={m.id}>
        <button
          type="button"
          aria-current={m.id === selected || undefined}
          onClick={() => onSelect(m.id)}
          className="focus-visible:focus-indicator block w-full px-4 py-3 text-left hover:bg-gray-50 focus-visible:ring-inset aria-[current]:bg-gray-100 dark:hover:bg-gray-800 dark:aria-[current]:bg-gray-800"
        >
          <span className="block truncate text-sm font-medium text-[var(--color-text-primary)]">
            {m.from}
          </span>
          <span className="block truncate text-xs text-[var(--color-text-secondary)]">
            {m.subject}
          </span>
        </button>
      </li>
    ))}
  </ul>
);

const FolderList = () => (
  <nav aria-label="Folders" className="p-2">
    <ul>
      {FOLDERS.map((f, i) => (
        <li key={f.id}>
          <button
            type="button"
            aria-current={i === 0 || undefined}
            className="focus-visible:focus-indicator flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-gray-50 focus-visible:ring-inset aria-[current]:bg-gray-100 aria-[current]:font-medium aria-[current]:text-[var(--color-text-primary)] dark:hover:bg-gray-800 dark:aria-[current]:bg-gray-800"
          >
            <f.icon className="h-4 w-4" aria-hidden />
            <span className="flex-1">{f.label}</span>
            <span className="text-2xs">{f.count}</span>
          </button>
        </li>
      ))}
    </ul>
  </nav>
);

const Message = ({ mail, onBack }: { mail: Mail; onBack?: () => void }) => (
  <article className="p-6">
    {onBack && (
      <Button
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onClick={onBack}
        className="mb-4 lg:hidden"
      >
        Back
      </Button>
    )}
    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{mail.subject}</h2>
    <p className="mt-1 text-sm text-[var(--color-text-muted)]">From {mail.from}</p>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
      <p key={n} className="mt-4 text-sm text-[var(--color-text-secondary)]">
        {mail.body}
      </p>
    ))}
  </article>
);

const Frame = ({ children, height = 420 }: { children: React.ReactNode; height?: number }) => (
  <div style={{ height }}>{children}</div>
);

const pane = (canvas: ReturnType<typeof within>, name: string) =>
  canvas.getByRole('region', { name });

/** Two panes: a fixed-width list and a detail that takes the rest. Each scrolls on its own. */
export const TwoPanes: Story = {
  globals: laptop,
  render: () => {
    const [id, setId] = useState('m1');
    return (
      <Frame>
        <SplitView>
          <SplitView.Pane id="list" label="Messages" width="w-80">
            <MailList selected={id} onSelect={setId} />
          </SplitView.Pane>
          <SplitView.Pane id="detail" label="Message">
            <Message mail={mails.find((m) => m.id === id)!} />
          </SplitView.Pane>
        </SplitView>
      </Frame>
    );
  },
};

/** The test of `TwoPanes`, hidden: the visible story keeps its resting state. */
export const TwoPanesPicksAMessage: Story = {
  ...TwoPanes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const detail = pane(canvas, 'Message');
    // Side by side: same top, the list at its width, the detail on the rest.
    await expect(list.getBoundingClientRect().top).toBe(detail.getBoundingClientRect().top);
    await expect(list.getBoundingClientRect().width).toBe(320);
    await expect(detail.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      list.getBoundingClientRect().right
    );
    await userEvent.click(canvas.getAllByRole('button', { name: /Disk alert/ })[0]!);
    await expect(
      canvas.getByRole('heading', { name: 'Disk alert cleared on rack B4' })
    ).toBeVisible();
  },
};

/** Mail: folders, messages and the open message, three panes. */
export const ThreePanes: Story = {
  globals: laptop,
  render: () => {
    const [id, setId] = useState('m1');
    return (
      <Frame height={460}>
        <SplitView>
          <SplitView.Pane id="folders" label="Folders" width="w-56">
            <FolderList />
          </SplitView.Pane>
          <SplitView.Pane id="list" label="Messages" width="w-80">
            <MailList selected={id} onSelect={setId} />
          </SplitView.Pane>
          <SplitView.Pane id="detail" label="Message">
            <Message mail={mails.find((m) => m.id === id)!} />
          </SplitView.Pane>
        </SplitView>
      </Frame>
    );
  },
  play: async ({ canvas }) => {
    const [folders, list, detail] = ['Folders', 'Messages', 'Message'].map((n) => pane(canvas, n));
    const lefts = [folders, list, detail].map((p) => p!.getBoundingClientRect().left);
    await expect(lefts[0]).toBeLessThan(lefts[1]!);
    await expect(lefts[1]).toBeLessThan(lefts[2]!);
  },
};

/** Scrolling one pane leaves the others, and the page, where they were. */
export const PanesScrollIndependently: Story = {
  ...ThreePanes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const detail = pane(canvas, 'Message');
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    await expect(detail.scrollHeight).toBeGreaterThan(detail.clientHeight);
    list.scrollTop = 120;
    await waitFor(() => expect(list.scrollTop).toBe(120));
    await expect(detail.scrollTop).toBe(0);
    detail.scrollTop = 80;
    await waitFor(() => expect(detail.scrollTop).toBe(80));
    await expect(list.scrollTop).toBe(120);
    await expect(window.scrollY).toBe(0);
  },
};

/**
 * A pane that scrolls and holds nothing a keyboard can reach is a tab stop itself, or its text
 * could not be scrolled without a mouse. One with buttons or links is not.
 */
export const ScrollablePaneIsReachable: Story = {
  globals: laptop,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={240}>
      <SplitView>
        <SplitView.Pane id="list" label="Messages" width="w-80">
          <MailList onSelect={() => {}} />
        </SplitView.Pane>
        <SplitView.Pane id="text" label="Notes">
          <Message mail={mails[0]!} />
        </SplitView.Pane>
      </SplitView>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const notes = pane(canvas, 'Notes');
    await waitFor(() => expect(notes).toHaveAttribute('tabindex', '0'));
    await expect(pane(canvas, 'Messages')).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    notes.focus();
    await expect(notes).toHaveFocus();
  },
};

/** The frame and the dividers use the theme border, in every theme. */
export const BordersFollowTheTheme: Story = {
  ...TwoPanes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const frame = canvasElement.querySelector('section')!.parentElement!;
    const detail = pane(canvas, 'Message');
    inEachTheme(() => {
      expectBorderToken(frame, '--color-border');
      // The list's right edge is the divider: the border of the pane itself.
      expectBorderToken(pane(canvas, 'Messages'), '--color-border');
      expect(getComputedStyle(detail).borderInlineEndWidth).toBe('0px');
    });
  },
};

const ShellFrame = ({ children }: { children: React.ReactNode }) => (
  <Shell
    topbar={<Topbar pageTitle="Mail" />}
    sidebar={
      <Sidebar>
        <Sidebar.Brand logo={<Inbox className="h-5 w-5" />} title="Cosmos" />
        <Sidebar.Item icon={Inbox} label="Mail" href="#mail" active />
      </Sidebar>
    }
  >
    {children}
  </Shell>
);

/**
 * Inside a Shell the view fills the content area: the panes scroll and the page does not. Below
 * `lg` the Shell scrolls its content area as a whole, and the view keeps the height it gets.
 */
export const InAShell: Story = {
  globals: laptop,
  parameters: { layout: 'fullscreen' },
  render: () => {
    const [id, setId] = useState('m1');
    return (
      <ShellFrame>
        <div className="h-full p-4">
          <SplitView>
            <SplitView.Pane id="list" label="Messages" width="w-80">
              <MailList selected={id} onSelect={setId} />
            </SplitView.Pane>
            <SplitView.Pane id="detail" label="Message">
              <Message mail={mails.find((m) => m.id === id)!} />
            </SplitView.Pane>
          </SplitView>
        </div>
      </ShellFrame>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const main = canvasElement.querySelector('main')!;
    const list = pane(canvas, 'Messages');
    const root = document.documentElement;
    // The view takes the height of the content area, whatever its panes hold.
    await expect(list.parentElement!.getBoundingClientRect().height).toBeLessThanOrEqual(
      main.clientHeight
    );
    await expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight);
    await expect(root.scrollHeight).toBeLessThanOrEqual(root.clientHeight);
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  },
};

/** At 375px the Shell's content area gives the view its height too, with one pane showing. */
export const InAShellNarrow: Story = {
  ...InAShell,
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const main = canvasElement.querySelector('main')!;
    const view = (await canvas.findByRole('region', { name: 'Messages' })).parentElement!;
    await expect(canvas.queryByRole('region', { name: 'Message' })).toBeNull();
    await expect(view.getBoundingClientRect().height).toBeGreaterThan(200);
    await expect(view.getBoundingClientRect().height).toBeLessThanOrEqual(main.clientHeight);
    expectNoHorizontalOverflow();
  },
};

/**
 * Below the breakpoint only the active pane shows. The list item opens the message and the Back
 * button returns, both through `useSplitView`; the pane that appears takes focus.
 */
export const Narrow: Story = {
  globals: mobileViewport,
  render: () => {
    const Row = ({ mail }: { mail: Mail }) => {
      const { setActivePane } = useSplitView();
      return (
        <button
          type="button"
          onClick={() => setActivePane('detail')}
          className="focus-visible:focus-indicator block w-full px-4 py-3 text-left hover:bg-gray-50 focus-visible:ring-inset dark:hover:bg-gray-800"
        >
          <span className="block truncate text-sm font-medium text-[var(--color-text-primary)]">
            {mail.from}
          </span>
          <span className="block truncate text-xs text-[var(--color-text-secondary)]">
            {mail.subject}
          </span>
        </button>
      );
    };
    const Detail = () => {
      const { setActivePane } = useSplitView();
      return <Message mail={mails[0]!} onBack={() => setActivePane('list')} />;
    };
    return (
      <Frame height={480}>
        <SplitView defaultActivePane="list">
          <SplitView.Pane id="list" label="Messages" width="w-80">
            <ul className="divide-y divide-[var(--color-border)]">
              {mails.map((m) => (
                <li key={m.id}>
                  <Row mail={m} />
                </li>
              ))}
            </ul>
          </SplitView.Pane>
          <SplitView.Pane id="detail" label="Message">
            <Detail />
          </SplitView.Pane>
        </SplitView>
      </Frame>
    );
  },
};

/** The test of `Narrow`, hidden: the visible story keeps its resting state. */
export const NarrowSwitchesPanes: Story = {
  ...Narrow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    // One pane at a time, the full width; the other is out of the accessibility tree.
    const list = pane(canvas, 'Messages');
    await expect(canvas.queryByRole('region', { name: 'Message' })).toBeNull();
    await expect(list.getBoundingClientRect().width).toBe(list.parentElement!.clientWidth);

    await userEvent.click(canvas.getAllByRole('button', { name: /Ana Ruiz/ })[0]!);
    const detail = await canvas.findByRole('region', { name: 'Message' });
    await expect(canvas.queryByRole('region', { name: 'Messages' })).toBeNull();
    await expect(detail).toHaveFocus();
    expectNoHorizontalOverflow();

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(await canvas.findByRole('region', { name: 'Messages' })).toHaveFocus();
    await expect(canvas.queryByRole('region', { name: 'Message' })).toBeNull();
  },
};

/** The host owns the active pane: `activePane` and `onActivePaneChange`. */
export const Controlled: Story = {
  globals: mobileViewport,
  args: { onActivePaneChange: fn() },
  render: function Render({ onActivePaneChange }) {
    const [active, setActive] = useState('list');
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          activePane = <code data-testid="active">{active}</code>
        </p>
        <Frame height={320}>
          <SplitView
            activePane={active}
            onActivePaneChange={(id) => {
              onActivePaneChange?.(id);
              setActive(id);
            }}
          >
            <SplitView.Pane id="list" label="Messages" width="w-80">
              <MailList onSelect={() => setActive('detail')} />
            </SplitView.Pane>
            <SplitView.Pane id="detail" label="Message">
              <Message mail={mails[0]!} onBack={() => setActive('list')} />
            </SplitView.Pane>
          </SplitView>
        </Frame>
        <Button variant="secondary" size="sm" onClick={() => setActive('detail')}>
          Show the message
        </Button>
      </div>
    );
  },
};

/** The test of `Controlled`, hidden: the visible story keeps its resting state. */
export const ControlledSwitchesPanes: Story = {
  ...Controlled,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('active')).toHaveTextContent('list');
    await userEvent.click(canvas.getByRole('button', { name: 'Show the message' }));
    await expect(await canvas.findByRole('region', { name: 'Message' })).toHaveFocus();
    await expect(canvas.queryByRole('region', { name: 'Messages' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(await canvas.findByRole('region', { name: 'Messages' })).toHaveFocus();
    await expect(canvas.getByTestId('active')).toHaveTextContent('list');
  },
};

/** `collapseBelow` moves the breakpoint: at 768px `xl` already shows one pane, `md` shows both. */
export const CollapseBelow: Story = {
  globals: { viewport: { value: 'tablet', isRotated: false } },
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex flex-col gap-4">
      {(['md', 'xl'] as const).map((b) => (
        <Frame key={b} height={160}>
          <SplitView collapseBelow={b}>
            <SplitView.Pane id={`${b}-list`} label={`${b} list`} width="w-56">
              <MailList onSelect={() => {}} />
            </SplitView.Pane>
            <SplitView.Pane id={`${b}-detail`} label={`${b} detail`}>
              <Message mail={mails[0]!} />
            </SplitView.Pane>
          </SplitView>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'md list' })).toBeVisible();
    await expect(canvas.getByRole('region', { name: 'md detail' })).toBeVisible();
    // Collapsed: the first pane shows, as no pane is active.
    await expect(canvas.getByRole('region', { name: 'xl list' })).toBeVisible();
    await expect(canvas.queryByRole('region', { name: 'xl detail' })).toBeNull();
  },
};
