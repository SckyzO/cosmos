import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe } from 'lucide-react';
import { expect } from 'storybook/test';
import { expectFocusRing, expectTextContrast, inEachTheme } from '../storybook-helpers';
import { Link, type LinkIntent, type LinkVariant } from './Link';

const meta = {
  title: 'Typography/Link',
  component: Link,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Read the docs', href: '#' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colored: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The default variant: the accent color, with no underline. Pick `underline` for a link inside a sentence.',
      },
    },
  },
};

export const Underline: Story = { args: { variant: 'underline' } };

export const Opacity: Story = { args: { variant: 'opacity' } };

export const OpacityHover: Story = { args: { variant: 'opacity-hover' } };

export const Subtle: Story = { args: { variant: 'subtle' } };

const INTENTS: LinkIntent[] = ['brand', 'success', 'warning', 'danger'];

const INTENT_TEXT: Record<LinkIntent, string> = {
  brand: 'Read the docs',
  success: 'View receipt',
  warning: 'Review changes',
  danger: 'Delete account',
};

export const Intents: Story = {
  render: () => (
    <div className="space-y-2">
      {INTENTS.map((i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-3xs w-28 font-mono text-gray-500 uppercase dark:text-gray-400">
            {i}
          </span>
          <Link href="#" intent={i}>
            {INTENT_TEXT[i]}
          </Link>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`intent` colors a `colored` link with a meaning: `brand` (default, the accent), `success`, `warning` or `danger`. The other variants have no color of their own and ignore it.',
      },
    },
  },
};

export const External: Story = {
  args: {
    variant: 'colored',
    href: 'https://github.com/sckyzo/cosmos',
    external: true,
    children: 'Open repository',
  },
};

export const ExternalNoIcon: Story = {
  args: {
    variant: 'colored',
    href: 'https://github.com/sckyzo/cosmos',
    external: true,
    hideExternalIcon: true,
    children: 'Open without the icon',
  },
};

export const WithLeadingIcon: Story = {
  render: () => (
    <Link href="https://example.com" external variant="colored">
      <Globe className="h-4 w-4" aria-hidden />
      Visit our website
    </Link>
  ),
};

export const InsideParagraph: Story = {
  render: () => (
    <p className="max-w-md text-sm text-gray-700 dark:text-gray-300">
      Cosmos is open-source and built on{' '}
      <Link href="#" variant="underline">
        React 19
      </Link>
      ,{' '}
      <Link href="#" variant="underline">
        Tailwind 4
      </Link>{' '}
      and{' '}
      <Link href="#" variant="underline" external>
        Storybook
      </Link>
      . Drop us a star if you like it.
    </p>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      {(['colored', 'underline', 'opacity', 'opacity-hover', 'subtle'] as LinkVariant[]).map(
        (v) => (
          <div key={v} className="flex items-center gap-3">
            <span className="w-28 font-mono text-[10px] text-gray-500 uppercase dark:text-gray-400">
              {v}
            </span>
            <Link href="#" variant={v}>
              Read the docs{' '}
              <span aria-hidden className="inline-block [text-decoration:inherit] rtl:-scale-x-100">
                →
              </span>
            </Link>
          </div>
        )
      )}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ExternalAddsSafeAttrs: Story = {
  tags: ['!dev'],
  args: { external: true, href: 'https://example.com', children: 'External' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /external/i });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const ExternalIconRenders: Story = {
  tags: ['!dev'],
  args: { external: true, href: '#', children: 'Click' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /click/i });
    // The lucide icon renders as an SVG sibling of the text.
    await expect(link.querySelector('svg')).not.toBeNull();
  },
};

export const ExternalIconHidden: Story = {
  args: { external: true, hideExternalIcon: true, href: '#', children: 'Plain' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /plain/i });
    await expect(link.querySelector('svg')).toBeNull();
  },
};

export const ExternalKeepsSafeRelWithCustomRel: Story = {
  tags: ['!dev'],
  args: { external: true, rel: 'nofollow noopener', href: 'https://example.com', children: 'Ext' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /ext/i });
    // The caller's tokens are added, the duplicate is dropped, nothing safe is lost.
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
  },
};

export const InternalKeepsCallerRel: Story = {
  tags: ['!dev'],
  args: { rel: 'nofollow', href: '#', children: 'Internal' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /internal/i });
    await expect(link).toHaveAttribute('rel', 'nofollow');
  },
};

export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('link', { name: 'Read the docs' }));
  },
};

export const FocusShowsRingInLight: Story = {
  tags: ['!dev'],
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};

// What each `intent` is meant to resolve to, drawn by a plain element with the palette classes.
const INTENT_PROBE: Record<LinkIntent, string> = {
  brand: 'text-brand-600 dark:text-brand-400',
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
};

/** A `colored` link takes the color of its `intent` in every theme, and keeps 4.5:1 on the page. */
export const IntentColorsTheLink: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-1">
      {INTENTS.map((i) => (
        <div key={i}>
          <Link href="#" intent={i}>
            {`${i} link`}
          </Link>
          <span data-probe={i} className={INTENT_PROBE[i]}>
            {`${i} probe`}
          </span>
        </div>
      ))}
      <Link href="#">default link</Link>
      <span data-probe="default" className={INTENT_PROBE.brand}>
        default probe
      </span>
    </div>
  ),
  play: async ({ canvas }) => {
    const colorOf = (el: HTMLElement) => getComputedStyle(el).color;
    const probe = (name: string) => canvas.getByText(`${name} probe`);
    inEachTheme(() => {
      for (const intent of INTENTS) {
        const link = canvas.getByRole('link', { name: `${intent} link` });
        expect(colorOf(link)).toBe(colorOf(probe(intent)));
        expectTextContrast(link);
      }
      // No intent is the accent, as before.
      expect(colorOf(canvas.getByRole('link', { name: 'default link' }))).toBe(
        colorOf(probe('default'))
      );
      // The meanings are told apart.
      const colors = INTENTS.map((i) => colorOf(canvas.getByRole('link', { name: `${i} link` })));
      expect(new Set(colors).size).toBe(INTENTS.length);
    });
  },
};

/** Only `colored` has a color of its own: `intent` leaves the other variants as they were. */
export const IntentIgnoredByOtherVariants: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-1">
      {(['underline', 'opacity', 'opacity-hover', 'subtle'] as LinkVariant[]).map((v) => (
        <div key={v}>
          <Link href="#" variant={v} intent="danger">
            {`${v} danger`}
          </Link>
          <Link href="#" variant={v}>
            {`${v} plain`}
          </Link>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const v of ['underline', 'opacity', 'opacity-hover', 'subtle']) {
      const withIntent = canvas.getByRole('link', { name: `${v} danger` });
      const plain = canvas.getByRole('link', { name: `${v} plain` });
      await expect(withIntent.className).toBe(plain.className);
      await expect(withIntent.className).not.toMatch(/red-/);
    }
  },
};
