import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/Button';
import { Select } from '../forms/Select';
import { SplitView } from '../layout/SplitView';
import {
  expectGraphicContrast,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mirroredIcon,
  mobileViewport,
} from '../storybook-helpers';
import { ChatComposer } from './ChatComposer';
import { ChatConversationList, type ChatConversation } from './ChatConversationList';
import { ChatMessage, type ChatMessageProps } from './ChatMessage';
import { ChatMessageActions } from './ChatMessageActions';
import { ChatSources } from './ChatSources';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatToolCall } from './ChatToolCall';
import { CodeBlock } from '../ui/CodeBlock';
import { ImageGrid } from '../ui/ImageGrid';
import { ChatDaySeparator, ChatThread, ChatTypingIndicator } from './ChatThread';

// The back arrow points toward the start of the line, so it turns around in right to left.
const BackIcon = mirroredIcon(ArrowLeft);

const meta = {
  title: 'Chat/Chat',
  component: ChatThread,
  subcomponents: { ChatMessage, ChatComposer, ChatConversationList },
  args: { children: null },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

type Msg = Omit<Extract<ChatMessageProps, { text: string }>, 'firstInGroup'> & { id: string };

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
                  icon={BackIcon}
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

// Short lines: a wider block would scroll inside itself on a phone, and axe wants it focusable.
const SNIPPET = `const q = useDebounce(v, 300);
useEffect(() => run(q), [q]);`;

const richReply = (
  <>
    <p>Keep the input controlled and debounce the value you search with:</p>
    <CodeBlock language="tsx" code={SNIPPET} className="my-2" />
    <p>Only the last value after 300 ms reaches the search.</p>
  </>
);

/**
 * `children` in place of `text`: rendered nodes, here a paragraph around a `CodeBlock`. With the
 * default `bubble`, the reply keeps its bubble and its 80% column.
 */
export const RichContentInABubble: Story = {
  render: () => (
    <Frame height={360}>
      <ChatThread className="flex-1">
        <ChatMessage
          direction="outgoing"
          sender={ME}
          time="10:42"
          text="How do I debounce a search?"
        />
        <ChatMessage direction="incoming" sender="Assistant" time="10:42">
          {richReply}
        </ChatMessage>
      </ChatThread>
    </Frame>
  ),
};

/**
 * `bubble={false}`: an incoming reply without a bubble. The content takes the whole column next
 * to the avatar, which sits at the top with the name; the user's message keeps its bubble.
 */
export const FlatReply: Story = {
  render: () => (
    <Frame height={360}>
      <ChatThread className="flex-1">
        <ChatMessage
          direction="outgoing"
          sender={ME}
          time="10:42"
          text="How do I debounce a search?"
        />
        <ChatMessage direction="incoming" sender="Assistant" time="10:42" bubble={false}>
          {richReply}
        </ChatMessage>
      </ChatThread>
    </Frame>
  ),
};

/** A flat reply fits a 375px screen: the code block scrolls inside itself. */
export const FlatReplyOnMobile: Story = {
  ...FlatReply,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const ChildrenRenderAndTextEscapes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={300}>
      <ChatThread className="flex-1">
        <ChatMessage direction="incoming" sender="Assistant" time="12:00">
          <ul>
            <li>first item</li>
            <li>
              <b>second</b> item
            </li>
          </ul>
        </ChatMessage>
        <ChatMessage direction="incoming" sender="Mallory" time="12:01" text={HOSTILE} />
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await expect(within(log).getAllByRole('listitem')).toHaveLength(2);
    await expect(within(log).getByText('second').tagName).toBe('B');
    // The text message still shows its markup as text, and its `<p>` is the only one around.
    await expect(within(log).getByText(HOSTILE, { exact: false })).toBeVisible();
    await expect(log.querySelectorAll('img')).toHaveLength(0);
    await expect(log.querySelectorAll('p')).toHaveLength(1);
  },
};

