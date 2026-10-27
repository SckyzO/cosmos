import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { JobLog, type JobLogProps } from './JobLog';
import { parseJobLogHash, type JobLogLineRef } from './job-log';
import {
  ANSI_STEPS,
  BUILD_STEPS,
  HOSTILE_STEP,
  longSteps,
  runningSteps,
} from './storybook-job-log';

const meta = {
  title: 'Monitoring/JobLog',
  component: JobLog,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { steps: [] },
} satisfies Meta<typeof JobLog>;

export default meta;
type Story = StoryObj<typeof meta>;

const BUILD_HEADER = {
  title: 'Build #1287',
  meta: 'main · 4f2c1a9',
  status: 'failed',
  duration: 123_000,
} as const;

const atEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 30;

const scrollerOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole('region');

// ── A finished build ────────────────────────────────────────────────────────

/**
 * A finished build in the terminal tone, dark in every theme. The failed step starts open, with
 * the lines of the failure; the passed and skipped steps are closed. Each line number is a link.
 */
export const FailedBuild: Story = {
  args: { steps: BUILD_STEPS, ...BUILD_HEADER, height: 520 },
};

/** The surface tone follows the theme: for a card on a page. */
export const Surface: Story = {
  args: { steps: BUILD_STEPS, ...BUILD_HEADER, tone: 'surface', height: 520 },
};

/** A line is marked as the current one: its step opens, it scrolls into view and takes `aria-current`. */
export const CurrentLine: Story = {
  args: {
    steps: BUILD_STEPS,
    ...BUILD_HEADER,
    height: 360,
    defaultCurrentLine: { step: 'run-tests', line: 6 },
    defaultExpandedSteps: ['install'],
  },
};

/** The search counts the lines that match across every step, closed or not, and highlights them. */
export const Search: Story = {
  args: { steps: BUILD_STEPS, ...BUILD_HEADER, height: 520, defaultSearch: 'pipeline' },
};

// ── Timestamps ──────────────────────────────────────────────────────────────

/** The timestamps column with the time of each line, as `LogViewer` shows it. */
export const TimestampsClock: Story = {
  args: {
    steps: BUILD_STEPS,
    ...BUILD_HEADER,
    height: 520,
    defaultTimestamps: true,
    locale: 'en-GB',
    timeZone: 'UTC',
  },
};

/** The same column as the time since the step started. A step with no `startedAt` counts from its first timestamp. */
export const TimestampsElapsed: Story = {
  args: {
    steps: BUILD_STEPS,
    ...BUILD_HEADER,
    height: 520,
    defaultTimestamps: true,
    timestampFormat: 'elapsed',
    tone: 'surface',
  },
};

// ── A running step ──────────────────────────────────────────────────────────

