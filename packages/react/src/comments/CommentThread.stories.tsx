import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  keyToEnd,
  mobileViewport,
} from '../storybook-helpers';
import { RelativeTime } from '../data/RelativeTime';
import { Comment } from './Comment';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';

const meta = {
  title: 'Lists/Comment Thread',
  component: CommentThread,
  subcomponents: { Comment, CommentComposer },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CommentThread>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="max-w-2xl bg-[var(--color-bg-panel)] p-4 sm:p-6">{children}</div>
);

// A fixed now, in local time like the dates below, so the relative times read the same in any
// zone and in the captures.
const NOW = new Date('2026-10-26T12:00').getTime();
const time = (iso: string) => <RelativeTime value={iso} now={NOW} />;

const HOSTILE = '<img src=x onerror="window.__commentXss=1"><b>bold</b> javascript:alert(1)';
const LONG_URL =
  'https://example.com/support/tickets/48213/attachments/export-2026-10-26-full-network-capture-with-a-very-long-descriptive-file-name-that-never-breaks.pcap?session=abcdef0123456789abcdef0123456789';
const LONG_WORD = 'Pneumonoultramicroscopicsilicovolcanoconiosis'.repeat(3);

type Item = {
  id: number;
  author: string;
  role?: string;
  text: string;
  edited?: boolean;
  internal?: boolean;
  replies: Item[];
};

const SEED: Item[] = [
  {
    id: 1,
    author: 'Marta Ilves',
    role: 'Customer',
    text: 'Since this morning the export fails with a timeout. Nothing changed on our side.',
    replies: [
      {
        id: 2,
        author: 'Ben Okafor',
        role: 'Support',
        text: 'Thanks Marta, I can see the failed runs. Looking into it now.',
        replies: [],
      },
      {
        id: 3,
        author: 'Marta Ilves',
        role: 'Customer',
        text: 'Great, let me know if you need the job id.',
        edited: true,
        replies: [],
      },
    ],
  },
  {
    id: 4,
    author: 'Ben Okafor',
    role: 'Support',
    text: 'Found it: a stuck worker on our side. Restarted, the export should run again.',
    replies: [],
  },
];

let nextId = 100;

const Discussion = ({ initial = SEED, me = 'Ben Okafor' }: { initial?: Item[]; me?: string }) => {
  const [items, setItems] = useState(initial);
  const map = (list: Item[], fn: (item: Item) => Item | null): Item[] =>
    list.flatMap((item) => {
      const next = fn({ ...item, replies: map(item.replies, fn) });
      return next ? [next] : [];
    });
  const render = (item: Item, isReply: boolean): ReactNode => (
    <Comment
      key={item.id}
      author={item.author}
      role={item.role}
      time={time('2026-10-26T09:12')}
      edited={item.edited}
      variant={item.internal ? 'internal' : 'default'}
      text={item.text}
      onReply={
        isReply
          ? undefined
          : (text) =>
              setItems(
                map(items, (i) =>
                  i.id === item.id
                    ? {
                        ...i,
                        replies: [
                          ...i.replies,
                          { id: nextId++, author: me, role: 'Support', text, replies: [] },
                        ],
                      }
                    : i
                )
              )
      }
      onEdit={
        item.author === me
          ? (text) =>
              setItems(map(items, (i) => (i.id === item.id ? { ...i, text, edited: true } : i)))
          : undefined
      }
      onDelete={
        item.author === me
          ? () => setItems(map(items, (i) => (i.id === item.id ? null : i)))
          : undefined
      }
      replies={item.replies.map((reply) => render(reply, true))}
    />
  );
  return (
    <CommentThread
      emptyDescription="Start the discussion."
      composer={
        <CommentComposer
          onSubmit={(text) =>
            setItems([...items, { id: nextId++, author: me, role: 'Support', text, replies: [] }])
          }
        />
      }
    >
      {items.map((item) => render(item, false))}
    </CommentThread>
  );
};

/** A ticket's discussion: replies under a comment, Reply for all, Edit and Delete on your own. */
export const ThreadWithReplies: Story = {
  render: () => (
    <Frame>
      <Discussion />
    </Frame>
  ),
};

