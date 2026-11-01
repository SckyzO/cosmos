import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { TwoStepVerificationForm } from './TwoStepVerificationForm';

const meta = {
  title: 'Examples/Auth/Two Step Verification Form',
  component: TwoStepVerificationForm,
  parameters: portalDocsParams(560),
  tags: ['autodocs'],
  args: { onSubmit: fn() },
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Verify your account">
        <Story />
      </AuthLayout>
    ),
  ],
} satisfies Meta<typeof TwoStepVerificationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { sentTo: 'john@example.com', cancelHref: '#', onResend: fn() },
};

export const AuthenticatorApp: Story = {
  args: { cancelHref: '#' },
};

export const WithError: Story = {
  args: {
    sentTo: 'john@example.com',
    error: 'Invalid code — please try again.',
    cancelHref: '#',
    onResend: fn(),
  },
};

export const Loading: Story = {
  args: { loading: true, sentTo: 'john@example.com', cancelHref: '#' },
};

export const FourDigits: Story = {
  args: { length: 4, sentTo: 'john@example.com', cancelHref: '#' },
};

export const WithBackupCode: Story = {
  args: { sentTo: 'john@example.com', cancelHref: '#', onResend: fn(), backupCode: true },
};

export const BackupCodeEntry: Story = {
  args: { defaultMethod: 'backup', backupCode: true, cancelHref: '#' },
};

export const BackupCodeRefused: Story = {
  args: {
    defaultMethod: 'backup',
    backupCode: true,
    error: 'That backup code isn’t valid. Check it and try again.',
    cancelHref: '#',
  },
};

// The countdown depends on how long the story has been open: no capture.
export const WithResendCooldown: Story = {
  tags: ['no-capture'],
  args: {
    sentTo: 'john@example.com',
    cancelHref: '#',
    onResend: fn(),
    backupCode: true,
    resendCooldown: 30,
  },
};

export const BackupCodeOnPhone: Story = {
  globals: mobileViewport,
  args: { defaultMethod: 'backup', backupCode: true, cancelHref: '#' },
};

export const Interactive: Story = {
  tags: ['no-capture'],
  render: () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [verified, setVerified] = useState(false);
    return (
      <>
        <TwoStepVerificationForm
          loading={submitting}
          error={error}
          sentTo="john@example.com"
          cancelHref="#"
          backupCode
          resendCooldown={15}
          onResend={() => setError(undefined)}
          onMethodChange={() => setError(undefined)}
          onSubmit={(code, method) => {
            setError(undefined);
            setSubmitting(true);
            window.setTimeout(() => {
              setSubmitting(false);
              if (code === '123456' || (method === 'backup' && code === '4f7a-91bc')) {
                setVerified(true);
              } else {
                setError(
                  method === 'backup'
                    ? 'That backup code isn’t valid. Try `4f7a-91bc`.'
                    : 'Invalid code — try `123456`.'
                );
              }
            }, 1200);
          }}
        />
        {verified && (
          <div className="inset-s-4 fixed bottom-4 rounded-md bg-green-500 px-3 py-1.5 text-sm text-white shadow-lg">
            Account verified!
          </div>
        )}
      </>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const standaloneDecorator = [
  (Story: () => React.ReactNode) => <div className="mx-auto max-w-sm p-12">{Story()}</div>,
];

// The interaction tests below stay off the docs page (`!autodocs`): their play
// functions take focus, which scrolls the docs page down to their iframe.
export const AutoSubmitOnComplete: Story = {
  tags: ['!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), sentTo: 'john@example.com', length: 4 },
};

export const AutoSubmitOnCompleteChecks: Story = {
  ...AutoSubmitOnComplete,
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    // One keyboard() call per digit: each call targets the cell that has focus
    // now. A single '1234' call kept typing into the first cell under the
    // Storybook UI's simulated events, though the input moves focus forward.
    for (const digit of '1234') await userEvent.keyboard(digit);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith('1234', 'code'));
  },
};

export const ManualSubmitDisabledUntilFilled: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: {
    onSubmit: fn(),
    autoSubmit: false,
    sentTo: 'john@example.com',
    length: 4,
  },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /verify my account/i });
    await expect(submit).toBeDisabled();
    const cells = canvas.getAllByRole('textbox');
    cells[0].focus();
    // One keyboard() call per digit, as in AutoSubmitOnComplete.
    for (const digit of '123') await userEvent.keyboard(digit);
    await expect(submit).toBeDisabled();
    await userEvent.keyboard('4');
    await waitFor(() => expect(submit).not.toBeDisabled());
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('1234', 'code');
  },
};