/** A text message with the default `bubble` keeps the classes it had before `bubble` existed. */
export const BubbleDefaultKeepsTheBubble: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={200}>
      <ChatThread className="flex-1">
        <ChatMessage direction="incoming" sender="Ana Ruiz" time="09:12" text="Hello there" />
        <ChatMessage direction="outgoing" sender={ME} time="09:13" text="Hi" />
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const incoming = canvas.getByText('Hello there').closest('p');
    const outgoing = canvas.getByText('Hi').closest('p');
    await expect(incoming?.className.split(' ').sort()).toEqual(
      [
        'rounded-2xl',
        'px-3.5',
        'py-2',
        'text-sm',
        'break-words',
        'whitespace-pre-wrap',
        'rounded-es-md',
        'bg-gray-100',
        'text-[var(--color-text-primary)]',
        'dark:bg-gray-800',
      ].sort()
    );
    await expect(outgoing?.className).toContain('bg-brand-500');
    // The same message flat has no bubble: no fill, no radius.
    await expect(getComputedStyle(incoming as HTMLElement).borderTopLeftRadius).toBe('16px');
  },
};

export const FlatReplyHasNoBubble: Story = {
  ...FlatReply,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const reply = canvas.getByText('Only the last value', { exact: false })
      .parentElement as HTMLElement;
    await expect(getComputedStyle(reply).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(getComputedStyle(reply).borderTopLeftRadius).toBe('0px');
    // The avatar is level with the name, at the top of the reply.
    const row = reply.closest('[class*="items-start"]') as HTMLElement;
    const avatar = row.firstElementChild as HTMLElement;
    await expect(avatar.getBoundingClientRect().top).toBeLessThanOrEqual(
      row.getBoundingClientRect().top + 8
    );
    // Wider than the 80% of a bubble.
    const thread = canvas.getByRole('log');
    await expect(reply.getBoundingClientRect().width).toBeGreaterThan(
      thread.clientWidth * 0.8 - 40
    );
  },
};

export const StreamingMarksTheMessageBusy: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={200}>
      <ChatThread className="flex-1">
        <ChatMessage direction="incoming" sender="Assistant" streaming text="Two racks:" />
        <ChatMessage direction="incoming" sender="Assistant" firstInGroup={false} text="Done." />
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const log = canvas.getByRole('log');
    await expect(canvas.getByText('Two racks:').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true'
    );
    await expect(log.querySelectorAll('[aria-busy]')).toHaveLength(1);
  },
};

const PROMPTS = ['Show the useDebounce hook', 'What about throttling?', 'Explain it simply'];

/** The chips of `Chatbot`, on their own: place them above a `ChatComposer`. */
export const Suggestions: Story = {
  render: () => (
    <Frame height={160}>
      <div className="flex-1" />
      <ChatSuggestions suggestions={PROMPTS} onSelect={() => {}} />
      <ChatComposer onSend={() => {}} />
    </Frame>
  ),
};

export const SuggestionsSelect: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatSuggestions suggestions={PROMPTS} onSelect={fn()} label="Follow-ups" />,
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Follow-ups' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  },
};

export const SuggestionsCallOnSelect: Story = {
  tags: ['!dev', '!autodocs'],
  args: {},
  render: function Render() {
    const [picked, setPicked] = useState('none');
    return (
      <>
        <ChatSuggestions suggestions={PROMPTS} onSelect={setPicked} />
        <output className="text-sm">{picked}</output>
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'What about throttling?' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('What about throttling?');
  },
};

export const EmptySuggestionsRenderNothing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="box">
      <ChatSuggestions suggestions={[]} onSelect={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('box')).toBeEmptyDOMElement();
  },
};

const REPLY = 'Only the last value after 300 ms reaches the search.';

const ActionsReply = ({ actions }: { actions: React.ReactNode }) => (
  <Frame height={200}>
    <ChatThread className="flex-1">
      <ChatMessage
        direction="incoming"
        sender="Assistant"
        time="10:42"
        bubble={false}
        actions={actions}
      >
        <p>{REPLY}</p>
      </ChatMessage>
    </ChatThread>
  </Frame>
);

/**
 * Under a reply, in the `actions` slot of its `ChatMessage`: the time, then copy, regenerate,
 * good and bad response. With a pointer they appear when the reply is hovered or holds the
 * focus, and the row keeps its space; on touch they are always there.
 */
export const ReplyActions: Story = {
  render: () => (
    <ActionsReply
      actions={<ChatMessageActions text={REPLY} onRegenerate={() => {}} defaultFeedback={null} />}
    />
  ),
};

/** On their own the actions are always shown. */
export const ActionsAlone: Story = {
  render: () => (
    <div className="p-4">
      <ChatMessageActions text={REPLY} onRegenerate={() => {}} defaultFeedback="up" />
    </div>
  ),
};