const InternalNotesStory = () => (
  <Frame>
    <CommentThread>
      <Comment
        author="Marta Ilves"
        role="Customer"
        time={time('2026-10-26T09:12')}
        text="Since this morning the export fails with a timeout."
      />
      <Comment
        author="Ben Okafor"
        role="Support"
        variant="internal"
        time={time('2026-10-26T09:30')}
        text="Worker 7 is stuck again. Do not tell the customer it is the third time this week."
        onReply={() => {}}
        replies={
          <Comment
            author="Lena Fischer"
            role="Support"
            variant="internal"
            time={time('2026-10-26T09:41')}
            text="Noted. Restart it and I will open an incident."
          />
        }
      />
      <Comment
        author="Ben Okafor"
        role="Support"
        time={time('2026-10-26T10:02')}
        text="We restarted the service, the export should work again."
      />
    </CommentThread>
  </Frame>
);

/** An internal note: tinted, with a lock and the words "Internal note". */
export const InternalNotes: Story = { render: () => <InternalNotesStory /> };

/** Edit swaps the body for a composer that starts with the comment's text: press Edit. */
export const Editing: Story = {
  render: () => (
    <Frame>
      <CommentThread>
        <Comment
          author="Ben Okafor"
          role="Support"
          time={time('2026-10-26T09:30')}
          text="Restarted the worker, the export should run again."
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </CommentThread>
    </Frame>
  ),
};

export const EditOpensAComposerWithTheFocus: Story = {
  ...Editing,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(canvas.getByRole('textbox', { name: 'Edit comment' })).toHaveFocus();
  },
};

/** No comment yet: the empty state, and the composer under it. */
export const EmptyThread: Story = {
  render: () => (
    <Frame>
      <CommentThread
        emptyDescription="Be the first to write one."
        composer={<CommentComposer onSubmit={() => {}} />}
      />
    </Frame>
  ),
};

