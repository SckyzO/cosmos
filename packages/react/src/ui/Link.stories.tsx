import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe } from 'lucide-react';
import { expect } from 'storybook/test';
import { Link, type LinkVariant } from './Link';

const meta = {
  title: 'Atoms/Link',
  component: Link,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Read the docs', href: '#' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colored: Story = {};

export const Underline: Story = { args: { variant: 'underline' } };

export const Opacity: Story = { args: { variant: 'opacity' } };

export const OpacityHover: Story = { args: { variant: 'opacity-hover' } };

export const Subtle: Story = { args: { variant: 'subtle' } };

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
            <span className="w-28 font-mono text-[10px] text-gray-400 uppercase">{v}</span>
            <Link href="#" variant={v}>
              Read the docs →
            </Link>
          </div>
        )
      )}
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ExternalAddsSafeAttrs: Story = {
  args: { external: true, href: 'https://example.com', children: 'External' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /external/i });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const ExternalIconRenders: Story = {
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
