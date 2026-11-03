import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Cog, Mail, Rocket, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/Button';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectTextContrast,
} from '../storybook-helpers';
import { finishAnimations, SlowFolds } from '../storybook-folds';
import { isSliding, tokenMs, transitionDelayMs, transitionMs } from '../storybook-motion';
import { Stepper, type StepperProps } from './Stepper';

const meta = {
  title: 'Navigation/Stepper',
  component: Stepper,
  subcomponents: { 'Stepper.Step': Stepper.Step },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { current: 0, children: null },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <Stepper current={1}>
      <Stepper.Step icon={Box}>Provision</Stepper.Step>
      <Stepper.Step icon={Cog}>Configure</Stepper.Step>
      <Stepper.Step icon={Rocket}>Deploy</Stepper.Step>
      <Stepper.Step icon={ShieldCheck}>Verified</Stepper.Step>
    </Stepper>
  ),
};

export const HorizontalSm: Story = {
  render: () => (
    <Stepper current={2} size="sm">
      <Stepper.Step>Account</Stepper.Step>
      <Stepper.Step>Profile</Stepper.Step>
      <Stepper.Step>Plan</Stepper.Step>
      <Stepper.Step>Done</Stepper.Step>
    </Stepper>
  ),
};

export const NumbersOnly: Story = {
  render: () => (
    <Stepper current={1}>
      <Stepper.Step>Order placed</Stepper.Step>
      <Stepper.Step>Processing</Stepper.Step>
      <Stepper.Step>Shipped</Stepper.Step>
      <Stepper.Step>Delivered</Stepper.Step>
    </Stepper>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <Stepper current={1}>
      <Stepper.Step icon={User} description="Tell us who you are">
        Profile
      </Stepper.Step>
      <Stepper.Step icon={Mail} description="Verify your email">
        Verify
      </Stepper.Step>
      <Stepper.Step icon={Cog} description="Pick your settings">
        Configure
      </Stepper.Step>
      <Stepper.Step icon={Rocket} description="Launch your project">
        Launch
      </Stepper.Step>
    </Stepper>
  ),
};

export const FirstStep: Story = {
  render: () => (
    <Stepper current={0}>
      <Stepper.Step icon={Box}>Provision</Stepper.Step>
      <Stepper.Step icon={Cog}>Configure</Stepper.Step>
      <Stepper.Step icon={Rocket}>Deploy</Stepper.Step>
      <Stepper.Step icon={ShieldCheck}>Verified</Stepper.Step>
    </Stepper>
  ),
};

export const AllDone: Story = {
  render: () => (
    <Stepper current={4}>
      <Stepper.Step icon={Box}>Provision</Stepper.Step>
      <Stepper.Step icon={Cog}>Configure</Stepper.Step>
      <Stepper.Step icon={Rocket}>Deploy</Stepper.Step>
      <Stepper.Step icon={ShieldCheck}>Verified</Stepper.Step>
    </Stepper>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="max-w-sm">
      <Stepper current={1} orientation="vertical">
        <Stepper.Step icon={User} description="Set your display name and avatar">
          Profile
        </Stepper.Step>
        <Stepper.Step icon={Mail} description="Confirm via the link we sent">
          Verify email
        </Stepper.Step>
        <Stepper.Step icon={Cog} description="Pick monitoring rules">
          Configure
        </Stepper.Step>
        <Stepper.Step icon={Rocket} description="Push to production">
          Launch
        </Stepper.Step>
      </Stepper>
    </div>
  ),
};

export const VerticalSm: Story = {
  render: () => (
    <div className="max-w-sm">
      <Stepper current={2} orientation="vertical" size="sm">
        <Stepper.Step>Account created</Stepper.Step>
        <Stepper.Step>Email verified</Stepper.Step>
        <Stepper.Step>Setting up your workspace…</Stepper.Step>
        <Stepper.Step>Ready</Stepper.Step>
      </Stepper>
    </div>
  ),
};

export const Clickable: Story = {
  render: () => {
    const [step, setStep] = useState(2);
    return (
      <div className="space-y-6">
        <Stepper current={step} clickable onStepClick={setStep}>
          <Stepper.Step icon={Box}>Provision</Stepper.Step>
          <Stepper.Step icon={Cog}>Configure</Stepper.Step>
          <Stepper.Step icon={Rocket}>Deploy</Stepper.Step>
          <Stepper.Step icon={ShieldCheck}>Verified</Stepper.Step>
        </Stepper>
        <p className="text-xs text-[var(--color-text-muted)]">
          Click any step to jump to it. Current: <code>{step}</code>.
        </p>
      </div>
    );
  },
};

