import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../ui/Button';
import { SplitView } from '../layout/SplitView';
import { expectGraphicContrast, expectTextContrast, inEachTheme } from '../storybook-helpers';
import { ChatComposer } from './ChatComposer';
import { ChatConversationList, type ChatConversation } from './ChatConversationList';
import { ChatMessage, type ChatMessageProps } from './ChatMessage';
import { ChatDaySeparator, ChatThread, ChatTypingIndicator } from './ChatThread';

const meta = {
  title: 'Chat/Chat',
  component: ChatThread,
  subcomponents: { ChatMessage, ChatComposer, ChatConversationList },
  args: { children: null },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

type Msg = Omit<ChatMessageProps, 'firstInGroup'> & { id: string };

const ME = 'You';
const conversation: Msg[] = [
  {
    id: '1',
    direction: 'incoming',
    sender: 'Ana Ruiz',
    time: '09:12',
    text: 'Morning! Did the nightly backup finish?',
  },
  {
    id: '2',
    direction: 'incoming',
    sender: 'Ana Ruiz',
    time: '09:12',
    text: 'The dashboard still shows it as running.',
  },
  {
    id: '3',
    direction: 'outgoing',
    sender: ME,
    time: '09:14',
    status: 'read',
    text: 'It finished at 04:20, the dashboard lags behind.',
  },
  {
    id: '4',
    direction: 'outgoing',
    sender: ME,
    time: '09:14',
    status: 'read',
    text: 'Logs are here: https://example.com/backups/nightly.',
  },
  { id: '5', direction: 'incoming', sender: 'Ana Ruiz', time: '09:15', text: 'Perfect, thanks 🙏' },
  {
    id: '6',
    direction: 'outgoing',
    sender: ME,
    time: '09:16',
    status: 'delivered',
    text: 'I will open a ticket for the refresh delay.\nShould be a quick fix.',
  },
];

// firstInGroup on the first message of each run from the same sender.
const renderMessages = (messages: Msg[]) =>
  messages.map(({ id, ...m }, i) => (
    <ChatMessage key={id} {...m} firstInGroup={messages[i - 1]?.sender !== m.sender} />
  ));

const Frame = ({ children, height = 480 }: { children: React.ReactNode; height?: number }) => (
  <div
    style={{ height }}
    className="flex max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]"
  >
    {children}
  </div>
);

export const Thread: Story = {
  render: () => (
    <Frame>
      <ChatThread className="flex-1">
        <ChatDaySeparator>Today</ChatDaySeparator>
        {renderMessages(conversation)}
        <ChatTypingIndicator name="Ana Ruiz" />
      </ChatThread>
    </Frame>
  ),
};

const SENDERS = ['Ana Ruiz', ME];
const long: Msg[] = Array.from({ length: 40 }, (_, i) => {
  const sender = SENDERS[Math.floor(i / 3) % 2];
  return {
    id: String(i),
    sender,
    direction: sender === ME ? 'outgoing' : 'incoming',
    time: `10:${String(i).padStart(2, '0')}`,
    status: sender === ME ? 'read' : undefined,
    text: `Message ${i + 1}: ${i % 4 === 0 ? 'a longer line that wraps over several lines in the bubble to show how text flows when it does not fit on one line.' : 'short one.'}`,
  };
});

/** Opens scrolled to the newest message. */
export const LongConversation: Story = {
  render: () => (
    <Frame>
      <ChatThread className="flex-1">
        <ChatDaySeparator>Yesterday</ChatDaySeparator>
        {renderMessages(long.slice(0, 20))}
        <ChatDaySeparator>Today</ChatDaySeparator>
        {renderMessages(long.slice(20))}
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await expect(log.scrollTop + log.clientHeight).toBeGreaterThanOrEqual(log.scrollHeight - 1);
  },
};

export const DeliveryStates: Story = {
  render: () => (
    <Frame height={360}>
      <ChatThread className="flex-1">
        {(['sending', 'sent', 'delivered', 'read', 'failed'] as const).map((status, i) => (
          <ChatMessage
            key={status}
            direction="outgoing"
            sender={ME}
            time="11:02"
            status={status}
            firstInGroup={i === 0}
            text={`Status: ${status}`}
          />
        ))}
      </ChatThread>
    </Frame>
  ),
};

const InteractiveChat = () => {
  const [messages, setMessages] = useState<Msg[]>(conversation.slice(0, 3));
  return (
    <Frame>
      <ChatThread className="flex-1">{renderMessages(messages)}</ChatThread>
      <ChatComposer
        attachment={
          <button
            type="button"
            aria-label="Attach a file"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Paperclip className="h-4 w-4" aria-hidden />
          </button>
        }
        onSend={(text) => {
          setMessages((prev) => [
            ...prev,
            {
              id: String(prev.length + 1),
              direction: 'outgoing',
              sender: ME,
              time: 'now',
              status: 'sent',
              text,
            },
          ]);
        }}
      />
    </Frame>
  );
};

/** Type and press Enter to send, Shift+Enter for a new line. */
export const Composer: Story = {
  render: () => <InteractiveChat />,
};

export const SendsOnEnter: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <InteractiveChat />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Message' });
    await expect(canvas.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await userEvent.type(input, '  Hello there  {Enter}');
    await expect(input).toHaveValue('');
    // Sent trimmed, as a new outgoing bubble.
    await expect(within(canvas.getByRole('log')).getByText('Hello there')).toBeVisible();
  },
};