const LongTextStory = () => (
  <Frame>
    <CommentThread>
      <Comment
        author="Marta Ilves with a rather long display name that has to wrap"
        role="Customer"
        time={time('2026-10-26T09:12')}
        text={`The capture is here: ${LONG_URL}\n\nAnd the culprit, as far as I can tell: ${LONG_WORD}`}
        onReply={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        replies={<Comment author="Ben Okafor" time={time('2026-10-26T09:30')} text={LONG_URL} />}
      />
    </CommentThread>
  </Frame>
);

/** A long unbroken URL and a long word wrap inside the comment. */
export const LongText: Story = { render: () => <LongTextStory /> };

const HostileStory = () => (
  <Frame>
    <CommentThread>
      <Comment
        author="Mallory"
        time={time('2026-10-26T09:12')}
        text={HOSTILE}
        replies={
          <Comment
            author="Eve"
            time={time('2026-10-26T09:13')}
            text="javascript:alert(document.cookie) and data:text/html,<script>alert(1)</script>"
          />
        }
      />
    </CommentThread>
  </Frame>
);

/** Markup and a `javascript:` URL show as written; only http(s) URLs become links. */
export const HostileText: Story = { render: () => <HostileStory /> };

/** Past `maxReplies` the replies fold behind a button that says how many. */
export const FoldedReplies: Story = {
  render: () => (
    <Frame>
      <CommentThread>
        <Comment
          author="Marta Ilves"
          role="Customer"
          time={time('2026-10-26T09:12')}
          text="Is anyone looking at this?"
          maxReplies={2}
          replies={[1, 2, 3, 4, 5].map((n) => (
            <Comment
              key={n}
              author={n % 2 ? 'Ben Okafor' : 'Marta Ilves'}
              time={time(`2026-10-26T09:${10 + n}`)}
              text={`Reply number ${n}.`}
            />
          ))}
        />
      </CommentThread>
    </Frame>
  ),
};

/**
 * `keepReplies="last"` keeps the latest replies on screen and folds the older ones behind a button
 * above them: a ticket, where the last exchanges matter.
 */
export const LatestRepliesKept: Story = {
  render: () => (
    <Frame>
      <CommentThread>
        <Comment
          author="Marta Ilves"
          role="Customer"
          time={time('2026-10-26T09:12')}
          text="Is anyone looking at this?"
          maxReplies={2}
          keepReplies="last"
          replies={[1, 2, 3, 4, 5, 6].map((n) => (
            <Comment
              key={n}
              author={n % 2 ? 'Ben Okafor' : 'Marta Ilves'}
              time={time(`2026-10-26T09:${10 + n}`)}
              text={`Reply number ${n}.`}
            />
          ))}
        />
      </CommentThread>
    </Frame>
  ),
};

/** Every text in another language: on the thread for all its comments, or on a single comment. */
export const Translated: Story = {
  render: () => (
    <Frame>
      <CommentThread
        label="Commentaires"
        emptyTitle="Aucun commentaire"
        labels={{
          reply: 'Répondre',
          edit: 'Modifier',
          delete: 'Supprimer',
          internal: 'Note interne',
          edited: 'modifié',
          replyPlaceholder: 'Écrire une réponse…',
          replySubmit: 'Publier la réponse',
          editSubmit: 'Enregistrer',
          cancel: 'Annuler',
          replyField: (author) => `Répondre à ${author}`,
          editField: 'Modifier le commentaire',
          replies: (author) => `Réponses à ${author}`,
          showReplies: (n) => `Afficher ${n} réponse${n > 1 ? 's' : ''} de plus`,
          hideReplies: 'Afficher moins de réponses',
        }}
        composer={
          <CommentComposer
            label="Commentaire"
            placeholder="Écrire un commentaire…"
            submitLabel="Publier"
            onSubmit={() => {}}
          />
        }
      >
        <Comment
          author="Camille Durand"
          variant="internal"
          edited
          time={time('2026-10-26T09:12')}
          text="Le worker est bloqué, je redémarre le service."
          onReply={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          maxReplies={1}
          replies={[1, 2, 3].map((n) => (
            <Comment key={n} author="Julien Roux" text={`Réponse ${n}.`} />
          ))}
        />
      </CommentThread>
    </Frame>
  ),
};

/** The composer alone: Enter adds a line, Ctrl or Cmd+Enter submits. */
export const Composer: Story = {
  render: () => (
    <Frame>
      <CommentComposer onSubmit={fn()} onCancel={fn()} />
    </Frame>
  ),
};

/** The comment is being sent: the field is read-only and the button spins. */
export const ComposerSubmitting: Story = {
  render: () => (
    <Frame>
      <CommentComposer
        defaultValue="Restarted the worker, please try again."
        submitting
        onSubmit={fn()}
      />
    </Frame>
  ),
};

const MODES = [
  { value: 'reply', label: 'Reply to customer', submitLabel: 'Send reply' },
  { value: 'note', label: 'Internal note', internal: true, submitLabel: 'Add note' },
];

/** Modes: a segmented control above the field picks what the text is. Reply is selected. */
export const ComposerWithModes: Story = {
  render: () => (
    <Frame>
      <CommentComposer modes={MODES} label="Reply to Marta Ilves" onSubmit={fn()} />
    </Frame>
  ),
};

/**
 * An internal mode tints the field and the button, and a line with a lock says who sees the text,
 * so a note is not sent to the customer by mistake.
 */
export const ComposerInternalNote: Story = {
  render: () => (
    <Frame>
      <CommentComposer
        modes={MODES}
        defaultMode="note"
        defaultValue="Worker 7 is stuck again, restarting it."
        label="Reply to Marta Ilves"
        onSubmit={fn()}
      />
    </Frame>
  ),
};

/** A ticket detail page: the record on one side, its discussion on the other. */
export const TicketDetailPage: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="grid gap-6 bg-[var(--color-bg-base)] p-4 sm:p-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <section
        aria-label="Ticket"
        className="h-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          #48213 Export times out
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ['Status', 'Open'],
            ['Priority', 'High'],
            ['Requester', 'Marta Ilves'],
            ['Assignee', 'Ben Okafor'],
            ['Opened', 'Oct 26, 09:12'],
          ].map(([term, value]) => (
            <div key={term} className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{term}</dt>
              <dd className="text-right text-[var(--color-text-primary)]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        aria-label="Discussion"
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5"
      >
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
          Discussion
        </h2>
        <Discussion
          initial={[
            ...SEED,
            {
              id: 7,
              author: 'Lena Fischer',
              role: 'Support',
              text: 'Internal: the stuck worker is the third this week. Opening an incident.',
              internal: true,
              replies: [],
            },
          ]}
        />
      </section>
    </div>
  ),
};

// ── Narrow screens ──────────────────────────────────────────────────────────

const atMobile = (story: Story): Story => ({
  ...story,
  globals: mobileViewport,
  play: async (context) => {
    await story.play?.(context);
    expectNoHorizontalOverflow(context.canvasElement);
  },
});

export const ThreadWithRepliesOnMobile: Story = atMobile(ThreadWithReplies);
export const InternalNotesOnMobile: Story = atMobile(InternalNotes);
export const EditingOnMobile: Story = atMobile(Editing);
export const EmptyThreadOnMobile: Story = atMobile(EmptyThread);
export const LongTextOnMobile: Story = atMobile(LongText);
export const HostileTextOnMobile: Story = atMobile(HostileText);
export const FoldedRepliesOnMobile: Story = atMobile(FoldedReplies);
export const LatestRepliesKeptOnMobile: Story = atMobile(LatestRepliesKept);
export const ComposerWithModesOnMobile: Story = atMobile(ComposerWithModes);
export const ComposerInternalNoteOnMobile: Story = atMobile(ComposerInternalNote);
export const TicketDetailPageOnMobile: Story = atMobile(TicketDetailPage);

// ── Tests ───────────────────────────────────────────────────────────────────

const tagged: { tags: string[] } = { tags: ['!dev', '!autodocs'] };

const replyCalls = fn();
export const ReplyOpensAComposerAndSubmits: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment
        author="Marta Ilves"
        text="Is anyone looking at this?"
        onReply={replyCalls}
        replies={<Comment author="Ben Okafor" text="Yes." />}
      />
    </Frame>
  ),
  play: async ({ canvas }) => {
    replyCalls.mockClear();
    const reply = canvas.getByRole('button', { name: 'Reply' });
    await expect(reply).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(reply);
    const field = await canvas.findByRole('textbox', { name: 'Reply to Marta Ilves' });
    await expect(field).toHaveFocus();
    await expect(reply).toHaveAttribute('aria-expanded', 'true');
    // The composer sits under the existing reply, inside the comment.
    await expect(canvas.getByRole('article', { name: 'Marta Ilves' })).toContainElement(field);
    const send = canvas.getByRole('button', { name: 'Post reply' });
    await expect(send).toBeDisabled();
    await userEvent.type(field, '  Thanks, on it.  ');
    await userEvent.click(send);
    await expect(replyCalls).toHaveBeenCalledTimes(1);
    await expect(replyCalls).toHaveBeenCalledWith('Thanks, on it.');
    await expect(canvas.queryByRole('textbox')).toBeNull();
    // The focus goes back to the button that opened the composer.
    await waitFor(() => expect(reply).toHaveFocus());
  },
};

