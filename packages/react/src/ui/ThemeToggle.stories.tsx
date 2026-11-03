import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  applyAppearance,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosThemeChoice,
} from '../settings/appearance';
import { bothDirections, directionBox } from '../storybook-helpers';
import { isFading, tokenMs, transitionMs, transitionValues } from '../storybook-motion';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Settings/Theme Toggle',
  component: ThemeToggle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { theme: 'light', onChange: fn() },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// The four themes and the system choice, in the order of the longest cycle.
const EVERY_THEME: CosmosThemeChoice[] = [...COSMOS_THEMES.map((theme) => theme.id), 'system'];

/** The default cycle is light and dark. The icon shows the theme the page is in. */
export const Light: Story = { args: { theme: 'light' } };
export const Dark: Story = { args: { theme: 'dark' } };

/** Sand, deep blue and the system choice have an icon of their own, once `themes` lists them. */
export const Sand: Story = { args: { theme: 'sand', themes: ['light', 'sand', 'dark'] } };
export const DeepBlue: Story = {
  args: { theme: 'deep-blue', themes: ['light', 'dark', 'deep-blue'] },
};
export const System: Story = { args: { theme: 'system', themes: ['light', 'dark', 'system'] } };

export const Small: Story = { args: { theme: 'light', size: 'sm' } };

export const AllThemes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {EVERY_THEME.map((theme) => (
        <ThemeToggle key={theme} theme={theme} themes={EVERY_THEME} onChange={fn()} />
      ))}
    </div>
  ),
};

const ControlledToggle = ({ initial }: { initial: CosmosThemeChoice }) => {
  const [theme, setTheme] = useState(initial);
  const onChange = (next: CosmosThemeChoice) => {
    setTheme(next);
    // The toggle only reports the next theme: applying it is the app's job.
    const accent = (document.documentElement.dataset.accent ?? 'blue') as CosmosAccent;
    applyAppearance({ theme: next, accent });
  };
  return (
    <div className="space-y-3">
      <ThemeToggle theme={theme} themes={EVERY_THEME} onChange={onChange} />
      <p className="text-xs text-[var(--color-text-muted)]">
        Current: <code>{theme}</code> — a click goes to the next theme of the list, the first one
        after the last, and applies it to the page
      </p>
    </div>
  );
};

/** All four themes, then the system choice. Starts from the toolbar theme, and remounts when it changes. */
export const Controlled: Story = {
  parameters: { settleMotion: false },
  render: (_args, { globals }) => {
    const initial = (
      EVERY_THEME.includes(globals.theme) ? globals.theme : 'light'
    ) as CosmosThemeChoice;
    return <ControlledToggle key={initial} initial={initial} />;
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const LightClickFiresWithDark: Story = {
  tags: ['!dev'],
  args: { theme: 'light', onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Switch to dark theme' });
    await expect(button).toHaveAttribute('data-theme', 'light');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('dark');
  },
};

/** The default cycle has two themes: dark goes back to light. */
export const DarkClickWrapsToLight: Story = {
  tags: ['!dev'],
  args: { theme: 'dark', onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch to light theme' }));
    await expect(args.onChange).toHaveBeenCalledWith('light');
  },
};

/** The name says what the click does, so the button holds no `aria-pressed`. */
export const NameSaysWhatTheClickDoes: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-3">
      <ThemeToggle theme="light" onChange={fn()} />
      <ThemeToggle theme="dark" onChange={fn()} />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Switch to dark theme', 'Switch to light theme']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toHaveAttribute('title', name);
      await expect(button).not.toHaveAttribute('aria-pressed');
    }
  },
};