export const ResendFiresHandler: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onSubmit: fn(), onResend: fn(), sentTo: 'john@example.com' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /resend code/i }));
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};

// ── Resend code (#303) ───────────────────────────────────────────────────────

/** "Resend code" is a ghost button of at least 44px, a touch target on a phone too. */
export const ResendIsA44pxButton: Story = {
  tags: ['!dev'],
  globals: mobileViewport,
  args: { onSubmit: fn(), onResend: fn(), sentTo: 'john@example.com' },
  play: async ({ canvas, canvasElement }) => {
    const resend = canvas.getByRole('button', { name: 'Resend code' });
    await expect(resend.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect(resend).toBeEnabled();
    expectNoHorizontalOverflow(canvasElement);
  },
};

// The back arrow points along the line, so it turns around in right to left; the number the code
// went to is the host's and keeps its own order inside the sentence ("+33 6 12" would lose its plus).
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onSubmit: fn(), sentTo: '+33 6 12 34 56 78', cancelHref: '#' },
  render: (args) => bothDirections(() => <TwoStepVerificationForm {...args} />),
  play: async ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      const arrow = box.querySelector('.lucide-arrow-left')!;
      await expect(getComputedStyle(arrow).scale, dir).toBe(dir === 'rtl' ? '-1 1' : 'none');
      expectReadsLeftToRight(box.querySelector('bdi')!);
    }
  },
};

// ── Backup code ──────────────────────────────────────────────────────────────

const backupLink = 'Use a backup code';
const codeLink = 'Use a verification code instead';

export const NoBackupLinkByDefault: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { sentTo: 'john@example.com', onResend: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: backupLink })).toBeNull();
  },
};

/** The link swaps the entry in place and moves focus to the new field, then back. */
export const SwitchesToTheBackupEntryAndBack: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { sentTo: 'john@example.com', onResend: fn(), backupCode: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Two-step verification'
    );
    await userEvent.click(canvas.getByRole('button', { name: backupLink }));
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Use a backup code');
    const field = canvas.getByLabelText(/^Backup code/);
    await expect(field).toHaveFocus();
    // The cells and the resend row belong to the code.
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(1);
    await expect(canvas.queryByRole('button', { name: 'Resend code' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: codeLink }));
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Two-step verification'
    );
    await expect(canvas.getAllByRole('textbox')[0]).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Resend code' })).toBeInTheDocument();
  },
};

export const DefaultMethodStartsOnTheBackupEntry: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { defaultMethod: 'backup', backupCode: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/^Backup code/)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: codeLink })).toBeInTheDocument();
  },
};

/** The host owns `method`: the link asks, the host answers. */
export const MethodFollowsTheHostWhenControlled: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { method: 'backup', backupCode: true, onMethodChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: codeLink }));
    await expect(args.onMethodChange).toHaveBeenCalledWith('code');
    await expect(canvas.getByLabelText(/^Backup code/)).toBeInTheDocument();
  },
};

/** No length or format is checked: the host's server says if the code is good. */
export const BackupSubmitTakesAnyNonEmptyText: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { defaultMethod: 'backup', backupCode: true, onSubmit: fn() },
  play: async ({ args, canvas }) => {
    const submit = canvas.getByRole('button', { name: /verify my account/i });
    const field = canvas.getByLabelText(/^Backup code/);
    await expect(submit).toBeDisabled();
    await userEvent.type(field, '   ');
    await expect(submit).toBeDisabled();
    await userEvent.type(field, 'x');
    await expect(submit).not.toBeDisabled();
    // Typing more than a code's length never sends it by itself.
    await userEvent.type(field, 'yzzy-1234-abcd');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.click(submit);
    await expect(args.onSubmit).toHaveBeenCalledWith('xyzzy-1234-abcd', 'backup');
  },
};

export const CodeSubmitPassesItsMethod: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { length: 4, onSubmit: fn() },
  play: async ({ args, canvas }) => {
    canvas.getAllByRole('textbox')[0].focus();
    for (const digit of '1234') await userEvent.keyboard(digit);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith('1234', 'code'));
  },
};

