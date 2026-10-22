import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
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
    await userEvent.click(await body.findByRole('button', { name: 'Close chat' }));
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
