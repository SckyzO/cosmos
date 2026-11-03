import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import {
  SlowFolds,
  clipOf,
  expectFoldClosed,
  expectFoldOpen,
  finishAnimations,
  foldOf,
  closedRotation,
  rotationOf,
} from '../storybook-folds';
import { CodeBlock } from '../ui/CodeBlock';
import { ChatToolCall } from './ChatToolCall';

const INPUT = `{
  "query": "debounce search input",
  "limit": 3
}`;
const OUTPUT = `[
  { "title": "useDebounce", "score": 0.92 },
  { "title": "Throttling vs debouncing", "score": 0.81 }
]`;

const meta = {
  title: 'Chat/ChatToolCall',
  component: ChatToolCall,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    name: 'search_docs',
    status: 'done',
    duration: '1.2s',
    input: <CodeBlock code={INPUT} language="json" />,
    output: <CodeBlock code={OUTPUT} language="json" />,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatToolCall>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "Done in {duration}", with a check in the success color. */
export const Done: Story = {};

/** A spinner and "Running", muted. */
export const Running: Story = {
  args: { status: 'running', duration: undefined, output: undefined },
};

/** An alert icon and "Failed", in the danger color. */
export const Failed: Story = {
  args: {
    status: 'failed',
    duration: undefined,
    output: <CodeBlock code={'Error: the docs index timed out after 10 s'} />,
  },
};

/** Without `duration` the status reads "Done". */
export const DoneWithoutDuration: Story = {
  args: { duration: undefined },
};

/** Open: "Input" and "Output", each a muted caption over its node. */
export const Open: Story = {
  args: { defaultOpen: true },
};

/**
 * The details unfold and fold back in 200 ms: the height runs from 0 to its size while the input
 * and the output fade in and slide 4 px, and the chevron turns with it.
 */
export const Unfolds: Story = {
  parameters: { settleMotion: false },
};

export const InEachStatus: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <ChatToolCall {...args} status="running" duration={undefined} output={undefined} />
      <ChatToolCall {...args} status="done" duration="1.2s" />
      <ChatToolCall {...args} status="failed" duration={undefined} />
    </div>
  ),
};

export const OutputShowsOnlyWhenExpanded: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /search_docs/ });
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('Output')).toBeNull();
    await expect(canvas.queryByText(/useDebounce/)).toBeNull();
    await userEvent.click(row);
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('Input')).toBeVisible();
    await expect(canvas.getByText('Output')).toBeVisible();
    await expect(canvas.getByText(/useDebounce/)).toBeVisible();
    // The button controls the region it opens.
    const id = row.getAttribute('aria-controls');
    await expect(id && document.getElementById(id)).toContainElement(canvas.getByText('Output'));
    // Closed again, the details are folded, not unmounted: not shown and out of reach.
    await userEvent.click(row);
    await expect(canvas.getByText('Output')).not.toBeVisible();
    await expect(foldOf(row)).toContainElement(canvas.getByText('Output'));
  },
};

/**
 * The details are a fold: closed, inert and out of the accessibility tree at once while the height
 * is still moving, their content kept; open, reachable at once and unclipped at rest. Slowed to
 * 2 s to read the middle.
 */
export const DetailsFoldAndStayMounted: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: (args) => (
    <SlowFolds>
      <ChatToolCall {...args} />
    </SlowFolds>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /search_docs/ });
    const body = foldOf(row);
    expectFoldClosed(body);
    await expect(rotationOf(row.querySelector('svg')!)).toBe(
      closedRotation(row.querySelector('svg')!)
    );

    await userEvent.click(row);
    await expect(body.inert).toBe(false);
    await expect(body).not.toHaveAttribute('aria-hidden');
    await expect(getComputedStyle(clipOf(body)).overflow).toBe('hidden');
    await finishAnimations(body);
    await expectFoldOpen(body);
    await finishAnimations(row);
    await expect(rotationOf(row.querySelector('svg')!)).toBe('90deg');
    await expect(body.getBoundingClientRect().height).toBeGreaterThan(0);

    await userEvent.click(row);
    expectFoldClosed(body);
    await expect(body.getBoundingClientRect().height).toBeGreaterThan(0);
    await expect(body.getAnimations().length).toBeGreaterThan(0);
    await expect(canvas.getByText('Output')).toBeInTheDocument();
    await finishAnimations(body);
    await expect(body.getBoundingClientRect().height).toBe(0);
  },
};

