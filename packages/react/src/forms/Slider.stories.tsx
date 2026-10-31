import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectFocusRing,
  expectGraphicContrast,
  expectMirrored,
  expectNoHorizontalOverflow,
  inEachTheme,
  keyToEnd,
  keyToStart,
  mobileViewport,
  startOffset,
} from '../storybook-helpers';
import { Slider, type SliderIntent, type SliderValue } from './Slider';

const meta = {
  title: 'Forms/Slider',
  component: Slider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        data-slider-card=""
        className="max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 text-[var(--color-text-base)]"
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

/** One handle: a number in, a number out. */
export const Default: Story = {
  args: { label: 'Volume', defaultValue: 40 },
};

/** A pair draws two handles; `formatValue` writes the header and the end labels. */
export const Range: Story = {
  args: {
    label: 'Price',
    defaultValue: [200, 800],
    min: 0,
    max: 1000,
    step: 10,
    formatValue: dollars,
  },
};

/** `marks` draws a tick at every `step`: here the five positions the value can take. */
export const StepWithMarks: Story = {
  args: {
    label: 'Quality',
    defaultValue: 50,
    step: 25,
    marks: true,
    formatValue: (n) => `${n}%`,
  },
};

const INTENTS: SliderIntent[] = ['brand', 'success', 'warning', 'danger'];

export const Intents: Story = {
  render: () => (
    <div className="space-y-6">
      {INTENTS.map((intent, i) => (
        <Slider key={intent} label={intent} intent={intent} defaultValue={25 + i * 20} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-6">
      <Slider label="Volume" defaultValue={40} disabled />
      <Slider label="Price" defaultValue={[200, 800]} max={1000} formatValue={dollars} disabled />
    </div>
  ),
};

/** Without a visible `label`, `aria-label` names the handles: the header shows the value alone. */
export const WithoutLabel: Story = {
  args: { 'aria-label': 'Brightness', defaultValue: 70 },
};

/** `value` and `onChange` keep the state in the host. */
export const Controlled: Story = {
  render: () => {
    const [price, setPrice] = useState<SliderValue>([200, 800]);
    return (
      <div className="space-y-3">
        <Slider
          label="Price"
          value={price}
          onChange={setPrice}
          max={1000}
          step={10}
          formatValue={dollars}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Current value: <code>{JSON.stringify(price)}</code>
        </p>
      </div>
    );
  },
};

/** At 375px a long label wraps and the value stays on the row: nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: {
    label: 'Monthly budget for the whole infrastructure team, every environment included',
    defaultValue: [2000, 8000],
    max: 10000,
    step: 100,
    formatValue: dollars,
  },
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    expectNoHorizontalOverflow(canvasElement);
    const [min, max] = canvas.getAllByRole('slider');
    for (const handle of [min, max]) {
      const box = handle.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(0);
      await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    }
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const valueOf = (handle: HTMLElement) => Number(handle.getAttribute('aria-valuenow'));

// The Radix root a handle sits in (handle, its positioning span, root), and the slider's own box.
const rootOf = (handle: HTMLElement) => handle.parentElement!.parentElement!;
const boxOf = (handle: HTMLElement) => rootOf(handle).parentElement!;

const calls = (onChange: unknown) => (onChange as ReturnType<typeof fn>).mock.calls;

/** The arrows move the value by `step`, Page Up and Page Down by ten of them, Home and End to the ends. */
export const KeyboardMovesTheValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Volume', defaultValue: 50, step: 5, onChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.tab();
    const handle = canvas.getByRole('slider', { name: 'Volume' });
    await expect(handle).toHaveFocus();

    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(valueOf(handle)).toBe(55);
    await userEvent.keyboard('{ArrowUp}');
    await expect(valueOf(handle)).toBe(60);
    await userEvent.keyboard(`{${keyToStart()}}{ArrowDown}{ArrowDown}`);
    await expect(valueOf(handle)).toBe(45);

    await userEvent.keyboard('{Home}');
    await expect(valueOf(handle)).toBe(0);
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(valueOf(handle), 'it stops at min').toBe(0);
    await userEvent.keyboard('{PageUp}');
    await expect(valueOf(handle)).toBe(50);
    await userEvent.keyboard('{PageDown}');
    await expect(valueOf(handle)).toBe(0);
    await userEvent.keyboard('{End}');
    await expect(valueOf(handle)).toBe(100);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(valueOf(handle), 'it stops at max').toBe(100);

    // Every move reported a number, and a move that changed nothing reported nothing.
    await expect(args.onChange).toHaveBeenCalledTimes(9);
    await expect(args.onChange).toHaveBeenLastCalledWith(100);
    for (const [value] of calls(args.onChange)) {
      await expect(typeof value).toBe('number');
    }
  },
};

/** The two handles of a range stop at each other: they can meet, never swap places. */
export const RangeHandlesCannotCross: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Price', defaultValue: [40, 60], step: 10, onChange: fn() },
  play: async ({ args, canvas }) => {
    const lower = canvas.getByRole('slider', { name: 'Price minimum' });
    const upper = canvas.getByRole('slider', { name: 'Price maximum' });

    await userEvent.tab();
    await expect(lower).toHaveFocus();
    await userEvent.keyboard(`{${keyToEnd()}}{${keyToEnd()}}{${keyToEnd()}}{${keyToEnd()}}`);
    await expect([valueOf(lower), valueOf(upper)]).toEqual([60, 60]);
    // The focus stayed on the handle that was moved, and the pair is still ordered.
    await expect(lower).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith([60, 60]);

    await userEvent.tab();
    await expect(upper).toHaveFocus();
    await userEvent.keyboard(`{${keyToStart()}}{${keyToStart()}}`);
    await expect([valueOf(lower), valueOf(upper)], 'the upper handle stops at the lower').toEqual([
      60, 60,
    ]);
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect([valueOf(lower), valueOf(upper)]).toEqual([60, 70]);
    await expect(upper).toHaveFocus();

    for (const [pair] of calls(args.onChange)) {
      const [a, b] = pair as [number, number];
      await expect(a).toBeLessThanOrEqual(b);
    }
  },
};

/** A single value reports a number, a range reports `[minimum, maximum]`, whatever the handle moved. */
export const OnChangeReceivesANumberOrAPair: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="space-y-6">
      <Slider label="Single" defaultValue={10} onChange={args.onChange} />
      <Slider label="Range" defaultValue={[20, 80]} onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    canvas.getByRole('slider', { name: 'Single' }).focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(11);

    canvas.getByRole('slider', { name: 'Range maximum' }).focus();
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith([20, 79]);
    canvas.getByRole('slider', { name: 'Range minimum' }).focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith([21, 79]);
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

/**
 * Only `undefined` means uncontrolled. The uncontrolled sliders start from their default and move
 * on their own; the controlled ones, held at a fixed value, report the change and keep showing the
 * value they are given.
 */
export const DefaultValueOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  render: (args) => (
    <div className="space-y-6">
      <Slider label="Uncontrolled" defaultValue={30} onChange={args.onChange} />
      <Slider label="Held" value={30} onChange={args.onChange} />
      <Slider label="Uncontrolled range" defaultValue={[10, 20]} onChange={args.onChange} />
      <Slider label="Held range" value={[10, 20]} onChange={args.onChange} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = canvas.getByRole('slider', { name: 'Uncontrolled' });
    own.focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(31);
    await expect(valueOf(own)).toBe(31);

    const held = canvas.getByRole('slider', { name: 'Held' });
    held.focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith(31);
    await expect(valueOf(held)).toBe(30);

    const ownMax = canvas.getByRole('slider', { name: 'Uncontrolled range maximum' });
    ownMax.focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith([10, 21]);
    await expect(valueOf(ownMax)).toBe(21);

    const heldMax = canvas.getByRole('slider', { name: 'Held range maximum' });
    heldMax.focus();
    await userEvent.keyboard(`{${keyToEnd()}}`);
    await expect(args.onChange).toHaveBeenLastCalledWith([10, 21]);
    await expect(valueOf(heldMax)).toBe(20);
  },
};

