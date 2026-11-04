import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Inbox, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { StackedList } from '../lists/StackedList';
import { Button } from '../ui/Button';
import {
  expectBeyondEnd,
  expectBorderToken,
  expectNoHorizontalOverflow,
  inEachTheme,
  mirroredIcon,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { SlowFolds } from '../storybook-folds';
import { isFading, tokenMs, transitionMs } from '../storybook-motion';
import { Shell } from './Shell';
import { Sidebar } from './Sidebar';
import { SplitView, useSplitView } from './SplitView';
import { Topbar } from './Topbar';

// The back arrow points toward the start of the line, so it turns around in right to left.
const BackIcon = mirroredIcon(ArrowLeft);

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
  <StackedList>
    {mails.map((m) => (
      <StackedList.Item
        key={m.id}
        // A bare list takes its rows' inset from its container, here the pane.
        className="px-4"
        title={m.from}
        subtitle={m.subject}
        selected={m.id === selected}
        onClick={() => onSelect(m.id)}
      />
    ))}
  </StackedList>
);

const FolderList = () => (
  <nav aria-label="Folders" className="p-2">
    <ul>
      {FOLDERS.map((f, i) => (
        <li key={f.id}>
          <button
            type="button"
            aria-current={i === 0 || undefined}
            className="focus-visible:focus-indicator flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-[var(--color-text-secondary)] hover:bg-gray-50 focus-visible:ring-inset aria-[current]:bg-gray-100 aria-[current]:font-medium aria-[current]:text-[var(--color-text-primary)] dark:hover:bg-gray-800 dark:aria-[current]:bg-gray-800"
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
      <Button variant="ghost" size="sm" icon={BackIcon} onClick={onBack} className="mb-4 lg:hidden">
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
    expectBeyondEnd(detail, list);
    await userEvent.click(canvas.getAllByRole('button', { name: /Ops on-call/ })[0]!);
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
};

export const ThreePanesChecks: Story = {
  ...ThreePanes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const [folders, list, detail] = ['Folders', 'Messages', 'Message'].map((n) => pane(canvas, n));
    // The panes follow each other along the line: the first is nearest the start edge.
    const view = folders!.parentElement!;
    const starts = [folders, list, detail].map((p) => startOffset(p!, view));
    await expect(starts[0]).toBeLessThan(starts[1]!);
    await expect(starts[1]).toBeLessThan(starts[2]!);
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
      // The list's end edge is the divider: the border of the pane itself.
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
};

export const InAShellChecks: Story = {
  ...InAShell,
  tags: ['!dev', '!autodocs'],
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
        <StackedList.Item
          className="px-4"
          title={mail.from}
          subtitle={mail.subject}
          onClick={() => setActivePane('detail')}
        />
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
            <StackedList>
              {mails.map((m) => (
                <Row key={m.id} mail={m} />
              ))}
            </StackedList>
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
        <p className="text-sm text-[var(--color-text-secondary)]">
          The host shows the{' '}
          <strong className="font-semibold text-[var(--color-text-primary)]" data-testid="active">
            {active}
          </strong>{' '}
          pane.
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

// ── Right to left ───────────────────────────────────────────────────────────

/** The panes run from the start edge: the first on the right, with the divider after it. */
export const PanesFollowTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { ...laptop, direction: 'rtl' },
  render: () => (
    <Frame>
      <SplitView>
        <SplitView.Pane id="list" label="Messages" width="w-80">
          <MailList selected="m1" onSelect={() => {}} />
        </SplitView.Pane>
        <SplitView.Pane id="detail" label="Message">
          <Message mail={mails[0]!} />
        </SplitView.Pane>
      </SplitView>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const detail = pane(canvas, 'Message');
    const view = list.parentElement!;
    await expect(getComputedStyle(view).direction).toBe('rtl');
    // The list is at the start: flush with the right edge of the view, the detail on its left.
    await expect(startOffset(list, view)).toBeLessThanOrEqual(1);
    await expect(list.getBoundingClientRect().left).toBeGreaterThan(
      detail.getBoundingClientRect().left
    );
    // The divider is the list's border on its end side, the left.
    await expect(getComputedStyle(list).borderLeftWidth).toBe('1px');
    await expect(getComputedStyle(list).borderRightWidth).toBe('0px');
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

// A list that opens a message, and a Back button in the message, through `useSplitView`.
const OpenRow = () => {
  const { setActivePane } = useSplitView();
  return (
    <StackedList.Item
      className="px-4"
      title="Ana Ruiz"
      subtitle="Nightly backup finished"
      onClick={() => setActivePane('detail')}
    />
  );
};

const BackToTheList = () => {
  const { setActivePane } = useSplitView();
  return <Message mail={mails[0]!} onBack={() => setActivePane('list')} />;
};

const PhoneMail = () => (
  <Frame height={360}>
    <SplitView defaultActivePane="list">
      <SplitView.Pane id="list" label="Messages" width="w-80">
        <StackedList>
          <OpenRow />
        </StackedList>
      </SplitView.Pane>
      <SplitView.Pane id="detail" label="Message">
        <BackToTheList />
      </SplitView.Pane>
    </SplitView>
  </Frame>
);

/**
 * On a narrow screen the message slides in over the list from the end of the line in 300 ms, and
 * back out the same way when Back is pressed (from the left in right to left). Side by side
 * nothing moves. With the reduced setting the panes change at once.
 */
export const DetailSlidesOverTheList: Story = {
  globals: mobileViewport,
  parameters: { settleMotion: false },
  render: () => <PhoneMail />,
};

// The left edge inside the border of the view, which a pane at rest sits on.
const innerLeft = (view: HTMLElement) => view.getBoundingClientRect().left + view.clientLeft;

// Where the pane sits along the line in its view: its distance from the start edge of the view.
const fromStart = (el: HTMLElement) => startOffset(el, el.parentElement!);

/**
 * Opening the message: it is reachable and has focus at once, it comes in over the list from the
 * end of the line, and the list, still under it, is out of reach; once the slide has played the
 * list is out of the layout and the message is in the flow, at rest.
 */
export const DetailComesInFromTheEnd: Story = {
  ...DetailSlidesOverTheList,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <SlowFolds tokens={['--cosmos-motion-slow']}>
      <PhoneMail />
    </SlowFolds>
  ),
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const view = list.parentElement!;
    await expect(isFading(view)).toBe(false);
    await expect(transitionMs(list)).toBe(0);

    await userEvent.click(canvas.getByRole('button', { name: /Ana Ruiz/ }));
    const detail = canvas.getByRole('region', { name: 'Message' });
    await expect(detail).toHaveFocus();
    // Moving: over the list, which is still there, but out of reach and out of the tree.
    await expect(isFading(view)).toBe(true);
    // On the slowed token of the story.
    await expect(transitionMs(detail)).toBe(2000);
    await expect(list).toHaveAttribute('aria-hidden', 'true');
    await expect(list.inert).toBe(true);
    await expect(canvas.queryByRole('region', { name: 'Messages' })).toBeNull();
    await expect(getComputedStyle(list).display).not.toBe('none');
    await waitFor(() => expect(fromStart(detail)).toBeGreaterThan(1));
    await expect(fromStart(detail)).toBeLessThanOrEqual(view.clientWidth + view.clientLeft);
    // The root scrolled nowhere to reach it.
    await expect(view.scrollLeft).toBe(0);

    // Then: at rest. The list is gone from the layout, the message fills the view.
    await waitFor(() => expect(getComputedStyle(list).display).toBe('none'), { timeout: 6000 });
    await expect(isFading(view)).toBe(false);
    await expect(getComputedStyle(detail).translate).toBe('none');
    await expect(detail.getBoundingClientRect().width).toBe(view.clientWidth);
    await expect(fromStart(detail)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(detail).marginInlineStart).toBe('0px');
    await expect(detail).not.toHaveAttribute('aria-hidden');
    await expect(detail).toHaveFocus();
  },
};

/**
 * Going back: the list is the pane in place at once, reachable, with focus; the message leaves
 * toward the end of the line, out of reach, and is out of the layout when it has gone.
 */
export const DetailLeavesToTheEnd: Story = {
  ...DetailSlidesOverTheList,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <SlowFolds tokens={['--cosmos-motion-slow']}>
      <PhoneMail />
    </SlowFolds>
  ),
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const view = list.parentElement!;
    await userEvent.click(canvas.getByRole('button', { name: /Ana Ruiz/ }));
    const detail = canvas.getByRole('region', { name: 'Message' });
    await waitFor(() => expect(getComputedStyle(list).display).toBe('none'), { timeout: 6000 });

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    // The list is back, in place and not moving; the message is the one going.
    await expect(list).toHaveFocus();
    await expect(list).not.toHaveAttribute('aria-hidden');
    await expect(list.inert).toBe(false);
    await expect(getComputedStyle(list).translate).toBe('none');
    await expect(list.getBoundingClientRect().width).toBe(view.clientWidth);
    await expect(detail).toHaveAttribute('aria-hidden', 'true');
    await expect(detail.inert).toBe(true);
    await expect(isFading(view)).toBe(true);
    await waitFor(() => expect(fromStart(detail)).toBeGreaterThan(1));

    await waitFor(() => expect(getComputedStyle(detail).display).toBe('none'), { timeout: 6000 });
    await expect(isFading(view)).toBe(false);
    await expect(canvas.queryByRole('region', { name: 'Message' })).toBeNull();
    await expect(list).toHaveFocus();
  },
};

/** The slide runs on the slow token of the theme, 300 ms, and the old pane goes when it has played. */
export const DetailSlidesOnTheSlowToken: Story = {
  ...DetailSlidesOverTheList,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    await userEvent.click(canvas.getByRole('button', { name: /Ana Ruiz/ }));
    const detail = canvas.getByRole('region', { name: 'Message' });
    await expect(transitionMs(detail)).toBe(tokenMs('--cosmos-motion-slow'));
    await expect(isFading(list.parentElement!)).toBe(true);
    await waitFor(() => expect(getComputedStyle(list).display).toBe('none'), { timeout: 3000 });
    await expect(isFading(list.parentElement!)).toBe(false);
  },
};

