import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { AppearanceSettings } from './AppearanceSettings';
import {
  COSMOS_ACCENTS,
  COSMOS_FONTS,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosFont,
  type CosmosTextSize,
  type CosmosTheme,
} from './appearance';

const meta = {
  title: 'Settings/Appearance Settings',
  component: AppearanceSettings,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    theme: 'light',
    accent: 'blue',
    onThemeChange: fn(),
    onAccentChange: fn(),
  },
} satisfies Meta<typeof AppearanceSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {};

export const CustomLabels: Story = {
  args: { themeLabel: 'Color scheme', accentLabel: 'Highlight color' },
};

/** `themes` / `accents` narrow the choice, e.g. dark themes and cool accents only. */
export const RestrictedChoices: Story = {
  args: {
    theme: 'deep-blue',
    accent: 'teal',
    themes: COSMOS_THEMES.filter((t) => t.dark),
    accents: COSMOS_ACCENTS.filter((a) => ['blue', 'teal', 'cyan', 'graphite'].includes(a.id)),
  },
};

/**
 * `onFontChange` and `onTextSizeChange` add the font and text size groups.
 * Each font card draws "Aa" in its font; the app must import the font's CSS
 * (`@sckyzo/cosmos-theme/fonts/<id>`) for it to load.
 */
export const WithFontAndTextSize: Story = {
  args: { font: 'inter', textSize: 'lg', onFontChange: fn(), onTextSizeChange: fn() },
};

/** `fonts` narrows the font choice to the ones the app loads. */
export const RestrictedFonts: Story = {
  args: {
    onFontChange: fn(),
    fonts: COSMOS_FONTS.filter((f) => ['outfit', 'inter', 'system'].includes(f.id)),
  },
};

export const Controlled: Story = {
  render: () => {
    const [theme, setTheme] = useState<CosmosTheme>('light');
    const [accent, setAccent] = useState<CosmosAccent>('blue');
    const [font, setFont] = useState<CosmosFont>('outfit');
    const [textSize, setTextSize] = useState<CosmosTextSize>('md');
    return (
      <div className="space-y-4">
        <AppearanceSettings
          theme={theme}
          accent={accent}
          font={font}
          textSize={textSize}
          onThemeChange={setTheme}
          onAccentChange={setAccent}
          onFontChange={setFont}
          onTextSizeChange={setTextSize}
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          Selected: <code>{theme}</code> / <code>{accent}</code> / <code>{font}</code> /{' '}
          <code>{textSize}</code>
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const GroupsAreLabelled: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Accent color' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
};

export const ClickSandFiresThemeChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sand' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).not.toHaveBeenCalled();
  },
};

export const ClickTealFiresAccentChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Teal' }));
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};

/** Without their handlers, the font and text size groups stay hidden. */
export const FontAndTextSizeNeedHandlers: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('group', { name: 'Font' })).toBeNull();
    await expect(canvas.queryByRole('group', { name: 'Text size' })).toBeNull();
  },
};

export const PickingFontAndTextSize: Story = {
  tags: ['!autodocs'],
  args: { onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ args, canvas }) => {
    // Outfit and the default size are selected when nothing is passed.
    await expect(canvas.getByRole('button', { name: 'Outfit' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(canvas.getByRole('button', { name: 'Default' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Inter' }));
    await expect(args.onFontChange).toHaveBeenCalledWith('inter');
    await userEvent.click(canvas.getByRole('button', { name: 'Large' }));
    await expect(args.onTextSizeChange).toHaveBeenCalledWith('lg');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};