export const InteractiveWizard: Story = {
  render: () => {
    const [step, setStep] = useState(0);
    const total = 4;
    return (
      <div className="max-w-2xl space-y-6">
        <Stepper current={step}>
          <Stepper.Step icon={User}>Account</Stepper.Step>
          <Stepper.Step icon={Cog}>Settings</Stepper.Step>
          <Stepper.Step icon={Mail}>Notifications</Stepper.Step>
          <Stepper.Step icon={Rocket}>Done</Stepper.Step>
        </Stepper>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Step <strong>{step + 1}</strong> of <strong>{total}</strong> — content for this step
            would be rendered here.
          </p>
        </div>
        <div className="flex justify-between">
          <Button
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button disabled={step >= total} onClick={() => setStep((s) => Math.min(total, s + 1))}>
            {step >= total - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ActiveStepHasAriaCurrent: Story = {
  tags: ['!dev'],
  render: () => (
    <Stepper current={1}>
      <Stepper.Step>One</Stepper.Step>
      <Stepper.Step>Two</Stepper.Step>
      <Stepper.Step>Three</Stepper.Step>
    </Stepper>
  ),
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem');
    await expect(items[1].querySelector('[aria-current="step"]')).not.toBeNull();
    await expect(items[0].querySelector('[aria-current="step"]')).toBeNull();
    await expect(items[2].querySelector('[aria-current="step"]')).toBeNull();
  },
};

export const ClickableStepFiresHandler: Story = {
  tags: ['!dev'],
  render: (args) => (
    <Stepper current={2} clickable onStepClick={args.onStepClick as (i: number) => void}>
      <Stepper.Step>Alpha</Stepper.Step>
      <Stepper.Step>Beta</Stepper.Step>
      <Stepper.Step>Gamma</Stepper.Step>
    </Stepper>
  ),
  args: { onStepClick: fn() } as never,
  play: async ({ args, canvas }) => {
    const buttons = canvas.getAllByRole('button');
    await userEvent.click(buttons[0]);
    await expect(
      (args as unknown as { onStepClick: ReturnType<typeof fn> }).onStepClick
    ).toHaveBeenCalledWith(0);
  },
};

export const NotClickableHasNoButtons: Story = {
  tags: ['!dev'],
  render: () => (
    <Stepper current={1}>
      <Stepper.Step>One</Stepper.Step>
      <Stepper.Step>Two</Stepper.Step>
    </Stepper>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('button').length).toBe(0);
  },
};

export const DisabledStepIsNotClickable: Story = {
  tags: ['!dev'],
  render: (args) => (
    <Stepper current={2} clickable onStepClick={args.onStepClick as (i: number) => void}>
      <Stepper.Step>Alpha</Stepper.Step>
      <Stepper.Step disabled>Beta</Stepper.Step>
      <Stepper.Step>Gamma</Stepper.Step>
    </Stepper>
  ),
  args: { onStepClick: fn() } as never,
  play: async ({ args, canvas }) => {
    const buttons = canvas.getAllByRole('button');
    // Beta (index 1) should be disabled
    await expect(buttons[1]).toBeDisabled();
    await userEvent.click(buttons[1]).catch(() => undefined);
    await expect(
      (args as unknown as { onStepClick: ReturnType<typeof fn> }).onStepClick
    ).not.toHaveBeenCalled();
  },
};

// TUI Plus pattern "Simple" — coloured top bar above each step column,
// no circle indicator. `variant='bars'`.
export const VariantBars: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Stepper current={1} variant="bars">
        <Stepper.Step>Job details</Stepper.Step>
        <Stepper.Step>Application form</Stepper.Step>
        <Stepper.Step>Preview</Stepper.Step>
      </Stepper>
    </div>
  ),
};

// TUI Plus pattern "Panels" — bordered card with steps separated by chevrons.
// `variant='panels'`.
export const VariantPanels: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <Stepper current={1} variant="panels">
        <Stepper.Step>Job details</Stepper.Step>
        <Stepper.Step>Application form</Stepper.Step>
        <Stepper.Step>Preview</Stepper.Step>
      </Stepper>
    </div>
  ),
};

