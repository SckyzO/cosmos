import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { SplitView } from '../layout/SplitView';
import { Card } from '../ui/Card';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { LogViewer } from './LogViewer';
import { LogConsole, SOURCES, fakeLine, fakeLines } from './storybook-logs';
import type { LogLevelKey, LogLine } from './types';

const meta = {
  title: 'Monitoring/Log Viewer',
  component: LogViewer,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { lines: [] },
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const atEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 30;

/** The terminal tone, dark in every theme: the default, with the toolbar wired to it. */
export const Terminal: Story = {
  render: () => <LogConsole count={400} />,
};

/**
 * A live stream from a fake feed: two lines every 400 ms. The viewer follows the end; scroll up to
 * pause it, and "Jump to latest" counts what came meanwhile.
 */
export const LiveStream: Story = {
  tags: ['no-capture'],
  render: () => <LogConsole count={200} feed={2} />,
};

/** Paused: the reader is not at the end, and twelve lines have arrived since. */
export const PausedWithNewLines: Story = {
  render: () => {
    const [lines, setLines] = useState(() => fakeLines(200));
    const [added, setAdded] = useState(false);
    // The twelve lines come right after the first render, so the viewer counts them as waiting.
    if (!added) {
      setAdded(true);
      queueMicrotask(() => setLines((previous) => [...previous, ...fakeLines(12, 201)]));
    }
    return (
      <Card padding="none" className="overflow-hidden">
        <LogViewer
          lines={lines}
          aria-label="Backend logs"
          follow={false}
          onFollowChange={() => {}}
        />
      </Card>
    );
  },
};

/** A search for "timeout": every match is highlighted and the active one is stronger. */
export const SearchWithMatches: Story = {
  render: () => <LogConsole count={300} search="timeout" />,
};

/** A row with fields or a stack trace expands in place. */
export const ExpandedRow: Story = {
  render: () => (
    <Card padding="none" className="overflow-hidden">
      <LogViewer
        lines={fakeLines(60)}
        aria-label="Backend logs"
        defaultExpandedIds={[8, 23]}
        lineNumbers
        follow={false}
        onFollowChange={() => {}}
        height={360}
      />
    </Card>
  ),
};

/** The surface tone follows the theme: for a card on a dashboard. Comfortable puts the message under its details. */
export const SurfaceComfortable: Story = {
  render: () => (
    <Card padding="none" className="overflow-hidden">
      <LogViewer
        lines={fakeLines(80)}
        aria-label="Backend logs"
        tone="surface"
        density="comfortable"
        height={420}
      />
    </Card>
  ),
};

/** The surface tone, compact, with line numbers and the newest line first. */
export const SurfaceNewestFirst: Story = {
  render: () => (
    <Card padding="none" className="overflow-hidden">
      <LogViewer
        lines={fakeLines(120)}
        aria-label="Backend logs"
        tone="surface"
        order="newest-first"
        lineNumbers
        height={320}
      />
    </Card>
  ),
};

// Every fifth line is long enough to wrap.
const longLines = () =>
  fakeLines(40).map((line, i) =>
    i % 5 === 0
      ? {
          ...line,
          message: `${line.message}: ${'the collector could not reach the target. '.repeat(6)}`,
        }
      : line
  );

/** `wrap` keeps long lines in view instead of scrolling sideways. */
export const Wrapped: Story = {
  render: () => {
    const lines = longLines();
    return (
      <Card padding="none" className="overflow-hidden">
        <LogViewer lines={lines} aria-label="Backend logs" wrap height={360} />
      </Card>
    );
  },
};

/** The widget of a dashboard: the last errors in a card, the surface tone, no toolbar, a fixed height. */
export const RecentErrors: Story = {
  render: () => {
    const errors = fakeLines(400)
      .filter((line) => line.level === 'error')
      .slice(-8);
    return (
      <div className="max-w-md">
        <Card padding="none">
          <Card.Header>
            <h3 className="m-0 text-base font-semibold text-[var(--color-text-primary)]">
              Recent errors
            </h3>
          </Card.Header>
          <LogViewer
            lines={errors}
            aria-label="Recent errors"
            tone="surface"
            columns={['time']}
            height={196}
            className="rounded-b-xl"
            announceErrors
          />
        </Card>
      </div>
    );
  },
};

/** Two viewers split by source, side by side in a `SplitView`. */
export const SplitBySource: Story = {
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => {
    const lines = fakeLines(300);
    const only = (source: string) => lines.filter((line) => line.source === source);
    return (
      <div style={{ height: 420 }}>
        <SplitView>
          <SplitView.Pane id="api" label="api.http">
            <LogViewer
              lines={only(SOURCES[0]!)}
              aria-label="api.http logs"
              columns={['time', 'level']}
              height="100%"
            />
          </SplitView.Pane>
          <SplitView.Pane id="prom" label="prom.client">
            <LogViewer
              lines={only(SOURCES[1]!)}
              aria-label="prom.client logs"
              columns={['time', 'level']}
              height="100%"
            />
          </SplitView.Pane>
        </SplitView>
      </div>
    );
  },
};

const HOSTILE: LogLine[] = [
  {
    id: 1,
    time: Date.parse('2026-01-15T06:12:00.000Z'),
    level: 'error',
    source: '<b>api</b>',
    message: '<img src=x onerror="window.__pwned = 1"><script>window.__pwned = 2</script>',
    fields: { html: '<a href="javascript:alert(1)">x</a>', note: 'text only' },
  },
  {
    id: 2,
    time: Date.parse('2026-01-15T06:12:01.000Z'),
    level: 'warn',
    message: 'bidi ‮echo txet desrever‬ and ⁦isolate⁩ end',
  },
  {
    id: 3,
    time: Date.parse('2026-01-15T06:12:02.000Z'),
    level: 'info',
    message: `long ${'0123456789'.repeat(500)} end`,
  },
];

/** A hostile line: markup, script tags, bidi control characters and a 5,000-character line, all drawn as text. */
export const HostileLine: Story = {
  render: () => (
    <Card padding="none" className="overflow-hidden">
      <LogViewer lines={HOSTILE} aria-label="Hostile logs" defaultExpandedIds={[1]} height={260} />
    </Card>
  ),
};

/** 50,000 lines: only the rows in view are drawn, so scrolling stays smooth. */
export const LargeBuffer: Story = {
  render: () => <LogConsole count={50000} height={420} />,
};

/**
 * A viewer 375px wide, in a card or a split view, whatever the screen: the row adapts to the width
 * of the viewer itself. The source column goes, and the row stays on one line; the viewer scrolls
 * sideways inside itself.
 */
export const NarrowViewer: Story = {
  render: () => (
    <div style={{ width: 375 }}>
      <Card padding="none" className="overflow-hidden">
        <LogViewer lines={fakeLines(60)} aria-label="Backend logs" height={300} />
      </Card>
    </div>
  ),
};

/** The same narrow viewer with `wrap`: the message goes on its own line, under the time and the level. */
export const NarrowWrapped: Story = {
  render: () => (
    <div style={{ width: 375 }}>
      <Card padding="none" className="overflow-hidden">
        <LogViewer lines={longLines()} aria-label="Backend logs" wrap height={360} />
      </Card>
    </div>
  ),
};

/** At 375px the toolbar keeps Live and the search in the bar, and the rest goes into Filters. */
export const Mobile: Story = {
  globals: mobileViewport,
  render: () => <LogConsole count={200} height={380} />,
  play: () => expectNoHorizontalOverflow(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

/** The test of `LiveStream`, hidden. */
export const FollowStopsWhenTheReaderScrollsUp: Story = {
  ...LiveStream,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await waitFor(() => expect(atEnd(log)).toBe(true));
    expect(canvas.queryByRole('button', { name: /Jump to latest/ })).toBeNull();

    log.scrollTop = 0;
    const jump = await canvas.findByRole('button', { name: /Jump to latest/ });
    // The feed goes on while the viewer is paused: the button counts the lines waiting.
    await waitFor(() => expect(jump.textContent).toMatch(/\(\d+ new\)/));
    const before = log.scrollTop;
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(log.scrollTop).toBe(before);

    await userEvent.click(jump);
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: /Jump to latest/ })).toBeNull()
    );
    await waitFor(() => expect(atEnd(log)).toBe(true));
  },
};

