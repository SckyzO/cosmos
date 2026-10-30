import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Inbox,
  Mail,
  MoreHorizontal,
  Settings,
  Ticket as TicketIcon,
  UserPlus,
  Users,
} from 'lucide-react';
import { useSyncExternalStore, type ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  Avatar,
  AuditDiff,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CodeBlock,
  Comment,
  CommentComposer,
  CommentThread,
  Countdown,
  DateTime,
  DescriptionList,
  ErrorState,
  Menu,
  PageHeader,
  RecordPager,
  RelativeTime,
  Shell,
  Sidebar,
  Sk,
  SkeletonText,
  Tabs,
  Tag,
  Timeline,
  Topbar,
  type CommentComposerMode,
  type TimelineItem,
} from '../../../../packages/react/src';
import {
  expectNoHorizontalOverflow,
  mobileViewport,
  portalDocsParams,
} from '../../../../packages/react/src/storybook-helpers';
import {
  NOW,
  extremeTicket,
  newTicket,
  ticket as regularTicket,
  type Message,
  type RelatedTicket,
  type Ticket,
} from './detail.data';

// A record page: the ticket on the left in three tabs, its details on the right. Everything
// but the shell is built from Cosmos components; the data comes from `detail.data.ts`.
//
// The states are props of one screen, not copies of it. A real page would derive `state` from
// its data fetch (pending, failed, 404, loaded) and pass the ticket it got.

type ScreenState = 'content' | 'loading' | 'error' | 'notFound';
type TicketTab = 'conversation' | 'details' | 'history';
type ScreenAction =
  'assign' | 'close' | 'merge' | 'copy' | 'spam' | 'previous' | 'next' | 'retry' | 'back';

type TicketScreenProps = {
  /** What the data fetch is doing. `content` shows `ticket`. */
  state?: ScreenState;
  ticket?: Ticket;
  /** The tab shown first. */
  tab?: TicketTab;
  /** A reply or a note was submitted, with the mode of the composer ("reply" or "note"). */
  onSubmit?: (text: string, mode?: string) => void;
  /** Any button of the page that is not a form: header actions, pager, retry, way back. */
  onAction?: (action: ScreenAction) => void;
};

// ── Small pieces ─────────────────────────────────────────────────────────────

// The same time everywhere, whatever the reader's zone and language.
const When = ({ value }: { value: string }) => (
  <DateTime
    value={value}
    format={{ dateStyle: 'medium', timeStyle: 'short' }}
    locale="en-US"
    timeZone="UTC"
  />
);

// The page changes its markup (not just its classes) below `sm`: the two main actions move into
// the More menu. Anything that only moves or hides stays a responsive class.
const PHONE = '(max-width: 639px)';
const watchPhone = (onChange: () => void) => {
  const list = window.matchMedia(PHONE);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
};
const usePhone = () =>
  useSyncExternalStore(
    watchPhone,
    () => window.matchMedia(PHONE).matches,
    () => false
  );

const cardTitle = 'text-sm font-semibold text-[var(--color-text-primary)]';

const RELATED_INTENT = { Open: 'info', Resolved: 'success', Closed: 'neutral' } as const;

const messageCount = (ticket: Ticket) =>
  ticket.exchanges.reduce((sum, { replies }) => sum + 1 + replies.length, 0);

// ── Shell ────────────────────────────────────────────────────────────────────

// The `Topbar` title is plain text: the page's own `PageHeader` is its one `h1`.
const AppShell = ({ children }: { children: ReactNode }) => (
  <Shell
    topbar={
      <Topbar
        pageTitle="Support"
        endActions={<Avatar name="Marcus Obi" size="sm" status="online" />}
      />
    }
    sidebar={
      <Sidebar>
        <Sidebar.Brand
          logo={<TicketIcon className="size-5" />}
          title="Relay Desk"
          subtitle="Support"
          divider
        />
        <div className="py-3">
          <Sidebar.Item icon={Inbox} label="Inbox" badge={<Badge size="sm">12</Badge>} />
          <Sidebar.Item icon={TicketIcon} label="Tickets" active />
          <Sidebar.Item icon={Users} label="Customers" />
          <Sidebar.Section label="Workspace">
            <Sidebar.Item icon={BarChart3} label="Reports" />
            <Sidebar.Item icon={BookOpen} label="Knowledge base" />
            <Sidebar.Item icon={Settings} label="Settings" />
          </Sidebar.Section>
        </div>
      </Sidebar>
    }
  >
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">{children}</div>
  </Shell>
);