export const BarsAddsBrandTopBorder: Story = {
  tags: ['!dev'],
  render: () => (
    <Stepper current={0} variant="bars">
      <Stepper.Step>A</Stepper.Step>
    </Stepper>
  ),
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('li');
    await expect(li?.querySelector('.border-brand-500')).not.toBeNull();
  },
};

export const PanelsWrapsInBorderedOl: Story = {
  tags: ['!dev'],
  render: () => (
    <Stepper current={0} variant="panels">
      <Stepper.Step>A</Stepper.Step>
    </Stepper>
  ),
  play: async ({ canvasElement }) => {
    const ol = canvasElement.querySelector('ol');
    await expect(ol?.className ?? '').toMatch(/rounded-md/);
    await expect(ol?.className ?? '').toMatch(/border/);
  },
};

// Side by side (md and up), the chevron is the only separator between two
// panels: the list also drew a straight divider right after each chevron.
// Locked to the desktop viewport for that layout, and kept off the docs page,
// whose width the story can't pick.
export const PanelsSeparatedByChevronsOnly: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Stepper current={1} variant="panels">
      <Stepper.Step>Job details</Stepper.Step>
      <Stepper.Step>Application form</Stepper.Step>
      <Stepper.Step>Preview</Stepper.Step>
    </Stepper>
  ),
  play: async ({ canvas }) => {
    const steps = canvas.getAllByRole('listitem');
    for (const [i, step] of steps.entries()) {
      const chevron = step.querySelector<HTMLElement>(':scope > [aria-hidden="true"]');
      if (i < steps.length - 1) {
        await expect(chevron).not.toBeNull();
        await expect(getComputedStyle(chevron!).display).not.toBe('none');
      } else {
        await expect(chevron).toBeNull();
      }
      await expect(getComputedStyle(step).borderLeftWidth).toBe('0px');
      await expect(getComputedStyle(step).borderRightWidth).toBe('0px');
    }
  },
};

// Pending step labels (gray-400) fell under 4.5:1 on light and sand (#151).
const pendingLabelContrastIn = (theme: string): Story => ({
  ...FirstStep,
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Deploy'));
  },
});

export const PendingLabelContrastInLight: Story = {
  ...pendingLabelContrastIn('light'),
  tags: ['!dev', '!autodocs'],
};
export const PendingLabelContrastInSand: Story = {
  ...pendingLabelContrastIn('sand'),
  tags: ['!dev', '!autodocs'],
};
export const PendingLabelContrastInDeepBlue: Story = {
  ...pendingLabelContrastIn('deep-blue'),
  tags: ['!dev', '!autodocs'],
};

// ── Controlled or not (#151) ─────────────────────────────────────────────────
// Only `undefined` means uncontrolled. The uncontrolled instance starts from its
// default and moves on its own; the controlled one, held at a fixed value, reports
// the change and keeps showing the value it is given.

const ThreeSteps = (props: Omit<StepperProps, 'children'>) => (
  <Stepper clickable {...props}>
    <Stepper.Step>Alpha</Stepper.Step>
    <Stepper.Step>Beta</Stepper.Step>
    <Stepper.Step>Gamma</Stepper.Step>
  </Stepper>
);

export const DefaultCurrentOrControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onStepClick: fn() },
  render: (args) => (
    <div className="space-y-8">
      <div role="group" aria-label="Uncontrolled">
        <ThreeSteps defaultCurrent={2} onStepClick={args.onStepClick} />
      </div>
      <div role="group" aria-label="Controlled">
        <ThreeSteps current={2} onStepClick={args.onStepClick} />
      </div>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const own = within(canvas.getByRole('group', { name: 'Uncontrolled' }));
    await expect(own.getByRole('button', { name: /Gamma/ })).toHaveAttribute(
      'aria-current',
      'step'
    );
    await userEvent.click(own.getByRole('button', { name: /Alpha/ }));
    await expect(args.onStepClick).toHaveBeenLastCalledWith(0);
    await expect(own.getByRole('button', { name: /Alpha/ })).toHaveAttribute(
      'aria-current',
      'step'
    );

    const held = within(canvas.getByRole('group', { name: 'Controlled' }));
    await userEvent.click(held.getByRole('button', { name: /Alpha/ }));
    await expect(args.onStepClick).toHaveBeenLastCalledWith(0);
    await expect(held.getByRole('button', { name: /Gamma/ })).toHaveAttribute(
      'aria-current',
      'step'
    );
  },
};

