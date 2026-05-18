import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';
import { SocialAuthButtons, type SocialProvider } from './SocialAuthButtons';

const meta = {
  title: 'Pages/Social Auth Buttons',
  component: SocialAuthButtons,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { onProviderClick: fn(), providers: ['google', 'github'] },
} satisfies Meta<typeof SocialAuthButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const TwoProviders: Story = {
  args: { providers: ['google', 'github'] },
};

export const FourProviders: Story = {
  args: { providers: ['google', 'github', 'x', 'apple'] },
};

export const AllProviders: Story = {
  args: { providers: ['google', 'github', 'x', 'facebook', 'apple', 'microsoft'] },
};

export const Grid: Story = {
  args: {
    providers: ['google', 'github', 'apple', 'microsoft'],
    layout: 'grid',
  },
};

export const NoDivider: Story = {
  args: {
    providers: ['google', 'github'],
    divider: false,
  },
};

export const DividerBelow: Story = {
  args: {
    providers: ['google', 'github'],
    position: 'below',
  },
};

export const LoadingProvider: Story = {
  args: {
    providers: ['google', 'github', 'apple'],
    loading: 'github',
  },
};

export const CustomLabel: Story = {
  args: {
    providers: ['google', 'github'],
    labelFor: (p) => `Sign in with ${p[0].toUpperCase() + p.slice(1)}`,
  },
};

// ── Integration with SignInForm via `extraTop` slot ──────────────────────────

export const InsideSignInForm: Story = {
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
        <Story />
      </AuthLayout>
    ),
  ],
  render: () => (
    <SignInForm
      onSubmit={fn()}
      signUpHref="#"
      onForgotPassword={fn()}
      extraTop={<SocialAuthButtons providers={['google', 'github']} onProviderClick={fn()} />}
    />
  ),
  parameters: portalDocsParams(720),
};

export const InsideSignInFormGrid: Story = {
  decorators: [
    (Story) => (
      <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
        <Story />
      </AuthLayout>
    ),
  ],
  render: () => (
    <SignInForm
      onSubmit={fn()}
      signUpHref="#"
      onForgotPassword={fn()}
      extraTop={
        <SocialAuthButtons
          providers={['google', 'github', 'apple', 'microsoft']}
          onProviderClick={fn()}
          layout="grid"
        />
      }
    />
  ),
  parameters: portalDocsParams(760),
};

export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = useState<SocialProvider | null>(null);
    const [signedIn, setSignedIn] = useState<SocialProvider | null>(null);
    return (
      <div className="max-w-sm space-y-3">
        <SocialAuthButtons
          providers={['google', 'github', 'apple', 'microsoft']}
          loading={loading}
          onProviderClick={(p) => {
            setLoading(p);
            window.setTimeout(() => {
              setLoading(null);
              setSignedIn(p);
            }, 1500);
          }}
        />
        {signedIn && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Signed in via <code>{signedIn}</code>
          </p>
        )}
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickProviderFiresHandler: Story = {
  args: {
    providers: ['google', 'github'],
    onProviderClick: fn(),
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /continue with google/i }));
    await expect(args.onProviderClick).toHaveBeenCalledWith('google');
    await userEvent.click(canvas.getByRole('button', { name: /continue with github/i }));
    await expect(args.onProviderClick).toHaveBeenCalledWith('github');
  },
};

export const LoadingDisablesAllButtons: Story = {
  args: {
    providers: ['google', 'github', 'apple'],
    loading: 'github',
    onProviderClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const buttons = canvas.getAllByRole('button');
    for (const b of buttons) await expect(b).toBeDisabled();
    await userEvent.click(buttons[0]).catch(() => undefined);
    await expect(args.onProviderClick).not.toHaveBeenCalled();
  },
};

export const EmptyProvidersRendersNothing: Story = {
  args: { providers: [], onProviderClick: fn() },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('button')).toBeNull();
  },
};
