import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { endOffset, portalDocsParams, startOffset } from '../storybook-helpers';
import { isFading, tokenMs, transitionMs, transitionValues } from '../storybook-motion';
import { Modal } from '../ui/Modal';
import { Chatbot, type ChatbotMessage } from './Chatbot';

const meta = {
  title: 'Chat/Chatbot',
  component: Chatbot,
  parameters: portalDocsParams.full(),
  args: {
    title: 'Cosmos assistant',
    subtitle: 'Usually replies in a few seconds',
    onSend: fn(),
    messages: [],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chatbot>;

export default meta;
type Story = StoryObj<typeof meta>;

const history: ChatbotMessage[] = [
  {
    id: '1',
    role: 'bot',
    time: '14:02',
    text: 'Hi! I can help with racks, alerts and dashboards.',
  },
  { id: '2', role: 'user', time: '14:03', status: 'read', text: 'Which racks are over 80% power?' },
  { id: '3', role: 'bot', time: '14:03', text: 'Two racks: B4 (86%) and C1 (82%).' },
  { id: '4', role: 'bot', time: '14:03', text: 'Details: https://example.com/power?rack=B4' },
];

export const Closed: Story = {
  args: { messages: history, unreadCount: 2 },
};

export const Open: Story = {
  args: {
    messages: history,
    defaultOpen: true,
    suggestions: ['Show rack B4', 'Open an incident', 'Thanks!'],
  },
};

export const Typing: Story = {
  args: {
    messages: history.slice(0, 2),
    defaultOpen: true,
    typing: true,
  },
};

export const Streaming: Story = {
  args: {
    defaultOpen: true,
    messages: [
      ...history.slice(0, 2),
      { id: '3', role: 'bot', time: '14:03', streaming: true, text: 'Two racks: B4 (86%) and' },
    ],
  },
};

export const ErrorAndRetry: Story = {
  args: {
    defaultOpen: true,
    messages: [
      ...history.slice(0, 1),
      {
        id: '2',
        role: 'user',
        time: '14:03',
        status: 'failed',
        text: 'Which racks are over 80% power?',
      },
    ],
    error: 'The assistant could not be reached.',
    onRetry: fn(),
  },
};

export const RetryCallsOnRetry: Story = {
  ...ErrorAndRetry,
  tags: ['!dev', '!autodocs'],
  play: async ({ args }) => {
    const panel = await within(document.body).findByRole('dialog', { name: 'Cosmos assistant' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    // The prop is `() => void`: the click event stays with the button.
    await expect(args.onRetry).toHaveBeenCalledWith();
  },
};

const REPLY = 'Two racks are over 80%: B4 at 86% and C1 at 82%. Want me to open an incident?';

/** Fake backend: types for a moment, then streams the reply word by word. */
export const Playground: Story = {
  render: function Render(args) {
    const [messages, setMessages] = useState<ChatbotMessage[]>(history.slice(0, 1));
    const [typing, setTyping] = useState(false);
    const timers = useRef<number[]>([]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const later = (ms: number, run: () => void) => {
      timers.current.push(window.setTimeout(run, ms));
    };

    const onSend = (text: string) => {
      const id = Date.now();
      setMessages((prev) => [...prev, { id: `u${id}`, role: 'user', text, status: 'sent' }]);
      setTyping(true);
      const words = REPLY.split(' ');
      later(800, () => {
        setTyping(false);
        words.forEach((_, i) =>
          later(i * 60, () =>
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== `b${id}`),
              {
                id: `b${id}`,
                role: 'bot',
                text: words.slice(0, i + 1).join(' '),
                streaming: i < words.length - 1,
              },
            ])
          )
        );
      });
    };

    return (
      <Chatbot
        {...args}
        messages={messages}
        typing={typing}
        onSend={onSend}
        suggestions={messages.length === 1 ? ['Racks over 80% power?'] : undefined}
      />
    );
  },
};

/** A modal open over the chat takes the first Escape; the chat closes on the next one. */
export const EscapeClosesTheModalOverTheChatFirst: Story = {
  tags: ['!dev', '!autodocs'],
  args: { messages: history, defaultOpen: true },
  render: function Render(args) {
    const [modal, setModal] = useState(true);
    return (
      <>
        <Chatbot {...args} />
        <Modal open={modal} onClose={() => setModal(false)} ariaLabel="Confirm deletion">
          <Modal.Body>Delete rack B4?</Modal.Body>
        </Modal>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole('dialog', { name: 'Confirm deletion' });
    // The launcher tells whether the chat is open: a closed panel stays mounted while it fades out.
    const launcher = body.getByRole('button', { name: 'Open chat' });
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: 'Confirm deletion' })).toBeNull()
    );
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(launcher).toHaveAttribute('aria-expanded', 'false'));
  },
};

