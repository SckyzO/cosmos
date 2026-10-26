import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import {
  expectFocusRing,
  expectGraphicContrast,
  expectRefFocuses,
  inEachTheme,
} from '../storybook-helpers';
import { Toggle } from './Toggle';

const meta = {
  title: 'Forms/Toggle',
  component: Toggle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { checked: false, onChange: () => {} },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const On: Story = {
  args: { checked: true, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Off: Story = {
  args: { checked: false, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Disabled: Story = {
  args: { checked: true, disabled: true, label: 'Locked feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

/** `sm` is a 36×20 track with a 16px thumb; `md` (default) keeps 44×24 and 20px. */
export const Small: Story = {
  args: { checked: true, size: 'sm', label: 'Weekly digest' },
  render: (args) => (
    <Wrap>
      <div className="space-y-3">
        <Toggle {...args} />
        <Toggle {...args} checked={false} label="Muted" />
        <Toggle {...args} disabled label="Locked" />
        <Toggle {...args} label="Email alerts" description="Sent once a day." />
      </div>
    </Wrap>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <Wrap>
        <Toggle
          checked={on}
          onChange={setOn}
          label="Auto-refresh"
          description="Reload data every 30 seconds."
        />
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Current state: <code>{String(on)}</code>
        </p>
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const SIZES = {
  md: { track: [44, 24], thumb: 20 },
  sm: { track: [36, 20], thumb: 16 },
} as const;

/**
 * The thumb sits 2px from every edge of the track, on and off, in both sizes: measured on the
 * boxes, not read from the classes.
 */
export const ThumbIsCenteredInTheTrack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-3">
        {(['md', 'sm'] as const).flatMap((size) =>
          [true, false].map((on) => (
            <Toggle
              key={`${size}-${on}`}
              size={size}
              checked={on}
              onChange={() => {}}
              label={`${size} ${on ? 'on' : 'off'}`}
            />
          ))
        )}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const size of ['md', 'sm'] as const) {
      for (const on of [true, false]) {
        const track = canvas.getByLabelText(`${size} ${on ? 'on' : 'off'}`);
        const thumb = track.firstElementChild!;
        const t = track.getBoundingClientRect();
        const h = thumb.getBoundingClientRect();
        const { track: dims, thumb: diameter } = SIZES[size];
        await expect([t.width, t.height]).toEqual(dims);
        await expect([h.width, h.height]).toEqual([diameter, diameter]);
        await expect(h.top - t.top).toBeCloseTo(2, 1);
        await expect(t.bottom - h.bottom).toBeCloseTo(2, 1);
        await expect(on ? t.right - h.right : h.left - t.left).toBeCloseTo(2, 1);
        // On travels the whole track: the gap on the other side is the track minus the thumb.
        await expect(on ? h.left - t.left : t.right - h.right).toBeCloseTo(
          dims[0] - diameter - 2,
          1
        );
      }
    }
  },
};

/** `sm` keeps the switch role, and a click on its label toggles it. */
export const SmallKeepsSwitchAndLabelClick: Story = {
  tags: ['!dev', '!autodocs'],
  args: { size: 'sm', checked: false, onChange: fn(), label: 'Weekly digest' },
  play: async ({ args, canvas }) => {
    const sw = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    // The label is part of the same <label>: the clickable area is larger than the track.
    await userEvent.click(canvas.getByText('Weekly digest'));
    await expect(args.onChange).toHaveBeenCalledWith(true);
    await expect(sw.closest('label')).toContainElement(canvas.getByText('Weekly digest'));
    // The pointer target is 24px tall (WCAG 2.5.8) though the track is 20px.
    const box = sw.getBoundingClientRect();
    const x = box.left + box.width / 2;
    await expect(document.elementFromPoint(x, box.top - 1.5)).toBe(sw);
    await expect(document.elementFromPoint(x, box.bottom + 1.5)).toBe(sw);
  },
};

export const ClickFiresOnChangeWithNextValue: Story = {
  tags: ['!dev'],
  args: { checked: false, onChange: fn(), label: 'Notifications' },
  play: async ({ args, canvas }) => {
    const sw = canvas.getByRole('switch');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const DisabledBlocksInteraction: Story = {
  tags: ['!dev'],
  args: { checked: true, disabled: true, onChange: fn(), label: 'Read only' },
  play: async ({ args, canvas }) => {
    const sw = canvas.getByRole('switch');
    await userEvent.click(sw);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/**
 * The label, dimmed with a disabled switch, is `aria-disabled`: its text
 * belongs to an inactive control, which axe then exempts from contrast.
 */
export const AriaDisabledFollowsDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-3">
        <Toggle checked onChange={() => {}} label="Enabled" />
        <Toggle checked disabled onChange={() => {}} label="Disabled" />
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Enabled').closest('label')).not.toHaveAttribute('aria-disabled');
    const dimmed = canvas.getByText('Disabled').closest('label');
    await expect(dimmed).toHaveClass('opacity-50');
    await expect(dimmed).toHaveAttribute('aria-disabled', 'true');
  },
};

// The off track (gray-200 on the page, 1.2:1) was nearly invisible (#151).
export const OffTrackContrastInEveryTheme: Story = {
  ...Off,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const track = canvas.getByRole('switch');
    inEachTheme(() => expectGraphicContrast(track, 'backgroundColor'));
  },
};

const toggleRef = createRef<HTMLButtonElement>();

/** The ref gets the switch `<button>`, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Toggle ref={toggleRef} checked={false} onChange={() => {}} label="Notifications" />
  ),
  play: async ({ canvas }) => {
    await expectRefFocuses(toggleRef, canvas.getByRole('switch', { name: 'Notifications' }));
  },
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

export const DefaultCheckedOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="space-y-3">
      <Toggle label="Uncontrolled" defaultChecked onChange={args.onChange} />
      <Toggle label="Controlled" checked={false} onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('switch', { name: 'Uncontrolled' });
    await expect(own).toBeChecked();
    await userEvent.click(own);
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    await expect(own).not.toBeChecked();

    const held = canvas.getByRole('switch', { name: 'Controlled' });
    await userEvent.click(held);
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(held).not.toBeChecked();
  },
};

export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { checked: true, label: 'Enable feature' },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('switch'));
  },
};

export const FocusShowsRingInLight: Story = {
  tags: ['!dev'],
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};