// The small vertical connector starts at the small marker's edge, not the default size's (#290).
export const SmallVerticalConnectorOffset: Story = {
  tags: ['!dev', '!autodocs'],
  render: VerticalSm.render,
  play: async ({ canvasElement }) => {
    const connector = canvasElement.querySelector('li > span[aria-hidden]') as HTMLElement;
    await expect(getComputedStyle(connector).top).toBe('28px');
    await expect(getComputedStyle(connector).insetInlineStart).toBe('13px');
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The steps run from the start edge, the panels' chevrons point the other way, the connectors follow. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: () =>
    bothDirections(() => (
      <div className="mb-6 space-y-8">
        <Stepper current={1} variant="panels">
          <Stepper.Step>Details</Stepper.Step>
          <Stepper.Step>Form</Stepper.Step>
          <Stepper.Step>Preview</Stepper.Step>
        </Stepper>
        <Stepper current={1}>
          <Stepper.Step>One</Stepper.Step>
          <Stepper.Step>Two</Stepper.Step>
          <Stepper.Step>Three</Stepper.Step>
        </Stepper>
      </div>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelectorAll('li')[0]);
    // The connector of the first indicator step starts at its middle and runs toward the next step.
    expectMirrored(canvasElement, (box) =>
      box.querySelectorAll('ol')[1]!.querySelector('li > span[aria-hidden]')
    );
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const chevron = box.querySelector('ol li > [aria-hidden="true"] svg')!;
      expect(getComputedStyle(chevron).scale, dir).toBe(dir === 'rtl' ? '-1 1' : 'none');
    }
  },
};

/** A vertical connector runs through the middle of the indicators, in both directions. */
export const VerticalConnectorLinesUpInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Stepper current={1} orientation="vertical">
        <Stepper.Step>Profile</Stepper.Step>
        <Stepper.Step>Verify</Stepper.Step>
      </Stepper>
    )),
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const li = box.querySelector('li')!;
      const connector = li
        .querySelector<HTMLElement>(':scope > span[aria-hidden]')!
        .getBoundingClientRect();
      const indicator = li.querySelector<HTMLElement>('.rounded-full')!.getBoundingClientRect();
      const middle = (r: DOMRect) => r.left + r.width / 2;
      expect(Math.abs(middle(connector) - middle(indicator)), dir).toBeLessThanOrEqual(1);
    }
  },
};

// ── Motion ───────────────────────────────────────────────────────────────────

// A stepper that advances and goes back with two buttons, in both orientations.
const Wizard = ({
  orientation,
  start = 0,
}: {
  orientation: 'horizontal' | 'vertical';
  start?: number;
}) => {
  const [step, setStep] = useState(start);
  return (
    <div className="max-w-md space-y-4" data-testid={orientation}>
      <Stepper current={step} orientation={orientation}>
        <Stepper.Step icon={User}>Account</Stepper.Step>
        <Stepper.Step>Profile</Stepper.Step>
        <Stepper.Step icon={Cog}>Plan</Stepper.Step>
        <Stepper.Step>Done</Stepper.Step>
      </Stepper>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>Next</Button>
      </div>
    </div>
  );
};

const Wizards = ({ start }: { start?: number }) => (
  <div className="space-y-10">
    <Wizard orientation="horizontal" start={start} />
    <Wizard orientation="vertical" start={start} />
  </div>
);

/**
 * When a step completes, the line toward the next one fills in 300 ms, then the check comes in
 * over the number; going back empties the line the same way. With the reduced setting it all
 * changes at once.
 */
export const ConnectorFillsAsTheStepperAdvances: Story = {
  parameters: { settleMotion: false },
  render: () => <Wizards />,
};

// The parts of a step of the indicator stepper.
const connectorFill = (item: HTMLElement) =>
  item.querySelector<HTMLElement>(':scope > span[aria-hidden] > span')!;
const checkOf = (item: HTMLElement) => item.querySelector<SVGElement>('svg.lucide-check')!;
const markOf = (item: HTMLElement) => checkOf(item).previousElementSibling as HTMLElement;

