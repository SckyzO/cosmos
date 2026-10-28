import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, User } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Topbar } from '../layout/Topbar';
import { endOffset, portalDocsParams } from '../storybook-helpers';
import { AppearanceMenu } from './AppearanceMenu';
import {
  applyAppearance,
  type CosmosAccent,
  type CosmosAppearance,
  type CosmosFont,
  type CosmosDensity,
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
 * In a `Topbar`, applying the choice to the page, font, text size and
 * density included. Starts from the toolbar's values.
 */
export const InTopbar: Story = {
  render: (_args, { globals }) => {
    const [appearance, setAppearance] = useState<CosmosAppearance>({
      theme: (globals.theme || 'dark') as CosmosTheme,
      accent: (globals.accent || 'blue') as CosmosAccent,
      font: (globals.font || 'outfit') as CosmosFont,
      textSize: (globals.textSize || 'md') as CosmosTextSize,
      density: (globals.density || 'default') as CosmosDensity,
    });
    const update = (patch: Partial<CosmosAppearance>) => {
      const next = { ...appearance, ...patch };
      setAppearance(next);
      applyAppearance(next);
    };
    return (
      <Topbar
        pageTitle="Analytics Dashboard"
        endActions={
          <>
            <IconButton icon={Bell} label="Notifications" />
            <AppearanceMenu
              {...appearance}
              onThemeChange={(theme) => update({ theme })}
              onAccentChange={(accent) => update({ accent })}
              onFontChange={(font) => update({ font })}
              onTextSizeChange={(textSize) => update({ textSize })}
              onDensityChange={(density) => update({ density })}
            />
            <IconButton icon={User} label="Profile" />
          </>
        }
      />
    );
  },
};

/** `onReset` adds a "Reset" button under the groups, in view while they scroll. */
export const WithReset: Story = {
  args: { onReset: fn(), onFontChange: fn(), onTextSizeChange: fn() },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const TriggerOpensPanel: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Appearance' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await waitFor(() => expect(panel()).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(within(panel()).getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    await expect(
      within(panel()).getByRole('radiogroup', { name: 'Accent color' })
    ).toBeInTheDocument();
  },
};

export const PanelIsFlushWithTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Appearance' });
    await userEvent.click(trigger);
    await waitFor(() => expect(panel()).toBeVisible());
    const t = trigger.getBoundingClientRect();
    const p = panel().getBoundingClientRect();
    // The panel lines up with the trigger's end edge, on the right or on the left.
    await expect(endOffset(panel(), trigger)).toBeCloseTo(0, 2);
    await expect(p.top).toBeCloseTo(t.bottom + 8, 2);
  },
};

export const PickingKeepsPanelOpen: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.click(within(panel()).getByRole('radio', { name: 'Sand' }));
    await userEvent.click(within(panel()).getByRole('radio', { name: 'Teal' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('sand');
    await expect(args.onAccentChange).toHaveBeenCalledWith('teal');
    await expect(panel()).toBeVisible();
  },
};

export const EscapeClosesPanel: Story = {
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
  args: { onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.click(within(panel()).getByRole('radio', { name: 'Montserrat' }));
    await userEvent.click(within(panel()).getByRole('radio', { name: 'Small' }));
    await expect(args.onFontChange).toHaveBeenCalledWith('montserrat');
    await expect(args.onTextSizeChange).toHaveBeenCalledWith('sm');
  },
};

/** With every group, the panel is taller than a short screen: it scrolls instead. */
export const TallPanelFitsTheScreen: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await expect(panel().getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    // The last group can still be reached.
    const large = within(panel()).getByRole('radio', { name: 'Extra large' });
    large.scrollIntoView();
    await userEvent.click(large);
  },
};

/** Reset reports and leaves the panel open: it is the host that puts the defaults back. */
export const ResetCallsOnReset: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onReset: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await userEvent.click(within(panel()).getByRole('button', { name: 'Reset' }));
    await expect(args.onReset).toHaveBeenCalledTimes(1);
    await expect(panel()).toBeVisible();
  },
};

export const NoResetByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    await expect(within(panel()).queryByRole('button', { name: 'Reset' })).toBeNull();
  },
};

/** Scrolled, a group's heading stays at the top of the panel while its group is in view. */
export const HeadingsStayPinnedWhileScrolling: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onReset: fn(), onFontChange: fn(), onTextSizeChange: fn() },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Appearance' }));
    await waitFor(() => expect(panel()).toBeVisible());
    const heading = within(panel()).getByText('Theme');
    // The panel's own scroll area, made short enough to scroll on any screen.
    const scroller = heading.closest<HTMLElement>('.overflow-y-auto')!;
    scroller.style.maxHeight = '260px';
    await waitFor(() => expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight));
    scroller.scrollTop = 60;
    await waitFor(() =>
      expect(heading.getBoundingClientRect().top).toBeCloseTo(
        scroller.getBoundingClientRect().top,
        0
      )
    );
    // Reset is outside the scroll area: it stays below, whatever the scroll.
    await expect(within(panel()).getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(scroller.contains(within(panel()).getByRole('button', { name: 'Reset' }))).toBe(
      false
    );
  },
};