/** The log of a deploy that streams a line every 400 ms. The host measures the durations. */
const StreamingJob = (props: Partial<JobLogProps>) => {
  const [count, setCount] = useState(6);
  useEffect(() => {
    const timer = window.setInterval(() => setCount((n) => n + 1), 400);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <JobLog
      title="Deploy staging #412"
      meta="release/2.4 · 9b07e3c"
      status="running"
      duration={80_000 + count * 700}
      steps={runningSteps(count)}
      tone="surface"
      defaultTimestamps
      timestampFormat="elapsed"
      height={520}
      {...props}
    />
  );
};

/**
 * A step that streams: the log follows the end, pauses when the reader scrolls up, and "Jump to
 * latest" counts what came meanwhile. The step after it waits, queued.
 */
export const RunningStep: Story = {
  tags: ['no-capture'],
  render: () => <StreamingJob />,
};

/** A running step that does not move: the log follows its end. */
export const RunningStepStill: Story = {
  args: {
    steps: runningSteps(60),
    title: 'Deploy staging #412',
    meta: 'release/2.4 · 9b07e3c',
    status: 'running',
    duration: 122_000,
    tone: 'surface',
    height: 420,
  },
};

// ── A long log ──────────────────────────────────────────────────────────────

/** A step of 20,000 lines. Only the lines in view, and a few more, are in the page. */
export const LongLog: Story = {
  args: {
    steps: longSteps(20_000),
    title: 'Build #1301',
    status: 'passed',
    duration: 805_000,
    height: 520,
    defaultExpandedSteps: ['compile'],
    defaultTimestamps: true,
    timestampFormat: 'elapsed',
  },
};

// ── ANSI ────────────────────────────────────────────────────────────────────

/**
 * Every colour a job can write: the 8 and their bright variants, as a foreground and as a
 * background, in each tone. The codes are read into theme colours that hold 4.5:1 in the four
 * themes; 256-colour and truecolor codes land on the nearest of the 16, and the other escape
 * sequences (cursor moves, window titles) are dropped.
 */
export const Ansi: Story = {
  render: () => (
    <div className="grid gap-6">
      <JobLog
        steps={ANSI_STEPS}
        title="Terminal"
        defaultExpandedSteps={['foreground', 'background', 'attributes']}
        controls={[]}
        height={560}
        aria-label="ANSI colours on the terminal tone"
      />
      <JobLog
        steps={ANSI_STEPS}
        title="Surface"
        tone="surface"
        defaultExpandedSteps={['foreground', 'background', 'attributes']}
        controls={[]}
        height={560}
        aria-label="ANSI colours on the surface tone"
      />
    </div>
  ),
};

// ── Syncing the current line with the URL hash ──────────────────────────────

/**
 * `JobLog` never reads or writes `location`. A host that wants shareable links does it in two
 * places: it reads the hash into `currentLine` (once, and on `hashchange`), and writes it back
 * from `onCurrentLineChange`. `parseJobLogHash` is the inverse of the links' `href`.
 */
const HashSynced = () => {
  const [line, setLine] = useState<JobLogLineRef | null>(
    () => parseJobLogHash(window.location.hash, 'job-') ?? { step: 'run-tests', line: 8 }
  );
  useEffect(() => {
    const onHashChange = () => setLine(parseJobLogHash(window.location.hash, 'job-'));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return (
    <div className="grid gap-3">
      <JobLog
        steps={BUILD_STEPS}
        {...BUILD_HEADER}
        height={420}
        idPrefix="job-"
        currentLine={line}
        onCurrentLineChange={(next) => {
          setLine(next);
          // `replaceState`: no new history entry per click, and the page does not jump.
          window.history.replaceState(null, '', `#job-${next.step}-L${next.line}`);
        }}
      />
      <p className="m-0 font-mono text-xs text-gray-600 dark:text-gray-400">
        location.hash: <output data-testid="hash">{window.location.hash || '(none)'}</output>
      </p>
    </div>
  );
};

export const SyncedWithTheUrlHash: Story = {
  render: () => <HashSynced />,
};

// ── 375px ───────────────────────────────────────────────────────────────────

/** At 375px the search stays in the bar and the other controls move into "More options"; the lines of a step scroll sideways. */
export const FailedBuildMobile: Story = {
  ...FailedBuild,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const RunningStepMobile: Story = {
  ...RunningStep,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const LongLogMobile: Story = {
  ...LongLog,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Tests ───────────────────────────────────────────────────────────────────

/** A step opens and closes from its header with Enter and with Space, and says so with `aria-expanded`. */
export const StepsToggleByKeyboard: Story = {
  ...FailedBuild,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('button', { name: /Install dependencies/ });
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('group', { name: 'Install dependencies output' })).toBeNull();
    header.focus();
    await userEvent.keyboard('{Enter}');
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    const body = canvas.getByRole('group', { name: 'Install dependencies output' });
    await expect(header).toHaveAttribute('aria-controls', body.id);
    await userEvent.keyboard(' ');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('group', { name: 'Install dependencies output' })).toBeNull();
    // Failed steps start open, the others closed.
    await expect(canvas.getByRole('button', { name: /Run tests/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(canvas.getByRole('button', { name: /Post cache/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  },
};

/** The toolbar's "expand all" opens every step, and the same button collapses them. */
export const ExpandAndCollapseAll: Story = {
  ...FailedBuild,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand all steps' }));
    for (const header of canvas.getAllByRole('button', { name: /^(Passed|Failed|Skipped)/ }))
      await expect(header).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse all steps' }));
    for (const header of canvas.getAllByRole('button', { name: /^(Passed|Failed|Skipped)/ }))
      await expect(header).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Clicking a line number reports the line, marks it and does not touch the URL. */
export const LineLinkSelectsTheLine: Story = {
  ...FailedBuild,
  tags: ['!dev', '!autodocs'],
  args: { ...FailedBuild.args, onCurrentLineChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const before = window.location.href;
    const group = canvas.getByRole('group', { name: 'Run tests output' });
    const link = within(group).getByRole('link', { name: 'Line 8' });
    await expect(link).toHaveAttribute('href', '#run-tests-L8');
    await expect(link).not.toHaveAttribute('aria-current');
    await userEvent.click(link);
    await expect(args.onCurrentLineChange).toHaveBeenCalledWith({ step: 'run-tests', line: 8 });
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(window.location.href).toBe(before);
    // Another line takes the mark.
    await userEvent.click(within(group).getByRole('link', { name: 'Line 3' }));
    await expect(link).not.toHaveAttribute('aria-current');
    await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
  },
};

/** A `currentLine` in a closed step opens it, scrolls to the line and marks it. */
export const CurrentLineOpensItsStep: Story = {
  ...LongLog,
  tags: ['!dev', '!autodocs'],
  args: {
    ...LongLog.args,
    defaultExpandedSteps: [],
    defaultCurrentLine: { step: 'compile', line: 12_000 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Compile/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const link = await canvas.findByRole('link', { name: 'Line 12000' });
    await expect(link).toHaveAttribute('aria-current', 'location');
    const scroller = scrollerOf(canvasElement);
    await waitFor(() => {
      const [view, row] = [scroller.getBoundingClientRect(), link.getBoundingClientRect()];
      expect(row.top).toBeGreaterThanOrEqual(view.top);
      expect(row.bottom).toBeLessThanOrEqual(view.bottom);
    });
  },
};

/** The host that syncs the hash reads it on load and writes it on a click: the log itself never does. */
export const HashSyncWritesTheHash: Story = {
  ...SyncedWithTheUrlHash,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', { name: 'Line 8' });
    await expect(link).toHaveAttribute('aria-current', 'location');
    await userEvent.click(
      within(canvas.getByRole('group', { name: 'Run tests output' })).getByRole('link', {
        name: 'Line 2',
      })
    );
    await waitFor(() => expect(window.location.hash).toBe('#job-run-tests-L2'));
    await expect(canvas.getByTestId('hash')).toHaveTextContent('#job-run-tests-L2');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  },
};

/** Markup and escape-looking text in a line is text: no element is created from it. */
export const HostileLineRendersAsText: Story = {
  args: { steps: [HOSTILE_STEP], defaultExpandedSteps: ['hostile'], height: 280 },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Hostile lines output' });
    await expect(group).toHaveTextContent('<img src=x onerror="window.__jobLogPwned = true">');
    await expect(group).toHaveTextContent('<script>window.__jobLogPwned = true</script>');
    await expect(group).toHaveTextContent(
      '&lt;b&gt;not bold&lt;/b&gt; &amp; entities stay as typed'
    );
    await expect(canvasElement.querySelector('img, script, b')).toBeNull();
    await expect(group.querySelectorAll('a')).toHaveLength(4);
    await expect((window as { __jobLogPwned?: boolean }).__jobLogPwned).toBeUndefined();
  },
};

/** ANSI colour codes become styled spans: the escape characters are gone, the text stays. */
export const AnsiColoursBecomeSpans: Story = {
  ...Ansi,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [terminal] = canvas.getAllByRole('region');
    const red = within(terminal!).getByText('red text');
    await expect(red.tagName).toBe('SPAN');
    await expect(red.className).toMatch(/text-red/);
    const background = within(terminal!).getByText(/^\s*blue background\s*$/);
    await expect(background.className).toMatch(/bg-blue/);
    const bold = within(terminal!).getByText('bold');
    await expect(bold.className).toMatch(/font-semibold/);
    // No escape character reaches the page, and a carriage return keeps the last segment.
    await expect(canvasElement.textContent).not.toContain('\x1b');
    await expect(within(terminal!).getByText(/^Progress 100%/)).toBeInTheDocument();
    await expect(canvasElement.textContent).not.toContain('Progress 10%');
    await expect(canvasElement.textContent).not.toContain('window title');
  },
};

/** 20,000 lines: the page holds a bounded number of rows, before and after scrolling a long way. */
export const LongLogIsWindowed: Story = {
  ...LongLog,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = () => canvasElement.querySelectorAll('[data-line]').length;
    await expect(canvas.getByRole('link', { name: 'Line 1' })).toBeInTheDocument();
    await expect(rows()).toBeLessThan(200);
    const scroller = scrollerOf(canvasElement);
    scroller.scrollTop = scroller.scrollHeight / 2;
    await waitFor(() => expect(canvas.queryByRole('link', { name: 'Line 1' })).toBeNull());
    await expect(rows()).toBeGreaterThan(0);
    await expect(rows()).toBeLessThan(200);
    // The rows in the page are the ones in view.
    const first = canvasElement.querySelector('[data-line]') as HTMLElement;
    await expect(Number(first.dataset.line)).toBeGreaterThan(1000);
  },
};

/** Scrolling up in a running step pauses following; "Jump to latest" goes back to the end and resumes. */
export const ScrollingUpPausesFollowing: Story = {
  ...RunningStepStill,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = scrollerOf(canvasElement);
    await waitFor(() => expect(atEnd(scroller)).toBe(true));
    await expect(canvas.getByText('Following the running step')).toBeInTheDocument();
    scroller.scrollTop = 0;
    const jump = await canvas.findByRole('button', { name: /Jump to latest/ });
    await expect(canvas.getByText('Paused')).toBeInTheDocument();
    await userEvent.click(jump);
    await waitFor(() => expect(atEnd(scroller)).toBe(true));
    await expect(canvas.getByText('Following the running step')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  },
};

/** The Pause button stops following without scrolling, and the log stays where it is. */
export const PauseButton: Story = {
  ...RunningStepStill,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = scrollerOf(canvasElement);
    await waitFor(() => expect(atEnd(scroller)).toBe(true));
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
    await expect(canvas.getByText('Paused')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Jump to latest/ })).toBeInTheDocument();
  },
};

/** A match in a closed step opens it, and the count and the arrows move between the matches of every step. */
export const SearchOpensAClosedStep: Story = {
  ...FailedBuild,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('button', { name: /Install dependencies/ });
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search the log' }), 'glob@');
    await expect(canvas.getByText('1/1')).toBeInTheDocument();
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    const mark = canvasElement.querySelector('mark');
    await expect(mark).toHaveTextContent('glob@');
    // A term in two steps: the arrows go from one to the other, opening the second.
    const field = canvas.getByRole('textbox', { name: 'Search the log' });
    await userEvent.clear(field);
    await userEvent.type(field, 'Done in');
    await expect(canvas.getByText('1/1')).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, 'job');
    await expect(canvas.getByText('1/2')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Set up job/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Next match' }));
    await expect(canvas.getByText('2/2')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Post cache/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await userEvent.clear(field);
    await userEvent.type(field, 'nothing like this');
    await expect(canvas.getByText('No matches')).toBeInTheDocument();
  },
};

/** The timestamps toggle adds the column, and the elapsed format reads from the start of the step. */
export const TimestampsToggleAndElapsed: Story = {
  ...FailedBuild,
  tags: ['!dev', '!autodocs'],
  args: { ...FailedBuild.args, timestampFormat: 'elapsed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.textContent).not.toContain('+0:00.0');
    await userEvent.click(canvas.getByRole('button', { name: 'Timestamps' }));
    await expect(canvas.getByRole('button', { name: 'Timestamps' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    const group = canvas.getByRole('group', { name: 'Run tests output' });
    await expect(group).toHaveTextContent('+0:00.0');
    await expect(group).toHaveTextContent('+0:11.7');
    await expect(group).toHaveTextContent('+1:11.9');
  },
};

/** At 375px the options are in a menu: timestamps and wrap are checkable items, the search stays. */
export const MobileMenuHoldsTheOptions: Story = {
  ...FailedBuildMobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Search the log' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Wrap lines' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    const menu = within(document.body).getByRole('menu', { name: 'Log options' });
    const timestamps = within(menu).getByRole('menuitemcheckbox', { name: 'Timestamps' });
    await expect(timestamps).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(timestamps);
    await expect(timestamps).toHaveAttribute('aria-checked', 'true');
    await expect(within(menu).getByRole('menuitem', { name: 'Expand all steps' })).toBeVisible();
    await expect(within(menu).getByRole('menuitem', { name: 'Download the log' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(canvasElement.textContent).toMatch(/\d\d:\d\d:\d\d/);
  },
};

/** The header of the open step sticks to the top of the log while its lines scroll under it. */
export const OpenStepHeaderSticks: Story = {
  ...LongLog,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = scrollerOf(canvasElement);
    const header = canvas.getByRole('button', { name: /Compile/ });
    scroller.scrollTop = scroller.scrollHeight / 3;
    await waitFor(() => expect(canvas.queryByRole('link', { name: 'Line 1' })).toBeNull());
    await expect(header.getBoundingClientRect().top).toBeCloseTo(
      scroller.getBoundingClientRect().top + scroller.clientTop,
      0
    );
    await expect(header).toBeVisible();
  },
};

/** `wrap` keeps a long line inside the log, and turning it off scrolls the lines of a step sideways. */
export const WrapKeepsLongLinesInView: Story = {
  args: {
    steps: [
      {
        id: 'long',
        name: 'Long line',
        status: 'passed',
        lines: ['short', `error: ${'the collector could not reach the target. '.repeat(12)}`],
      },
    ],
    defaultExpandedSteps: ['long'],
    height: 320,
  },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lines = () => canvasElement.querySelector<HTMLElement>('[data-lines]')!;
    await expect(lines().scrollWidth).toBeGreaterThan(lines().clientWidth);
    await userEvent.click(canvas.getByRole('button', { name: 'Wrap lines' }));
    await waitFor(() => expect(lines().scrollWidth).toBeLessThanOrEqual(lines().clientWidth));
    await expect(canvas.getByRole('button', { name: 'Wrap lines' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
};