// How much of its track the connector's fill covers, along the line it runs on.
const filledShare = (item: HTMLElement, orientation: 'horizontal' | 'vertical') => {
  const track = connectorFill(item).parentElement!.getBoundingClientRect();
  const fill = connectorFill(item).getBoundingClientRect();
  return orientation === 'horizontal' ? fill.width / track.width : fill.height / track.height;
};

const expectFilled = (item: HTMLElement, orientation: 'horizontal' | 'vertical') =>
  expect(filledShare(item, orientation)).toBeCloseTo(1, 2);
const expectEmpty = (item: HTMLElement, orientation: 'horizontal' | 'vertical') =>
  expect(filledShare(item, orientation)).toBeCloseTo(0, 2);

// A step that has completed shows its check and not its number, a step that has not, the opposite.
const expectCompleted = (item: HTMLElement) => {
  expect(getComputedStyle(checkOf(item)).opacity, 'check').toBe('1');
  expect(getComputedStyle(markOf(item)).opacity, 'number').toBe('0');
  expect(markOf(item)).toHaveAttribute('aria-hidden', 'true');
};
const expectNotCompleted = (item: HTMLElement) => {
  expect(getComputedStyle(checkOf(item)).opacity, 'check').toBe('0');
  expect(getComputedStyle(markOf(item)).opacity, 'number').toBe('1');
  expect(markOf(item)).not.toHaveAttribute('aria-hidden');
};

/**
 * At rest the connector of a completed step is full and its check is shown, in place of the
 * number or the icon; going back empties it and brings the number back. A check is decoration:
 * the step is named by its label, and a completed step exposes no number.
 */
export const ConnectorIsFullOnceTheStepIsDone: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Wizards />,
  play: async ({ canvas }) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const wizard = within(canvas.getByTestId(orientation));
      const items = () => wizard.getAllByRole('listitem');
      const next = wizard.getByRole('button', { name: 'Next' });
      const back = wizard.getByRole('button', { name: 'Back' });

      for (const item of items()) expectNotCompleted(item);
      for (const item of items().slice(0, 3)) expectEmpty(item, orientation);

      // Forward: each step that completes fills its connector, shows its check.
      for (const index of [0, 1, 2]) {
        await userEvent.click(next);
        const done = items()[index]!;
        await waitFor(() => expectFilled(done, orientation));
        await waitFor(() => expectCompleted(done));
        await expect(items()[index + 1]).toHaveTextContent(/./);
        // The ones ahead are still empty.
        for (const ahead of items().slice(index + 1, 3)) expectEmpty(ahead, orientation);
      }
      // The last step has no connector after it, and completes with its check alone.
      await userEvent.click(next);
      await waitFor(() => expectCompleted(items()[3]!));
      await expect(items()[3]!.querySelector(':scope > span[aria-hidden]')).toBeNull();

      // Back, one step at a time: the connector empties and the number is back.
      for (const index of [3, 2, 1, 0]) {
        await userEvent.click(back);
        const undone = items()[index]!;
        await waitFor(() => expectNotCompleted(undone));
        if (index < 3) await waitFor(() => expectEmpty(undone, orientation));
        // The steps before it keep their connector and their check.
        for (const before of items().slice(0, index)) {
          expectCompleted(before);
          expectFilled(before, orientation);
        }
      }
    }
  },
};

/**
 * Nothing plays on the first render, filled or not: the connectors are where they belong and the
 * checks are in, with no transition to catch up with.
 */
export const NothingPlaysOnFirstRender: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <Wizards start={2} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(isSliding(canvasElement)).toBe(false);
    await expect(
      canvasElement
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running')
    ).toHaveLength(0);
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const items = within(canvas.getByTestId(orientation)).getAllByRole('listitem');
      expectFilled(items[0]!, orientation);
      expectFilled(items[1]!, orientation);
      expectEmpty(items[2]!, orientation);
      expectCompleted(items[0]!);
      expectCompleted(items[1]!);
      expectNotCompleted(items[2]!);
    }
  },
};

/**
 * The line fills over the slow token and the check comes in over the fast one, after the line:
 * it waits as long as the line takes. Going back it leaves at once while the line empties.
 */