export const FocusManagement: Story = {
  tags: ['!dev', '!autodocs'],
  args: { messages: history, unreadCount: 3 },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const launcher = body.getByRole('button', { name: 'Open chat, 3 unread' });
    await userEvent.click(launcher);

    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    // Focus moves into the panel, on the composer.
    await waitFor(() =>
      expect(within(panel).getByRole('textbox', { name: 'Message' })).toHaveFocus()
    );
    await expect(within(panel).getByRole('log')).toHaveAttribute('aria-live', 'polite');

    // Escape closes and puts focus back on the launcher.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(body.getByRole('button', { name: 'Open chat, 3 unread' })).toHaveFocus();

    // The close button does the same.
    await userEvent.keyboard('{Enter}');
    const reopened = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await userEvent.click(within(reopened).getByRole('button', { name: 'Close chat' }));
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(launcher).toHaveFocus();
  },
};

export const SuggestionSends: Story = {
  tags: ['!dev', '!autodocs'],
  args: { messages: history, defaultOpen: true, suggestions: ['Show rack B4'] },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('button', { name: 'Show rack B4' }));
    await expect(args.onSend).toHaveBeenCalledWith('Show rack B4');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The launcher sits in the corner at the end of the line, with the panel above it, so on the left
 * where the page reads right to left. The panel is portalled: the page's `dir` reaches it.
 */
export const LauncherAndPanelSitInTheEndCorner: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { direction: 'rtl', viewport: { value: 'desktop', isRotated: false } },
  args: { messages: history, defaultOpen: true },
  play: async ({ canvasElement }) => {
    const page = canvasElement.ownerDocument.documentElement;
    const body = within(canvasElement.ownerDocument.body);
    await expect(getComputedStyle(page).direction).toBe('rtl');
    const launcher = body.getByRole('button', { name: 'Open chat' });
    const panel = await body.findByRole('dialog');
    await expect(endOffset(launcher, page)).toBe(24);
    await expect(endOffset(panel, page)).toBe(24);
    // The user's own message is at the end of the thread, on the left; the bot's at the start.
    const mine = body.getByText('Which racks are over 80% power?');
    const theirs = body.getByText('Two racks: B4 (86%) and C1 (82%).');
    await expect(endOffset(mine, panel)).toBeLessThan(startOffset(mine, panel));
    await expect(startOffset(theirs, panel)).toBeLessThan(endOffset(theirs, panel));
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

/**
 * The panel opens like a dialog: it fades in, rises 16px and grows from 95% out of the corner
 * nearest the launcher over 200 ms, then leaves over 120 ms. Click the launcher, Close or Escape.
 */
export const PanelOpensAndLeaves: Story = {
  tags: ['!autodocs'],
  parameters: { settleMotion: false },
  args: { messages: history },
};

const body = within(document.body);
const launcherOf = () => body.getByRole('button', { name: /Open chat/ });

/** Open, the panel is opaque at its full size, in its place, and takes events. */
export const PanelIsAtRestWhenOpen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { messages: history },
  play: async () => {
    await userEvent.click(launcherOf());
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await expect(getComputedStyle(panel).opacity).toBe('1');
    await expect(getComputedStyle(panel).scale).toBe('none');
    await expect(getComputedStyle(panel).translate).toBe('none');
    await expect(panel).not.toHaveAttribute('inert');
    await expect(getComputedStyle(panel).pointerEvents).not.toBe('none');
  },
};