/** A controlled slider shows the value the host passes back, in the handle and in the header. */
export const ControlledFollowsTheHost: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [price, setPrice] = useState<SliderValue>([200, 800]);
    return (
      <Slider
        label="Price"
        value={price}
        onChange={setPrice}
        max={1000}
        step={100}
        formatValue={dollars}
      />
    );
  },
  play: async ({ canvas }) => {
    const upper = canvas.getByRole('slider', { name: 'Price maximum' });
    upper.focus();
    await userEvent.keyboard(`{${keyToStart()}}`);
    await expect(valueOf(upper)).toBe(700);
    await expect(canvas.getByText('$200 – $700')).toBeInTheDocument();
  },
};

/** Every handle has an accessible name: the label, with "minimum" and "maximum" for a range. */
export const HandlesAreNamed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      <Slider label="Volume" defaultValue={40} />
      <Slider label="Price" defaultValue={[200, 800]} />
      <Slider aria-label="Brightness" defaultValue={70} />
      <Slider aria-label="Budget" defaultValue={[10, 90]} />
      <Slider label="Visible" aria-label="Named by aria-label" defaultValue={50} />
    </div>
  ),
  play: async ({ canvas }) => {
    const names = canvas.getAllByRole('slider').map((handle) => handle.getAttribute('aria-label'));
    await expect(names).toEqual([
      'Volume',
      'Price minimum',
      'Price maximum',
      'Brightness',
      'Budget minimum',
      'Budget maximum',
      'Named by aria-label',
    ]);
  },
};

