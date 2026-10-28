import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { AppearanceSettings } from './AppearanceSettings';
import {
  COSMOS_ACCENTS,
  COSMOS_FONTS,
  COSMOS_SYSTEM_THEME,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosFont,
  type CosmosDensity,
  type CosmosTextSize,
  type CosmosTheme,
  type CosmosThemeChoice,
} from './appearance';
import { keyToEnd } from '../storybook-helpers';

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

/**
 * `onDensityChange` adds the density group: how tight the controls and rows are. Each card draws
 * three rows, closer or further apart.
 */
export const WithDensity: Story = {
  args: { density: 'compact', onDensityChange: fn() },
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
    const [density, setDensity] = useState<CosmosDensity>('default');
    return (
      <div className="space-y-4">
        <AppearanceSettings
          theme={theme}
          accent={accent}
          font={font}
          textSize={textSize}
          density={density}
          onThemeChange={setTheme}
          onAccentChange={setAccent}
          onFontChange={setFont}
          onTextSizeChange={setTextSize}
          onDensityChange={setDensity}
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          Selected: <code>{theme}</code> / <code>{accent}</code> / <code>{font}</code> /{' '}
          <code>{textSize}</code> / <code>{density}</code>
        </p>
      </div>
    );
  },
};

/** Opt-in: add `COSMOS_SYSTEM_THEME` to the themes, and `applyAppearance` resolves it with `prefers-color-scheme`. */
export const WithSystemTheme: Story = {
  render: () => {
    const [theme, setTheme] = useState<CosmosThemeChoice>('system');
    return (
      <AppearanceSettings
        theme={theme}
        accent="blue"
        themes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]}
        onThemeChange={setTheme}
        onAccentChange={() => {}}
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Deep Blue' }));
    await expect(canvas.getByRole('radio', { name: 'Deep Blue' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'System' }));
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
  },
};

// The default list has no System card.
export const NoSystemByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('radio', { name: 'System' })).toBeNull();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const GroupsAreRadioGroups: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Sand' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).not.toHaveBeenCalled();
  },
};

export const ClickTealFiresAccentChange: Story = {
  tags: ['!dev'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Teal' }));
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};

/** Without their handlers, the font and text size groups stay hidden. */
export const FontAndTextSizeNeedHandlers: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('radiogroup', { name: 'Font' })).toBeNull();
    await expect(canvas.queryByRole('radiogroup', { name: 'Text size' })).toBeNull();
    await expect(canvas.queryByRole('radiogroup', { name: 'Density' })).toBeNull();
  },
};

export const PickingDensity: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onDensityChange: fn() },
  play: async ({ args, canvas }) => {
    // The default is selected when nothing is passed.
    await expect(canvas.getByRole('radio', { name: 'Default' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await userEvent.click(canvas.getByRole('radio', { name: 'Compact' }));
    await expect(args.onDensityChange).toHaveBeenCalledWith('compact');
    await userEvent.click(canvas.getByRole('radio', { name: 'Comfortable' }));
    await expect(args.onDensityChange).toHaveBeenCalledWith('comfortable');
    await expect(args.onThemeChange).not.toHaveBeenCalled();
  },
};

export const PickingFontAndTextSize: Story = {
  tags: ['!dev', '!autodocs'],
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
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Sand' })).toHaveFocus();
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Teal', checked: true })).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(canvas.getByRole('radio', { name: 'Cyan' })).toHaveFocus();
    await expect(args.onAccentChange).toHaveBeenCalledWith('cyan');

    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Outfit', checked: true })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onFontChange).toHaveBeenCalledWith('inter');
  },
};