/** The test of `SearchWithMatches`, hidden. */
export const SearchMovesBetweenMatches: Story = {
  ...SearchWithMatches,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const status = await canvas.findByText(/^1 of \d+$/);
    const total = status.textContent!.split(' of ')[1]!;
    expect(Number(total)).toBeGreaterThan(2);
    expect(canvasElement.querySelectorAll('mark').length).toBeGreaterThan(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Next match' }));
    await canvas.findByText(`2 of ${total}`);
    await userEvent.click(canvas.getByRole('button', { name: 'Previous match' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous match' }));
    // Before the first match comes the last.
    await canvas.findByText(`${total} of ${total}`);
    await userEvent.click(canvas.getByRole('button', { name: 'Next match' }));
    await canvas.findByText(`1 of ${total}`);
  },
};

/** The test of `HostileLine`, hidden. */
export const HostileLineRendersAsText: Story = {
  ...HostileLine,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    expect(log.querySelector('img, script, a, b')).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    expect(log.textContent).toContain('<img src=x onerror="window.__pwned = 1">');
    expect(log.textContent).toContain('<b>api</b>');
    expect(log.textContent).toContain('<a href="javascript:alert(1)">x</a>');
    // The bidi characters stay inside their own message.
    const message = [...log.querySelectorAll('span')].find((el) =>
      el.textContent?.includes('bidi')
    );
    expect(getComputedStyle(message!).unicodeBidi).toBe('isolate');
    // The 5,000-character line is drawn whole and the row stays one line tall.
    expect(log.textContent).toContain('0123456789'.repeat(500));
  },
};

/** The test of `Terminal`, hidden: every level is a word. */
export const LevelsAreLabelledByText: Story = {
  render: () => (
    <LogViewer
      lines={[
        ...(['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const).map((level, i) => ({
          ...fakeLine(i + 1),
          level,
          fields: undefined,
          stack: undefined,
        })),
        { ...fakeLine(7), level: 'notice', fields: undefined, stack: undefined },
      ]}
      aria-label="Levels"
    />
  ),
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    for (const word of ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN'])
      // The hidden row that measures the others carries a level word too: skip it.
      expect(
        canvas.getAllByText(word).filter((el) => !el.closest('[aria-hidden="true"]'))
      ).toHaveLength(1);
  },
};

/** The test of the errors-only announcement. */
export const AnnouncesOnlyErrors: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [lines, setLines] = useState(() => fakeLines(5).filter((l) => l.level !== 'error'));
    const add = (level: string, message: string) =>
      setLines((previous) => [
        ...previous,
        { id: previous.length + 100, time: Date.now(), level, message },
      ]);
    return (
      <div>
        <button type="button" onClick={() => add('info', 'all quiet')}>
          Add info
        </button>
        <button type="button" onClick={() => add('error', 'disk full')}>
          Add error
        </button>
        <LogViewer lines={lines} aria-label="Backend logs" announceErrors height={200} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    // The log itself announces nothing.
    expect(log).toHaveAttribute('aria-live', 'off');
    const region = canvas.getByRole('status');
    expect(region).toHaveTextContent('');

    await userEvent.click(canvas.getByRole('button', { name: 'Add info' }));
    await canvas.findByText('all quiet');
    expect(region).toHaveTextContent('');

    await userEvent.click(canvas.getByRole('button', { name: 'Add error' }));
    await waitFor(() => expect(region).toHaveTextContent('error: disk full'));
  },
};