export const ShiftEnterAddsNewline: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <InteractiveChat />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Message' });
    const log = canvas.getByRole('log');
    const before = log.childElementCount;
    const height = input.getBoundingClientRect().height;
    await userEvent.type(input, 'line one{Shift>}{Enter}{/Shift}line two');
    await expect(log.childElementCount).toBe(before);
    await expect(input).toHaveValue('line one\nline two');
    // The textarea grew to fit the second line.
    await expect(input.getBoundingClientRect().height).toBeGreaterThan(height);
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    await expect(log.childElementCount).toBe(before + 1);
    await expect(log.lastElementChild).toHaveTextContent('line one line two');
  },
};

const composerRef = createRef<HTMLTextAreaElement>();

/** The ref gets the textarea (ShiftEnterAddsNewline covers its own ref, which sizes it). */
export const ComposerForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatComposer ref={composerRef} onSend={() => {}} />,
  play: async ({ canvas }) => {
    await expect(composerRef.current).toBe(canvas.getByRole('textbox', { name: 'Message' }));
  },
};

const NEWLINE = '{Shift>}{Enter}{/Shift}';

/** A few lines fit with nothing to scroll; past `maxHeight` the field scrolls. */
export const ComposerGrowsWithoutScrolling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatComposer maxHeight={120} onSend={() => {}} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Message' });
    await userEvent.type(input, `one${NEWLINE}two${NEWLINE}three`);
    // The borders are counted in the height: the three lines fit exactly.
    await expect(input.scrollHeight).toBeLessThanOrEqual(input.clientHeight);
    await userEvent.type(input, `${NEWLINE}four${NEWLINE}five${NEWLINE}six${NEWLINE}seven`);
    await expect(input.getBoundingClientRect().height).toBe(120);
    await expect(input.scrollHeight).toBeGreaterThan(input.clientHeight);
  },
};

const HOSTILE = '<img src=x onerror="window.__chatXss=1"><b>bold</b> javascript:alert(1)';

/** Markup in a message shows up as text; only http(s) URLs become links. */
export const HostileTextRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={240}>
      <ChatThread className="flex-1">
        <ChatMessage direction="incoming" sender="Mallory" time="12:00" text={HOSTILE} />
        <ChatMessage
          direction="incoming"
          sender="Mallory"
          firstInGroup={false}
          text="See https://example.com/a?b=1, then javascript:alert(2)"
        />
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await expect(log.querySelector('img, b')).toBeNull();
    await expect(within(log).getByText(HOSTILE, { exact: false })).toBeVisible();
    const links = within(log).getAllByRole('link');
    await expect(links).toHaveLength(1);
    await expect(links[0]).toHaveAttribute('href', 'https://example.com/a?b=1');
    await expect((window as { __chatXss?: number }).__chatXss).toBeUndefined();
    // Sender and time are read on every bubble, grouped or not.
    await expect(log).toHaveTextContent('Mallory, 12:00:');
  },
};