// ── Header ───────────────────────────────────────────────────────────────────

const TicketBreadcrumb = ({ id, onBack }: { id: string; onBack?: () => void }) => (
  <Breadcrumb items={[{ label: 'Tickets', onClick: onBack }, { label: `#${id}` }]} />
);

const TRIGGER_CLASS =
  'inline-flex size-ctrl-32 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:focus-indicator dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';

const TicketHeader = ({
  ticket,
  onAction,
}: {
  ticket: Ticket;
  onAction: (action: ScreenAction) => void;
}) => {
  const phone = usePhone();
  const assign = ticket.assignee ? 'Assign' : 'Assign to me';
  return (
    <PageHeader
      as="h1"
      title={ticket.subject}
      breadcrumb={<TicketBreadcrumb id={ticket.id} onBack={() => onAction('back')} />}
      description={ticket.summary}
      meta={
        <>
          <Badge intent={ticket.status.intent}>{ticket.status.label}</Badge>
          <Tag intent={ticket.priority.intent}>{`${ticket.priority.label} priority`}</Tag>
          <PageHeader.MetaItem icon={Mail}>{ticket.channel}</PageHeader.MetaItem>
          <PageHeader.MetaItem icon={Clock}>
            Opened <When value={ticket.createdAt} />
          </PageHeader.MetaItem>
        </>
      }
      actions={
        <>
          <RecordPager
            variant="compact"
            noun="ticket"
            position={ticket.position.index}
            total={ticket.position.total}
            onPrevious={() => onAction('previous')}
            onNext={() => onAction('next')}
          />
          {!phone && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                onClick={() => onAction('assign')}
              >
                {assign}
              </Button>
              <Button size="sm" icon={Check} onClick={() => onAction('close')}>
                Close ticket
              </Button>
            </>
          )}
          <Menu align="end">
            <Menu.Trigger aria-label="More" className={TRIGGER_CLASS}>
              <MoreHorizontal className="size-4" aria-hidden />
            </Menu.Trigger>
            <Menu.Content aria-label="More actions">
              {phone && (
                <>
                  <Menu.Item icon={UserPlus} onSelect={() => onAction('assign')}>
                    {assign}
                  </Menu.Item>
                  <Menu.Item icon={Check} onSelect={() => onAction('close')}>
                    Close ticket
                  </Menu.Item>
                  <Menu.Separator />
                </>
              )}
              <Menu.Item onSelect={() => onAction('merge')}>Merge into another ticket</Menu.Item>
              <Menu.Item onSelect={() => onAction('copy')}>Copy link</Menu.Item>
              <Menu.Item intent="danger" onSelect={() => onAction('spam')}>
                Mark as spam
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </>
      }
    />
  );
};

// ── Conversation ─────────────────────────────────────────────────────────────

// What the composer can write. Only the internal mode is tinted and never reaches the customer.
const modesFor = (ticket: Ticket): CommentComposerMode[] => [
  {
    value: 'reply',
    label: 'Reply to customer',
    submitLabel: 'Send reply',
    placeholder: `Write to ${ticket.requester.name}…`,
  },
  {
    value: 'note',
    label: 'Internal note',
    internal: true,
    submitLabel: 'Add note',
    placeholder: 'Write a note for your team…',
  },
];

