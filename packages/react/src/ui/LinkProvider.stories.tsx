import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createContext,
  createRef,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Box, Layers, LayoutDashboard, MoreVertical, Pencil, Server, Settings } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ChatMessage } from '../chat/ChatMessage';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { Row } from '../lists/Row';
import { Breadcrumb } from '../navigation/Breadcrumb';
import { mobileViewport, startOffset } from '../storybook-helpers';
import { Link } from './Link';
import { LinkProvider, type LinkComponent, type LinkComponentProps } from './LinkProvider';
import { Menu } from './Menu';
import { Tag } from './Tag';

const meta = {
  title: 'Navigation/LinkProvider',
  component: LinkProvider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { component: { control: false }, children: { control: false } },
  // The stories below build their own tree: these only satisfy the required props.
  args: { component: () => null, children: null },
} satisfies Meta<typeof LinkProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── A router in a few lines ─────────────────────────────────────────────────

type Visit = { href: string; via: string };

const RouterContext = createContext<{ visits: Visit[]; push: (visit: Visit) => void }>({
  visits: [],
  push: () => {},
});

/** The app's router, reduced to what the stories show: the list of places it was sent to. */
function FakeRouter({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const push = useCallback((visit: Visit) => setVisits((list) => [...list, visit]), []);
  const router = useMemo(() => ({ visits, push }), [visits, push]);
  return <RouterContext value={router}>{children}</RouterContext>;
}

/**
 * What an app writes once, next to its router. Like a router's `Link` it runs the `onClick` it was
 * given first, leaves a modified click (new tab) and a click somebody handled to the browser, and
 * hands everything else, `ref` included, to its `<a>`. `data-router-link` tells a link that came
 * through it from a plain one.
 */
const createFakeLink = (via: string): LinkComponent =>
  function FakeLink({ href, onClick, ...props }: LinkComponentProps) {
    const { push } = use(RouterContext);
    return (
      <a
        {...props}
        href={href}
        data-router-link={via}
        onClick={(event) => {
          onClick?.(event);
          const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
          if (event.defaultPrevented || event.button !== 0 || modified) return;
          event.preventDefault();
          push({ href, via });
        }}
      />
    );
  };

const RouterLink = createFakeLink('router');
const OuterLink = createFakeLink('outer');
const InnerLink = createFakeLink('inner');

const NavigationLog = () => {
  const { visits } = use(RouterContext);
  return (
    <section
      aria-label="Router navigations"
      className="rounded-xl border border-[var(--color-border)] p-4"
    >
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Router navigations</h2>
      {visits.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">None yet: click a link.</p>
      ) : (
        <ol className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
          {visits.map((visit, i) => (
            <li key={i}>{`${visit.href} via ${visit.via}`}</li>
          ))}
        </ol>
      )}
    </section>
  );
};

// ── The page the stories share ──────────────────────────────────────────────

const accountRef = createRef<HTMLAnchorElement>();

const MENU_TRIGGER =
  'focus-visible:focus-indicator flex size-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5';

