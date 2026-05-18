import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Input } from '../forms/Input';
import { Textarea } from '../forms/Textarea';
import { CopyButton } from './CopyButton';

const meta = {
  title: 'Atoms/Copy Button',
  component: CopyButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'Hello world!' },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconDefault: Story = {};

export const ButtonWithLabel: Story = {
  args: { variant: 'button' },
};

export const SizeMd: Story = {
  args: { size: 'md', variant: 'button' },
};

export const Floating: Story = {
  render: (args) => (
    <div className="group relative inline-block rounded-lg bg-gray-900 p-6 pr-12 font-mono text-xs text-gray-200">
      <pre>npm install @sckyzo/cosmos-react</pre>
      <CopyButton {...args} className="absolute top-2 right-2" />
    </div>
  ),
  args: { value: 'npm install @sckyzo/cosmos-react', floating: true },
};

export const CustomLabels: Story = {
  args: {
    variant: 'button',
    size: 'md',
    copyLabel: 'Share link',
    copiedLabel: 'Link copied!',
  },
};

export const LongDuration: Story = {
  args: { variant: 'button', duration: 3000 },
};

export const WithReadOnlyInput: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Share link
        </label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value="https://cosmos.sckyzo.dev/invite/xK9pQ2mZ3vW8aR1n"
            className="font-mono text-xs"
          />
          <CopyButton value="https://cosmos.sckyzo.dev/invite/xK9pQ2mZ3vW8aR1n" size="md" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          API key
        </label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            type="password"
            value="sk-prod-A1B2C3D4E5F6G7H8I9J0"
            className="font-mono text-xs"
          />
          <CopyButton
            value="sk-prod-A1B2C3D4E5F6G7H8I9J0"
            size="md"
            variant="button"
            copyLabel="Copy"
            copiedLabel="Copied!"
          />
        </div>
      </div>
    </div>
  ),
};

export const WithTextarea: Story = {
  render: () => {
    const snippet = `{
  "name": "@sckyzo/cosmos-react",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`;
    return (
      <div className="max-w-md">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          package.json snippet
        </label>
        <div className="group relative">
          <Textarea readOnly value={snippet} rows={8} resize="none" className="font-mono text-xs" />
          <CopyButton value={snippet} floating className="absolute top-2 right-2" />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Hover the textarea to reveal the copy button.
        </p>
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [last, setLast] = useState<string | null>(null);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800">
            sk-XXXX-YYYY-ZZZZ
          </code>
          <CopyButton value="sk-XXXX-YYYY-ZZZZ" onCopy={(v) => setLast(v)} />
        </div>
        {last && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Last copied: <code>{last}</code>
          </p>
        )}
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────
// `navigator.clipboard.writeText` rejects in the vitest browser sandbox
// (no user-gesture / no permission) so our try/catch swallows the error and
// the button never enters the "copied" state. Stub it for the duration of
// each test so we can assert the success path.
const stubClipboard = () => {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.resolve() },
  });
  return () =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: original,
    });
};

export const ClickFiresOnCopy: Story = {
  args: { value: 'test-value', onCopy: fn() },
  play: async ({ args, canvas }) => {
    const restore = stubClipboard();
    try {
      const btn = canvas.getByRole('button', { name: /copy/i });
      await userEvent.click(btn);
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: /copied/i })).toBeInTheDocument()
      );
      await expect(args.onCopy).toHaveBeenCalledWith('test-value');
    } finally {
      restore();
    }
  },
};

export const FeedbackResetsAfterDuration: Story = {
  args: { value: 'reset-test', duration: 200 },
  play: async ({ canvas }) => {
    const restore = stubClipboard();
    try {
      const btn = canvas.getByRole('button', { name: /copy/i });
      await userEvent.click(btn);
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: /copied/i })).toBeInTheDocument()
      );
      await waitFor(
        () => expect(canvas.getByRole('button', { name: /^copy$/i })).toBeInTheDocument(),
        { timeout: 1500 }
      );
    } finally {
      restore();
    }
  },
};