/** In right to left the message comes from the left and leaves by it: the end of that line. */
export const DetailComesFromTheLeftInRightToLeft: Story = {
  ...DetailSlidesOverTheList,
  tags: ['!dev', '!autodocs'],
  globals: { ...mobileViewport, direction: 'rtl' },
  render: () => (
    <SlowFolds tokens={['--cosmos-motion-slow']}>
      <PhoneMail />
    </SlowFolds>
  ),
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const view = list.parentElement!;
    await expect(getComputedStyle(view).direction).toBe('rtl');
    await userEvent.click(canvas.getByRole('button', { name: /Ana Ruiz/ }));
    const detail = canvas.getByRole('region', { name: 'Message' });
    // Moving: shifted toward the left edge, with its start (the right) still inside the view.
    await waitFor(() => expect(startOffset(detail, view)).toBeGreaterThan(1));
    await expect(detail.getBoundingClientRect().left).toBeLessThan(innerLeft(view));
    await waitFor(() => expect(getComputedStyle(list).display).toBe('none'), { timeout: 6000 });
    await expect(startOffset(detail, view)).toBeLessThanOrEqual(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(startOffset(detail, view)).toBeGreaterThan(1));
    await expect(detail.getBoundingClientRect().left).toBeLessThan(innerLeft(view));
    await waitFor(() => expect(getComputedStyle(detail).display).toBe('none'), { timeout: 6000 });
  },
};

