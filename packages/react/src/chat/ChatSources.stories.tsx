import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { ChatSources, type ChatSource } from './ChatSources';

const SOURCES: ChatSource[] = [
  {
    title: 'useDebounce: a hook for delayed values',
    href: 'https://usehooks.example.com/debounce',
  },
  {
    title: 'Debouncing and throttling explained',
    href: 'https://blog.example.org/posts/debounce-vs-throttle',
    domain: 'blog.example.org',
  },
  { title: 'Search as you type, the accessible way', href: 'https://a11y.example.net/search' },
];

const meta = {
  title: 'Chat/ChatSources',
  component: ChatSources,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { sources: SOURCES },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatSources>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Numbered chips under a caption: the number, the title on one line, the domain. */
export const Default: Story = {};

/** An entry that is not an http(s) URL is plain text with a dashed border, never a link. */
export const WithANonHttpEntry: Story = {
  args: {
    sources: [
      ...SOURCES.slice(0, 2),
      { title: 'Internal runbook', href: 'file:///srv/docs/runbook.md', domain: 'runbook.md' },
      { title: 'Pasted from a script', href: 'javascript:alert(1)' },
    ],
  },
};

export const CustomLabel: Story = {
  args: { label: 'References' },
};

/** Long titles are cut to one line; the chips wrap onto the next line. */
export const ManySources: Story = {
  args: {
    sources: Array.from({ length: 8 }, (_, i) => ({
      title: `A rather long page title that does not fit on a single line, number ${i + 1}`,
      href: `https://docs.example.com/page-${i + 1}`,
    })),
  },
};

export const OnMobile: Story = {
  ...ManySources,
  globals: mobileViewport,
  play: async ({ canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
  },
};

export const OnlyHttpSourcesBecomeLinks: Story = {
  ...WithANonHttpEntry,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(2);
    for (const link of links) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveTextContent('(opens in a new tab)');
    }
    await expect(links[0]).toHaveAttribute('href', 'https://usehooks.example.com/debounce');
    const list = canvas.getByRole('list', { name: 'Sources' });
    const items = within(list).getAllByRole('listitem');
    await expect(items).toHaveLength(4);
    // The other two are text: no anchor, a dashed border.
    for (const item of items.slice(2)) {
      await expect(item.querySelector('a')).toBeNull();
      await expect(getComputedStyle(item.firstElementChild as HTMLElement).borderTopStyle).toBe(
        'dashed'
      );
    }
    await expect(items[2]).toHaveTextContent('Internal runbook');
    await expect(items[3]).toHaveTextContent('Pasted from a script');
    await expect(items[0].firstElementChild).not.toHaveStyle({ borderTopStyle: 'dashed' });
  },
};

export const DomainDefaultsToTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    sources: [
      { title: 'With a port', href: 'http://localhost:6006/docs' },
      { title: 'Given', href: 'https://x.example.com/a', domain: 'custom label' },
      { title: 'Not a URL', href: '/relative/path' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('localhost:6006')).toBeVisible();
    await expect(canvas.getByText('custom label')).toBeVisible();
    await expect(canvas.queryByText('x.example.com')).toBeNull();
    // A relative path has no host to show.
    const items = canvas.getAllByRole('listitem');
    await expect(items[2]).toHaveTextContent(/^3Not a URL$/);
  },
};

const HOSTILE = '<img src=x onerror="window.__sourcesXss=1"><b>bold</b>';

export const HostileTitleRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    sources: [
      { title: HOSTILE, href: 'https://example.com/a', domain: '<i>domain</i>' },
      { title: HOSTILE, href: 'javascript:alert(1)' },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('img, b, i')).toBeNull();
    await expect(canvas.getAllByText(HOSTILE)).toHaveLength(2);
    await expect(canvas.getByText('<i>domain</i>')).toBeVisible();
    await expect((window as { __sourcesXss?: number }).__sourcesXss).toBeUndefined();
    await expect(canvas.getAllByRole('link')).toHaveLength(1);
  },
};

export const TitleIsTruncatedWithItsFullTextAsTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    sources: [
      {
        title: 'A page title long enough to be cut by the chip, which stays on a single line',
        href: 'https://example.com/long',
      },
    ],
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText(/A page title long enough/).closest('[title]') as HTMLElement;
    await expect(title).toHaveAttribute('title', title.textContent as string);
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(getComputedStyle(title).whiteSpace).toBe('nowrap');
  },
};

export const NothingRendersWithoutSources: Story = {
  tags: ['!dev', '!autodocs'],
  args: { sources: [] },
  render: (args) => (
    <div data-testid="box">
      <ChatSources {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('box')).toBeEmptyDOMElement();
  },
};

export const ReadableInEveryTheme: Story = {
  ...WithANonHttpEntry,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    inEachTheme(() => {
      for (const chip of canvasElement.querySelectorAll('li > *')) {
        for (const text of chip.querySelectorAll('span:not([aria-hidden]):not(.sr-only)')) {
          expectTextContrast(text);
        }
      }
      for (const number of canvasElement.querySelectorAll('[aria-hidden]')) {
        expectTextContrast(number);
      }
    });
  },
};