/** Three themes cycle in the order of `themes`, and the last wraps to the first. */
export const ThreeThemesWrapAround: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-3">
      {(['light', 'dark', 'deep-blue'] as const).map((theme) => (
        <ThemeToggle
          key={theme}
          theme={theme}
          themes={['light', 'dark', 'deep-blue']}
          onChange={fn()}
          data-testid={theme}
        />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const expected = {
      light: 'Switch to dark theme',
      dark: 'Switch to deep blue theme',
      'deep-blue': 'Switch to light theme',
    };
    for (const [theme, name] of Object.entries(expected)) {
      await expect(canvas.getByTestId(theme)).toHaveAccessibleName(name);
    }
  },
};

export const DeepBlueClickWrapsToLight: Story = {
  tags: ['!dev'],
  args: { theme: 'deep-blue', themes: ['light', 'dark', 'deep-blue'], onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Switch to light theme' });
    await expect(button).toHaveAttribute('data-theme', 'deep-blue');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('light');
  },
};

/** `sand` and `system` are in the cycle when `themes` lists them, and only then. */
export const SandAndSystemAreOptIn: Story = {
  tags: ['!dev', '!autodocs'],
  args: { theme: 'deep-blue', onChange: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Switch to system theme' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Switch to sand theme' })).toBeNull();
    // Not in the default list: the click goes to its first theme.
    await expect(canvas.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  },
};

export const DeepBlueClickFiresWithSystem: Story = {
  tags: ['!dev', '!autodocs'],
  args: { theme: 'deep-blue', themes: EVERY_THEME, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch to system theme' }));
    await expect(args.onChange).toHaveBeenCalledWith('system');
  },
};

export const SystemClickWrapsToLight: Story = {
  tags: ['!dev', '!autodocs'],
  args: { theme: 'system', themes: EVERY_THEME, onChange: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Switch to light theme' });
    await expect(button).toHaveAttribute('data-theme', 'system');
    await userEvent.click(button);
    await expect(args.onChange).toHaveBeenCalledWith('light');
  },
};

/** The icon is the one of the current theme: a sun, a sunset, a moon, a moon and a star, a screen. */
export const IconShowsTheCurrentTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-3">
      {EVERY_THEME.map((theme) => (
        <ThemeToggle
          key={theme}
          theme={theme}
          themes={EVERY_THEME}
          onChange={fn()}
          data-testid={theme}
        />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const icons = {
      light: 'lucide-sun',
      sand: 'lucide-sunset',
      dark: 'lucide-moon',
      'deep-blue': 'lucide-moon-star',
      system: 'lucide-monitor',
    };
    for (const [theme, icon] of Object.entries(icons)) {
      // Every icon of the list is in the button; the one showing is the one that is opaque.
      const shown = Array.from(canvas.getByTestId(theme).querySelectorAll('svg')).filter(
        (svg) => getComputedStyle(svg).opacity === '1'
      );
      await expect(shown).toHaveLength(1);
      await expect(shown[0]).toHaveClass(icon);
    }
  },
};

/** `labels` renames the button for the theme a click goes to, in the page's own language. */
export const LabelsRenameTheButton: Story = {
  tags: ['!dev', '!autodocs'],
  args: { theme: 'light', labels: { dark: 'Passer au thème sombre' }, onChange: fn() },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Passer au thème sombre' });
    await expect(button).toHaveAttribute('title', 'Passer au thème sombre');
  },
};

