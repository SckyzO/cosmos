import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Cog, Mail, Rocket, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from '../ui/Button';
import { Stepper } from './Stepper';

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
            Step <strong>{step + 1}</strong> of <strong>{total}</strong> — content for this
            step would be rendered here.
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
          <Button
            disabled={step >= total}
            onClick={() => setStep((s) => Math.min(total, s + 1))}
          >
            {step >= total - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ActiveStepHasAriaCurrent: Story = {
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
      (args as unknown as { onStepClick: ReturnType<typeof fn> }).onStepClick,
    ).toHaveBeenCalledWith(0);
  },
};

export const NotClickableHasNoButtons: Story = {
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
      (args as unknown as { onStepClick: ReturnType<typeof fn> }).onStepClick,
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
