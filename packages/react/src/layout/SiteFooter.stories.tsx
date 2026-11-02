import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, type ComponentPropsWithoutRef } from 'react';
import { Camera, CirclePlay, Mail, Rss, TreePine, type LucideIcon } from 'lucide-react';
import { expect, within } from 'storybook/test';
import {
  endOffset,
  expectFocusRing,
  expectNoHorizontalOverflow,
  expectTextContrast,
  inDirection,
  inEachTheme,
  startEdge,
  startOffset,
} from '../storybook-helpers';
import { Input } from '../forms/Input';
import { Navbar } from '../navigation/Navbar';
import { Button } from '../ui/Button';
import { LinkProvider, type LinkComponentProps } from '../ui/LinkProvider';
import { SiteFooter } from './SiteFooter';

const meta = {
  title: 'Layout/Site Footer',
  component: SiteFooter,
  subcomponents: {
    'SiteFooter.Brand': SiteFooter.Brand,
    'SiteFooter.Column': SiteFooter.Column,
    'SiteFooter.Link': SiteFooter.Link,
    'SiteFooter.Title': SiteFooter.Title,
    'SiteFooter.Aside': SiteFooter.Aside,
    'SiteFooter.Banner': SiteFooter.Banner,
    'SiteFooter.Bottom': SiteFooter.Bottom,
  },
  parameters: {
    layout: 'fullscreen',
    // The two widths of the stories below: a desktop and a phone. Every story pins one of them.
    viewport: {
      options: {
        desktop1440: { name: 'Desktop (1440×900)', styles: { width: '1440px', height: '900px' } },
        phone375: { name: 'Phone (375×812)', styles: { width: '375px', height: '812px' } },
      },
    },
  },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESKTOP = { viewport: { value: 'desktop1440', isRotated: false } } as const;
const PHONE = { viewport: { value: 'phone375', isRotated: false } } as const;
// The checks of a visible story live in a hidden twin: out of the sidebar and the docs page.
const HIDDEN = ['!dev', '!autodocs'];

// ── What the stories put in the footer ──────────────────────────────────────

const DESCRIPTION = 'Slow-made ceramics and lighting, shipped from our Lisbon studio.';

const COLUMNS = [
  {
    title: 'Shop',
    links: ['All products', 'Kitchen & table', 'Lighting', 'Gift cards', 'New arrivals'],
  },
  {
    title: 'Help',
    links: ['Shipping & delivery', 'Returns', 'Track an order', 'Contact us', 'FAQ'],
  },
  { title: 'Studio', links: ['Our story', 'Journal', 'Care guides', 'Wholesale'] },
];

const LEGAL = [
  { label: 'Terms of sale', href: '#terms' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Cookie settings', href: '#cookies' },
];

// lucide-react has no brand icons: generic ones stand for the networks.
const SOCIAL: { label: string; icon: LucideIcon }[] = [
  { label: 'Photo feed', icon: Camera },
  { label: 'Videos', icon: CirclePlay },
  { label: 'RSS feed', icon: Rss },
];

const slug = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, '-');

const Mark = () => (
  <span className="bg-brand-500 grid size-8 place-items-center rounded-lg text-white">
    <TreePine className="size-5" aria-hidden />
  </span>
);

// The page decides what a social link looks like: the footer only gives it room.
const SocialLinks = ({ tone = 'light' }: { tone?: 'light' | 'dark' }) => (
  <ul className="-ms-1.5 flex gap-1">
    {SOCIAL.map(({ label, icon: Icon }) => (
      <li key={label}>
        <a
          href={`#${slug(label)}`}
          aria-label={label}
          className={
            tone === 'dark'
              ? 'focus-visible:focus-indicator inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white'
              : 'focus-visible:focus-indicator inline-flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
          }
        >
          <Icon className="size-4" aria-hidden />
        </a>
      </li>
    ))}
  </ul>
);

const NewsletterForm = () => (
  <form className="flex max-w-md items-start gap-2" onSubmit={(event) => event.preventDefault()}>
    <div className="min-w-0 flex-1">
      <Input
        type="email"
        aria-label="Email address"
        placeholder="you@example.com"
        autoComplete="email"
        icon={Mail}
      />
    </div>
    <Button type="submit">Subscribe</Button>
  </form>
);

type StoreFooterProps = Omit<ComponentPropsWithoutRef<typeof SiteFooter>, 'children'> & {
  /** The letter in a banner above the columns, in place of the end column. */
  banner?: boolean;
};

/** The footer of the demo storefront: every story below is this one, set up differently. */
const StoreFooter = ({ banner = false, ...rest }: StoreFooterProps) => {
  const dark = rest.theme === 'dark';
  const letterId = useId();
  return (
    <SiteFooter {...rest}>
      {banner && (
        <SiteFooter.Banner data-testid="banner" role="group" aria-labelledby={letterId}>
          <div className="min-w-0 flex-1 basis-64">
            <SiteFooter.Title id={letterId}>The studio letter</SiteFooter.Title>
            <p className="mt-1.5 text-sm">One short email a month with new pieces and restocks.</p>
          </div>
          <div className="min-w-0 flex-1 basis-80">
            <NewsletterForm />
          </div>
        </SiteFooter.Banner>
      )}
      <SiteFooter.Brand href="#home" description={DESCRIPTION} data-testid="brand">
        <Mark />
        Harbor &amp; Pine
      </SiteFooter.Brand>
      {COLUMNS.map(({ title, links }) => (
        <SiteFooter.Column key={title} title={title} data-testid={`column-${slug(title)}`}>
          {links.map((label) => (
            <SiteFooter.Link key={label} href={`#${slug(label)}`}>
              {label}
            </SiteFooter.Link>
          ))}
        </SiteFooter.Column>
      ))}
      {!banner && (
        <SiteFooter.Aside data-testid="aside" role="group" aria-labelledby={letterId}>
          <SiteFooter.Title id={letterId}>The studio letter</SiteFooter.Title>
          <p className="mt-1.5 mb-3 text-sm">
            One short email a month with new pieces and restocks.
          </p>
          <NewsletterForm />
          <div className="mt-4">
            <SocialLinks tone={dark ? 'dark' : 'light'} />
          </div>
        </SiteFooter.Aside>
      )}
      <SiteFooter.Bottom links={LEGAL} data-testid="bottom">
        <span data-testid="copyright">
          &copy; 2026 Harbor &amp; Pine Studio. All rights reserved.
        </span>
      </SiteFooter.Bottom>
    </SiteFooter>
  );
};

/** The one-line footer of the cart and the checkout. */
const CompactStoreFooter = (props: Omit<StoreFooterProps, 'banner' | 'variant'>) => (
  <SiteFooter variant="compact" {...props}>
    <SiteFooter.Brand href="#home" description={DESCRIPTION} data-testid="brand">
      <Mark />
      Harbor &amp; Pine
    </SiteFooter.Brand>
    <SiteFooter.Column title="Help" data-testid="column-help">
      {['Shipping & returns', 'Contact us', 'FAQ'].map((label) => (
        <SiteFooter.Link key={label} href={`#${slug(label)}`}>
          {label}
        </SiteFooter.Link>
      ))}
    </SiteFooter.Column>
    <SiteFooter.Bottom links={LEGAL} data-testid="bottom">
      <span data-testid="copyright">&copy; 2026 Harbor &amp; Pine</span>
    </SiteFooter.Bottom>
    <SiteFooter.Aside data-testid="aside">
      <SocialLinks tone={props.theme === 'dark' ? 'dark' : 'light'} />
    </SiteFooter.Aside>
  </SiteFooter>
);

// ── Stories ──────────────────────────────────────────────────────────────────

/** Brand and a line, three columns of links, the letter and the social links, the bottom row. */
export const Default: Story = {
  globals: DESKTOP,
  render: () => <StoreFooter />,
};

export const DefaultMobile: Story = {
  globals: PHONE,
  render: () => <StoreFooter />,
};

/** One line for the cart and the checkout, where the big footer would push the button away. */
export const Compact: Story = {
  globals: DESKTOP,
  render: () => <CompactStoreFooter />,
};

export const CompactMobile: Story = {
  globals: PHONE,
  render: () => <CompactStoreFooter />,
};

/** A full-width banner above the columns takes the letter, and the end column goes. */
export const WithBanner: Story = {
  globals: DESKTOP,
  render: () => <StoreFooter banner />,
};

export const WithBannerMobile: Story = {
  globals: PHONE,
  render: () => <StoreFooter banner />,
};

/** `theme="dark"` stays dark in every theme: shown here on a light page. */
export const Dark: Story = {
  globals: { ...DESKTOP, theme: 'light' },
  render: () => <StoreFooter theme="dark" />,
};

export const DarkMobile: Story = {
  globals: { ...PHONE, theme: 'light' },
  render: () => <StoreFooter theme="dark" />,
};

const PageContent = () => (
  <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Lighting</h1>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Lamps, shades and bulbs, made one at a time.
    </p>
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {['Dune lamp', 'Tide pendant', 'Ember sconce', 'Pine table lamp'].map((name) => (
        <div
          key={name}
          className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-900 dark:border-white/10 dark:bg-gray-800 dark:text-white"
        >
          <div className="mb-3 aspect-square rounded-lg bg-gray-100 dark:bg-white/5" />
          {name}
        </div>
      ))}
    </div>
  </main>
);

/** The footer after the page, as a sibling of `main`: that is what makes it the page's footer. */
export const OnAStorefrontPage: Story = {
  globals: DESKTOP,
  render: () => (
    <div className="flex min-h-[640px] flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar aria-label="Main">
        <Navbar.Brand>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Harbor &amp; Pine
          </span>
          <Navbar.Items>
            <Navbar.Item href="#shop" active>
              Shop
            </Navbar.Item>
            <Navbar.Item href="#journal">Journal</Navbar.Item>
          </Navbar.Items>
        </Navbar.Brand>
      </Navbar>
      <PageContent />
      <StoreFooter />
    </div>
  ),
};

// ── Checks ───────────────────────────────────────────────────────────────────

const rect = (element: Element) => element.getBoundingClientRect();
const midY = (element: Element) => rect(element).top + rect(element).height / 2;

/** The footer is the page's one contentinfo and each of its navs is named by its heading. */
export const LandmarksAndNavNamesAreUnique: Story = {
  ...Default,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('contentinfo')).toHaveLength(1);
    // Four navs, each reachable by its own name: an unnamed or a repeated one would not be.
    await expect(canvas.getAllByRole('navigation')).toHaveLength(4);
    for (const title of ['Shop', 'Help', 'Studio']) {
      const nav = canvas.getByRole('navigation', { name: title });
      await expect(nav).toContainElement(canvas.getByRole('heading', { name: title, level: 2 }));
    }
    await expect(canvas.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    // The letter is a group the page names with its own heading.
    await expect(canvas.getByRole('group', { name: 'The studio letter' })).toBeInTheDocument();
  },
};