/** Click, Enter and Space each call `onChange` with the next theme. */
export const EveryActivationPassesTheNextTheme: Story = {
  tags: ['!dev', '!autodocs'],
  args: { theme: 'light', onChange: fn() },
  render: (args) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    return (
      <ThemeToggle
        theme={theme}
        onChange={(next) => {
          args.onChange(next);
          setTheme(next);
        }}
      />
    );
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch to dark theme' }));
    await expect(args.onChange).toHaveBeenLastCalledWith('dark');

    canvas.getByRole('button', { name: 'Switch to light theme' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith('light');
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith('dark');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

const EveryThemeToggle = () => {
  const [theme, setTheme] = useState<CosmosThemeChoice>('system');
  const onChange = (next: CosmosThemeChoice) => {
    setTheme(next);
    const accent = (document.documentElement.dataset.accent ?? 'blue') as CosmosAccent;
    applyAppearance({ theme: next, accent });
  };
  return <ThemeToggle theme={theme} themes={EVERY_THEME} onChange={onChange} />;
};

/** Cycles through all five choices and applies each; `system` resolves to the OS preference. */
export const CyclesThroughEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <EveryThemeToggle />,
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const saved = root.className;
    try {
      // system -> light
      await userEvent.click(canvas.getByRole('button', { name: 'Switch to light theme' }));
      await expect(canvas.getByRole('button')).toHaveAttribute('data-theme', 'light');
      await userEvent.click(canvas.getByRole('button', { name: 'Switch to sand theme' }));
      await expect(root.classList.contains('sand')).toBe(true);
      await userEvent.click(canvas.getByRole('button', { name: 'Switch to dark theme' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Switch to deep blue theme' }));
      await expect(root.classList.contains('deep-blue')).toBe(true);
      await userEvent.click(canvas.getByRole('button', { name: 'Switch to system theme' }));
      await expect(canvas.getByRole('button')).toHaveAttribute('data-theme', 'system');
      // `system` is no theme class: the page got the light or the dark one.
      await expect(root.classList.contains('system')).toBe(false);
    } finally {
      root.className = saved;
    }
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

const iconOf = (button: Element, theme: string) =>
  button.querySelector(`[data-theme-icon="${theme}"]`)!;
const look = (icon: Element) => {
  const { opacity, rotate } = getComputedStyle(icon);
  return { opacity, rotate };
};
const AT_REST = { opacity: '1', rotate: 'none' };

// The quarter before the current icon and the one after it. Right to left turns the other way, and
// the stories hold under `dir="rtl"` on the page too (the direction pass).
const quarter = (element: Element, side: 'past' | 'next') => {
  const rtl = getComputedStyle(element).direction === 'rtl';
  return (side === 'past') !== rtl ? '-90deg' : '90deg';
};

/**
 * At rest the icon of the current theme is upright and opaque, the icons before it in the list
 * have turned a quarter one way and the ones after it wait a quarter the other way, transparent,
 * for every theme of the list; right to left mirrors the turn.
 */
export const IconsRestPerTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="flex gap-3">
        {EVERY_THEME.map((theme) => (
          <ThemeToggle
            key={theme}
            theme={theme}
            themes={EVERY_THEME}
            onChange={fn()}
            data-testid={theme}
          />
        ))}
      </div>
    )),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      // The quarter before the current icon, and the one after it.
      const past = { opacity: '0', rotate: dir === 'ltr' ? '-90deg' : '90deg' };
      const next = { opacity: '0', rotate: dir === 'ltr' ? '90deg' : '-90deg' };
      for (const [current, theme] of EVERY_THEME.entries()) {
        const button = box.querySelector(`[data-testid="${theme}"]`)!;
        await expect(button.querySelectorAll('svg')).toHaveLength(EVERY_THEME.length);
        for (const [index, other] of EVERY_THEME.entries()) {
          const expected = index === current ? AT_REST : index < current ? past : next;
          await expect(look(iconOf(button, other)), `${dir} ${theme}: ${other}`).toEqual(expected);
        }
      }
    }
  },
};

// A toggle that turns through the four themes, as the page would drive it.
const FOUR = ['light', 'sand', 'dark', 'deep-blue'] as const;
const TurningToggle = () => {
  const [theme, setTheme] = useState<(typeof FOUR)[number]>('light');
  return <ThemeToggle theme={theme} themes={FOUR} onChange={setTheme} />;
};

/**
 * A click turns the icon that leaves a quarter and the one that arrives a quarter, the same way
 * round, fading one into the other; wrapping from the last theme back to the first turns them the
 * other way. Read from the transitions that run, then from where they end.
 */
export const IconsTurnAQuarterBothWays: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <TurningToggle />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    // Forward: the old icon turns out to the quarter before, the new one comes from the quarter after.
    await userEvent.click(button);
    await expect(button).toHaveAttribute('data-theme', 'sand');
    await expect(transitionValues(iconOf(button, 'light'), 'rotate').at(-1)).toBe(
      quarter(button, 'past')
    );
    await expect(transitionValues(iconOf(button, 'sand'), 'rotate')[0]).toBe(
      quarter(button, 'next')
    );
    await expect(transitionValues(iconOf(button, 'light'), 'opacity')).toEqual(['1', '0']);
    await expect(transitionValues(iconOf(button, 'sand'), 'opacity')).toEqual(['0', '1']);
    await waitFor(() => expect(look(iconOf(button, 'sand'))).toEqual(AT_REST));
    await expect(look(iconOf(button, 'light'))).toEqual({
      opacity: '0',
      rotate: quarter(button, 'past'),
    });

    await userEvent.click(button);
    await userEvent.click(button);
    await expect(button).toHaveAttribute('data-theme', 'deep-blue');
    await waitFor(() => expect(look(iconOf(button, 'deep-blue'))).toEqual(AT_REST));

    // Back to the first theme: the other way round.
    await userEvent.click(button);
    await expect(button).toHaveAttribute('data-theme', 'light');
    await expect(transitionValues(iconOf(button, 'deep-blue'), 'rotate').at(-1)).toBe(
      quarter(button, 'next')
    );
    await expect(transitionValues(iconOf(button, 'light'), 'rotate')[0]).toBe(
      quarter(button, 'past')
    );
    await waitFor(() => expect(look(iconOf(button, 'light'))).toEqual(AT_REST));
    await expect(look(iconOf(button, 'deep-blue'))).toEqual({
      opacity: '0',
      rotate: quarter(button, 'next'),
    });
  },
};