/**
 * `formatValue` writes the header (a range reads `$200 – $800`), both end labels and the value a
 * screen reader announces; a slider without it shows the numbers as they are.
 */
export const FormatValueWritesEveryNumber: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      <Slider label="Price" defaultValue={[200, 800]} max={1000} formatValue={dollars} />
      <Slider label="Plain" defaultValue={[20, 80]} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$200 – $800')).toBeInTheDocument();
    await expect(canvas.getByText('$0')).toBeInTheDocument();
    await expect(canvas.getByText('$1,000')).toBeInTheDocument();
    const lower = canvas.getByRole('slider', { name: 'Price minimum' });
    await expect(lower).toHaveAttribute('aria-valuenow', '200');
    await expect(lower).toHaveAttribute('aria-valuetext', '$200');

    await expect(canvas.getByText('20 – 80')).toBeInTheDocument();
    await expect(canvas.getByRole('slider', { name: 'Plain minimum' })).not.toHaveAttribute(
      'aria-valuetext'
    );
  },
};

/** `marks` draws one tick per step, under the handle's position for that step. */
export const MarksAlignWithTheHandle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      <Slider label="At min" value={0} step={25} marks onChange={() => {}} />
      <Slider label="At middle" value={50} step={25} marks onChange={() => {}} />
      <Slider label="At max" value={100} step={25} marks onChange={() => {}} />
      <Slider label="No marks" value={50} step={25} onChange={() => {}} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const ticks = (handle: HTMLElement) =>
      [...boxOf(handle).querySelectorAll('[data-slider-tick]')] as HTMLElement[];
    const centerX = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.left + box.width / 2;
    };

    await expect(ticks(canvas.getByRole('slider', { name: 'No marks' }))).toHaveLength(0);
    for (const [name, at] of [
      ['At min', 0],
      ['At middle', 2],
      ['At max', 4],
    ] as const) {
      const handle = canvas.getByRole('slider', { name });
      const row = ticks(handle);
      await expect(row).toHaveLength(5);
      // Radix measures the handle after mount, then moves it inside the track.
      await waitFor(() => expect(centerX(row[at])).toBeCloseTo(centerX(handle), 0));
      // The row is evenly spaced.
      const gaps = row.slice(1).map((tick, i) => centerX(tick) - centerX(row[i]));
      for (const gap of gaps) await expect(gap).toBeCloseTo(gaps[0], 0);
    }
    expectNoHorizontalOverflow(canvasElement);
  },
};