/** The footer sits at the end of the page's content, and the page keeps its other landmarks. */
export const LandmarksOnAPageStayUnique: Story = {
  ...OnAStorefrontPage,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('contentinfo')).toHaveLength(1);
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
    const names = canvas.getAllByRole('navigation').map((nav) => nav.getAttribute('aria-label'));
    // Five navs: the bar, three columns and the legal links.
    await expect(canvas.getAllByRole('navigation')).toHaveLength(5);
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    await expect(names.filter((name) => name === 'Main')).toHaveLength(1);
    const footer = canvas.getByRole('contentinfo');
    await expect(rect(footer).top).toBeGreaterThanOrEqual(rect(canvas.getByRole('main')).bottom);
  },
};

/** The legal links' nav takes the name the page gives it. */
export const LegalNavNameFollowsLinksLabel: Story = {
  globals: DESKTOP,
  tags: HIDDEN,
  render: () => (
    <SiteFooter>
      <SiteFooter.Bottom links={LEGAL} linksLabel="Mentions légales">
        &copy; 2026
      </SiteFooter.Bottom>
    </SiteFooter>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Mentions légales' })).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation', { name: 'Legal' })).toBeNull();
  },
};

/** At desktop width the brand, the columns and the end column share one row, the bottom under it. */
export const PartsShareOneRowAtDesktop: Story = {
  ...Default,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    const [brand, shop, help, studio, aside, bottom] = [
      'brand',
      'column-shop',
      'column-help',
      'column-studio',
      'aside',
      'bottom',
    ].map((id) => canvas.getByTestId(id));
    const row = [brand, shop, help, studio, aside];
    for (const part of row) await expect(rect(part).top).toBeCloseTo(rect(brand).top, 0);
    // In reading order, each starting after the one before.
    const starts = row.map((part) => startEdge(rect(part), footer));
    await expect(starts).toEqual([...starts].sort((a, b) => a - b));
    // The end column takes the most room, a link column the least.
    await expect(rect(aside).width).toBeGreaterThan(rect(brand).width);
    await expect(rect(brand).width).toBeGreaterThan(rect(shop).width);
    await expect(rect(bottom).top).toBeGreaterThan(rect(shop).bottom);
    // The content stops at the width of the Navbar (`max-w-7xl`).
    await expect(rect(footer.firstElementChild!).width).toBeLessThanOrEqual(1280);
  },
};

