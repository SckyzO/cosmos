import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  applyAppearance,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosThemeChoice,
} from '../settings/appearance';
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
      await expect(canvas.getByTestId(theme).querySelector('svg')).toHaveClass(icon);
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
