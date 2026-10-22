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

export const GroupsAreRadioGroups: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    await expect(canvas.getByRole('radiogroup', { name: 'Accent color' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  },
};

export const ClickSandFiresThemeChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Sand' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).not.toHaveBeenCalled();
  },
};

export const ClickTealFiresAccentChange: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Teal' }));
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};

/** Without their handlers, the font and text size groups stay hidden. */
export const FontAndTextSizeNeedHandlers: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('radiogroup', { name: 'Font' })).toBeNull();
    await expect(canvas.queryByRole('radiogroup', { name: 'Text size' })).toBeNull();
  },
};

export const PickingFontAndTextSize: Story = {
  tags: ['!autodocs'],
  args: { onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ args, canvas }) => {
    // Outfit and the default size are selected when nothing is passed.
    await expect(canvas.getByRole('radio', { name: 'Outfit' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(canvas.getByRole('radio', { name: 'Default' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await userEvent.click(canvas.getByRole('radio', { name: 'Inter' }));
    await expect(args.onFontChange).toHaveBeenCalledWith('inter');
    await userEvent.click(canvas.getByRole('radio', { name: 'Large' }));
    await expect(args.onTextSizeChange).toHaveBeenCalledWith('lg');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};

export const ArrowKeysRoveAndPick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { accent: 'teal', onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ args, canvas }) => {
    // Each group is one tab stop, on its checked radio.
    await expect(canvas.getByRole('radio', { name: 'Sand' })).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Light', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Sand' })).toHaveFocus();
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Teal', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Cyan' })).toHaveFocus();
    await expect(args.onAccentChange).toHaveBeenCalledWith('cyan');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Outfit', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onFontChange).toHaveBeenCalledWith('inter');
  },
};