/** `maxWidth="none"` lets the content run to the padding of the window. */
export const MaxWidthNoneFillsTheWindow: Story = {
  globals: DESKTOP,
  tags: HIDDEN,
  render: () => <StoreFooter maxWidth="none" />,
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    await expect(rect(footer.firstElementChild!).width).toBeCloseTo(rect(footer).width, 0);
  },
};

/** Below `sm` the link columns go two by two, with the brand and the end column full width. */
export const ColumnsGoTwoByTwoBelowSm: Story = {
  ...DefaultMobile,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const [brand, shop, help, studio, aside] = [
      'brand',
      'column-shop',
      'column-help',
      'column-studio',
      'aside',
    ].map((id) => rect(canvas.getByTestId(id)));
    // The wrapping row: the footer's side padding is outside it, in the column that holds it.
    const content = rect(canvas.getByRole('contentinfo').firstElementChild!.firstElementChild!);
    // Shop and Help side by side, each about half the row, and Studio on the next line.
    await expect(help.top).toBeCloseTo(shop.top, 0);
    await expect(studio.top).toBeGreaterThan(shop.bottom);
    await expect(shop.width).toBeCloseTo(help.width, 0);
    await expect(shop.width).toBeLessThan(content.width / 2);
    await expect(shop.width).toBeGreaterThan(content.width / 2 - 24);
    // The brand and the end column take the whole row, one over the columns, one under.
    for (const part of [brand, aside]) await expect(part.width).toBeGreaterThan(content.width - 40);
    await expect(brand.bottom).toBeLessThanOrEqual(shop.top);
    await expect(aside.top).toBeGreaterThanOrEqual(studio.bottom);
  },
};