/** The test of `ExpandedRow`, hidden: a row expands and collapses with its button. */
export const RowExpandsInPlace: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LogViewer
      lines={fakeLines(40)}
      aria-label="Backend logs"
      follow={false}
      onFollowChange={() => {}}
    />
  ),
  play: async ({ canvas }) => {
    const [first] = canvas.getAllByRole('button', { name: 'Show details' });
    await userEvent.click(first!);
    const details = await canvas.findByRole('group', { name: /Details of line/ });
    expect(details).toHaveTextContent('request_id');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide details' }));
    await waitFor(() =>
      expect(canvas.queryByRole('group', { name: /Details of line/ })).toBeNull()
    );
  },
};

/** The test of `LargeBuffer`, hidden: 50,000 lines draw a few dozen rows. */
export const LargeBufferDrawsTheWindowOnly: Story = {
  ...LargeBuffer,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const log = canvas.getByRole('log');
    await waitFor(() => expect(atEnd(log)).toBe(true));
    const rows = () => canvasElement.querySelectorAll('[role="log"] [data-level]').length;
    expect(rows()).toBeGreaterThan(10);
    expect(rows()).toBeLessThan(150);
    log.scrollTop = 0;
    await waitFor(() => expect(canvas.getByText('Jump to latest', { exact: false })).toBeVisible());
    expect(rows()).toBeLessThan(150);
  },
};

/**
 * The test of a paused viewer, hidden: a filter that shortens the list makes the browser clamp the
 * scroll position, which lands at the end. That scroll is not the reader's: the viewer stays paused.
 */