/** With the reduced setting the panes change at once: nothing slides, and the old pane is gone. */
export const PanesChangeAtOnceUnderReducedMotion: Story = {
  ...DetailSlidesOverTheList,
  tags: ['!dev', '!autodocs'],
  globals: { ...mobileViewport, motion: 'reduced' },
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const view = list.parentElement!;
    await userEvent.click(canvas.getByRole('button', { name: /Ana Ruiz/ }));
    const detail = canvas.getByRole('region', { name: 'Message' });
    await expect(isFading(view)).toBe(false);
    await expect(getComputedStyle(list).display).toBe('none');
    await expect(getComputedStyle(detail).translate).toBe('none');
    await expect(detail).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(isFading(view)).toBe(false);
    await expect(getComputedStyle(detail).display).toBe('none');
    await expect(list).toHaveFocus();
  },
};

/** Side by side nothing moves when the view changes pane: both stay, reachable, as they are. */
export const WideViewDoesNotMove: Story = {
  tags: ['!dev', '!autodocs'],
  globals: laptop,
  parameters: { settleMotion: false },
  render: () => {
    const Wide = () => {
      const [active, setActive] = useState('list');
      return (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setActive((id) => (id === 'list' ? 'detail' : 'list'))}>
            Switch
          </Button>
          <Frame height={240}>
            <SplitView activePane={active}>
              <SplitView.Pane id="list" label="Messages" width="w-80">
                <MailList onSelect={() => {}} />
              </SplitView.Pane>
              <SplitView.Pane id="detail" label="Message">
                <Message mail={mails[0]!} />
              </SplitView.Pane>
            </SplitView>
          </Frame>
        </div>
      );
    };
    return <Wide />;
  },
  play: async ({ canvas }) => {
    const list = pane(canvas, 'Messages');
    const detail = pane(canvas, 'Message');
    const view = list.parentElement!;
    const before = [list, detail].map((el) => el.getBoundingClientRect().toJSON());
    for (let n = 0; n < 2; n++) {
      await userEvent.click(canvas.getByRole('button', { name: 'Switch' }));
      await expect(isFading(view)).toBe(false);
      for (const el of [list, detail]) {
        await expect(el).not.toHaveAttribute('aria-hidden');
        await expect(el.inert).toBe(false);
        await expect(getComputedStyle(el).translate).toBe('none');
        await expect(getComputedStyle(el).marginInlineStart).toBe('0px');
        await expect(transitionMs(el)).toBe(0);
      }
      await expect([list, detail].map((el) => el.getBoundingClientRect().toJSON())).toEqual(before);
    }
  },
};