export const CompactDoesNotScrollSidewaysAt375: Story = {
  ...CompactMobile,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const footer = rect(canvas.getByRole('contentinfo'));
    for (const id of ['brand', 'column-help', 'bottom', 'aside']) {
      const part = rect(canvas.getByTestId(id));
      await expect(part.left, id).toBeGreaterThanOrEqual(footer.left);
      await expect(part.right, id).toBeLessThanOrEqual(footer.right);
    }
  },
};

export const BannerDoesNotScrollSidewaysAt375: Story = {
  ...WithBannerMobile,
  tags: HIDDEN,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

export const DarkDoesNotScrollSidewaysAt375: Story = {
  ...DarkMobile,
  tags: HIDDEN,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** The compact footer is one line at desktop width, and says less than the full one. */
export const CompactIsOneLineAtDesktop: Story = {
  ...Compact,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    const parts = ['brand', 'column-help', 'bottom', 'aside'].map((id) => canvas.getByTestId(id));
    for (const part of parts) await expect(midY(part)).toBeCloseTo(midY(parts[0]), -1);
    // The padding and one row of text: well under what the columns of the full footer take.
    await expect(rect(footer).height).toBeLessThan(110);
    // The brand's line and the column title are for the full footer: the title stays the nav's
    // name, off screen.
    await expect(canvas.queryByText(DESCRIPTION)).toBeNull();
    const title = canvas.getByRole('heading', { name: 'Help' });
    await expect(rect(title).width).toBeLessThanOrEqual(1);
    await expect(canvas.getByRole('navigation', { name: 'Help' })).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('navigation')).toHaveLength(2);
  },
};