const editCalls = fn();
export const EditThenCancelRestoresTheCommentAndFocus: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment
        author="Ben Okafor"
        text="Restarted the worker."
        onEdit={editCalls}
        onDelete={() => {}}
      />
    </Frame>
  ),
  play: async ({ canvas }) => {
    editCalls.mockClear();
    const edit = canvas.getByRole('button', { name: 'Edit' });
    await userEvent.click(edit);
    const field = await canvas.findByRole('textbox', { name: 'Edit comment' });
    await expect(field).toHaveValue('Restarted the worker.');
    await expect(field).toHaveFocus();
    // The body gives way to the composer; the actions too.
    await expect(canvas.queryByText('Restarted the worker.', { ignore: 'textarea' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Delete' })).toBeNull();
    await userEvent.type(field, ' And more.');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(editCalls).not.toHaveBeenCalled();
    await expect(canvas.getByText('Restarted the worker.')).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Edit' })).toHaveFocus());

    // Escape cancels too, and Save sends the new text.
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(await canvas.findByRole('textbox')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Edit' })).toHaveFocus());
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await userEvent.type(await canvas.findByRole('textbox'), ' Done.');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(editCalls).toHaveBeenCalledTimes(1);
    await expect(editCalls).toHaveBeenCalledWith('Restarted the worker. Done.');
  },
};

export const FoldedRepliesUnfold: Story = {
  ...FoldedReplies,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Replies to Marta Ilves' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    const more = canvas.getByRole('button', { name: 'Show 3 more replies' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    await expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    const fewer = canvas.getByRole('button', { name: 'Show fewer replies' });
    await expect(fewer).toHaveAttribute('aria-expanded', 'true');
    await expect(fewer).toHaveFocus();
    await userEvent.click(fewer);
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // One hidden reply is singular.
  },
};

export const FewRepliesAreNotFolded: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment
        author="Marta Ilves"
        text="Hello."
        replies={[1, 2].map((n) => (
          <Comment key={n} author="Ben Okafor" text={`Reply ${n}.`} />
        ))}
      />
      <Comment
        author="Marta Ilves"
        text="Again."
        maxReplies={2}
        replies={[1, 2, 3].map((n) => (
          <Comment key={n} author="Ben Okafor" text={`Other ${n}.`} />
        ))}
      />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reply 2.')).toBeVisible();
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    await expect(canvas.getByRole('button', { name: 'Show 1 more reply' })).toBeVisible();
  },
};