/** The sizes of the look: an 8px track, a 20px handle with a 2px border, kept inside the track. */
export const LookGeometry: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-6">
      <Slider label="At min" value={0} onChange={() => {}} />
      <Slider label="At max" value={100} onChange={() => {}} />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [name, offset] of [
      ['At min', startOffset],
      ['At max', endOffset],
    ] as const) {
      const handle = canvas.getByRole('slider', { name });
      const root = rootOf(handle);
      const track = root.firstElementChild as HTMLElement;
      const box = handle.getBoundingClientRect();
      await expect([box.width, box.height]).toEqual([20, 20]);
      await expect(getComputedStyle(handle).borderTopWidth).toBe('2px');
      await expect(track.getBoundingClientRect().height).toBe(8);
      await expect(getComputedStyle(track).borderRadius).not.toBe('0px');
      // The handle sits against the end of the track, not half out of it: the start edge at the
      // minimum, the end edge at the maximum, whichever side of the page those are on.
      await waitFor(() => expect(offset(handle, root)).toBeCloseTo(0, 0));
    }
  },
};

// The colour the browser resolves a CSS value to: what a class and a token compare as.
const resolved = (value: string) => {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
};

// WCAG 1.4.11 for a colour with no element of its own (a border): a probe filled with it, laid on
// the card the slider sits on.
const expectColorContrast = (card: Element, color: string, what: string, min = 3) => {
  const probe = document.createElement('span');
  probe.style.backgroundColor = color;
  card.append(probe);
  try {
    expectGraphicContrast(probe, 'backgroundColor', min);
  } catch (error) {
    throw new Error(`${what} (${color}): ${(error as Error).message}`, { cause: error });
  } finally {
    probe.remove();
  }
};

const PALETTE: Record<SliderIntent, string> = {
  brand: 'brand',
  success: 'green',
  warning: 'amber',
  danger: 'red',
};

/**
 * `brand` is `brand-500` everywhere. The others are the `-600` of their colour in the light themes
 * and the `-500` in the dark ones, and the fill and the handle's border read 3:1 on the card.
 */
export const IntentColorsInEveryTheme: Story = {
  ...Intents,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const card = canvasElement.querySelector('[data-slider-card]')!;
    inEachTheme(() => {
      const dark = ['dark', 'deep-blue'].some((theme) =>
        document.documentElement.classList.contains(theme)
      );
      for (const intent of INTENTS) {
        const handle = canvas.getByRole('slider', { name: intent });
        const fill = rootOf(handle).firstElementChild!.firstElementChild!;
        const shade = intent === 'brand' ? 500 : dark ? 500 : 600;
        const expected = resolved(`var(--color-${PALETTE[intent]}-${shade})`);
        expect(getComputedStyle(fill).backgroundColor, `${intent} fill`).toBe(expected);
        expect(getComputedStyle(handle).borderTopColor, `${intent} handle`).toBe(expected);
        expect(getComputedStyle(handle).backgroundColor, 'the handle is white').toBe(
          resolved('var(--color-white)')
        );
        expectColorContrast(card, expected, intent);
      }
    });
  },
};

