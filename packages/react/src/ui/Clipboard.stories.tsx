import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Input } from '../forms/Input';
import { Textarea } from '../forms/Textarea';
import { SectionCard } from '../templates';
import { Clipboard } from './Clipboard';

const meta = {
  title: 'Atoms/Clipboard',
  component: Clipboard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'Hello world!' },
} satisfies Meta<typeof Clipboard>;

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
      <Clipboard {...args} className="absolute top-2 right-2" />
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
          <Clipboard value="https://cosmos.sckyzo.dev/invite/xK9pQ2mZ3vW8aR1n" size="md" />
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
          <Clipboard
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
          <Clipboard value={snippet} floating className="absolute top-2 right-2" />
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
          <Clipboard value="sk-XXXX-YYYY-ZZZZ" onCopy={(v) => setLast(v)} />
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

// ── Flowbite-inspired patterns ───────────────────────────────────────────────
// These stories mirror the canonical "copy" patterns from
// https://flowbite.com/docs/components/clipboard/ adapted to Cosmos primitives.

export const InsideInput: Story = {
  render: () => (
    <div className="max-w-md">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Share link
      </label>
      <div className="relative">
        <Input
          readOnly
          value="https://cosmos.sckyzo.dev/invite/xK9pQ2mZ3vW8aR1n"
          className="pr-10 font-mono text-xs"
        />
        <Clipboard
          value="https://cosmos.sckyzo.dev/invite/xK9pQ2mZ3vW8aR1n"
          className="absolute top-1 right-1"
          size="sm"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        Icon-only button anchored inside the field, mirroring Flowbite&apos;s &quot;Input with copy
        button&quot; pattern.
      </p>
    </div>
  ),
};

export const InputGroupUrl: Story = {
  render: () => (
    <div className="max-w-md">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Shareable URL
      </label>
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 font-mono text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          https://
        </span>
        <input
          readOnly
          value="cosmos.sckyzo.dev/r/xK9p"
          className="flex-1 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white"
        />
        <Clipboard
          value="https://cosmos.sckyzo.dev/r/xK9p"
          variant="button"
          size="sm"
          className="rounded-none border-0 border-l border-gray-200 dark:border-gray-700"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        Three-segment input group with prefix + URL + Clipboard, all sharing a single border.
      </p>
    </div>
  ),
};

export const ApiKeysCard: Story = {
  render: () => {
    const keys = [
      { label: 'Account ID', value: 'acc_01HQVZ8XKPYM2N3R4S5T6U7V8' },
      { label: 'Public key', value: 'pk_live_51N9k2pLk...8oZqW' },
      { label: 'Secret key', value: 'sk_live_51N9k2pLk...XnVbA', sensitive: true },
    ];
    return (
      <div className="max-w-xl">
        <SectionCard
          title="API credentials"
          description="Use these keys to authenticate your Cosmos exporter against the monitoring-hub API."
        >
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.label}>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {k.label}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    type={k.sensitive ? 'password' : 'text'}
                    value={k.value}
                    className="font-mono text-xs"
                  />
                  <Clipboard value={k.value} size="md" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
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