const submitCalls = fn();
export const CtrlOrCmdEnterSubmitsEnterAddsALine: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer onSubmit={submitCalls} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    submitCalls.mockClear();
    const field = canvas.getByRole('textbox', { name: 'Comment' });
    await userEvent.type(field, 'first{Enter}second');
    await expect(field).toHaveValue('first\nsecond');
    await expect(submitCalls).not.toHaveBeenCalled();
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await expect(submitCalls).toHaveBeenLastCalledWith('first\nsecond');
    // Sent: the field is empty again and Submit is disabled.
    await expect(field).toHaveValue('');
    await expect(canvas.getByRole('button', { name: 'Comment' })).toBeDisabled();
    // Nothing to send: the shortcut does nothing.
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await expect(submitCalls).toHaveBeenCalledTimes(1);
    await userEvent.type(field, 'third');
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
    await expect(submitCalls).toHaveBeenCalledTimes(2);
    await expect(submitCalls).toHaveBeenLastCalledWith('third');
    // No cancel callback, no Cancel button.
    await expect(canvas.queryByRole('button', { name: 'Cancel' })).toBeNull();
  },
};

export const SubmitIsDisabledWhileEmptyOrSubmitting: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer onSubmit={() => {}} />
      <div className="mt-6">
        <CommentComposer label="Sending" defaultValue="On its way" submitting onSubmit={() => {}} />
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const [idle, sending] = canvas.getAllByRole('textbox');
    const [send, sendingButton] = canvas.getAllByRole('button', { name: 'Comment' });
    await expect(send).toBeDisabled();
    await userEvent.type(idle!, '   ');
    await expect(send).toBeDisabled();
    await userEvent.type(idle!, 'hi');
    await expect(send).toBeEnabled();
    await expect(sending).toHaveAttribute('readonly');
    await expect(sendingButton).toBeDisabled();
  },
};

export const HostileBodyRendersAsText: Story = {
  ...HostileText,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText(HOSTILE, { exact: false })).toBeVisible();
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(canvasElement.querySelector('b')).toBeNull();
    await expect(canvasElement.querySelector('a')).toBeNull();
    await expect('__commentXss' in window).toBe(false);
  },
};

export const LinksInABodyAreHttpOnly: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment author="Ana" text="See https://example.com/a. Not javascript:alert(1)." />
    </Frame>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'https://example.com/a' });
    await expect(link).toHaveAttribute('href', 'https://example.com/a');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(canvas.getAllByRole('link')).toHaveLength(1);
  },
};