/** The header shows the label at the start and the value at the end, against the track's ends. */
export const HeaderLabelStartValueEnd: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Price', defaultValue: [200, 800], max: 1000, formatValue: dollars },
  play: async ({ canvas }) => {
    const label = canvas.getByText('Price');
    const value = canvas.getByText('$200 – $800');
    const handle = canvas.getByRole('slider', { name: 'Price minimum' });
    const root = rootOf(handle);
    await expect(startOffset(label, root)).toBeCloseTo(0, 0);
    await expect(endOffset(value, root)).toBeCloseTo(0, 0);
    // The end labels sit under the track, at its two ends.
    const ends = [canvas.getByText('$0'), canvas.getByText('$1,000')];
    for (const end of ends) {
      await expect(end.getBoundingClientRect().top).toBeGreaterThan(
        root.getBoundingClientRect().bottom - 1
      );
    }
    await expect(startOffset(ends[0], root)).toBeCloseTo(0, 0);
    await expect(endOffset(ends[1], root)).toBeCloseTo(0, 0);
  },
};

/** A disabled slider is dimmed, out of the tab order and moves with neither key nor pointer. */
export const DisabledBlocksInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Volume', defaultValue: 40, disabled: true, onChange: fn() },
  play: async ({ args, canvas }) => {
    const handle = canvas.getByRole('slider', { name: 'Volume' });
    await userEvent.tab();
    await expect(handle).not.toHaveFocus();
    handle.focus();
    await userEvent.keyboard(`{${keyToEnd()}}{End}`);
    await userEvent.click(handle);
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(valueOf(handle)).toBe(40);
    await expect(handle).toHaveAttribute('data-disabled');
    const wrapper = boxOf(handle);
    await expect(wrapper).toHaveClass('opacity-50');
    await expect(wrapper).toHaveAttribute('aria-disabled', 'true');
  },
};

/** The handle shows the shared focus indicator when it is reached with the keyboard. */
export const FocusShowsRingInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { label: 'Volume', defaultValue: 40 },
  play: async ({ canvas }) => {
    await expectFocusRing(canvas.getByRole('slider', { name: 'Volume' }));
  },
};

export const FocusShowsRingInLight: Story = {
  ...FocusShowsRingInDark,
  globals: { theme: 'light' },
};

// ── Right to left ───────────────────────────────────────────────────────────

/**
 * The minimum is at the start: on the right in right to left. The filled part grows from there,
 * the handle sits at the same distance from the start edge, ArrowLeft raises the value, and a
 * press on the track picks the value at that place.
 */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Slider label="Volume" defaultValue={25} step={25} marks onChange={() => {}} />
    )),
  play: async ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => within(box).getByRole('slider'));
    expectMirrored(canvasElement, (box) => box.querySelector('[data-slider-tick]:nth-child(3)'));
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const handle = within(box).getByRole('slider');
      const track = rootOf(handle).firstElementChild as HTMLElement;
      const fill = track.firstElementChild as HTMLElement;
      await expect(startOffset(fill, track), `${dir}: the fill starts at the start`).toBeCloseTo(
        0,
        0
      );
      await expect(fill.getBoundingClientRect().width).toBeCloseTo(
        track.getBoundingClientRect().width * 0.25,
        0
      );
      handle.focus();
      await userEvent.keyboard(`{${keyToEnd(box)}}`);
      await expect(valueOf(handle)).toBe(50);
      await userEvent.keyboard(`{${keyToStart(box)}}{${keyToStart(box)}}`);
      await expect(valueOf(handle)).toBe(0);

      // A press 75% along the track, counted from its start edge.
      const rect = track.getBoundingClientRect();
      const x = dir === 'rtl' ? rect.right - rect.width * 0.75 : rect.left + rect.width * 0.75;
      const y = rect.top + rect.height / 2;
      await userEvent.pointer([
        { target: track, coords: { clientX: x, clientY: y } },
        { keys: '[MouseLeft]', target: track, coords: { clientX: x, clientY: y } },
      ]);
      await waitFor(() => expect(valueOf(handle)).toBe(75));
    }
  },
};