/** A sidebar, a breadcrumb, links, a tag, a menu and a list row: all of them with an `href`. */
const Page = () => (
  <div className="flex flex-col gap-6 lg:flex-row">
    <div className="h-[26rem] shrink-0 self-start overflow-hidden rounded-xl border border-[var(--color-border)]">
      <Sidebar>
        <Sidebar.Brand
          logo={<Box className="h-5 w-5" />}
          title="Cosmos"
          subtitle="Design system"
          href="/"
        />
        <div className="py-3">
          <Sidebar.Item icon={LayoutDashboard} label="Dashboard" href="/dashboard" active />
          <Sidebar.Item icon={Server} label="Servers" href="/servers" />
          <Sidebar.SubMenu icon={Layers} label="Library" href="/library" defaultOpen>
            <Sidebar.Item label="Tokens" href="/library/tokens" />
          </Sidebar.SubMenu>
          <Sidebar.Item icon={Settings} label="Settings" href="/settings" />
        </div>
      </Sidebar>
    </div>
    <div className="min-w-0 flex-1 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Servers', href: '/servers' },
          { label: 'rack-01' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Link ref={accountRef} href="/account">
          Account preferences
        </Link>
        <Tag href="/tags/gpu">gpu</Tag>
        <Menu>
          <Menu.Trigger aria-label="More actions" className={MENU_TRIGGER}>
            <MoreVertical className="h-4 w-4" aria-hidden />
          </Menu.Trigger>
          <Menu.Content aria-label="Actions">
            <Menu.Item icon={Pencil} href="/racks/01/edit">
              Edit rack
            </Menu.Item>
            <Menu.Item href="https://example.com/help" target="_blank" rel="noreferrer">
              Help in a new tab
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
      <Row icon={Server} title="Rack 01" subtitle="Paris, room A" href="/racks/01" />
      <NavigationLog />
    </div>
  </div>
);

// A click on a link that stays a plain `<a>` would load its page in the test frame: keep the click,
// not its default action.
const keepPage = (event: Event) => event.preventDefault();

const body = () => within(document.body);

const visitsOf = (log: HTMLElement) =>
  within(log)
    .queryAllByRole('listitem')
    .map((item) => item.textContent);

// ── Stories ─────────────────────────────────────────────────────────────────

const ADAPTERS = [
  'Mount `LinkProvider` once, at the root of the app, with the component every internal link',
  'renders through. Next.js: its `Link` takes `href` as it is.',
  '',
  '```tsx',
  "import NextLink from 'next/link';",
  '',
  '<LinkProvider component={NextLink}>{app}</LinkProvider>;',
  '```',
  '',
  'React Router: its `Link` wants `to`, so a two-line adapter. Define it at module level, and',
  'hand on every prop, `ref` and `onClick` included.',
  '',
  '```tsx',
  "import { Link } from 'react-router';",
  "import { LinkProvider, type LinkComponentProps } from '@sckyzo/cosmos-react';",
  '',
  'const AppLink = ({ href, ...props }: LinkComponentProps) => <Link to={href} {...props} />;',
  '',
  '<LinkProvider component={AppLink}>{app}</LinkProvider>;',
  '```',
  '',
  'Below, a fake router stands for either: it records where each click sends it and loads nothing.',
  'Middle-click and "Open in a new tab" still work, every link being a real `<a href>`.',
].join('\n');

/**
 * Every internal link of the page goes through the app's link component: the sidebar (brand, rows,
 * sub-menu), the breadcrumb, `Link`, `Tag`, a menu item and a list row. A click navigates in place
 * and the page keeps its state.
 */
export const ThroughTheRouter: Story = {
  parameters: { docs: { description: { story: ADAPTERS } } },
  render: () => (
    <FakeRouter>
      <LinkProvider component={RouterLink}>
        <Page />
      </LinkProvider>
    </FakeRouter>
  ),
};

export const ThroughTheRouterChecks: Story = {
  ...ThroughTheRouter,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, step }) => {
    const sidebar = canvas.getByRole('navigation', { name: 'Main navigation' });
    const crumbs = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    const log = canvas.getByRole('region', { name: 'Router navigations' });

    await step('each link is the provided component, with its props', async () => {
      const brand = within(sidebar).getByRole('link', { name: /Cosmos/ });
      await expect(brand).toHaveAttribute('data-router-link', 'router');
      await expect(brand).toHaveAttribute('href', '/');
      const dashboard = within(sidebar).getByRole('link', { name: 'Dashboard' });
      await expect(dashboard).toHaveAttribute('data-router-link', 'router');
      await expect(dashboard).toHaveAttribute('href', '/dashboard');
      await expect(dashboard).toHaveAttribute('aria-current', 'page');
      await expect(dashboard).toHaveClass('focus-visible:focus-indicator');
      const library = within(sidebar).getByRole('link', { name: 'Library' });
      await expect(library).toHaveAttribute('data-router-link', 'router');
      await expect(library).toHaveAttribute('data-sidebar-item', '');
      const servers = within(crumbs).getByRole('link', { name: 'Servers' });
      await expect(servers).toHaveAttribute('data-router-link', 'router');
      await expect(servers).toHaveAttribute('href', '/servers');
      await expect(servers).toHaveClass('text-brand-600');
      const account = canvas.getByRole('link', { name: 'Account preferences' });
      await expect(account).toHaveAttribute('data-router-link', 'router');
      await expect(account).toHaveClass('focus-visible:focus-indicator');
      // The consumer's `ref` reaches the element the provided component renders.
      await expect(accountRef.current).toBe(account);
      const tag = canvas.getByRole('link', { name: 'gpu' });
      await expect(tag).toHaveAttribute('data-router-link', 'router');
      await expect(tag).toHaveAttribute('href', '/tags/gpu');
      const row = canvas.getByRole('link', { name: /Rack 01/ });
      await expect(row).toHaveAttribute('data-router-link', 'router');
      await expect(row).toHaveClass('rounded-lg');
    });

    await step('a click goes to the router and the page stays', async () => {
      const page = location.href;
      // The window sees a link's click after the component and the router handled it.
      const prevented: boolean[] = [];
      const watch = (event: MouseEvent) => {
        if ((event.target as Element).closest('a')) prevented.push(event.defaultPrevented);
      };
      window.addEventListener('click', watch);
      try {
        await userEvent.click(within(sidebar).getByRole('link', { name: 'Servers' }));
        await userEvent.click(within(crumbs).getByRole('link', { name: 'Home' }));
        await userEvent.click(canvas.getByRole('link', { name: 'Account preferences' }));
        await userEvent.click(canvas.getByRole('link', { name: 'gpu' }));
        await userEvent.click(canvas.getByRole('link', { name: /Rack 01/ }));
        // A menu item: the menu still runs its own click, and closes.
        await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
        await userEvent.click(body().getByRole('menuitem', { name: 'Edit rack' }));
      } finally {
        window.removeEventListener('click', watch);
      }
      await waitFor(() =>
        expect(visitsOf(log)).toEqual([
          '/servers via router',
          '/ via router',
          '/account via router',
          '/tags/gpu via router',
          '/racks/01 via router',
          '/racks/01/edit via router',
        ])
      );
      await expect(prevented).toEqual([true, true, true, true, true, true]);
      await expect(location.href).toBe(page);
      await waitFor(() => expect(body().queryByRole('menu')).toBeNull());
    });
  },
};