/** Closing with nothing to animate (0 s, as in these tests): the panel is gone in the same render. */
export const ClosingAtZeroSecondsUnmountsAtOnce: Story = {
  tags: ['!dev', '!autodocs'],
  args: { messages: history, defaultOpen: true },
  play: async () => {
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Close chat' }));
    await expect(body.queryByRole('dialog')).toBeNull();
    await expect(launcherOf()).toHaveFocus();
    await expect(launcherOf()).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * At its real speed the panel opens over the base duration and leaves over the exit one, easing out
 * then in, from 16px down and 95%; closed, it is already out of the way while it leaves.
 */
export const LeavingPanelIsInertAndFocusIsBack: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  args: { messages: history },
  play: async () => {
    const launcher = launcherOf();
    await userEvent.click(launcher);
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await expect(transitionMs(panel)).toBe(tokenMs('--cosmos-motion-base'));
    await expect(isFading(panel)).toBe(true);
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));

    await userEvent.keyboard('{Escape}');
    // Still on screen, fading, with the shorter exit...
    await expect(panel).toBeInTheDocument();
    await expect(isFading(panel)).toBe(true);
    await expect(transitionMs(panel)).toBe(tokenMs('--cosmos-motion-exit-lg'));
    // ...heading back down and shrinking: 16px and 95%.
    await expect(transitionValues(panel, 'translate').at(-1)).toBe('0px 16px');
    await expect(transitionValues(panel, 'scale').at(-1)).toMatch(/^(0\.95|95%)/);
    // ...and already out of the way.
    await expect(panel).toHaveAttribute('inert');
    await expect(getComputedStyle(panel).pointerEvents).toBe('none');
    await expect(launcher).toHaveFocus();
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

/** Opened again while it leaves, the same panel comes back, not a second one. */
export const ReopeningWhileItLeavesKeepsThePanel: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  args: { messages: history },
  play: async () => {
    await userEvent.click(launcherOf());
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
    await userEvent.keyboard('{Escape}');
    await expect(isFading(panel)).toBe(true);
    await userEvent.click(launcherOf());
    await expect(body.getAllByRole('dialog')).toHaveLength(1);
    await expect(body.getByRole('dialog')).toBe(panel);
    await expect(panel).not.toHaveAttribute('inert');
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'));
    await expect(getComputedStyle(panel).scale).toBe('none');
  },
};

/** It grows out of the corner by the launcher: the bottom right, and the bottom left in right to left. */
export const PanelGrowsFromTheLauncherCorner: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { messages: history, defaultOpen: true },
  play: async ({ canvasElement }) => {
    const page = canvasElement.ownerDocument.documentElement;
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    // `transform-origin` computes to pixels: the size of the panel is its bottom end.
    const origin = () => {
      const [x, y] = getComputedStyle(panel).transformOrigin.split(' ').map(parseFloat);
      return { x: x!, y: y!, width: panel.offsetWidth, height: panel.offsetHeight };
    };
    const was = page.getAttribute('dir');
    try {
      for (const dir of ['ltr', 'rtl'] as const) {
        page.setAttribute('dir', dir);
        // The page's direction is followed: the origin moves with it.
        await waitFor(() => {
          const { x, y, width, height } = origin();
          expect(y, `${dir}: bottom`).toBeCloseTo(height, 0);
          expect(x, `${dir}: end`).toBeCloseTo(dir === 'ltr' ? width : 0, 0);
        });
      }
    } finally {
      if (was === null) page.removeAttribute('dir');
      else page.setAttribute('dir', was);
    }
  },
};

/** With the reduced setting the panel is there as it opens and gone as it closes. */
export const PanelSkipsMotionWhenReduced: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  args: { messages: history },
  play: async () => {
    await userEvent.click(launcherOf());
    const panel = await body.findByRole('dialog', { name: 'Cosmos assistant' });
    await expect(transitionMs(panel)).toBe(0);
    await expect(isFading(panel)).toBe(false);
    await expect(getComputedStyle(panel).opacity).toBe('1');
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('dialog')).toBeNull();
    await expect(launcherOf()).toHaveFocus();
  },
};
