import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CheckCheck,
  HardDrive,
  Mail,
  MailOpen,
  MessageSquare,
  Receipt,
  Rocket,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EmptyState } from '../feedback/EmptyState';
import { PageContainer } from '../layout/PageContainer';
import {
  bothDirections,
  directionBox,
  endEdge,
  endOffset,
  expectNoHorizontalOverflow,
  mobileViewport,
  startEdge,
  startOffset,
} from '../storybook-helpers';
import { Button } from './Button';
import { Card } from './Card';
import { NotificationRow, type NotificationRowIntent } from './NotificationRow';
import { Tabs } from './Tabs';

const meta = {
  title: 'Lists/Notification Row',
  component: NotificationRow,
  tags: ['autodocs'],
  // `intent` and `title` are required, and Storybook 10 wants them in `args`.
  args: { intent: 'info', title: 'Ana Costa commented on "Q3 rollout plan"' },
} satisfies Meta<typeof NotificationRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// A row fills the width it is given: a story frames it the way a page or a panel would.
const Frame = ({ children, testId }: { children: ReactNode; testId?: string }) => (
  <div
    data-testid={testId}
    className="max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]"
  >
    {children}
  </div>
);

// The actions are named after their row ("Delete: {title}"), so a row is found by a name that
// starts with its title, or with "Unread: " before it.
const rowButton = (root: HTMLElement, title: string) =>
  within(root).getByRole('button', { name: new RegExp(`^(Unread: )?${title}`) });

const actionButtons = (title: string, unread: boolean) => (
  <>
    <Button
      variant="ghost"
      shape="square"
      size="sm"
      icon={unread ? MailOpen : Mail}
      aria-label={`${unread ? 'Mark as read' : 'Mark as unread'}: ${title}`}
    />
    <Button
      variant="ghost"
      intent="danger"
      shape="square"
      size="sm"
      icon={Trash2}
      aria-label={`Delete: ${title}`}
    />
  </>
);

// ── The row ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    subtitle: '"Can we move the cutover to Thursday?"',
    caption: 'comment_created',
    time: '5 min ago',
  },
  render: (args) => (
    <Frame>
      <NotificationRow {...args} />
    </Frame>
  ),
};

/** The row is a button of its own: it needs no panel around it, and takes `onClick`. */
export const RendersOutsideAPanel: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  args: { ...Default.args, onClick: fn() },
  play: async ({ args, canvas }) => {
    const row = canvas.getByRole('button', { name: /Ana Costa commented/ });
    await expect(row.tagName).toBe('BUTTON');
    await expect(row).toHaveAttribute('type', 'button');
    await userEvent.click(row);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Unread: Story = {
  args: { ...Default.args, unread: true },
  render: Default.render,
};

export const UnreadChecks: Story = {
  ...Unread,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /Ana Costa commented/ });
    await expect(row).toHaveTextContent('Unread:');
    await expect(row).toHaveClass('dark:bg-brand-500/10');
  },
};

export const Intents: Story = {
  render: () => (
    <Frame>
      <div className="divide-y divide-[var(--color-border)]">
        <NotificationRow intent="danger" title="Deploy of api-gateway failed" />
        <NotificationRow intent="warning" title="Disk usage at 87% on db-02" />
        <NotificationRow intent="info" title="Ana Costa commented" />
        <NotificationRow intent="success" title="Invoice 2041 paid" />
        <NotificationRow intent="success" title="Invoice 2042 paid" badgeLabel="PAID" />
      </div>
    </Frame>
  ),
};

/** `icon` replaces the icon the `intent` picks. The chip and the badge keep the intent's color. */
export const CustomIcons: Story = {
  render: () => (
    <Frame>
      <div className="divide-y divide-[var(--color-border)]">
        <NotificationRow intent="info" icon={MessageSquare} title="Ana Costa commented" />
        <NotificationRow intent="success" icon={Receipt} title="Invoice 2041 paid" />
        <NotificationRow intent="danger" icon={Rocket} title="Deploy of api-gateway failed" />
        <NotificationRow intent="info" title="No icon given: the one of the intent" />
      </div>
    </Frame>
  ),
};

export const CustomIconsChecks: Story = {
  ...CustomIcons,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = (name: RegExp) => canvas.getByRole('button', { name });
    await expect(row(/Ana Costa/).querySelector('svg')).toHaveClass(
      'lucide-message-square',
      'text-blue-500'
    );
    await expect(row(/Ana Costa/).querySelector('div.rounded-full')).toHaveClass('bg-blue-500/15');
    await expect(row(/Invoice 2041/).querySelector('svg')).toHaveClass(
      'lucide-receipt',
      'text-green-600'
    );
    await expect(row(/Deploy/).querySelector('svg')).toHaveClass('lucide-rocket', 'text-red-500');
    // Without `icon`, the intent's own.
    await expect(row(/No icon given/).querySelector('svg')).toHaveClass('lucide-info');
    // The badge is the intent's, whatever the icon.
    await expect(within(row(/Deploy/)).getByText('CRIT').parentElement).toHaveClass('bg-red-600');
  },
};

