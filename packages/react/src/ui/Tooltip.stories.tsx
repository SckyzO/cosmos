import type { Meta, StoryObj } from '@storybook/react-vite';
import { Save, Search, Undo2 } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Tooltip, TooltipHelp } from './Tooltip';
import { SectionCard } from '../templates/SectionCard';
import { Button } from './Button';

const meta = {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { content: 'Tooltip content', children: null },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-12 text-[var(--color-text-base)]">{children}</div>
);

export const Positions: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Positions — hover the buttons">
        <div className="flex flex-wrap items-center gap-12">
          {(['top', 'bottom', 'left', 'right'] as const).map((position) => (
            <Tooltip key={position} content={`Position: ${position}`} position={position}>
              <Button variant="secondary" size="sm">
                {position}
              </Button>
            </Tooltip>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Variants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants">
        <div className="flex flex-wrap items-center gap-6">
          <Tooltip content="Dark variant (default)" variant="dark">
            <Button variant="secondary" size="sm">
              Dark
            </Button>
          </Tooltip>
          <Tooltip content="White variant" variant="white">
            <Button variant="secondary" size="sm">
              White
            </Button>
          </Tooltip>
          <Tooltip content="Brand accent" variant="brand">
            <Button variant="secondary" size="sm">
              Brand
            </Button>
          </Tooltip>
        </div>
      </SectionCard>
      <div className="mt-4">
        <SectionCard title="Status — explain a state">
          <div className="flex flex-wrap items-center gap-6">
            <Tooltip content="All 12 checks passing" variant="success">
              <Button variant="secondary" size="sm">
                Success
              </Button>
            </Tooltip>
            <Tooltip content="Disk 92% full" variant="warning">
              <Button variant="secondary" size="sm">
                Warning
              </Button>
            </Tooltip>
            <Tooltip content="Node unreachable since 14:02" variant="danger">
              <Button variant="secondary" size="sm">
                Danger
              </Button>
            </Tooltip>
          </div>
        </SectionCard>
      </div>
      <div className="mt-4">
        <SectionCard title="TooltipHelp shortcut">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hover the help icon</span>
            <TooltipHelp text="TooltipHelp uses the HelpCircle icon as trigger." />
          </div>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

// ── Keyboard access ──────────────────────────────────────────────────────────

/** Focus shows the tooltip, Escape hides it, and it describes its trigger. */
export const KeyboardFocusShowsTooltip: Story = {
  render: () => (
    <Wrap>
      <Tooltip content="Deletes the selected rows">
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </Tooltip>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Delete' });
    const tip = canvas.getByRole('tooltip');
    await expect(tip).not.toBeVisible();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
    await expect(trigger).toHaveAccessibleDescription('Deletes the selected rows');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

/** Escape also closes a tooltip opened by the pointer, wherever focus is. */
export const EscapeClosesHoveredTooltip: Story = {
  render: () => (
    <Wrap>
      <Tooltip content="Deletes the selected rows">
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </Tooltip>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const tip = canvas.getByRole('tooltip');
    await userEvent.hover(canvas.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tip).not.toBeVisible());
  },
};

/** The help icon is a button, so keyboard users can open its tooltip too. */
export const HelpIconOpensOnFocus: Story = {
  render: () => (
    <Wrap>
      <TooltipHelp text="Share of failed requests allowed this month." />
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    const help = canvas.getByRole('button', { name: 'Help' });
    await expect(help).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
    await expect(help).toHaveAccessibleDescription('Share of failed requests allowed this month.');
  },
};

// ── Content ──────────────────────────────────────────────────────────────────

/** `shortcut` lists keys after the label: the usual toolbar tooltip. */
export const WithShortcut: Story = {
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2">
        <Tooltip content="Save" shortcut={['⌘', 'S']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Save} aria-label="Save" />
        </Tooltip>
        <Tooltip content="Undo" shortcut={['⌘', 'Z']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Undo2} aria-label="Undo" />
        </Tooltip>
        <Tooltip content="Search" shortcut={['⌘', 'K']}>
          <Button variant="secondary" size="sm" shape="circle" icon={Search} aria-label="Search" />
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    await userEvent.hover(save);
    const tip = canvas.getAllByRole('tooltip')[0];
    await waitFor(() => expect(tip).toBeVisible());
    const keys = [...tip.querySelectorAll('kbd')].map((k) => k.textContent);
    await expect(keys).toEqual(['⌘', 'S']);
  },
};

/** `title` adds a bold first line; the content reads as its explanation. */
export const WithTitle: Story = {
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2 text-sm">
        Error budget
        <Tooltip
          title="Error budget"
          content="Share of failed requests allowed this month before on-call is paged."
          position="right"
        >
          <Button variant="ghost" size="xs">
            What is this?
          </Button>
        </Tooltip>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    const tip = within(canvas.getByRole('tooltip'));
    await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
    await expect(tip.getByText('Error budget')).toHaveClass('font-semibold');
  },
};

// ── Timing ───────────────────────────────────────────────────────────────────

/**
 * `delay` waits before showing, so crossing a toolbar doesn't flash every
 * tooltip; leaving or Escape cancels it. `arrow={false}` drops the pointer.
 */
export const DelayedWithoutArrow: Story = {
  render: () => (
    <Wrap>
      <Tooltip content="Refresh the data" delay={300} arrow={false}>
        <Button variant="secondary" size="sm">
          Refresh
        </Button>
      </Tooltip>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Refresh' });
    const tip = canvas.getByRole('tooltip');
    await expect(tip.querySelector('[aria-hidden]')).toBeNull();

    // Shows only after the delay.
    await userEvent.hover(trigger);
    await expect(tip).not.toBeVisible();
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.unhover(trigger);
    await waitFor(() => expect(tip).not.toBeVisible());

    // Escape during the delay cancels the pending show.
    await userEvent.hover(trigger);
    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 450));
    await expect(tip).not.toBeVisible();
  },
};