/** With the Animations setting on "Reduced", the details open and close at once. */
export const ReducedMotionFoldsAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  globals: { motion: 'reduced' },
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /search_docs/ });
    const body = foldOf(row);
    await expect(getComputedStyle(body).transitionDuration).toBe('0s');
    await userEvent.click(row);
    await expect(body.getAnimations({ subtree: true })).toHaveLength(0);
    await expect(getComputedStyle(clipOf(body)).overflow).toBe('visible');
    await userEvent.click(row);
    await expect(body.getAnimations({ subtree: true })).toHaveLength(0);
    await expect(body.getBoundingClientRect().height).toBe(0);
  },
};

export const OpensWithTheKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /search_docs/ });
    await userEvent.tab();
    await expect(row).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    await expect(row).toHaveAttribute('aria-expanded', 'false');
  },
};

export const StatusIsTheOnlyLiveRegion: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultOpen: true },
  play: async ({ canvas, canvasElement }) => {
    const live = canvasElement.querySelectorAll('[aria-live]');
    await expect(live).toHaveLength(1);
    await expect(live[0]).toHaveAttribute('aria-live', 'polite');
    await expect(live[0]).toHaveTextContent('Done in 1.2s');
    // The spinner's own `role="status"` is out of the tree while running: "Loading" is not read.
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

const Progress = () => {
  const [status, setStatus] = useState<'running' | 'done'>('running');
  return (
    <>
      <button type="button" onClick={() => setStatus('done')}>
        finish
      </button>
      <ChatToolCall name="search_docs" status={status} duration="1.2s" />
    </>
  );
};

/** The status text changes inside the same live region, so the change is announced. */
export const StatusChangeStaysInTheLiveRegion: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Progress />,
  play: async ({ canvas, canvasElement }) => {
    const live = canvasElement.querySelector('[aria-live]')!;
    await expect(live).toHaveTextContent('Running');
    await userEvent.click(canvas.getByRole('button', { name: 'finish' }));
    await expect(canvasElement.querySelector('[aria-live]')).toBe(live);
    await expect(live).toHaveTextContent('Done in 1.2s');
  },
};

const onOpenChange = fn();

export const ControlledOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { open: false, onOpenChange },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /search_docs/ }));
    await expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled: it stays closed until the host passes `open` back.
    await expect(canvas.queryByText('Output')).toBeNull();
  },
};

export const LongNameStaysInTheRow: Story = {
  // Short code: a block that scrolls inside itself would need a focus stop of its own.
  args: {
    name: 'search_internal_documentation_index_with_a_very_long_tool_name',
    defaultOpen: true,
    input: <CodeBlock code={'{ "q": "x" }'} />,
    output: <CodeBlock code="[]" />,
  },
  globals: mobileViewport,
};

export const LongNameStaysInTheRowChecks: Story = {
  ...LongNameStaysInTheRow,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
    const name = within(canvasElement)
      .getByText(/search_internal/)
      .closest('span')!;
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
  },
};

export const ReadableInEveryTheme: Story = {
  ...InEachStatus,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    inEachTheme(() => {
      for (const live of canvasElement.querySelectorAll('[aria-live]')) expectTextContrast(live);
    });
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The chevron points to the end of the line when closed, down when open; the status is at the end. */
export const FollowsTheReadingDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-2">
        <ChatToolCall name="search_docs" status="done" duration="1.2s" />
        <ChatToolCall name="read_file" status="running" defaultOpen />
      </div>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelectorAll('button svg')[0]);
    expectMirrored(canvasElement, (box) => box.querySelector('[aria-live]'));
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = canvasElement.querySelector<HTMLElement>(`[data-direction="${dir}"]`)!;
      const [closed, open] = [...box.querySelectorAll('button')].map((b) =>
        b.querySelector('svg')!
      );
      expect(getComputedStyle(closed!).rotate, `${dir}: closed`).toBe(
        dir === 'rtl' ? '180deg' : 'none'
      );
      expect(getComputedStyle(open!).rotate, `${dir}: open`).toBe('90deg');
    }
  },
};
