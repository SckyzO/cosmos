import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { expectNoHorizontalOverflow, mobileViewport } from '../storybook-helpers';
import { SectionCard } from '../templates/SectionCard';
import { SecretValue } from './SecretValue';

const API_KEY = 'ck_live_9f3a1c7e52b84d06a1f2e3c4';
const WEBHOOK = 'whsec_5f2c9e0b7d4a41c8b3e6f19a2d07c4e1';

const meta = {
  title: 'Atoms/Secret Value',
  component: SecretValue,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: API_KEY, label: 'API key' },
} satisfies Meta<typeof SecretValue>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Masked: a fixed run of bullets. The real value is not in the page. */
export const Masked: Story = {};

export const Revealed: Story = {
  args: { value: WEBHOOK, label: 'Webhook secret', defaultRevealed: true },
};

/** The last characters stay visible while masked, to tell two keys apart. */
export const WithVisibleSuffix: Story = {
  args: { visibleSuffix: 4 },
};

/** Revealed for three seconds, then masked again. */
export const AutoHide: Story = {
  args: { defaultRevealed: true, autoHideAfter: 3000 },
};

export const InACard: Story = {
  render: () => (
    <SectionCard title="Credentials">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs text-[var(--color-text-muted)]">API key</p>
          <SecretValue label="API key" value={API_KEY} visibleSuffix={4} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-[var(--color-text-muted)]">Webhook secret</p>
          <SecretValue label="Webhook secret" value={WEBHOOK} defaultRevealed />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-[var(--color-text-muted)]">Signing key</p>
          <SecretValue label="Signing key" value="sg_7d1e4b9a02c64f8e" />
        </div>
      </div>
    </SectionCard>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

// `navigator.clipboard.writeText` rejects in the vitest browser sandbox: stub it, and keep what
// was written.
const stubClipboard = () => {
  const original = navigator.clipboard;
  const written: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        written.push(text);
        return Promise.resolve();
      },
    },
  });
  return {
    written,
    restore: () =>
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original }),
  };
};

const MASK = '•'.repeat(20);

export const MaskedValueIsNotInTheDom: Story = {
  tags: ['!dev', '!autodocs'],
  args: { visibleSuffix: 4 },
  play: async ({ canvas, canvasElement }) => {
    const html = canvasElement.innerHTML;
    // Neither the value nor any run of it longer than the suffix is in the page.
    await expect(html).not.toContain(API_KEY);
    await expect(html).not.toContain(API_KEY.slice(-5));
    await expect(html).not.toContain(API_KEY.slice(0, 10));
    await expect(canvasElement.textContent).toContain(MASK + API_KEY.slice(-4));
    // A screen reader is not given the bullets, and the group is named by what it holds.
    await expect(canvas.getByRole('group', { name: 'API key' })).toBeVisible();
    await expect(canvasElement.querySelector('[aria-hidden="true"]')?.textContent).toBe(MASK);
  },
};

export const MaskDoesNotLeakTheLength: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-3">
      <SecretValue label="Short" value="abc" />
      <SecretValue label="Long" value={WEBHOOK.repeat(3)} />
    </div>
  ),
  play: async ({ canvas }) => {
    const shown = (name: string) => canvas.getByRole('group', { name }).querySelector('code')!;
    await expect(shown('Short').textContent).toBe(MASK);
    await expect(shown('Long').textContent).toBe(MASK);
  },
};

/** A suffix is capped at half the value: a short secret is not given away. */
export const SuffixIsCappedAtHalfTheValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'abcdef', visibleSuffix: 20 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain(MASK + 'def');
    await expect(canvasElement.textContent).not.toContain('cdef');
  },
};

export const ShowAndHideToggleTheValue: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const show = canvas.getByRole('button', { name: 'Show API key' });
    await expect(show).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(show);
    await expect(canvasElement.textContent).toContain(API_KEY);
    const hide = canvas.getByRole('button', { name: 'Hide API key' });
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(hide);
    await expect(canvasElement.innerHTML).not.toContain(API_KEY);
    await expect(canvas.getByRole('button', { name: 'Show API key' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  },
};

const ControlledSecret = ({ onChange }: { onChange: (revealed: boolean) => void }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <SecretValue
      label="API key"
      value={API_KEY}
      revealed={revealed}
      onRevealedChange={(next) => {
        onChange(next);
        setRevealed(next);
      }}
    />
  );
};

export const ControlledRevealedFiresTheChange: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <ControlledSecret onChange={fn()} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show API key' }));
    await expect(canvasElement.textContent).toContain(API_KEY);
  },
};

export const RevealedChangeReportsTheStateToMoveTo: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onRevealedChange: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show API key' }));
    await expect(args.onRevealedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Hide API key' }));
    await expect(args.onRevealedChange).toHaveBeenLastCalledWith(false);
  },
};

/** Copy writes the real value to the clipboard, and the value stays masked. */
export const CopyYieldsTheRealValueWhileMasked: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const { written, restore } = stubClipboard();
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Copy API key' }));
      await waitFor(() => expect(written).toEqual([API_KEY]));
      await expect(canvasElement.innerHTML).not.toContain(API_KEY);
      await expect(canvas.getByRole('button', { name: 'Show API key' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    } finally {
      restore();
    }
  },
};

export const AutoHideMasksTheValueAgain: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultRevealed: true, autoHideAfter: 300, onRevealedChange: fn() },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvasElement.textContent).toContain(API_KEY);
    await waitFor(() => expect(canvasElement.innerHTML).not.toContain(API_KEY), { timeout: 2000 });
    await expect(args.onRevealedChange).toHaveBeenCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Show API key' })).toBeVisible();
  },
};

/** The buttons wrap under the value on a phone, and the page does not scroll sideways. */
export const MobileButtonsWrapUnderTheValue: Story = {
  globals: mobileViewport,
  args: { value: WEBHOOK.repeat(2), label: 'Webhook secret', defaultRevealed: true },
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow();
    const value = canvas
      .getByRole('group', { name: 'Webhook secret' })
      .querySelector('code')!
      .getBoundingClientRect();
    for (const name of ['Hide Webhook secret', 'Copy Webhook secret']) {
      const button = canvas.getByRole('button', { name }).getBoundingClientRect();
      await expect(button.top).toBeGreaterThanOrEqual(value.bottom);
    }
  },
};

/**
 * The value is an island: a key stays in its own direction (here left to right) in a right to
 * left page, and the end of it does not jump to the other side.
 */
export const ValueIsIsolatedInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div dir="rtl">
      <SecretValue value="sk_live-4eC39H-" label="API key" defaultRevealed visibleSuffix={4} />
    </div>
  ),
  play: async ({ canvas }) => {
    const code = canvas.getByRole('group', { name: 'API key' }).querySelector('code')!;
    const island = code.querySelector('bdi')!;
    await expect(island).toHaveTextContent('sk_live-4eC39H-');
    await expect(getComputedStyle(island).direction).toBe('ltr');
    await expect(getComputedStyle(island).unicodeBidi).toBe('isolate');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide API key' }));
    // Masked, the dots and the visible suffix are one island: the suffix stays at the end of
    // the value, on the right of the dots, where on its own it would go to their left.
    const mask = code.querySelector('[aria-hidden="true"]')!;
    const masked = mask.closest('bdi');
    await expect(masked).toHaveTextContent(/•39H-$/);
    await expect(getComputedStyle(masked!).direction).toBe('ltr');
    const suffix = document.createRange();
    suffix.selectNodeContents(masked!);
    suffix.setStartAfter(mask);
    await expect(suffix.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      mask.getBoundingClientRect().right - 1
    );
  },
};