const reveal = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole('group', { name: 'Reply actions' }).parentElement as HTMLElement;

// Every rule of the page that hides the reveal wrapper, with the media query it sits in.
const hidingRules = () => {
  const found: { media: string; selector: string }[] = [];
  const visit = (rules: CSSRuleList, media: string) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) visit(rule.cssRules, `${media} ${rule.conditionText}`);
      else if (rule instanceof CSSStyleRule && rule.style.opacity === '0') {
        if (rule.selectorText.includes('reply')) found.push({ media, selector: rule.selectorText });
      } else if ('cssRules' in rule) visit(rule.cssRules as CSSRuleList, media);
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules, '');
  return found;
};

export const ActionsRevealOnHoverAndFocus: Story = {
  tags: ['!dev', '!autodocs'],
  render: ReplyActions.render,
  play: async ({ canvas }) => {
    const row = reveal(canvas);
    const height = row.getBoundingClientRect().height;
    // At rest with a pointer: out of sight, but the space is kept.
    await expect(getComputedStyle(row).opacity).toBe('0');
    await expect(height).toBeGreaterThanOrEqual(28);
    // Hidden only where the device can hover, and only while the reply is not hovered: a real
    // :hover cannot be forced from a play function, so the rule itself is checked.
    const rules = hidingRules();
    await expect(rules).toHaveLength(1);
    await expect(rules[0].media).toContain('hover: hover');
    await expect(rules[0].selector).toContain(':not(:hover)');
    await expect(rules[0].selector).toContain(':not(:focus-within)');
    // A keyboard user tabbing into it sees it.
    for (let i = 0; i < 5 && !row.contains(document.activeElement); i += 1) await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Copy reply' })).toHaveFocus();
    await expect(getComputedStyle(row).opacity).toBe('1');
    await expect(row.getBoundingClientRect().height).toBe(height);
    (document.activeElement as HTMLElement).blur();
    await waitFor(() => expect(getComputedStyle(row).opacity).toBe('0'));
  },
};

/** Focus on a link in the reply shows its actions too, not only focus on the actions. */
export const ActionsRevealWhenTheReplyHoldsTheFocus: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Frame height={200}>
      <ChatThread className="flex-1">
        <ChatMessage
          direction="incoming"
          sender="Assistant"
          time="10:42"
          bubble={false}
          actions={<ChatMessageActions text={REPLY} onRegenerate={() => {}} />}
        >
          <p>
            See <a href="https://react.dev">the React docs</a>.
          </p>
        </ChatMessage>
      </ChatThread>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const row = reveal(canvas);
    await expect(getComputedStyle(row).opacity).toBe('0');
    canvas.getByRole('link', { name: 'the React docs' }).focus();
    await waitFor(() => expect(getComputedStyle(row).opacity).toBe('1'));
  },
};

export const FeedbackTogglesPressed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatMessageActions defaultFeedback={null} />,
  play: async ({ canvas }) => {
    const good = canvas.getByRole('button', { name: 'Good response' });
    const bad = canvas.getByRole('button', { name: 'Bad response' });
    await expect(good).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(good);
    await expect(good).toHaveAttribute('aria-pressed', 'true');
    await expect(bad).toHaveAttribute('aria-pressed', 'false');
    // The other one takes over; the pressed one again clears it.
    await userEvent.click(bad);
    await expect(good).toHaveAttribute('aria-pressed', 'false');
    await expect(bad).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(bad);
    await expect(bad).toHaveAttribute('aria-pressed', 'false');
  },
};

const onFeedbackChange = fn();

export const FeedbackControlled: Story = {
  tags: ['!dev', '!autodocs'],
  // Controlled to `down`: the host decides, the button reports the move.
  render: () => <ChatMessageActions feedback="down" onFeedbackChange={onFeedbackChange} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Good response' }));
    await expect(onFeedbackChange).toHaveBeenCalledWith('up');
    // Still `down`: it only moves once the host passes the new value back.
    await expect(canvas.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Bad response' }));
    await expect(onFeedbackChange).toHaveBeenCalledWith(null);
  },
};