export const PausedStaysPausedWhenAFilterChanges: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [lines] = useState(() => fakeLines(200));
    const [follow, setFollow] = useState(false);
    const [levels, setLevels] = useState<readonly LogLevelKey[] | undefined>(undefined);
    return (
      <div>
        <button type="button" onClick={() => setLevels(['fatal'])}>
          Fatal only
        </button>
        <p>{follow ? 'Following' : 'Paused'}</p>
        <LogViewer
          lines={lines}
          aria-label="Backend logs"
          follow={follow}
          onFollowChange={setFollow}
          activeLevels={levels}
          height={300}
        />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    log.scrollTop = 1200;
    await waitFor(() => expect(log.scrollTop).toBeGreaterThan(1000));
    const rows = () => log.querySelectorAll('[data-level]').length;
    const before = rows();

    await userEvent.click(canvas.getByRole('button', { name: 'Fatal only' }));
    // The list is a handful of rows now, which the browser clamps the scroll position to.
    await waitFor(() => expect(log.scrollHeight).toBeLessThan(log.clientHeight + 24));
    expect(rows()).toBeLessThan(before);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(canvas.getByText('Paused')).toBeVisible();
    expect(canvas.getByRole('button', { name: /Jump to latest/ })).toBeVisible();
  },
};

/** The test of resuming, hidden: the reader scrolling back to the end follows again. */
export const ScrollingBackToTheEndResumes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <LogConsole count={200} height={300} paused />,
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await canvas.findByRole('button', { name: /Jump to latest/ });
    log.scrollTop = log.scrollHeight;
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: /Jump to latest/ })).toBeNull()
    );
    await waitFor(() => expect(atEnd(log)).toBe(true));
  },
};

// The first row that is drawn, not the hidden one that measures the others.
const firstRow = (log: HTMLElement) =>
  [...log.querySelectorAll<HTMLElement>('[data-level]')].find(
    (row) => !row.closest('[aria-hidden="true"]')
  )!;
const isDrawn = (el: Element) => el.getClientRects().length > 0;

/** The test of `NarrowViewer`, hidden: no source, one line per row, and the page does not scroll. */
export const NarrowViewerScrollsInsideItself: Story = {
  ...NarrowViewer,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await waitFor(() => expect(log.clientWidth).toBeLessThanOrEqual(375));
    expectNoHorizontalOverflow();
    expect(log.querySelectorAll('[title]')).not.toHaveLength(0);
    for (const source of log.querySelectorAll('[title]')) expect(isDrawn(source)).toBe(false);
    // One line a row (the probe row measures the same), and the viewer scrolls, not the page.
    for (const row of log.querySelectorAll<HTMLElement>('[data-level]'))
      expect(row.offsetHeight).toBeLessThanOrEqual(24);
    expect(log.scrollWidth).toBeGreaterThan(log.clientWidth);
    // The hidden row that measures the others is narrow too: the window counts rows of its height.
    const probe = log.querySelector<HTMLElement>('[aria-hidden="true"]')!;
    expect(probe.offsetHeight).toBe(firstRow(log).offsetHeight);
  },
};

/** The test of `NarrowWrapped`, hidden: the message has the full width, on a line of its own. */
export const NarrowWrappedMessageHasTheFullWidth: Story = {
  ...NarrowWrapped,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await waitFor(() => expect(log.clientWidth).toBeLessThanOrEqual(375));
    expectNoHorizontalOverflow();
    for (const source of log.querySelectorAll('[title]')) expect(isDrawn(source)).toBe(false);
    expect(log.scrollWidth).toBeLessThanOrEqual(log.clientWidth);
    const row = firstRow(log);
    const message = row.querySelector<HTMLElement>('.whitespace-pre-wrap')!;
    const time = row.querySelector<HTMLElement>('time')!;
    // The message is as wide as the viewer less its padding, not a column of one word.
    expect(message.getBoundingClientRect().width).toBeGreaterThan(log.clientWidth * 0.8);
    // And it sits under the time and the level.
    expect(message.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      time.getBoundingClientRect().bottom
    );
  },
};

/** The test of the wide viewer, hidden: from `md` up the source column is back. */
export const WideViewerKeepsTheSource: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 720 }}>
      <LogViewer lines={fakeLines(20)} aria-label="Backend logs" height={200} />
    </div>
  ),
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    const sources = [...log.querySelectorAll('[title]')].filter(
      (el) => !el.closest('[aria-hidden="true"]')
    );
    expect(sources.length).toBeGreaterThan(5);
    for (const source of sources) expect(isDrawn(source)).toBe(true);
  },
};