/** Three panes: back from the last one to the first leaves the last toward the end, the first in place. */
export const ThreePanesMoveTheLaterOne: Story = {
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  parameters: { settleMotion: false },
  render: () => {
    const Panes = () => {
      const [active, setActive] = useState('folders');
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['folders', 'list', 'detail'].map((id) => (
              <Button key={id} size="sm" onClick={() => setActive(id)}>
                {`Show ${id}`}
              </Button>
            ))}
          </div>
          <Frame height={240}>
            <SplitView activePane={active}>
              <SplitView.Pane id="folders" label="Folders">
                <FolderList />
              </SplitView.Pane>
              <SplitView.Pane id="list" label="Messages">
                <MailList onSelect={() => {}} />
              </SplitView.Pane>
              <SplitView.Pane id="detail" label="Message">
                <Message mail={mails[0]!} />
              </SplitView.Pane>
            </SplitView>
          </Frame>
        </div>
      );
    };
    return <Panes />;
  },
  play: async ({ canvas, canvasElement }) => {
    // By id: a pane that is not shown has no name for the accessibility tree.
    const panes = ['folders', 'list', 'detail'].map((id) =>
      canvasElement.querySelector<HTMLElement>(`[data-split-pane="${id}"]`)!
    );
    const settled = async (shown: number) => {
      for (const [i, el] of panes.entries()) {
        if (i === shown) await expect(getComputedStyle(el).display).not.toBe('none');
        else
          await waitFor(() => expect(getComputedStyle(el).display).toBe('none'), { timeout: 3000 });
      }
    };
    await userEvent.click(canvas.getByRole('button', { name: 'Show detail' }));
    await settled(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Show folders' }));
    // The last pane is the one that leaves, over the first, which is reachable at once.
    await expect(panes[2]!).toHaveAttribute('aria-hidden', 'true');
    await expect(panes[0]!).not.toHaveAttribute('aria-hidden');
    await settled(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Show list' }));
    await settled(1);
  },
};