export const CopyReplyCopiesTheText: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatMessageActions text={REPLY} />,
  play: async ({ canvas }) => {
    const original = navigator.clipboard;
    const writeText = fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Copy reply' }));
      await expect(writeText).toHaveBeenCalledWith(REPLY);
      await expect(canvas.getByRole('button', { name: 'Copied' })).toBeVisible();
      // The check goes back to the copy icon after 2 s.
      await waitFor(
        () => expect(canvas.getByRole('button', { name: 'Copy reply' })).toBeVisible(),
        { timeout: 3000 }
      );
    } finally {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original });
    }
  },
};

const onRegenerate = fn();

export const RegenerateCallsBack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatMessageActions onRegenerate={onRegenerate} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Regenerate' }));
    await expect(onRegenerate).toHaveBeenCalledTimes(1);
    // Only the actions that were asked for.
    await expect(canvas.queryByRole('button', { name: 'Copy reply' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Good response' })).toBeNull();
  },
};

export const ActionsContrastInEveryTheme: Story = {
  ...ActionsAlone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    inEachTheme(() => {
      for (const icon of canvasElement.querySelectorAll('svg')) {
        expectGraphicContrast(icon, 'color', 3);
      }
    });
  },
};

const ComposerFooter = () => (
  <>
    <button
      type="button"
      aria-label="Attach a file"
      className="focus-visible:focus-indicator flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Paperclip className="h-4 w-4" aria-hidden />
    </button>
    <Select
      aria-label="Model"
      size="sm"
      fullWidth={false}
      options={[
        { value: 'fast', label: 'Cosmos Fast' },
        { value: 'deep', label: 'Cosmos Deep' },
      ]}
      defaultValue="fast"
    />
    <span className="text-2xs ms-auto text-[var(--color-text-muted)]">Enter to send</span>
  </>
);

/** `footer`: a line under the field, inside the same panel (attach, model picker, a hint). */
export const ComposerWithFooter: Story = {
  render: () => (
    <Frame height={160}>
      <div className="flex-1" />
      <ChatComposer onSend={() => {}} footer={<ComposerFooter />} />
    </Frame>
  ),
};

const onStop = fn();

/** `generating`: the send button is a Stop button; the field stays editable. */
export const ComposerGenerating: Story = {
  render: () => (
    <Frame height={160}>
      <div className="flex-1" />
      <ChatComposer onSend={() => {}} generating onStop={onStop} footer={<ComposerFooter />} />
    </Frame>
  ),
};

export const ComposerFooterAtMobile: Story = {
  ...ComposerGenerating,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const ComposerWithoutFooterKeepsItsRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatComposer onSend={() => {}} />,
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const root = field.parentElement as HTMLElement;
    // Field and button are direct children of the one row, as before the footer existed.
    await expect(root.parentElement).toBe(canvasElement.firstElementChild);
    await expect(root.className.split(' ').sort()).toEqual(
      [
        'flex',
        'items-end',
        'gap-2',
        'border-t',
        'border-[var(--color-border)]',
        'bg-[var(--color-bg-panel)]',
        'p-3',
      ].sort()
    );
    await expect(root.children).toHaveLength(2);
  },
};

export const StopReplacesSend: Story = {
  ...ComposerGenerating,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Message' });
    await expect(canvas.queryByRole('button', { name: 'Send message' })).toBeNull();
    const stop = canvas.getByRole('button', { name: 'Stop generating' });
    await expect(stop).toBeEnabled();
    // Enter does not send, and the field stays editable.
    await userEvent.type(input, 'next question{Enter}');
    await expect(input).toHaveValue('next question');
    await expect(input).toBeEnabled();
    await userEvent.click(stop);
    await expect(onStop).toHaveBeenCalledTimes(1);
  },
};

export const StopLabelIsTranslatable: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ChatComposer onSend={() => {}} generating stopLabel="Arrêter" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Arrêter' })).toBeVisible();
  },
};

export const StopLooksLikeSend: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const Toggle = () => {
      const [generating, setGenerating] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setGenerating(!generating)}>
            toggle
          </button>
          <ChatComposer onSend={() => {}} generating={generating} />
        </>
      );
    };
    return <Toggle />;
  },
  play: async ({ canvas }) => {
    const send = canvas.getByRole('button', { name: 'Send message' });
    const before = send.getBoundingClientRect();
    await userEvent.click(canvas.getByRole('button', { name: 'toggle' }));
    const stop = canvas.getByRole('button', { name: 'Stop generating' });
    // The same button, in the same place and size, filled the same way.
    await expect(stop).toBe(send);
    await expect(stop.getBoundingClientRect().width).toBe(before.width);
    await expect(stop.getBoundingClientRect().height).toBe(before.height);
    await expect(getComputedStyle(stop).backgroundColor).toBe(
      getComputedStyle(send).backgroundColor
    );
    await expect(getComputedStyle(stop).opacity).toBe('1');
  },
};

