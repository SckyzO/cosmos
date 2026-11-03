import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectGraphicContrast,
  expectMirrored,
  expectRefFocuses,
  inEachTheme,
  startEdge,
  startOffset,
} from '../storybook-helpers';
import { Button } from '../ui/Button';
import { Toggle, type ToggleIntent } from './Toggle';

const meta = {
  title: 'Forms/Toggle',
  component: Toggle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { onChange: () => {} },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const On: Story = {
  args: { defaultChecked: true, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Off: Story = {
  args: { defaultChecked: false, label: 'Enable feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

export const Disabled: Story = {
  args: { defaultChecked: true, disabled: true, label: 'Locked feature' },
  render: (args) => (
    <Wrap>
      <Toggle {...args} />
    </Wrap>
  ),
};

/** `sm` is a 36×20 track with a 16px thumb; `md` (default) keeps 44×24 and 20px. */
export const Small: Story = {
  args: { defaultChecked: true, size: 'sm', label: 'Weekly digest' },
  render: (args) => (
    <Wrap>
      <div className="space-y-3">
        <Toggle {...args} />
        <Toggle {...args} defaultChecked={false} label="Muted" />
        <Toggle {...args} disabled label="Locked" />
        <Toggle {...args} label="Email alerts" description="Sent once a day." />
      </div>
    </Wrap>
  ),
};

/** `lg` is a 52×28 track with a 24px thumb, for a settings page. */
export const Large: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-3">
        <Toggle
          size="lg"
          defaultChecked
          label="Two-factor authentication"
          description="Ask for a code at every sign-in."
        />
        <Toggle size="lg" label="Weekly digest" />
        <Toggle size="lg" disabled label="Locked" />
      </div>
    </Wrap>
  ),
};

const INTENTS: ToggleIntent[] = ['brand', 'success', 'warning', 'danger'];

/**
 * `intent` colours the track while it is on: the accent (default), or a meaning. The track is gray
 * while it is off, whatever the intent.
 */
export const Intents: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-3">
        {INTENTS.map((intent) => (
          <Toggle
            key={intent}
            intent={intent}
            defaultChecked
            label={intent.charAt(0).toUpperCase() + intent.slice(1)}
          />
        ))}
        <Toggle intent="danger" label="Off, whatever the intent" />
      </div>
    </Wrap>
  ),
};

const SETTINGS = [
  { label: 'Email alerts', description: 'One message when a host goes down.', on: true },
  { label: 'Weekly digest', description: 'A summary every Monday morning.', on: false },
  { label: 'Auto-refresh', description: 'Reload the dashboard every 30 seconds.', on: true },
];

/**
 * `labelPosition="start"` puts the label before the switch, which rests on the end edge of the
 * row: a settings list. The order follows the reading direction.
 */
export const LabelOnTheStart: Story = {
  render: () => (
    <Wrap>
      <ul className="max-w-md divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] px-4">
        {SETTINGS.map(({ label, description, on }) => (
          <li key={label} className="py-3">
            <Toggle
              labelPosition="start"
              defaultChecked={on}
              label={label}
              description={description}
            />
          </li>
        ))}
      </ul>
    </Wrap>
  ),
};

const InAFormDemo = () => {
  const [posted, setPosted] = useState('(nothing yet)');
  return (
    <Wrap>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = [...new FormData(event.currentTarget)].map(
            ([name, v]) => `${name}=${String(v)}`
          );
          setPosted(fields.join(', '));
        }}
      >
        <Toggle name="alerts" defaultChecked label="Email alerts" />
        <Toggle name="digest" value="weekly" label="Weekly digest" />
        <Button type="submit" size="sm">
          Save
        </Button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Posted: <code>{posted}</code>
        </p>
      </form>
    </Wrap>
  );
};

/**
 * With a `name`, a native form posts the switch like a checkbox: `value` (`on` by default) while
 * it is on, nothing while it is off.
 */
export const InAForm: Story = { render: () => <InAFormDemo /> };

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
  lg: { track: [52, 28], thumb: 24 },
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
        {(['md', 'sm', 'lg'] as const).flatMap((size) =>
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
    for (const size of ['md', 'sm', 'lg'] as const) {
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
        await expect(on ? endOffset(thumb, track) : startOffset(thumb, track)).toBeCloseTo(2, 1);
        // On travels the whole track: the gap on the other side is the track minus the thumb.
        await expect(on ? startOffset(thumb, track) : endOffset(thumb, track)).toBeCloseTo(
          dims[0] - diameter - 2,
          1
        );
      }
    }
  },
};