/**
 * A link that leaves the app stays a plain `<a>`: `target="_blank"` (`Link external` sets it), and
 * the links of a chat message, which are the sender's. So do a link with no `href` and the bare `#`
 * a breadcrumb gives a crumb that has none. The last link is routed, to tell them apart.
 */
export const ExternalLinksStayPlain: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FakeRouter>
      <LinkProvider component={RouterLink}>
        <div className="flex max-w-md flex-col items-start gap-4">
          <Link href="https://github.com/SckyzO/cosmos" external>
            Repository
          </Link>
          <Link href="/docs" target="_blank">
            Docs in a new tab
          </Link>
          <Link>No destination</Link>
          <Breadcrumb items={[{ label: 'Home' }, { label: 'Current page' }]} />
          <ChatMessage
            sender="Ada"
            direction="incoming"
            text="The changelog is at https://example.com/changelog."
          />
          <Link href="/settings">Settings (routed)</Link>
          <NavigationLog />
        </div>
      </LinkProvider>
    </FakeRouter>
  ),
  play: async ({ canvas }) => {
    const plain = [
      canvas.getByRole('link', { name: /Repository/ }),
      canvas.getByRole('link', { name: 'Docs in a new tab' }),
      canvas.getByRole('link', { name: 'Home' }),
      canvas.getByRole('link', { name: 'https://example.com/changelog' }),
    ];
    for (const link of plain) {
      await expect(link.tagName).toBe('A');
      await expect(link).not.toHaveAttribute('data-router-link');
    }
    await expect(plain[0]).toHaveAttribute('target', '_blank');
    await expect(plain[0]).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(plain[2]).toHaveAttribute('href', '#');
    await expect(plain[3]).toHaveAttribute('href', 'https://example.com/changelog');
    await expect(plain[3]).toHaveAttribute('target', '_blank');
    // A link with no `href` is an `<a>` with none, so it is not a link for assistive technology.
    const none = canvas.getByText('No destination').closest('a')!;
    await expect(none).not.toHaveAttribute('href');
    await expect(none).not.toHaveAttribute('data-router-link');

    window.addEventListener('click', keepPage);
    try {
      for (const link of plain) await userEvent.click(link);
      await userEvent.click(canvas.getByRole('link', { name: 'Settings (routed)' }));
    } finally {
      window.removeEventListener('click', keepPage);
    }
    // Only the routed link reached the router.
    await waitFor(() =>
      expect(visitsOf(canvas.getByRole('region', { name: 'Router navigations' }))).toEqual([
        '/settings via router',
      ])
    );
    await expect(canvas.getByRole('link', { name: 'Settings (routed)' })).toHaveAttribute(
      'data-router-link',
      'router'
    );
  },
};

/**
 * A provider inside another one replaces it for its subtree: here the breadcrumb is sent through
 * another component than the rest of the page.
 */