const StopFocus = () => {
  const [generating, setGenerating] = useState(true);
  return (
    <ChatComposer onSend={() => {}} generating={generating} onStop={() => setGenerating(false)} />
  );
};

/** Stop holds the focus when the reply ends: it goes to the field, not to the page. */
export const FocusMovesToTheFieldWhenGenerationEnds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StopFocus />,
  play: async ({ canvas }) => {
    const stop = canvas.getByRole('button', { name: 'Stop generating' });
    stop.focus();
    await expect(stop).toHaveFocus();
    await userEvent.click(stop);
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Send message' })).toBeDisabled();
  },
};

const FocusElsewhere = () => {
  const [generating, setGenerating] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setGenerating(false)}>
        finish
      </button>
      <ChatComposer onSend={() => {}} generating={generating} />
    </>
  );
};

export const FocusStaysWhereItWasWhenGenerationEnds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FocusElsewhere />,
  play: async ({ canvas }) => {
    const finish = canvas.getByRole('button', { name: 'finish' });
    await userEvent.click(finish);
    await expect(finish).toHaveFocus();
  },
};

export const FooterSitsInsideThePanel: Story = {
  ...ComposerWithFooter,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const panel = field.parentElement!.parentElement as HTMLElement;
    const attach = canvas.getByRole('button', { name: 'Attach a file' });
    await expect(panel.contains(attach)).toBe(true);
    // Under the field, not beside it.
    await expect(attach.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      field.getBoundingClientRect().bottom
    );
    await expect(getComputedStyle(panel).borderTopWidth).toBe('1px');
  },
};

const AssistantReply = ({
  children,
  streaming,
  actions,
}: {
  children: React.ReactNode;
  streaming?: boolean;
  actions?: React.ReactNode;
}) => (
  <ChatMessage
    direction="incoming"
    sender="Assistant"
    time="10:42"
    bubble={false}
    streaming={streaming}
    actions={actions}
  >
    {children}
  </ChatMessage>
);

const replyActions = (
  <ChatMessageActions
    text={`${REPLY}\n\n${SNIPPET}`}
    onRegenerate={() => {}}
    defaultFeedback={null}
  />
);

/**
 * An AI assistant page: flat replies that take the whole column, a code block, the actions under
 * the last reply, suggested follow-ups and a composer with a model picker and an attach button.
 */
export const AiAssistant: Story = {
  render: () => (
    <Frame height={640}>
      <ChatThread label="Conversation with the assistant" className="flex-1">
        <ChatMessage
          direction="outgoing"
          sender={ME}
          time="10:41"
          text="How do I debounce a search field in React?"
        />
        <AssistantReply actions={replyActions}>{richReply}</AssistantReply>
      </ChatThread>
      <ChatSuggestions suggestions={PROMPTS.slice(0, 2)} onSelect={() => {}} />
      <ChatComposer placeholder="Ask anything…" onSend={() => {}} footer={<ComposerFooter />} />
    </Frame>
  ),
};