export const AnActionWithoutItsCallbackIsAbsent: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment author="Ana" text="No actions at all." />
      <div className="mt-4">
        <Comment author="Ben" text="Only reply." onReply={() => {}} />
      </div>
      <div className="mt-4">
        <Comment
          author="Cleo"
          text="A reply: no Reply of its own."
          onEdit={() => {}}
          replies={<Comment author="Dan" text="Nested." onReply={() => {}} onDelete={() => {}} />}
        />
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const ana = within(canvas.getByRole('article', { name: 'Ana' }));
    await expect(ana.queryAllByRole('button')).toHaveLength(0);
    const ben = within(canvas.getByRole('article', { name: 'Ben' }));
    await expect(ben.getAllByRole('button').map((b) => b.textContent)).toEqual(['Reply']);
    const cleo = canvas.getByRole('article', { name: 'Cleo' });
    const dan = within(within(cleo).getByRole('article', { name: 'Dan' }));
    // One level: a reply cannot be replied to, but its other actions stay.
    await expect(dan.getAllByRole('button').map((b) => b.textContent)).toEqual(['Delete']);
  },
};

export const EditedMarkAndRoleAreShown: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment author="Ana" role="Support" edited time="2m ago" text="Fixed." />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Support')).toBeVisible();
    await expect(canvas.getByText('2m ago')).toBeVisible();
    await expect(canvas.getByText('(edited)')).toBeVisible();
  },
};

export const ChildrenRenderInPlaceOfText: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <Comment author="Ana" editText="**raw** source" onEdit={() => {}}>
        <ul>
          <li>first item</li>
          <li>
            <b>second</b> item
          </li>
        </ul>
      </Comment>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(await canvas.findByRole('textbox')).toHaveValue('**raw** source');
  },
};

export const InternalNoteIsMarkedWithoutColor: Story = {
  ...InternalNotes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const notes = canvas.getAllByText('Internal note');
    await expect(notes).toHaveLength(2);
    const internal = canvasElement.querySelector<HTMLElement>('article[data-variant="internal"]')!;
    const plain = canvasElement.querySelector<HTMLElement>('article[data-variant="default"]')!;
    const box = internal.firstElementChild as HTMLElement;
    const panel = getComputedStyle(plain.firstElementChild as HTMLElement).backgroundColor;
    inEachTheme(() => {
      // Tinted, boxed and still readable in every theme.
      expect(getComputedStyle(box).backgroundColor).not.toBe(panel);
      expect(parseFloat(getComputedStyle(box).borderTopWidth)).toBeGreaterThan(0);
      for (const el of [
        within(box).getByText('Ben Okafor'),
        within(box).getByText(/Worker 7/),
        box.querySelector<HTMLElement>('time')!,
        within(box).getByText('Internal note'),
      ]) {
        expectTextContrast(el);
      }
    });
  },
};

