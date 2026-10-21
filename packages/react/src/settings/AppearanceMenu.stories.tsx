import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, User } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Topbar } from '../layout/Topbar';
import { portalDocsParams } from '../storybook-helpers';
import { AppearanceMenu } from './AppearanceMenu';
import {
  applyAppearance,
  type CosmosAccent,
  type CosmosAppearance,
  type CosmosFont,
  type CosmosTextSize,
  type CosmosTheme,
} from './appearance';

const meta = {
  title: 'Settings/Appearance Menu',
  component: AppearanceMenu,
  parameters: portalDocsParams(480),
  tags: ['autodocs'],
  args: {
    theme: 'light',
    accent: 'blue',
    onThemeChange: fn(),
    onAccentChange: fn(),
  },
  // Right-aligned like a top bar, so the panel opens towards the page.
  render: (args) => (
    <div className="flex justify-end p-6">
      <AppearanceMenu {...args} />
    </div>
  ),
} satisfies Meta<typeof AppearanceMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const panel = () => within(document.body).getByRole('dialog', { name: 'Appearance' });

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

const IconButton = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
  >
    <Icon className="h-5 w-5" aria-hidden />
  </button>
);

/**
 * In a `Topbar`, applying the choice to the page, font and text size
 * included. Starts from the toolbar's values.
 */
export const InTopbar: Story = {
  render: (_args, { globals }) => {
    const [appearance, setAppearance] = useState<CosmosAppearance>({
      theme: (globals.theme || 'dark') as CosmosTheme,
      accent: (globals.accent || 'blue') as CosmosAccent,
      font: (globals.font || 'outfit') as CosmosFont,
      textSize: (globals.textSize || 'md') as CosmosTextSize,
    });
    const update = (patch: Partial<CosmosAppearance>) => {
      const next = { ...appearance, ...patch };
      setAppearance(next);
      applyAppearance(next);
    };
    return (
      <Topbar
        pageTitle="Analytics Dashboard"
        rightActions={
          <>
            <IconButton icon={Bell} label="Notifications" />
            <AppearanceMenu
              {...appearance}
              onThemeChange={(theme) => update({ theme })}
              onAccentChange={(accent) => update({ accent })}
              onFontChange={(font) => update({ font })}
              onTextSizeChange={(textSize) => update({ textSize })}
            />
            <IconButton icon={User} label="Profile" />
          </>
        }
      />
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const TriggerOpensPanel: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Appearance' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await waitFor(() => expect(panel()).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(within(panel()).getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    await expect(within(panel()).getByRole('group', { name: 'Accent color' })).toBeInTheDocument();
  },
};

export const PanelIsFlushWithTrigger: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Appearance' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panel()).toBeVisible());
    const t = trigger.getBoundingClientRect();
    const p = panel().getBoundingClientRect();
    await expect(p.right).toBeCloseTo(t.right, 2);
    await expect(p.top).toBeCloseTo(t.bottom + 8, 2);
  },
};

export const PickingKeepsPanelOpen: Story = {
  tags: ['!autodocs'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.click(within(panel()).getByRole('button', { name: 'Sand' }));
    await userEvent.click(within(panel()).getByRole('button', { name: 'Teal' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(panel()).toBeVisible();
  },
};

export const EscapeClosesPanel: Story = {
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Appearance' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(within(document.body).queryByRole('dialog', { name: 'Appearance' })).toBeNull()
    );
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const PanelShowsFontAndTextSize: Story = {
  tags: ['!autodocs'],
  args: { onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.click(within(panel()).getByRole('button', { name: 'Montserrat' }));
    await userEvent.click(within(panel()).getByRole('button', { name: 'Small' }));
    await expect(args.onFontChange).toHaveBeenCalledWith('montserrat');
    await expect(args.onTextSizeChange).toHaveBeenCalledWith('sm');
  },
};