// A message and, for the opening one, the code the customer pasted under it.
const MessageComment = ({
  message,
  onReply,
  replies,
}: {
  message: Message;
  onReply?: (text: string) => void;
  replies?: ReactNode;
}) => {
  const common = {
    author: message.author,
    role: message.role,
    time: <When value={message.at} />,
    variant: message.internal ? ('internal' as const) : ('default' as const),
    onReply,
    replies,
    // A ticket's last exchanges matter: the older replies fold above them.
    keepReplies: 'last' as const,
    maxReplies: 4,
  };
  if (message.code === undefined) return <Comment {...common} text={message.text} />;
  return (
    <Comment {...common}>
      <p className="whitespace-pre-wrap">{message.text}</p>
      <CodeBlock code={message.code} language="http" wrap className="mt-3" />
    </Comment>
  );
};

const Conversation = ({
  ticket,
  onSubmit,
}: {
  ticket: Ticket;
  onSubmit: (text: string, mode?: string) => void;
}) => (
  <CommentThread
    label="Conversation"
    emptyTitle="No replies yet"
    emptyDescription={`${ticket.requester.name} is waiting for a first answer. Your reply is sent to ${ticket.requester.email}.`}
    composer={
      <CommentComposer
        label="Message"
        modes={modesFor(ticket)}
        onSubmit={onSubmit}
        placeholder="Write a reply…"
      />
    }
  >
    {ticket.exchanges.map(({ message, replies }) => (
      <MessageComment
        key={message.id}
        message={message}
        onReply={(text) => onSubmit(text, 'reply')}
        replies={replies.map((reply) => (
          <MessageComment key={reply.id} message={reply} />
        ))}
      />
    ))}
  </CommentThread>
);

// ── Details and history tabs ─────────────────────────────────────────────────

const Fields = ({ ticket }: { ticket: Ticket }) => (
  <DescriptionList>
    {ticket.fields.map((field) => (
      <DescriptionList.Item key={field.label} label={field.label} mono={field.mono}>
        {field.value}
      </DescriptionList.Item>
    ))}
  </DescriptionList>
);

// The `inline` diff, one line per field: a Timeline writes its description inside a `<p>`, which
// the `table` variant (a block) can't sit in.
const HistoryTab = ({ ticket }: { ticket: Ticket }) => {
  const items: TimelineItem[] = ticket.history.map((entry) => ({
    id: entry.id,
    title: (
      <>
        <bdi>{entry.actor}</bdi> {entry.action}
      </>
    ),
    time: <When value={entry.at} />,
    avatarName: entry.actor,
    description:
      entry.changes.length > 0 ? <AuditDiff changes={entry.changes} variant="inline" /> : undefined,
  }));
  return <Timeline variant="avatar" items={items} />;
};

// ── Aside ────────────────────────────────────────────────────────────────────

const Person = ({ name, email }: { name: string; email?: string }) => (
  <span className="flex min-w-0 items-center justify-end gap-2 text-end">
    <Avatar name={name} size="xs" />
    <span className="min-w-0">
      <span className="block break-words">
        <bdi>{name}</bdi>
      </span>
      {email && (
        <span className="block text-xs font-normal break-all text-[var(--color-text-secondary)]">
          <bdi>{email}</bdi>
        </span>
      )}
    </span>
  </span>
);