/** On the backup entry the error sits under the field, and the field is invalid. */
export const BackupErrorShowsUnderTheField: Story = {
  ...BackupCodeRefused,
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  play: async ({ canvas }) => {
    const field = canvas.getByLabelText(/^Backup code/);
    await expect(field).toBeInvalid();
    await expect(field).toHaveAccessibleDescription(
      'That backup code isn’t valid. Check it and try again.'
    );
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

export const BackupLoadingDisablesTheEntry: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { defaultMethod: 'backup', backupCode: true, loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/^Backup code/)).toBeDisabled();
    await expect(canvas.getByRole('button', { name: codeLink })).toBeDisabled();
  },
};

export const BackupEntryFitsOnAPhone: Story = {
  ...BackupCodeOnPhone,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    await userEvent.type(canvas.getByLabelText(/^Backup code/), '4f7a-91bc-4f7a-91bc-4f7a-91bc');
    const link = canvas.getByRole('button', { name: codeLink });
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expectNoHorizontalOverflow(canvasElement);
  },
};

// ── Resend cooldown ──────────────────────────────────────────────────────────

// The cooldown counts real seconds, so these tests run in real time with 2 s cooldowns and wait on
// what they check; the margins are the wait's, never a sleep.
const countdown = (canvas: { getByRole: (role: string, o: object) => HTMLElement }) =>
  canvas.getByRole('button', { name: 'Resend code' });

export const CooldownStartsOnMountAndEnds: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { sentTo: 'john@example.com', onResend: fn(), resendCooldown: 2 },
  play: async ({ canvas }) => {
    const resend = countdown(canvas);
    const status = canvas.getByRole('status');
    // A code was just sent: counting from the first render, the button dimmed but still focusable.
    await expect(resend).toHaveAttribute('aria-disabled', 'true');
    await expect(resend).not.toBeDisabled();
    await expect(resend).toHaveAccessibleDescription(/available in 0:0[12]/);
    await expect(status).toBeEmptyDOMElement();
    resend.focus();
    await waitFor(() => expect(resend).toHaveAccessibleDescription('available in 0:01'), {
      timeout: 2500,
    });
    // At zero: active again, the countdown gone, said once, and focus where it was.
    await waitFor(() => expect(resend).not.toHaveAttribute('aria-disabled'), { timeout: 2500 });
    await expect(resend).not.toHaveAccessibleDescription();
    await expect(status).toHaveTextContent('You can request a new code.');
    await expect(resend).toHaveFocus();
  },
};

export const PressingWhileCountingDoesNothing: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onResend: fn(), resendCooldown: 2 },
  play: async ({ args, canvas }) => {
    const resend = countdown(canvas);
    resend.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onResend).not.toHaveBeenCalled();
    await expect(resend).toHaveFocus();
  },
};

export const PressingRestartsTheCountdownAndSaysSo: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onResend: fn(), resendCooldown: 2 },
  play: async ({ args, canvas }) => {
    const resend = countdown(canvas);
    const status = canvas.getByRole('status');
    await waitFor(() => expect(resend).not.toHaveAttribute('aria-disabled'), { timeout: 3500 });
    resend.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onResend).toHaveBeenCalledTimes(1);
    await expect(resend).toHaveAttribute('aria-disabled', 'true');
    await expect(resend).toHaveAccessibleDescription(/available in 0:0[12]/);
    await expect(status).toHaveTextContent('We sent you a new code.');
    await expect(status).toBeVisible();
    // Focus stays on the button through it all.
    await expect(resend).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onResend).toHaveBeenCalledTimes(1);
  },
};

/** Without `resendCooldown` the button is as it was: no wait, no message. */
export const NoCooldownLeavesResendAsItWas: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onResend: fn() },
  play: async ({ args, canvas }) => {
    const resend = countdown(canvas);
    await expect(resend).not.toHaveAttribute('aria-disabled');
    await userEvent.click(resend);
    await userEvent.click(resend);
    await expect(args.onResend).toHaveBeenCalledTimes(2);
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(resend).not.toHaveAccessibleDescription();
  },
};

/** `loading` disables the button as before, with the real attribute. */
export const LoadingDisablesResendWhateverTheCooldown: Story = {
  tags: ['!dev', '!autodocs'],
  decorators: standaloneDecorator,
  args: { onResend: fn(), loading: true },
  play: async ({ canvas }) => {
    await expect(countdown(canvas)).toBeDisabled();
  },
};

export const CooldownFitsOnAPhone: Story = {
  ...WithResendCooldown,
  tags: ['!dev', '!autodocs'],
  globals: mobileViewport,
  play: async ({ canvas, canvasElement }) => {
    await expect(countdown(canvas)).toHaveAttribute('aria-disabled', 'true');
    await expect(countdown(canvas).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expectNoHorizontalOverflow(canvasElement);
  },
};