/** The same page on a phone: nothing widens, the footer keeps its line. */
export const AiAssistantOnMobile: Story = {
  ...AiAssistant,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

const PHOTO = new URL('../storybook-assets/snow-mountain-under-stars.jpg', import.meta.url).href;
const DUNES = new URL('../storybook-assets/pale-dunes.svg', import.meta.url).href;

/** An image generator: the pictures are the reply, in a grid across the full column. */
export const ImageGenerator: Story = {
  render: () => (
    <Frame height={560}>
      <ChatThread label="Conversation with the image generator" className="flex-1">
        <ChatMessage
          direction="outgoing"
          sender={ME}
          time="10:41"
          text="A starry night over snowy mountains, and pale dunes at dawn"
        />
        <AssistantReply
          actions={<ChatMessageActions onRegenerate={() => {}} defaultFeedback={null} />}
        >
          <p>Here are four variations:</p>
          <ImageGrid columns={2} gap="sm" aspectRatio="aspect-video" className="my-2">
            <ImageGrid.Item>
              <img src={PHOTO} alt="Starry night over snowy mountains, variation 1" />
            </ImageGrid.Item>
            <ImageGrid.Item>
              <img src={DUNES} alt="Pale dunes at dawn, variation 2" />
            </ImageGrid.Item>
            <ImageGrid.Item>
              <img src={DUNES} alt="Pale dunes at dawn, variation 3" />
            </ImageGrid.Item>
            <ImageGrid.Item>
              <img src={PHOTO} alt="Starry night over snowy mountains, variation 4" />
            </ImageGrid.Item>
          </ImageGrid>
        </AssistantReply>
      </ChatThread>
      <ChatComposer
        placeholder="Describe an image…"
        onSend={() => {}}
        footer={<ComposerFooter />}
      />
    </Frame>
  ),
};

export const ImageGeneratorOnMobile: Story = {
  ...ImageGenerator,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

const PARTIAL = 'Keep the input controlled and debounce the value you search with, not the';

const StreamingWithStop = () => {
  const [generating, setGenerating] = useState(true);
  return (
    <Frame height={420}>
      <ChatThread className="flex-1">
        <ChatMessage direction="outgoing" sender={ME} time="10:41" text="How do I debounce?" />
        <AssistantReply streaming={generating}>
          <p>{PARTIAL}</p>
        </AssistantReply>
      </ChatThread>
      <ChatComposer
        onSend={() => {}}
        generating={generating}
        onStop={() => setGenerating(false)}
        footer={<ComposerFooter />}
      />
    </Frame>
  );
};

/**
 * A reply mid-stream: the caret after the text, the message `aria-busy`, and Stop in place of
 * Send. Stopping ends the stream: the caret goes and Send comes back.
 */
export const StreamingWithStopButton: Story = {
  render: () => <StreamingWithStop />,
};

export const StopEndsTheStream: Story = {
  ...StreamingWithStopButton,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const reply = canvas.getByText(PARTIAL).closest('[aria-busy]');
    await expect(reply).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Stop generating' }));
    await expect(reply).not.toHaveAttribute('aria-busy');
    await expect(canvas.getByRole('button', { name: 'Send message' })).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toHaveFocus();
  },
};

export const AiPagesInEveryTheme: Story = {
  ...AiAssistant,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    inEachTheme(() => {
      for (const reply of canvasElement.querySelectorAll('p')) expectTextContrast(reply);
      for (const chip of canvasElement.querySelectorAll('li button')) expectTextContrast(chip);
    });
  },
};

/**
 * The assistant page with what the assistant did and where the answer comes from: a finished tool
 * call above the text of the reply, the sources under it, then the actions.
 */
export const AiAssistantWithToolsAndSources: Story = {
  render: () => (
    <Frame height={640}>
      <ChatThread label="Conversation with the assistant" className="flex-1">
        <ChatMessage
          direction="outgoing"
          sender={ME}
          time="10:41"
          text="How do I debounce a search field in React?"
        />
        <AssistantReply actions={replyActions}>
          <ChatToolCall
            name="search_docs"
            status="done"
            duration="1.2s"
            className="my-1"
            input={<CodeBlock code={'{ "query": "debounce search input" }'} />}
            output={<CodeBlock code={'[{ "title": "useDebounce" }]'} />}
          />
          {richReply}
          <ChatSources
            className="mt-2"
            sources={[
              {
                title: 'useDebounce: a hook for delayed values',
                href: 'https://usehooks.example.com/debounce',
              },
              {
                title: 'Debouncing and throttling explained',
                href: 'https://blog.example.org/debounce',
              },
            ]}
          />
        </AssistantReply>
        <AssistantReply>
          <ChatToolCall name="run_tests" status="running" className="my-1" />
        </AssistantReply>
      </ChatThread>
      <ChatComposer placeholder="Ask anything…" onSend={() => {}} footer={<ComposerFooter />} />
    </Frame>
  ),
};

export const AiAssistantWithToolsOnMobile: Story = {
  ...AiAssistantWithToolsAndSources,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const ToolsAndSourcesInEveryTheme: Story = {
  ...AiAssistantWithToolsAndSources,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    inEachTheme(() => {
      for (const live of canvasElement.querySelectorAll('[aria-live]:not([role="log"])')) {
        expectTextContrast(live);
      }
    });
  },
};
