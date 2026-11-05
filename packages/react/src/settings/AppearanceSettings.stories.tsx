import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AppearanceSettings } from './AppearanceSettings';
import {
  applyAppearance,
  COSMOS_ACCENTS,
  COSMOS_FONTS,
  COSMOS_SYSTEM_THEME,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosFont,
  type CosmosDensity,
  type CosmosMotion,
  type CosmosTextSize,
  type CosmosTheme,
  type CosmosThemeChoice,
} from './appearance';
import { keyToEnd, mobileViewport } from '../storybook-helpers';
import { tokenMs } from '../storybook-motion';
import { LabelsProvider } from '../labels/LabelsProvider';

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
  args: { labels: { theme: 'Color scheme', accent: 'Highlight color' } },
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

/**
 * `onMotionChange` adds the animations group: normal, or reduced, which sets every duration of the
 * theme to 0 (`applyAppearance({ motion: 'reduced' })` sets `data-motion="reduced"` on `<html>`).
 * Each card draws a dot, with the trail of its movement or without.
 */
export const WithMotion: Story = {
  args: { motion: 'full', onMotionChange: fn() },
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
};

export const WithSystemThemeChecks: Story = {
  ...WithSystemTheme,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Deep Blue' }));
    await expect(canvas.getByRole('radio', { name: 'Deep Blue' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'System' }));
    await expect(canvas.getByRole('radio', { name: 'System' })).toBeChecked();
  },
};

// The theme cards each get a column from `sm` up: five with the System card, four without.
const cardRows = (canvas: ReturnType<typeof within>) => {
  const group = canvas.getByRole('radiogroup', { name: 'Theme' });
  const tops = within(group)
    .getAllByRole('radio')
    .map((card) => Math.round(card.getBoundingClientRect().top));
  return [...new Set(tops)];
};

export const ThemeCardsShareOneRowWithSystem: Story = {
  ...WithSystemTheme,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Theme' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(5);
    await expect(cardRows(canvas), 'Deep Blue sits alone on a second row').toHaveLength(1);
  },
};

export const ThemeCardsShareOneRowWithoutSystem: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Theme' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(4);
    await expect(cardRows(canvas)).toHaveLength(1);
  },
};

/** A short list keeps four columns: its cards keep their width instead of filling the row. */
export const FewThemeCardsKeepFourColumns: Story = {
  ...RestrictedChoices,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Theme' });
    const cards = within(group).getAllByRole('radio');
    await expect(cards.length).toBeLessThan(4);
    const width = (node: Element) => node.getBoundingClientRect().width;
    await expect(width(cards[0]!)).toBeLessThan(width(group) / 3);
  },
};

/** Below `sm` the grid stays two wide, however many cards there are. */
export const ThemeCardsStayTwoWideOnAPhone: Story = {
  ...WithSystemTheme,
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  play: async ({ canvas }) => {
    await expect(cardRows(canvas)).toHaveLength(3);
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

// ── Animations ───────────────────────────────────────────────────────────────

export const MotionGroupCallsOnMotionChange: Story = {
  tags: ['!dev', '!autodocs'],
  args: { motion: 'full', onMotionChange: fn() },
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Animations' });
    await expect(within(group).getByRole('radio', { name: 'Normal' })).toBeChecked();
    await userEvent.click(within(group).getByRole('radio', { name: 'Reduced' }));
    await expect(args.onMotionChange).toHaveBeenCalledWith('reduced');
  },
};

/** Without `onMotionChange` there is no animations group, as for the other optional groups. */
export const NoMotionGroupByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('radiogroup', { name: 'Animations' })).toBeNull();
  },
};

/**
 * `applyAppearance({ motion: 'reduced' })` sets `data-motion` on `<html>` and every duration of
 * the theme reads 0; `full` takes the attribute off and the durations come back.
 */
export const ReducedMotionZeroesTheDurations: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [motion, setMotion] = useState<CosmosMotion>('full');
    return (
      <AppearanceSettings
        theme="light"
        accent="blue"
        motion={motion}
        onThemeChange={() => {}}
        onAccentChange={() => {}}
        onMotionChange={(next) => {
          setMotion(next);
          applyAppearance({ theme: 'light', accent: 'blue', motion: next });
        }}
      />
    );
  },
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const tokens = [
      '--cosmos-motion-fast',
      '--cosmos-motion-exit',
      '--cosmos-motion-exit-lg',
      '--cosmos-motion-base',
      '--cosmos-motion-slow',
    ];
    const was = root.className;
    const wasAttributes = ['data-accent', 'data-motion'].map((n) => [n, root.getAttribute(n)]);
    try {
      await expect(root).not.toHaveAttribute('data-motion');
      await expect(tokenMs('--cosmos-motion-base')).toBe(200);

      await userEvent.click(canvas.getByRole('radio', { name: 'Reduced' }));
      await expect(root).toHaveAttribute('data-motion', 'reduced');
      for (const token of tokens) await expect(tokenMs(token), token).toBe(0);

      await userEvent.click(canvas.getByRole('radio', { name: 'Normal' }));
      await expect(root).not.toHaveAttribute('data-motion');
      await expect(tokenMs('--cosmos-motion-base')).toBe(200);
    } finally {
      root.className = was;
      for (const [name, value] of wasAttributes) {
        if (value === null) root.removeAttribute(name!);
        else root.setAttribute(name!, value);
      }
    }
  },
};

/** The provider writes the headings and the names of the options, and the settings' own `labels` win over it. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider
      labels={{
        appearanceSettings: {
          theme: 'Thème',
          accent: "Couleur d'accent",
          font: 'Police',
          textSize: 'Taille du texte',
          density: 'Densité',
          motion: 'Animations',
        },
        appearance: {
          themeLight: 'Clair',
          themeSand: 'Sable',
          themeDark: 'Sombre',
          themeDeepBlue: 'Bleu profond',
          themeSystem: 'Système',
          accentTeal: 'Sarcelle',
          fontSystem: 'Système',
          textSizeLarge: 'Grand',
          densityCompact: 'Compact',
          motionReduced: 'Réduites',
        },
      }}
    >
      <div data-testid="provider">
        <AppearanceSettings
          theme="light"
          accent="blue"
          onThemeChange={fn()}
          onAccentChange={fn()}
          onFontChange={fn()}
          onTextSizeChange={fn()}
          onDensityChange={fn()}
          onMotionChange={fn()}
          themes={[COSMOS_SYSTEM_THEME, ...COSMOS_THEMES]}
        />
      </div>
      <div data-testid="own">
        <AppearanceSettings
          theme="light"
          accent="blue"
          onThemeChange={fn()}
          onAccentChange={fn()}
          labels={{ theme: 'Apparence' }}
        />
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const provider = within(canvas.getByTestId('provider'));
    for (const text of [
      'Thème',
      "Couleur d'accent",
      'Police',
      'Taille du texte',
      'Densité',
      'Animations',
    ])
      await expect(provider.getByText(text)).toBeVisible();
    for (const text of ['Clair', 'Sable', 'Sombre', 'Bleu profond', 'Réduites', 'Grand', 'Compact'])
      await expect(provider.getByText(text)).toBeVisible();
    await expect(provider.getAllByText('Système').length).toBeGreaterThan(0);
    // The settings' own label wins over the provider's.
    await expect(within(canvas.getByTestId('own')).getByText('Apparence')).toBeVisible();
    await expect(within(canvas.getByTestId('own')).queryByText('Thème')).toBeNull();
  },
};