/** Whatever order the parts come in, the banner is above the columns and the bottom row under. */
export const BannerAndBottomKeepTheirPlace: Story = {
  globals: DESKTOP,
  tags: HIDDEN,
  render: () => (
    <SiteFooter>
      <SiteFooter.Bottom data-testid="bottom">&copy; 2026</SiteFooter.Bottom>
      <SiteFooter.Column title="Shop" data-testid="column">
        <SiteFooter.Link href="#all">All products</SiteFooter.Link>
      </SiteFooter.Column>
      <SiteFooter.Brand data-testid="brand">Harbor</SiteFooter.Brand>
      <SiteFooter.Banner data-testid="banner">The studio letter</SiteFooter.Banner>
    </SiteFooter>
  ),
  play: async ({ canvas }) => {
    const [banner, brand, column, bottom] = ['banner', 'brand', 'column', 'bottom'].map((id) =>
      rect(canvas.getByTestId(id))
    );
    await expect(banner.bottom).toBeLessThanOrEqual(brand.top);
    await expect(banner.bottom).toBeLessThanOrEqual(column.top);
    await expect(bottom.top).toBeGreaterThanOrEqual(column.bottom);
    await expect(bottom.top).toBeGreaterThanOrEqual(brand.bottom);
    await expect(banner.width).toBeGreaterThan(rect(canvas.getByRole('contentinfo')).width / 2);
  },
};

// What an app writes once, next to its router.
const RoutedLink = ({ href, ...props }: LinkComponentProps) => (
  <a {...props} href={href} data-routed="" />
);

/** Every link of the footer is drawn by the app's link component, but a bare `#` stays an `<a>`. */
export const LinksGoThroughLinkProvider: Story = {
  globals: DESKTOP,
  tags: HIDDEN,
  render: () => (
    <LinkProvider component={RoutedLink}>
      <SiteFooter>
        <SiteFooter.Brand href="/">Harbor</SiteFooter.Brand>
        <SiteFooter.Column title="Shop">
          <SiteFooter.Link href="/shop">All products</SiteFooter.Link>
          <SiteFooter.Link href="#">Soon</SiteFooter.Link>
        </SiteFooter.Column>
        <SiteFooter.Bottom links={[{ label: 'Privacy', href: '/privacy' }]} />
      </SiteFooter>
    </LinkProvider>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Harbor', 'All products', 'Privacy']) {
      await expect(canvas.getByRole('link', { name }), name).toHaveAttribute('data-routed');
    }
    await expect(canvas.getByRole('link', { name: 'Soon' })).not.toHaveAttribute('data-routed');
  },
};