export const CustomLabelsReachEveryText: Story = {
  ...Translated,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Note interne')).toBeVisible();
    await expect(canvas.getByText('(modifié)')).toBeVisible();
    await expect(canvas.getByRole('list', { name: 'Commentaires' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Afficher 2 réponses de plus' })).toBeVisible();
    for (const name of ['Répondre', 'Modifier', 'Supprimer']) {
      await expect(canvas.getByRole('button', { name })).toBeVisible();
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Répondre' }));
    const field = await canvas.findByRole('textbox', { name: 'Répondre à Camille Durand' });
    await expect(field).toHaveAttribute('placeholder', 'Écrire une réponse…');
    await expect(canvas.getByRole('button', { name: 'Publier la réponse' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Annuler' })).toBeVisible();
  },
};

export const EmptyThreadSaysSo: Story = {
  ...EmptyThread,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No comments yet')).toBeVisible();
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.getByRole('textbox', { name: 'Comment' })).toBeVisible();
  },
};

export const DiscussionRoundTrip: Story = {
  ...ThreadWithReplies,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    // A new comment through the composer at the bottom.
    const composer = canvas.getAllByRole('textbox', { name: 'Comment' }).at(-1)!;
    await userEvent.type(composer, 'Closing this one.');
    await userEvent.click(canvas.getAllByRole('button', { name: 'Comment' }).at(-1)!);
    await expect(await canvas.findByText('Closing this one.')).toBeVisible();
    // Delete your own comment: the host removes it.
    await userEvent.click(
      within(canvas.getByText('Closing this one.').closest('article')!).getByRole('button', {
        name: 'Delete',
      })
    );
    await waitFor(() => expect(canvas.queryByText('Closing this one.')).toBeNull());
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The avatar and the text are at the start, and the replies hang from a rule at the start too. */
export const RepliesHangFromTheStartInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <CommentThread>
        <Comment
          author="Ana Costa"
          text="Rebooted the node, it is back in service."
          time={time('2026-10-26T11:00')}
          onReply={() => {}}
          onEdit={() => {}}
          replies={<Comment author="Ben Ito" text="Thanks, confirmed on my side." />}
        />
      </CommentThread>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByText('Ana Costa'));
    expectMirrored(canvasElement, (box) => within(box).getByText('Ben Ito'));
    expectMirrored(canvasElement, (box) =>
      within(box).getByText('Rebooted the node, it is back in service.')
    );
    // The reply button sits under the text, nudged back to the start edge by its padding.
    expectMirrored(canvasElement, (box) => within(box).getByRole('button', { name: 'Reply' }));
    const rule = canvasElement.querySelector('[data-direction="rtl"] .border-s-2')!;
    expect(getComputedStyle(rule).borderInlineStartWidth).toBe('2px');
    expect(getComputedStyle(rule).borderRightWidth).toBe('2px');
    expect(getComputedStyle(rule).borderLeftWidth).toBe('0px');
    // The replies are indented from the start, the same distance in both directions.
    expectMirrored(canvasElement, (box) => box.querySelector('.border-s-2'));
  },
};

export const LatestRepliesShowAndTheButtonUnfoldsTheOlderOnes: Story = {
  ...LatestRepliesKept,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Replies to Marta Ilves' });
    const items = () => within(list).getAllByRole('listitem');
    // The last two stay, the older four are folded.
    await expect(items()).toHaveLength(2);
    await expect(within(list).getByText('Reply number 5.')).toBeVisible();
    await expect(within(list).getByText('Reply number 6.')).toBeVisible();
    await expect(within(list).queryByText('Reply number 1.')).toBeNull();
    const more = canvas.getByRole('button', { name: 'Show 4 earlier replies' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    // The button sits above the replies, where the folded ones come back.
    await expect(
      more.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await userEvent.click(more);
    await expect(items()).toHaveLength(6);
    await expect(items()[0]).toHaveTextContent('Reply number 1.');
    await expect(items()[5]).toHaveTextContent('Reply number 6.');
    const fewer = canvas.getByRole('button', { name: 'Show fewer replies' });
    await expect(fewer).toHaveAttribute('aria-expanded', 'true');
    await expect(fewer).toHaveFocus();
    await userEvent.click(fewer);
    await expect(items()).toHaveLength(2);
    await expect(items()[0]).toHaveTextContent('Reply number 5.');
  },
};

export const TheDefaultStillFoldsTheTail: Story = {
  ...FoldedReplies,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Replies to Marta Ilves' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    await expect(within(list).getByText('Reply number 1.')).toBeVisible();
    await expect(within(list).getByText('Reply number 2.')).toBeVisible();
    await expect(within(list).queryByText('Reply number 5.')).toBeNull();
    // The button is under the replies.
    const more = canvas.getByRole('button', { name: 'Show 3 more replies' });
    await expect(
      list.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  },
};

const modeCalls = fn();
export const SwitchingModeChangesWhatOnSubmitReceives: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer modes={MODES} onSubmit={modeCalls} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    modeCalls.mockClear();
    const field = canvas.getByRole('textbox', { name: 'Comment' });
    const reply = canvas.getByRole('radio', { name: 'Reply to customer' });
    const note = canvas.getByRole('radio', { name: 'Internal note' });
    await expect(reply).toBeChecked();
    await userEvent.type(field, 'Restarted, please retry.');
    await userEvent.click(canvas.getByRole('button', { name: 'Send reply' }));
    await expect(modeCalls).toHaveBeenLastCalledWith('Restarted, please retry.', 'reply');
    // The text stays when the mode changes; the button follows the mode.
    await userEvent.type(field, 'Do not tell the customer.');
    await userEvent.click(note);
    await expect(note).toBeChecked();
    await expect(field).toHaveValue('Do not tell the customer.');
    await userEvent.click(canvas.getByRole('button', { name: 'Add note' }));
    await expect(modeCalls).toHaveBeenLastCalledWith('Do not tell the customer.', 'note');
    await expect(modeCalls).toHaveBeenCalledTimes(2);
  },
};

const plainCalls = fn();
export const WithoutModesOnSubmitStillGetsTheTextAlone: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer onSubmit={plainCalls} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    plainCalls.mockClear();
    await expect(canvas.queryByRole('radiogroup')).toBeNull();
    await expect(canvas.queryByRole('status')).toBeNull();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Comment' }), 'hello');
    await userEvent.click(canvas.getByRole('button', { name: 'Comment' }));
    await expect(plainCalls).toHaveBeenCalledTimes(1);
    await expect(plainCalls.mock.calls[0]).toEqual(['hello']);
  },
};

