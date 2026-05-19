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
  // Icon-only Clipboard layered ON TOP of a readonly Input — the button is
  // vertically centered in the field (top-1/2 + translate-y) and uses
  // `floating` so it has no border / transparent bg and blends with the
  // field instead of looking bolted on.
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
          floating
          size="sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-100"
        />
      </div>
    </div>
  ),
};

export const InputGroupWithCopy: Story = {
  // Three-segment connected group — prefix, input, brand-coloured button —
  // sharing a single border. Matches Flowbite's "Input group with copy"
  // (https://flowbite.com/docs/components/clipboard/) which is the
  // canonical "verify your URL" pattern.
  render: () => {
    const url = 'https://cosmos.sckyzo.dev';
    return (
      <div className="max-w-md">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Verify your website
        </label>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
          <span className="flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            URL
          </span>
          <input
            readOnly
            value={url}
            className="flex-1 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white"
          />
          <Clipboard
            value={url}
            className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600 h-auto w-12 shrink-0 rounded-none border-0 text-white dark:text-white"
            size="md"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Security certificate is required for approval.
        </p>
      </div>
    );
  },
};

export const ApiKeysCard: Story = {
  // Multi-row credentials card with Clipboard as an absolute overlay inside
  // each field (no second column needed). Matches Flowbite's "Card with API
  // keys" pattern. Footer mirrors the "Cancel / Next step" actions from
  // the reference for realism.
  render: () => {
    const keys = [
      { label: 'Cosmos account ID', value: '756593826' },
      { label: 'API key', value: 'f4h6sd3t-jsy63ind-hsgdt7rs-jdhf76st' },
      { label: 'Role ARN', value: '123456789012:user/Cosmos' },
    ];
    return (
      <div className="max-w-xl">
        <SectionCard
          title="Create a role with read-only in-line policy"
          description="To give Cosmos read access, please create an IAM Role following the trust relationship and inline policy."
        >
          <div className="space-y-4">
            {keys.map((k) => (
              <div key={k.label}>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {k.label}
                </label>
                <div className="relative">
                  <input
                    readOnly
                    value={k.value}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-12 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800/60 dark:text-white"
                  />
                  <Clipboard
                    value={k.value}
                    floating
                    size="sm"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-100"
                  />
                </div>
              </div>
            ))}
            <div className="mt-2 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Next step
              </button>
            </div>
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