/** The link of the current page reads bolder and stronger; the other links do not. */
export const CurrentLinkIsMarked: Story = {
  globals: DESKTOP,
  tags: HIDDEN,
  render: () => (
    <SiteFooter>
      <SiteFooter.Column title="Shop">
        <SiteFooter.Link href="#all" aria-current="page">
          All products
        </SiteFooter.Link>
        <SiteFooter.Link href="#lighting">Lighting</SiteFooter.Link>
      </SiteFooter.Column>
    </SiteFooter>
  ),
  play: async ({ canvas }) => {
    const current = canvas.getByRole('link', { name: 'All products' });
    const other = canvas.getByRole('link', { name: 'Lighting' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(other).not.toHaveAttribute('aria-current');
    await expect(Number(getComputedStyle(current).fontWeight)).toBeGreaterThan(
      Number(getComputedStyle(other).fontWeight)
    );
    await expect(getComputedStyle(current).color).not.toBe(getComputedStyle(other).color);
  },
};

/** The links of the footer take the focus ring of the accent, on a light and on a dark footer. */
export const LinksShowTheFocusRing: Story = {
  ...Default,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('link', { name: 'Lighting' }));
    await expectFocusRing(canvas.getByRole('link', { name: 'Privacy' }));
  },
};

export const DarkLinksShowTheFocusRing: Story = {
  ...Dark,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('link', { name: 'Lighting' }));
  },
};

// The text of each kind in a footer: a heading, a link, a line of text and the legal links.
const readableTexts = (canvas: ReturnType<typeof within>) => [
  canvas.getByRole('heading', { name: 'Shop' }),
  canvas.getByRole('link', { name: 'Lighting' }),
  canvas.getByText(DESCRIPTION),
  canvas.getByTestId('copyright'),
  canvas.getByRole('link', { name: 'Privacy' }),
  canvas.getByRole('link', { name: /Harbor/ }),
];

export const LightFooterIsReadableInEveryTheme: Story = {
  ...Default,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    inEachTheme(() => {
      for (const text of readableTexts(canvas)) expectTextContrast(text);
    });
  },
};

export const DarkFooterIsReadableInEveryTheme: Story = {
  ...Dark,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('contentinfo')).toHaveAttribute('data-theme', 'dark');
    inEachTheme(() => {
      for (const text of readableTexts(canvas)) expectTextContrast(text);
    });
  },
};

export const BannerIsReadableInEveryTheme: Story = {
  ...WithBanner,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    inEachTheme(() => {
      expectTextContrast(canvas.getByRole('heading', { name: 'The studio letter' }));
      expectTextContrast(canvas.getByText(/One short email/));
    });
  },
};

export const CompactIsReadableInEveryTheme: Story = {
  ...Compact,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    inEachTheme(() => {
      expectTextContrast(canvas.getByRole('link', { name: 'FAQ' }));
      expectTextContrast(canvas.getByTestId('copyright'));
      expectTextContrast(canvas.getByRole('link', { name: 'Privacy' }));
    });
  },
};

/** Under `dir="rtl"` the layout mirrors: each part is as far from the start edge as before. */
export const PartsMirrorInRightToLeft: Story = {
  ...Default,
  tags: HIDDEN,
  play: async ({ canvas }) => {
    // One footer, measured in both directions: a second one would be a second contentinfo.
    const footer = canvas.getByRole('contentinfo');
    const measure = () =>
      [
        canvas.getByTestId('brand'),
        canvas.getByTestId('column-shop'),
        canvas.getByTestId('column-help'),
        canvas.getByTestId('column-studio'),
        canvas.getByTestId('aside'),
        canvas.getByTestId('copyright'),
        canvas.getByRole('navigation', { name: 'Legal' }),
      ].map((part) => [startOffset(part, footer), endOffset(part, footer)]);
    let ltr: number[][] = [];
    await inDirection('ltr', () => {
      ltr = measure();
    });
    await inDirection('rtl', () => {
      const rtl = measure();
      rtl.forEach(([start, end], index) => {
        expect(start, `part ${index}: distance from the start edge`).toBeCloseTo(ltr[index][0], 0);
        expect(end, `part ${index}: distance from the end edge`).toBeCloseTo(ltr[index][1], 0);
      });
      // The brand is still the nearest to the start, the end column the nearest to the end.
      expect(rtl[0][0]).toBeLessThan(rtl[1][0]);
      expect(rtl[4][1]).toBeLessThan(rtl[1][1]);
      // The legal links are at the end of the bottom row, the copyright at its start.
      expect(rtl[5][0]).toBeLessThan(rtl[6][0]);
    });
  },
};