export const NestedProvider: Story = {
  render: () => (
    <FakeRouter>
      <LinkProvider component={OuterLink}>
        <div className="flex max-w-md flex-col items-start gap-4">
          <Link href="/outer">Outer link</Link>
          <LinkProvider component={InnerLink}>
            <Link href="/inner">Inner link</Link>
            <Breadcrumb
              items={[{ label: 'Home', href: '/' }, { label: 'Current page' }]}
              aria-label="Inner breadcrumb"
            />
          </LinkProvider>
          <Link href="/outer-again">Outer again</Link>
          <NavigationLog />
        </div>
      </LinkProvider>
    </FakeRouter>
  ),
};

export const NestedProviderChecks: Story = {
  ...NestedProvider,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const via = (name: string) =>
      canvas.getByRole('link', { name }).getAttribute('data-router-link');
    await expect(via('Outer link')).toBe('outer');
    await expect(via('Inner link')).toBe('inner');
    await expect(via('Home')).toBe('inner');
    await expect(via('Outer again')).toBe('outer');

    await userEvent.click(canvas.getByRole('link', { name: 'Outer link' }));
    await userEvent.click(canvas.getByRole('link', { name: 'Inner link' }));
    await userEvent.click(canvas.getByRole('link', { name: 'Home' }));
    await userEvent.click(canvas.getByRole('link', { name: 'Outer again' }));
    await waitFor(() =>
      expect(visitsOf(canvas.getByRole('region', { name: 'Router navigations' }))).toEqual([
        '/outer via outer',
        '/inner via inner',
        '/ via inner',
        '/outer-again via outer',
      ])
    );
  },
};

/**
 * Without a provider nothing changes: every link is a plain `<a>`, the way it always was. It
 * navigates the page, so the app that wants its router mounts the provider.
 */
export const WithoutAProvider: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FakeRouter>
      <Page />
    </FakeRouter>
  ),
  play: async ({ canvas }) => {
    const sidebar = canvas.getByRole('navigation', { name: 'Main navigation' });
    const links = [
      within(sidebar).getByRole('link', { name: /Cosmos/ }),
      within(sidebar).getByRole('link', { name: 'Dashboard' }),
      within(sidebar).getByRole('link', { name: 'Library' }),
      within(canvas.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'Servers',
      }),
      canvas.getByRole('link', { name: 'Account preferences' }),
      canvas.getByRole('link', { name: 'gpu' }),
      canvas.getByRole('link', { name: /Rack 01/ }),
    ];
    for (const link of links) {
      await expect(link.tagName).toBe('A');
      await expect(link).toHaveAttribute('href');
      await expect(link).not.toHaveAttribute('data-router-link');
    }
    await expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(canvas.queryByRole('link', { name: 'Edit rack' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    const item = await body().findByRole('menuitem', { name: 'Edit rack' });
    await expect(item.tagName).toBe('A');
    await expect(item).toHaveAttribute('href', '/racks/01/edit');
    await expect(item).not.toHaveAttribute('data-router-link');
    await expect(
      canvas.getAllByRole('link').filter((a) => a.hasAttribute('data-router-link'))
    ).toEqual([]);
  },
};

/**
 * Below `lg` the sidebar is a drawer, and a click on one of its links closes it. The provided
 * component gets the `onClick` that does it, and the keyboard focus goes back to the hamburger.
 */
export const DrawerClosesOnAProvidedLink: Story = {
  globals: mobileViewport,
  tags: ['!dev', '!autodocs'],
  render: () => (
    <FakeRouter>
      <LinkProvider component={RouterLink}>
        <Shell
          topbar={<Topbar pageTitle="Servers" />}
          sidebar={
            <Sidebar>
              <Sidebar.Brand logo={<Box className="h-5 w-5" />} title="Cosmos" href="/" />
              <div className="py-3">
                <Sidebar.Item icon={LayoutDashboard} label="Dashboard" href="/dashboard" active />
                <Sidebar.Item icon={Server} label="Servers" href="/servers" />
              </div>
            </Sidebar>
          }
        >
          <div className="p-4">
            <NavigationLog />
          </div>
        </Shell>
      </LinkProvider>
    </FakeRouter>
  ),
  play: async () => {
    const hamburger = body().getByRole('button', { name: 'Open navigation' });
    await userEvent.click(hamburger);
    const dialog = await body().findByRole('dialog', { name: 'Navigation menu' });
    await waitFor(() => expect(startOffset(dialog, document.documentElement)).toBe(0));

    const servers = within(dialog).getByRole('link', { name: 'Servers' });
    await expect(servers).toHaveAttribute('data-router-link', 'router');
    await userEvent.click(servers);

    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(hamburger).toHaveFocus();
    await expect(visitsOf(body().getByRole('region', { name: 'Router navigations' }))).toEqual([
      '/servers via router',
    ]);
  },
};