export const CheckComesInAfterTheConnector: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => <Wizards />,
  play: async ({ canvas }) => {
    const slow = tokenMs('--cosmos-motion-slow');
    const fast = tokenMs('--cosmos-motion-fast');
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const wizard = within(canvas.getByTestId(orientation));
      const first = wizard.getAllByRole('listitem')[0]!;
      const list = wizard.getByRole('list');

      await userEvent.click(wizard.getByRole('button', { name: 'Next' }));
      await expect(isSliding(list)).toBe(true);
      await expect(transitionMs(connectorFill(first))).toBe(slow);
      await expect(transitionMs(checkOf(first))).toBe(fast);
      await expect(transitionDelayMs(checkOf(first))).toBe(slow);
      await waitFor(() => expectCompleted(first), { timeout: 2000 });
      await waitFor(() => expect(isSliding(list)).toBe(false), { timeout: 2000 });

      await userEvent.click(wizard.getByRole('button', { name: 'Back' }));
      await expect(isSliding(list)).toBe(true);
      await expect(transitionMs(connectorFill(first))).toBe(slow);
      await expect(transitionDelayMs(checkOf(first))).toBe(0);
      await waitFor(() => expectEmpty(first, orientation), { timeout: 2000 });
      await waitFor(() => expectNotCompleted(first), { timeout: 2000 });
    }
  },
};

/** With the reduced setting the connector and the check change at once: nothing runs. */
export const StepperJumpsUnderReducedMotion: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { motion: 'reduced' },
  parameters: { settleMotion: false },
  render: () => <Wizards />,
  play: async ({ canvas }) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const wizard = within(canvas.getByTestId(orientation));
      const first = wizard.getAllByRole('listitem')[0]!;
      await userEvent.click(wizard.getByRole('button', { name: 'Next' }));
      await expect(isSliding(wizard.getByRole('list'))).toBe(false);
      await expect(transitionMs(connectorFill(first))).toBe(0);
      await expect(transitionDelayMs(checkOf(first))).toBe(0);
      expectFilled(first, orientation);
      expectCompleted(first);
    }
  },
};

// A stepper of two steps and the button that completes the first.
const OneStepAhead = ({ orientation }: { orientation: 'horizontal' | 'vertical' }) => {
  const [step, setStep] = useState(0);
  return (
    <div className="max-w-xs space-y-3">
      <Stepper current={step} orientation={orientation}>
        <Stepper.Step>One</Stepper.Step>
        <Stepper.Step>Two</Stepper.Step>
      </Stepper>
      <Button onClick={() => setStep(1)}>Next</Button>
    </div>
  );
};

/**
 * A horizontal connector fills from the start of the line: from the left in left to right, from
 * the right in right to left (read midway, on a slowed token), and a vertical one fills downward.
 */
export const ConnectorFillsFromTheStartOfTheLine: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { settleMotion: false },
  render: () => (
    <SlowFolds tokens={['--cosmos-motion-slow']}>
      {bothDirections(() => (
        <div className="space-y-8">
          <OneStepAhead orientation="horizontal" />
          <OneStepAhead orientation="vertical" />
        </div>
      ))}
    </SlowFolds>
  ),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = within(directionBox(canvasElement, dir));
      const [horizontal, vertical] = box.getAllByRole('list');
      for (const stepper of [horizontal!, vertical!]) {
        const group = within(stepper.parentElement!);
        const fill = connectorFill(within(stepper).getAllByRole('listitem')[0]!);
        const track = fill.parentElement!;
        await userEvent.click(group.getByRole('button', { name: 'Next' }));
        const along = stepper === horizontal ? 'width' : 'height';
        // Midway: part of the track is covered, from its start.
        await waitFor(() => {
          const covered = fill.getBoundingClientRect()[along];
          expect(covered, `${dir} ${along}: covered`).toBeGreaterThan(0);
          expect(covered, `${dir} ${along}: not yet all`).toBeLessThan(
            track.getBoundingClientRect()[along]
          );
        });
        const f = fill.getBoundingClientRect();
        const t = track.getBoundingClientRect();
        if (stepper === vertical) {
          expect(f.top, `${dir}: fills down from the top`).toBeCloseTo(t.top, 0);
        } else if (dir === 'rtl') {
          expect(f.right, 'rtl: fills from the right').toBeCloseTo(t.right, 0);
        } else {
          expect(f.left, 'ltr: fills from the left').toBeCloseTo(t.left, 0);
        }
        await finishAnimations(stepper);
        expectFilled(
          within(stepper).getAllByRole('listitem')[0]!,
          along === 'width' ? 'horizontal' : 'vertical'
        );
      }
    }
  },
};