/**
 * `actions` take the end of the row. They are siblings of the row's button, never inside it, so
 * each one is a stop of its own for the keyboard and a click on one is not a click on the row.
 */
export const WithActions: Story = {
  args: { ...Default.args, unread: true },
  render: (args) => (
    <Frame>
      <NotificationRow {...args} actions={actionButtons(args.title, Boolean(args.unread))} />
    </Frame>
  ),
};

export const WithActionsChecks: Story = {
  ...WithActions,
  tags: ['!dev', '!autodocs'],
  args: { ...WithActions.args, onClick: fn() },
  play: async ({ args, canvas, canvasElement }) => {
    const row = rowButton(canvasElement, 'Ana Costa commented');
    const mark = canvas.getByRole('button', { name: /^Mark as read/ });
    const remove = canvas.getByRole('button', { name: /^Delete/ });
    // Nothing interactive inside the row's button: the actions come after it.
    await expect(row.querySelector('button, a[href], [role="button"]')).toBeNull();
    await expect(row.contains(mark)).toBe(false);
    await expect(row.nextElementSibling!.contains(mark)).toBe(true);
    await expect(row.nextElementSibling!.contains(remove)).toBe(true);
    // The tint and the hover are the row's, so they cover the actions too.
    await expect(row.parentElement).toHaveClass('dark:bg-brand-500/10');
    // Keyboard: the row, then each action.
    row.focus();
    await userEvent.tab();
    await expect(mark).toHaveFocus();
    await userEvent.tab();
    await expect(remove).toHaveFocus();
    // An action is not a click on the row.
    await userEvent.click(mark);
    await expect(args.onClick).not.toHaveBeenCalled();
    await userEvent.click(row);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Without `actions` the row is the button itself, with nothing around it. */
export const WithoutActionsIsTheButton: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const row = canvas.getByRole('button', { name: /Ana Costa commented/ });
    await expect(row.nextElementSibling).toBeNull();
    await expect(row.parentElement!.tagName).toBe('DIV');
    await expect(row.parentElement!.className).toContain('rounded-2xl');
  },
};

/**
 * The icon starts the row, the badge and the actions end it, and the texts keep their reading
 * order, in both directions.
 */
export const FollowsTheDirection: Story = {
  ...WithActions,
  tags: ['!dev', '!autodocs'],
  render: (args) =>
    bothDirections(() => (
      <Frame>
        <NotificationRow {...args} actions={actionButtons(args.title, Boolean(args.unread))} />
      </Frame>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const row = rowButton(box, 'Ana Costa commented');
      const root = row.parentElement!;
      const chip = row.querySelector('div.rounded-full')!;
      const badge = within(row).getByText('INFO');
      const mark = within(box).getByRole('button', { name: /^Mark as read/ });
      const remove = within(box).getByRole('button', { name: /^Delete/ });
      expect(startOffset(chip, root), `${dir}: the icon starts the row`).toBeLessThan(
        endOffset(chip, root)
      );
      // Badge, then the actions, toward the end of the line.
      expect(endOffset(badge, root), `${dir}: the badge is before the actions`).toBeGreaterThan(
        endOffset(mark, root)
      );
      expect(endOffset(mark, root)).toBeGreaterThan(endOffset(remove, root));
      expect(endOffset(remove, root), `${dir}: the actions end the row`).toBeLessThan(
        startOffset(remove, root)
      );
    }
  },
};

// ── A notifications page ─────────────────────────────────────────────────────

type Notice = {
  id: string;
  intent: NotificationRowIntent;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  time: string;
  unread: boolean;
};

const NOTICES: Notice[] = [
  {
    id: 'comment',
    intent: 'info',
    icon: MessageSquare,
    title: 'Ana Costa commented on "Q3 rollout plan"',
    subtitle: '"Can we move the cutover to Thursday?"',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 'deploy',
    intent: 'danger',
    icon: Rocket,
    title: 'Deploy of api-gateway failed',
    subtitle: 'production · build 4821',
    time: '32 min ago',
    unread: true,
  },
  {
    id: 'invoice',
    intent: 'success',
    icon: Receipt,
    title: 'Invoice 2041 paid',
    subtitle: 'Northwind Traders · 1,280.00 EUR',
    time: '2 h ago',
    unread: true,
  },
  {
    id: 'disk',
    intent: 'warning',
    icon: HardDrive,
    title: 'Disk usage at 87% on db-02',
    subtitle: 'Datacenter Paris',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'mention',
    intent: 'info',
    icon: MessageSquare,
    title: 'Li Wei mentioned you in "Billing migration"',
    subtitle: '"@you can you check the webhook retries?"',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'invoice-late',
    intent: 'warning',
    icon: Receipt,
    title: 'Invoice 2037 is 14 days overdue',
    subtitle: 'Contoso Ltd · 640.00 EUR',
    time: '3 days ago',
    unread: false,
  },
];