/** The icons move over the base duration, 200 ms, and the box they turn in does not change size. */
export const IconsTurnOnTheBaseToken: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <TurningToggle />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    await expect(tokenMs('--cosmos-motion-base')).toBe(200);
    const icons = FOUR.map((theme) => iconOf(button, theme));
    for (const icon of icons) await expect(transitionMs(icon)).toBe(200);
    const box = button.getBoundingClientRect().toJSON();
    const rects = icons.map((icon) => icon.getBoundingClientRect().toJSON());
    await userEvent.click(button);
    await expect(isFading(iconOf(button, 'sand'))).toBe(true);
    await waitFor(() => expect(isFading(button)).toBe(false));
    await expect(button.getBoundingClientRect().toJSON()).toEqual(box);
    await expect(icons.map((icon) => icon.getBoundingClientRect().toJSON())).toEqual(rects);
  },
};

/** With the reduced setting the icons swap at once, with no turn. */
export const IconsSwapAtOnceWhenReduced: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <TurningToggle />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    for (const theme of FOUR) await expect(transitionMs(iconOf(button, theme))).toBe(0);
    await userEvent.click(button);
    await expect(isFading(iconOf(button, 'light'))).toBe(false);
    await expect(isFading(iconOf(button, 'sand'))).toBe(false);
    await expect(look(iconOf(button, 'sand'))).toEqual(AT_REST);
    await expect(look(iconOf(button, 'light'))).toEqual({
      opacity: '0',
      rotate: quarter(button, 'past'),
    });
  },
};

/** A theme outside the list still has its icon, upright, and the list follows it. */
export const ThemeOutsideTheListKeepsItsIcon: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ThemeToggle theme="system" themes={['light', 'dark']} onChange={fn()} />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    await expect(button.querySelectorAll('svg')).toHaveLength(3);
    await expect(look(iconOf(button, 'system'))).toEqual(AT_REST);
    await expect(look(iconOf(button, 'light'))).toEqual({
      opacity: '0',
      rotate: quarter(button, 'next'),
    });
  },
};