/**
 * The lit track takes the colour of its `intent` (the accent by default), 3:1 or more against the
 * page in every theme (WCAG 1.4.11), and the unlit one is the same gray whatever the intent.
 */
export const IntentColoursTheLitTrack: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="space-y-3">
        {INTENTS.map((intent) => (
          <Toggle key={intent} intent={intent} defaultChecked label={`${intent} on`} />
        ))}
        <Toggle defaultChecked label="default on" />
        <Toggle label="plain off" />
        <Toggle intent="danger" label="danger off" />
      </div>
    </Wrap>
  ),
  play: ({ canvas }) => {
    const track = (name: string) => canvas.getByRole('switch', { name });
    const lit = INTENTS.map((intent) => track(`${intent} on`));
    inEachTheme(() => {
      for (const switchTrack of lit) expectGraphicContrast(switchTrack, 'backgroundColor');
      const colour = (el: Element) => getComputedStyle(el).backgroundColor;
      expect(new Set(lit.map(colour)).size, 'one colour per intent').toBe(INTENTS.length);
      expect(colour(track('default on')), 'the accent is the default').toBe(
        colour(track('brand on'))
      );
      expect(colour(track('danger off')), 'gray whatever the intent').toBe(
        colour(track('plain off'))
      );
    });
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

/**
 * `labelPosition="start"`: the label comes before the switch, which rests on the end edge of the
 * row; by default the switch comes first, on the start edge. Both mirror in right to left.
 */
export const LabelPositionPlacesTheSwitch: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Wrap>
        <div className="w-80 space-y-3">
          <Toggle
            labelPosition="start"
            label="Label first"
            description="The switch is on the end."
          />
          <Toggle label="Switch first" />
        </div>
      </Wrap>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const find = (name: string) => {
        const sw = within(box).getByRole('switch', { name: new RegExp(name) });
        return { sw, row: sw.closest('label')!, text: within(box).getByText(name) };
      };
      const first = find('Label first');
      expect(
        startEdge(first.text.getBoundingClientRect(), box),
        `${dir}: label before switch`
      ).toBeLessThan(startEdge(first.sw.getBoundingClientRect(), box));
      expect(endOffset(first.sw, first.row), `${dir}: switch on the end edge`).toBeCloseTo(0, 1);
      const second = find('Switch first');
      expect(startOffset(second.sw, second.row), `${dir}: switch on the start edge`).toBeCloseTo(
        0,
        1
      );
      expect(startEdge(second.sw.getBoundingClientRect(), box)).toBeLessThan(
        startEdge(second.text.getBoundingClientRect(), box)
      );
    }
    expectMirrored(canvasElement, (box) =>
      within(box).getByRole('switch', { name: /Label first/ })
    );
  },
};

/**
 * With a `name`, a form posts the switch as a checkbox is: `value` while on (`on` by default),
 * nothing while off or disabled. A switch without a `name` posts nothing.
 */
export const NameAndValueReachANativeForm: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <form className="space-y-3">
        <Toggle name="alerts" defaultChecked label="Alerts" />
        <Toggle name="plan" value="pro" defaultChecked label="Plan" />
        <Toggle name="digest" label="Digest" />
        <Toggle name="locked" defaultChecked disabled label="Locked" />
        <Toggle defaultChecked label="Nameless" />
      </form>
    </Wrap>
  ),
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const posted = () => [...new FormData(form)].map(([name, value]) => `${name}=${String(value)}`);
    await expect(posted()).toEqual(['alerts=on', 'plan=pro']);
    await userEvent.click(canvas.getByRole('switch', { name: 'Digest' }));
    await expect(posted()).toEqual(['alerts=on', 'plan=pro', 'digest=on']);
    await userEvent.click(canvas.getByRole('switch', { name: 'Alerts' }));
    await expect(posted()).toEqual(['plan=pro', 'digest=on']);
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
  ...FocusShowsRingInDark,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The thumb starts at the start edge and travels to the end one, then the label follows. */
export const ThumbTravelsFromTheStartInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <div className="space-y-3">
        <Toggle checked={false} onChange={() => {}} label="Off" />
        <Toggle checked onChange={() => {}} label="On" />
      </div>
    )),
  play: ({ canvasElement }) => {
    for (const name of ['Off', 'On']) {
      expectMirrored(
        canvasElement,
        (box) => within(box).getByRole('switch', { name }).firstElementChild,
        1
      );
    }
    expectMirrored(canvasElement, (box) => within(box).getByText('Off'));
  },
};