const Related = ({ tickets, empty }: { tickets: RelatedTicket[]; empty: string }) => (
  <Card padding="none">
    <Card.Header>
      <h2 className={cardTitle}>Related tickets</h2>
    </Card.Header>
    <Card.Body>
      {tickets.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{empty}</p>
      ) : (
        <ul role="list" className="divide-y divide-[var(--color-border)]">
          {tickets.map((related) => (
            <li
              key={related.id}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words text-[var(--color-text-primary)]">
                  <bdi>{related.title}</bdi>
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">#{related.id}</p>
              </div>
              <Badge size="sm" intent={RELATED_INTENT[related.status]}>
                {related.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card.Body>
  </Card>
);

const Aside = ({ ticket }: { ticket: Ticket }) => (
  <div className="min-w-0 space-y-6">
    <Card padding="none">
      <Card.Header>
        <h2 className={cardTitle}>Details</h2>
      </Card.Header>
      <Card.Body>
        <DescriptionList compact>
          <DescriptionList.Item label="Requester">
            <Person name={ticket.requester.name} email={ticket.requester.email} />
          </DescriptionList.Item>
          <DescriptionList.Item label="Assignee">
            {ticket.assignee ? (
              <Person name={ticket.assignee} />
            ) : (
              <span className="font-normal text-[var(--color-text-secondary)]">Unassigned</span>
            )}
          </DescriptionList.Item>
          <DescriptionList.Item label={ticket.sla.label}>
            {/* `now` freezes the count so the story reads the same on every run; an app leaves it out. */}
            <Countdown
              variant="inline"
              target={ticket.sla.due}
              now={NOW}
              label="in"
              completedLabel={
                <Badge size="sm" intent="danger">
                  Breached
                </Badge>
              }
            />
          </DescriptionList.Item>
          <DescriptionList.Item label="Channel">{ticket.channel}</DescriptionList.Item>
          <DescriptionList.Item label="Created">
            <span className="block text-end">
              <When value={ticket.createdAt} />
              <span className="block text-xs font-normal text-[var(--color-text-secondary)]">
                <RelativeTime value={ticket.createdAt} now={NOW} />
              </span>
            </span>
          </DescriptionList.Item>
        </DescriptionList>
        <div className="mt-1 border-t border-gray-100 pt-3 dark:border-white/5">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {ticket.tags.length > 0 ? `Tags (${ticket.tags.length})` : 'Tags'}
          </p>
          {ticket.tags.length === 0 ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">No tags</p>
          ) : (
            <ul role="list" className="mt-2 flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <li key={tag}>
                  <Tag size="sm">{tag}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card.Body>
    </Card>
    <Related tickets={ticket.related} empty={ticket.noRelated} />
  </div>
);

// ── The record, and the states around it ─────────────────────────────────────

const Record = ({
  ticket,
  tab,
  onSubmit,
}: {
  ticket: Ticket;
  tab: TicketTab;
  onSubmit: (text: string, mode?: string) => void;
}) => (
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <Tabs defaultValue={tab} className="min-w-0">
      <Tabs.List>
        <Tabs.Trigger value="conversation" badge={messageCount(ticket)}>
          Conversation
        </Tabs.Trigger>
        <Tabs.Trigger value="details">Details</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="conversation" className="pt-6">
        <Conversation ticket={ticket} onSubmit={onSubmit} />
      </Tabs.Panel>
      <Tabs.Panel value="details" className="pt-6">
        <Fields ticket={ticket} />
      </Tabs.Panel>
      <Tabs.Panel value="history" className="pt-6">
        <HistoryTab ticket={ticket} />
      </Tabs.Panel>
    </Tabs>
    <Aside ticket={ticket} />
  </div>
);

// Skeletons where the data goes. The header keeps the id the route already knows.
const LoadingBody = ({ id }: { id: string }) => (
  <div aria-busy="true" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <p role="status" className="sr-only">
      Loading ticket #{id}…
    </p>
    <div className="space-y-6">
      <Sk h="h-9" w="w-72 max-w-full" round="rounded-lg" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <Sk h="h-8" w="w-8" round="rounded-full" className="shrink-0" />
          <SkeletonText lines={3} className="flex-1" />
        </div>
      ))}
    </div>
    <Card>
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex justify-between gap-4">
            <Sk h="h-3" w="w-16" />
            <Sk h="h-3" w="w-28" />
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const TicketScreen = ({
  state = 'content',
  ticket = regularTicket,
  tab = 'conversation',
  onSubmit = () => {},
  onAction = () => {},
}: TicketScreenProps) => {
  const id = state === 'notFound' ? '9999' : ticket.id;
  return (
    <AppShell>
      {state === 'content' ? (
        <TicketHeader ticket={ticket} onAction={onAction} />
      ) : (
        // No ticket to name yet, or none at all: the header keeps the title the route gives.
        <PageHeader
          as="h1"
          title={`Ticket #${id}`}
          breadcrumb={<TicketBreadcrumb id={id} onBack={() => onAction('back')} />}
        />
      )}
      {state === 'content' && <Record ticket={ticket} tab={tab} onSubmit={onSubmit} />}
      {state === 'loading' && <LoadingBody id={id} />}
      {state === 'error' && (
        <Card>
          <ErrorState
            title={`Could not load ticket #${id}`}
            description="Relay Desk did not get an answer from the server (504). Nothing was lost; any reply you were writing is kept as a draft."
            onRetry={() => onAction('retry')}
            action={
              <Button variant="ghost" size="sm" onClick={() => onAction('back')}>
                Back to tickets
              </Button>
            }
          />
        </Card>
      )}
      {state === 'notFound' && (
        <Card>
          <ErrorState
            title={`Ticket #${id} does not exist`}
            description="It may have been deleted or merged into another ticket, or the number is mistyped. Check the number or go back to the list."
            action={
              <Button variant="secondary" size="sm" onClick={() => onAction('back')}>
                Back to tickets
              </Button>
            }
          />
        </Card>
      )}
    </AppShell>
  );
};

// ── Stories ──────────────────────────────────────────────────────────────────

const meta = {
  title: 'Examples/Detail',
  component: TicketScreen,
  parameters: { ...portalDocsParams.full(), layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onSubmit: fn(), onAction: fn() },
} satisfies Meta<typeof TicketScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Hidden stories: tests that click or type, kept out of the sidebar and the docs.
const hidden = ['!dev', '!autodocs'];

/** Ticket #4821 with its conversation: a customer, the answers under it and an internal note. */
export const Content: Story = {};

/** A new ticket nobody answered: the thread asks for the first reply, the composer is ready. */
export const Empty: Story = {
  args: { ticket: newTicket },
};

/** The first load: skeletons where the data goes, the shell and the ticket's number in place. */
export const Loading: Story = {
  args: { state: 'loading' },
};

/** The request failed: the ticket exists, so the error offers a retry and the way back. */
export const LoadError: Story = {
  name: 'Error',
  args: { state: 'error' },
};

/** Ticket #9999 does not exist: no retry, the way back to the list is the action. */
export const NotFound: Story = {
  args: { state: 'notFound' },
};

/**
 * A subject on three lines, 40 tags, long emails, a long message with a code block and 200
 * replies: the last four stay, the 196 earlier ones fold behind a button.
 */
export const ExtremeContent: Story = {
  args: { ticket: extremeTicket },
};

/** The History tab shown first (`tab="history"`), with its audit diffs. */
export const History: Story = {
  args: { tab: 'history' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(canvas.getByText(/changed the priority/)).toBeVisible();
    await expect(canvas.getByText('High')).toBeVisible();
  },
};

/**
 * The same page at phone width: the aside under the thread, Assign and Close ticket in the More
 * menu.
 */
export const Phone: Story = {
  globals: mobileViewport,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    await expect(canvas.getByRole('button', { name: 'More' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Close ticket' })).toBeNull();
  },
};

/** The History tab at phone width. */
export const PhoneHistory: Story = {
  globals: mobileViewport,
  args: { tab: 'history' },
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

export const ContentRendersTheRecord: Story = {
  tags: hidden,
  play: async ({ canvas }) => {
    // One h1: the page header. The topbar's title is text.
    const headings = canvas.getAllByRole('heading', { level: 1 });
    await expect(headings).toHaveLength(1);
    await expect(headings[0]).toHaveTextContent('Refund not received for order 10392');
    await expect(canvas.getByRole('tab', { name: /Conversation/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(canvas.getByRole('list', { name: 'Conversation' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Internal note' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Close ticket' })).toBeVisible();
    // The SLA counts down to 11:42 from the frozen 10:00.
    await expect(canvas.getByRole('timer')).toHaveTextContent('1h 42m');
    await expect(canvas.getByRole('navigation', { name: 'Ticket navigation' })).toBeVisible();
  },
};

export const EmptyAsksForTheFirstReply: Story = {
  ...Empty,
  tags: hidden,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No replies yet')).toBeVisible();
    await expect(canvas.queryByRole('list', { name: 'Conversation' })).toBeNull();
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await expect(canvas.getByText('No tags')).toBeVisible();
    await expect(canvas.getByText('No other ticket from Jonas Weber.')).toBeVisible();
  },
};

export const LoadingShowsSkeletons: Story = {
  ...Loading,
  tags: hidden,
  play: async ({ canvasElement, canvas }) => {
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading ticket #4821');
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Ticket #4821');
    // The shell stays live.
    await expect(canvas.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  },
};

export const LoadErrorOffersRetryAndTheWayBack: Story = {
  ...LoadError,
  tags: hidden,
  play: async ({ canvas, args }) => {
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Could not load ticket #4821');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    await expect(args.onAction).toHaveBeenLastCalledWith('retry');
    await userEvent.click(within(alert).getByRole('button', { name: 'Back to tickets' }));
    await expect(args.onAction).toHaveBeenLastCalledWith('back');
  },
};

export const NotFoundOffersOnlyTheWayBack: Story = {
  ...NotFound,
  tags: hidden,
  play: async ({ canvas, args }) => {
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Ticket #9999 does not exist');
    await expect(within(alert).queryByRole('button', { name: 'Try again' })).toBeNull();
    await userEvent.click(within(alert).getByRole('button', { name: 'Back to tickets' }));
    await expect(args.onAction).toHaveBeenLastCalledWith('back');
  },
};

export const ExtremeContentFoldsTheEarlierReplies: Story = {
  ...ExtremeContent,
  tags: hidden,
  play: async ({ canvas }) => {
    const replies = () =>
      within(
        canvas.getByRole('list', { name: 'Replies to Bartholomew Fitzgerald-Montgomery' })
      ).getAllByRole('listitem');
    await expect(canvas.getByRole('tab', { name: /Conversation/ })).toHaveTextContent('201');
    await expect(canvas.getByText(/retrying from our side/)).toBeVisible();
    await expect(canvas.getAllByRole('listitem').length).toBeGreaterThan(40);
    await expect(replies()).toHaveLength(4);
    const toggle = canvas.getByRole('button', { name: 'Show 196 earlier replies' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // The fold is above the replies it hides, and the latest reply stays in view.
    await expect(canvas.getByText(/\(update 200\)/)).toBeVisible();
    await expect(canvas.queryByText(/\(update 1\)/)).toBeNull();
    await userEvent.click(toggle);
    await expect(replies()).toHaveLength(200);
    await expect(canvas.getByText(/\(update 1\)/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Show fewer replies' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  },
};

export const ComposerModesReachOnSubmit: Story = {
  tags: hidden,
  play: async ({ canvas, args }) => {
    const field = canvas.getByRole('textbox', { name: 'Message' });
    await expect(canvas.getByRole('radio', { name: 'Reply to customer' })).toBeChecked();
    await userEvent.type(field, 'Payments re-issued the refund today.');
    await userEvent.click(canvas.getByRole('button', { name: 'Send reply' }));
    await expect(args.onSubmit).toHaveBeenLastCalledWith(
      'Payments re-issued the refund today.',
      'reply'
    );
    await userEvent.click(canvas.getByRole('radio', { name: 'Internal note' }));
    await userEvent.type(field, 'Ask pay-ops to confirm by 15:00.');
    await userEvent.click(canvas.getByRole('button', { name: 'Add note' }));
    await expect(args.onSubmit).toHaveBeenLastCalledWith(
      'Ask pay-ops to confirm by 15:00.',
      'note'
    );
  },
};

export const PhoneActionsLiveInTheMoreMenu: Story = {
  ...Phone,
  tags: hidden,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'More' }));
    // The menu renders in a portal, at the end of the body.
    const menu = within(document.body);
    await expect(menu.getByRole('menuitem', { name: 'Assign' })).toBeVisible();
    await userEvent.click(menu.getByRole('menuitem', { name: 'Close ticket' }));
    await waitFor(() => expect(args.onAction).toHaveBeenLastCalledWith('close'));
  },
};
