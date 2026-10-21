import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import {
  AppearanceSettings,
  Button,
  applyAppearance,
  type CosmosAccent,
  type CosmosTheme,
} from '../../../packages/react/src';

const meta = {
  title: 'Foundations/Appearance',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Pick a theme and an accent: `applyAppearance` sets them on `<html>`, so the ' +
          'whole page follows. The toolbar menus reset the page to their own values.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type PlaygroundProps = { initialTheme: CosmosTheme; initialAccent: CosmosAccent };

const AppearancePlayground = ({ initialTheme, initialAccent }: PlaygroundProps) => {
  const [theme, setTheme] = useState(initialTheme);
  const [accent, setAccent] = useState(initialAccent);
  useEffect(() => applyAppearance({ theme, accent }), [theme, accent]);

  return (
    <div className="max-w-3xl space-y-8">
      <AppearanceSettings
        theme={theme}
        accent={accent}
        onThemeChange={setTheme}
        onAccentChange={setAccent}
      />
      <section aria-label="Sample" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="secondary">Secondary</Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Body text with{' '}
          <a href="#appearance" className="text-brand-600 dark:text-brand-400 hover:underline">
            a link
          </a>{' '}
          in the accent color.
        </p>
      </section>
    </div>
  );
};

// Start from the toolbar's values; changing them remounts the playground.
const renderPlayground: Story['render'] = (_args, { globals }) => {
  const theme = (globals.theme || 'dark') as CosmosTheme;
  const accent = (globals.accent || 'blue') as CosmosAccent;
  return (
    <AppearancePlayground key={`${theme}-${accent}`} initialTheme={theme} initialAccent={accent} />
  );
};

export const Default: Story = { render: renderPlayground };

// ── Interaction tests ────────────────────────────────────────────────────────

export const PickingAppliesToDocument: Story = {
  // A test: it rewrites the theme on <html>, so keep it out of the docs page.
  tags: ['!autodocs'],
  render: renderPlayground,
  play: async ({ canvas }) => {
    const root = document.documentElement;
    await userEvent.click(canvas.getByRole('button', { name: 'Sand' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Teal' }));
    await expect(root).toHaveClass('sand');
    await expect(root).not.toHaveClass('dark');
    await expect(root).toHaveAttribute('data-accent', 'teal');

    await userEvent.click(canvas.getByRole('button', { name: 'Light' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Blue' }));
    await expect(root).not.toHaveClass('sand');
    await expect(root).not.toHaveAttribute('data-accent');
  },
};

/** The sizes under text-xs match the pixel classes they replace: font-size only. */
export const SmallTextTokens: Story = {
  tags: ['!autodocs'],
  render: () => (
    <p style={{ fontSize: '16px', lineHeight: '24px' }}>
      <span data-testid="text-2xs" className="text-2xs">
        Eleven
      </span>{' '}
      <span data-testid="text-3xs" className="text-3xs">
        Ten
      </span>
    </p>
  ),
  play: async ({ canvas }) => {
    for (const [id, size] of [
      ['text-2xs', '11px'],
      ['text-3xs', '10px'],
    ]) {
      const style = getComputedStyle(canvas.getByTestId(id));
      await expect(style.fontSize).toBe(size);
      // No line height of their own: they keep the parent's.
      await expect(style.lineHeight).toBe('24px');
    }
  },
};

const FONT_FAMILIES = [
  ['inter', 'Inter Variable'],
  ['plex', 'IBM Plex Sans Variable'],
  ['montserrat', 'Montserrat Variable'],
  ['open-sans', 'Open Sans Variable'],
  ['system', 'system-ui'],
] as const;

/** data-font swaps the sans-serif family below it; font-mono keeps JetBrains Mono. */
export const FontAttributeSwitchesFamily: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="space-y-2">
      {FONT_FAMILIES.map(([id]) => (
        <p key={id} data-font={id} data-testid={id}>
          The quick brown fox
        </p>
      ))}
      <code data-font="inter" data-testid="mono" className="font-mono">
        const x = 1;
      </code>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [id, family] of FONT_FAMILIES) {
      const computed = getComputedStyle(canvas.getByTestId(id)).fontFamily;
      await expect(computed.split(',')[0].replaceAll('"', '').trim()).toBe(family);
    }
    await expect(getComputedStyle(canvas.getByTestId('mono')).fontFamily).toContain(
      'JetBrains Mono'
    );
  },
};

/** data-text-size scales the text-* sizes and plain text, not the spacing. */
export const TextSizeAttributeScales: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="space-y-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} data-text-size={size} data-testid={size}>
          <span className="text-sm">Small</span> <span className="text-3xs">Tiny</span>{' '}
          <span>Plain</span>
        </div>
      ))}
      <div data-text-size="lg" data-testid="utility-wins" className="p-4 text-xs">
        A text-xs class on the element itself still applies.
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const sizes = (id: string) =>
      [...canvas.getByTestId(id).querySelectorAll('span')].map(
        (el) => getComputedStyle(el).fontSize
      );
    await expect(sizes('sm')).toEqual(['13.125px', '9.375px', '15px']);
    await expect(sizes('md')).toEqual(['14px', '10px', '16px']);
    await expect(sizes('lg')).toEqual(['15.75px', '11.25px', '18px']);
    await expect(sizes('xl')).toEqual(['17.5px', '12.5px', '20px']);

    const own = getComputedStyle(canvas.getByTestId('utility-wins'));
    await expect(own.fontSize).toBe('13.5px');
    // rem spacing doesn't scale.
    await expect(own.paddingTop).toBe('16px');
  },
};