type Filter = 'all' | 'unread';

/**
 * The list a notifications page shows: the same rows as the topbar panel, with an All / Unread
 * filter, "Mark all as read", and the actions of each row. The page owns the data and the
 * paging; a row only draws one notification.
 */
const NotificationsPage = ({ initial = NOTICES }: { initial?: Notice[] }) => {
  const [notices, setNotices] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  // What holds the list stays mounted when the list is empty, so a row that leaves, or a button
  // that disables itself, has somewhere to hand the focus to.
  const results = useRef<HTMLDivElement>(null);
  const unreadCount = notices.filter((n) => n.unread).length;
  const shown = filter === 'unread' ? notices.filter((n) => n.unread) : notices;

  const setUnread = (id: string, unread: boolean) => {
    setNotices((all) => all.map((n) => (n.id === id ? { ...n, unread } : n)));
    if (filter === 'unread') results.current?.focus();
  };
  const remove = (id: string) => {
    setNotices((all) => all.filter((n) => n.id !== id));
    results.current?.focus();
  };
  const markAllRead = () => {
    setNotices((all) => all.map((n) => ({ ...n, unread: false })));
    results.current?.focus();
  };

  return (
    <PageContainer width="narrow">
      <Card padding="none">
        <Card.Header>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Notifications
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={CheckCheck}
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
        </Card.Header>
        <Tabs value={filter} onChange={(next) => setFilter(next === 'unread' ? 'unread' : 'all')}>
          <Tabs.List className="px-4">
            <Tabs.Trigger value="all" badge={notices.length}>
              All
            </Tabs.Trigger>
            <Tabs.Trigger value="unread" badge={unreadCount}>
              Unread
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
        <div ref={results} tabIndex={-1} className="focus-visible:focus-indicator">
          {shown.length === 0 ? (
            <EmptyState
              compact
              intent={filter === 'unread' ? 'success' : 'neutral'}
              icon={filter === 'unread' ? CheckCheck : undefined}
              title={filter === 'unread' ? "You're all caught up" : 'No notifications'}
              description={filter === 'unread' ? 'Nothing unread.' : 'New ones will show up here.'}
            />
          ) : (
            <ul role="list" className="divide-y divide-[var(--color-border)]">
              {shown.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    intent={n.intent}
                    icon={n.icon}
                    title={n.title}
                    subtitle={n.subtitle}
                    time={n.time}
                    unread={n.unread}
                    // Opening a notification reads it.
                    onClick={() => setUnread(n.id, false)}
                    actions={
                      <>
                        <Button
                          variant="ghost"
                          shape="square"
                          size="sm"
                          icon={n.unread ? MailOpen : Mail}
                          aria-label={`${n.unread ? 'Mark as read' : 'Mark as unread'}: ${n.title}`}
                          onClick={() => setUnread(n.id, !n.unread)}
                        />
                        <Button
                          variant="ghost"
                          intent="danger"
                          shape="square"
                          size="sm"
                          icon={Trash2}
                          aria-label={`Delete: ${n.title}`}
                          onClick={() => remove(n.id)}
                        />
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

/** A page of notifications on a desktop screen: filters, "Mark all as read", row actions. */
export const Page: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <NotificationsPage />,
};

/** The same page on a phone: the rows truncate their text, and the actions stay on the row. */
export const PageOnAPhone: Story = {
  parameters: { layout: 'fullscreen' },
  globals: mobileViewport,
  render: () => <NotificationsPage />,
};

const unreadTab = (root: HTMLElement) => within(root).getByRole('tab', { name: /^Unread/ });
const rows = (root: HTMLElement) => within(root).getAllByRole('listitem');

export const PageChecks: Story = {
  ...Page,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await expect(rows(canvasElement)).toHaveLength(6);
    await expect(canvas.getByRole('tab', { name: 'All 6' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(unreadTab(canvasElement)).toHaveAccessibleName('Unread 3');
    // The page owns the filter: Unread keeps the rows that are.
    await userEvent.click(unreadTab(canvasElement));
    await expect(rows(canvasElement)).toHaveLength(3);
    // Marking one as read takes it out of Unread and updates the count. The button that had the
    // focus is gone, so the focus goes to what holds the list.
    const results = canvas.getByRole('list').parentElement!;
    await userEvent.click(canvas.getByRole('button', { name: /^Mark as read: Deploy of api/ }));
    await expect(rows(canvasElement)).toHaveLength(2);
    await expect(unreadTab(canvasElement)).toHaveAccessibleName('Unread 2');
    await expect(results).toHaveFocus();
    // Opening a row reads it too.
    await userEvent.click(rowButton(canvasElement, 'Invoice 2041 paid'));
    await expect(rows(canvasElement)).toHaveLength(1);
    // Mark all as read empties Unread, says so, and disables itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Mark all as read' }));
    await expect(canvas.getByText("You're all caught up")).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    await expect(unreadTab(canvasElement)).toHaveAccessibleName('Unread 0');
    // All still has every row, now read, each offering "Mark as unread".
    await userEvent.click(canvas.getByRole('tab', { name: /^All/ }));
    await expect(rows(canvasElement)).toHaveLength(6);
    await userEvent.click(canvas.getByRole('button', { name: /^Mark as unread: Disk usage/ }));
    await expect(unreadTab(canvasElement)).toHaveAccessibleName('Unread 1');
    await expect(canvas.getByRole('button', { name: 'Mark all as read' })).toBeEnabled();
    // Delete removes the row and hands the focus to what holds the list.
    await userEvent.click(canvas.getByRole('button', { name: /^Delete: Disk usage/ }));
    await expect(rows(canvasElement)).toHaveLength(5);
    await expect(canvas.getByRole('tab', { name: 'All 5' })).toBeVisible();
    await expect(results).toHaveFocus();
  },
};

/** The keyboard walks a row's button, its actions, then the next row's button. */
export const PageKeyboardOrder: Story = {
  ...Page,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const [first, second] = rows(canvasElement);
    rowButton(first!, 'Ana Costa commented').focus();
    await userEvent.tab();
    await expect(within(first!).getByRole('button', { name: /^Mark as read/ })).toHaveFocus();
    await userEvent.tab();
    await expect(within(first!).getByRole('button', { name: /^Delete/ })).toHaveFocus();
    await userEvent.tab();
    await expect(rowButton(second!, 'Deploy of api-gateway failed')).toHaveFocus();
    // Nothing nests: the first button of every row holds no other control.
    for (const item of rows(canvasElement)) {
      const [button] = within(item).getAllByRole('button');
      await expect(button!.querySelector('button, a[href], [role="button"]')).toBeNull();
    }
  },
};

export const PageOnAPhoneChecks: Story = {
  ...PageOnAPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow();
    // Every action stays inside the card, at the end of its row.
    const card = canvas.getByRole('list').closest('.rounded-2xl')!.getBoundingClientRect();
    for (const item of rows(canvasElement)) {
      for (const action of within(item).getAllByRole('button').slice(1)) {
        const rect = action.getBoundingClientRect();
        await expect(rect.right).toBeLessThanOrEqual(card.right);
        await expect(rect.left).toBeGreaterThanOrEqual(card.left);
      }
    }
  },
};

/**
 * At exactly 375px the rows still hold: a title too long for the line is cut with an ellipsis, the
 * actions stay on the row and the page does not scroll sideways.
 */
export const PageAt375px: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div data-testid="phone" style={{ width: 375 }}>
      <NotificationsPage
        initial={[
          { ...NOTICES[0]!, title: 'A_title_with_no_break_point_that_runs_long_past_the_line_end' },
          NOTICES[1]!,
        ]}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const phone = canvas.getByTestId('phone');
    await expect(phone.scrollWidth).toBeLessThanOrEqual(phone.clientWidth);
    const card = canvas.getByRole('list').closest('.rounded-2xl')!.getBoundingClientRect();
    for (const item of rows(canvasElement)) {
      const [row, ...actions] = within(item).getAllByRole('button');
      await expect(actions).toHaveLength(2);
      for (const action of actions) {
        const rect = action.getBoundingClientRect();
        await expect(rect.right).toBeLessThanOrEqual(card.right);
        await expect(rect.left).toBeGreaterThanOrEqual(card.left);
        await expect(rect.width).toBeGreaterThanOrEqual(24);
      }
      // The row's text did not push the actions out: its button ends where they start.
      await expect(endEdge(row!.getBoundingClientRect(), row)).toBeLessThanOrEqual(
        startEdge(actions[0]!.getBoundingClientRect(), row)
      );
    }
    const long = within(rows(canvasElement)[0]!)
      .getByText(/A_title_with_no_break_point/)
      .closest<HTMLElement>('.truncate')!;
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
  },
};
