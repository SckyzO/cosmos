import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import { expect } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Button } from '../ui/Button';
import { Input } from '../forms/Input';
import { PasswordInput } from '../forms/PasswordInput';
import { AuthLayout } from './AuthLayout';

const meta = {
  title: 'Pages/Auth Layout',
  component: AuthLayout,
  parameters: portalDocsParams(600),
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { children: null as ReactNode },
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const FormPlaceholder = () => (
  <div className="space-y-4">
    <Input label="Username" placeholder="admin" autoComplete="username" />
    <PasswordInput label="Password" autoComplete="current-password" />
    <Button className="w-full">Sign in</Button>
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const FormOnly: Story = {
  render: () => (
    <AuthLayout>
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const WithBrand: Story = {
  render: () => (
    <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <AuthLayout title="Welcome back">
      <FormPlaceholder />
    </AuthLayout>
  ),
};

export const CustomBrand: Story = {
  render: () => (
    <AuthLayout
      brand={
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Sparkles className="text-brand-500 h-10 w-10" aria-hidden />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">cosmos</h1>
          <p className="text-xs tracking-widest text-gray-400 uppercase">design system</p>
        </div>
      }
    >
      <FormPlaceholder />
    </AuthLayout>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RendersCardAndBrand: Story = {
  render: () => (
    <AuthLayout logo={Activity} title="Cosmos" subtitle="Sign in to continue">
      <FormPlaceholder />
    </AuthLayout>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Cosmos' })).toBeInTheDocument();
    await expect(canvas.getByText(/sign in to continue/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText('Username')).toBeInTheDocument();
  },
};