const readSurface = (el: Element) => {
  const style = getComputedStyle(el);
  return `${style.backgroundColor}|${style.borderTopColor}`;
};

export const AnInternalModeIsAnnouncedAndTinted: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer modes={MODES} defaultValue="Check the logs." onSubmit={fn()} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: 'Comment' });
    const status = canvas.getByRole('status');
    const replySurface = readSurface(field);
    await expect(status).toHaveTextContent('');
    await userEvent.click(canvas.getByRole('radio', { name: 'Internal note' }));
    // Announced in a live region that was already on the page, and shown with a lock.
    await expect(status).toHaveTextContent('Internal note: only your team sees this.');
    await expect(status).toBeVisible();
    inEachTheme(() => {
      expect(readSurface(field)).not.toBe(replySurface);
      expectTextContrast(field);
    });
    // The submit button turns amber.
    const submit = canvas.getByRole('button', { name: 'Add note' });
    await expect(submit).toBeEnabled();
    await userEvent.click(canvas.getByRole('radio', { name: 'Reply to customer' }));
    await expect(status).toHaveTextContent('');
    await expect(readSurface(field)).toBe(replySurface);
  },
};

export const InternalSubmitButtonIsTintedToo: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer modes={MODES} defaultValue="Text" onSubmit={fn()} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    const bg = () => getComputedStyle(canvas.getAllByRole('button')[0]!).backgroundColor;
    const replyBg = bg();
    await userEvent.click(canvas.getByRole('radio', { name: 'Internal note' }));
    await expect(bg()).not.toBe(replyBg);
  },
};

const ControlledModes = ({ onSubmit }: { onSubmit: (text: string, mode?: string) => void }) => {
  const [mode, setMode] = useState('reply');
  return (
    <Frame>
      <CommentComposer
        modes={MODES}
        mode={mode}
        onModeChange={setMode}
        defaultValue="Text"
        onSubmit={onSubmit}
      />
      <p data-testid="host-mode">{mode}</p>
    </Frame>
  );
};

const controlledCalls = fn();
export const ModeCanBeControlled: Story = {
  ...tagged,
  render: () => <ControlledModes onSubmit={controlledCalls} />,
  play: async ({ canvas }) => {
    controlledCalls.mockClear();
    await userEvent.click(canvas.getByRole('radio', { name: 'Internal note' }));
    await expect(canvas.getByTestId('host-mode')).toHaveTextContent('note');
    await expect(canvas.getByRole('radio', { name: 'Internal note' })).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Add note' }));
    await expect(controlledCalls).toHaveBeenLastCalledWith('Text', 'note');
  },
};

export const ModeKeyboardArrowsMoveTheSelection: Story = {
  ...tagged,
  render: () => (
    <Frame>
      <CommentComposer modes={MODES} onSubmit={fn()} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    canvas.getByRole('radio', { name: 'Reply to customer' }).focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Internal note' })).toBeChecked();
    await expect(canvas.getByRole('status')).toHaveTextContent('Internal note');
  },
};