const conversations: ChatConversation[] = [
  {
    id: 'ana',
    name: 'Ana Ruiz',
    lastMessage: 'Perfect, thanks 🙏',
    time: '09:15',
    unread: 2,
    presence: 'online',
  },
  {
    id: 'ops',
    name: 'Ops on-call',
    lastMessage: 'Disk alert cleared on rack B4',
    time: '08:47',
    presence: 'away',
  },
  { id: 'li', name: 'Li Wei', lastMessage: 'See you Monday', time: 'Fri', presence: 'offline' },
  {
    id: 'sam',
    name: 'Sam Patel',
    lastMessage: 'Can you review my PR when you get a minute?',
    time: 'Thu',
    unread: 12,
  },
];

/**
 * Conversation list on the left, the open thread on the right, in a `SplitView`. Below `lg` one
 * pane shows at a time: picking a conversation opens the thread and Back returns to the list.
 */
export const TwoPane: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  parameters: { layout: 'fullscreen' },
  render: function Render() {
    const [selected, setSelected] = useState('ana');
    const [pane, setPane] = useState('list');
    const current = conversations.find((c) => c.id === selected);
    return (
      <div className="h-[560px] p-4">
        <SplitView activePane={pane} onActivePaneChange={setPane}>
          <SplitView.Pane id="list" label="Conversations" width="w-72">
            <ChatConversationList
              conversations={conversations}
              selectedId={selected}
              onSelect={(id) => {
                setSelected(id);
                setPane('thread');
              }}
            />
          </SplitView.Pane>
          <SplitView.Pane id="thread" label="Thread">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowLeft}
                  onClick={() => setPane('list')}
                  className="lg:hidden"
                >
                  Back
                </Button>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {current?.name}
                </h2>
              </div>
              <ChatThread label={`Conversation with ${current?.name}`} className="min-h-0 flex-1">
                <ChatDaySeparator>Today</ChatDaySeparator>
                {renderMessages(conversation)}
              </ChatThread>
              <ChatComposer onSend={() => {}} />
            </div>
          </SplitView.Pane>
        </SplitView>
      </div>
    );
  },
};

/** Picking a conversation opens its thread; at this width the list stays beside it. */
export const TwoPanePicksAConversation: Story = {
  ...TwoPane,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Ana Ruiz' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Ops on-call/ }));
    await expect(canvas.getByRole('heading', { name: 'Ops on-call' })).toBeVisible();
    await expect(canvas.getByRole('log', { name: 'Conversation with Ops on-call' })).toBeVisible();
    // Side by side at this width: the list stays on screen.
    await expect(canvas.getByRole('navigation', { name: 'Conversations' })).toBeVisible();
  },
};

/**
 * The outgoing bubble's text, and the time and delivery ticks under it, hold
 * their contrast in every theme and on the default and two light accents.
 */
export const OutgoingContrastInEveryThemeAndAccent: Story = {
  ...DeliveryStates,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const saved = root.getAttribute('data-accent');
    try {
      for (const accent of ['blue', 'amber', 'cyan']) {
        root.setAttribute('data-accent', accent);
        inEachTheme(() => {
          try {
            for (const bubble of canvasElement.querySelectorAll('p')) expectTextContrast(bubble);
            for (const time of canvasElement.querySelectorAll('time')) expectTextContrast(time);
            for (const tick of canvasElement.querySelectorAll('svg')) {
              expectGraphicContrast(tick, 'color');
            }
          } catch (error) {
            throw new Error(`[${accent}] ${(error as Error).message}`, { cause: error });
          }
        });
      }
    } finally {
      if (saved === null) root.removeAttribute('data-accent');
      else root.setAttribute('data-accent', saved);
    }
  },
};
