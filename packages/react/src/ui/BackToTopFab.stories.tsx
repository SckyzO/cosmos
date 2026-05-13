import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronUp, Rocket } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { BackToTopFab } from './BackToTopFab';

const meta = {
  title: 'Atoms/Back To Top FAB',
  component: BackToTopFab,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof BackToTopFab>;

export default meta;
type Story = StoryObj<typeof meta>;

const TallContent = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-6 py-12 dark:from-gray-900 dark:to-gray-950">
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scroll down</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        The FAB fades in after the threshold is scrolled past. Click it to smooth-scroll
        back to the top.
      </p>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Filler paragraph {i + 1} — keep scrolling…
        </div>
      ))}
    </div>
    {children}
  </div>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab />
    </TallContent>
  ),
};

export const BottomLeft: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab position="bottom-left" />
    </TallContent>
  ),
};

export const NeutralIntent: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab intent="neutral" />
    </TallContent>
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab icon={ChevronUp} />
    </TallContent>
  ),
};

export const RocketIcon: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab icon={Rocket} ariaLabel="Launch to top" />
    </TallContent>
  ),
};

export const LowThreshold: Story = {
  render: () => (
    <TallContent>
      <BackToTopFab threshold={50} />
    </TallContent>
  ),
};

export const ForceVisible: Story = {
  // Use a tiny threshold so the FAB is visible inside Storybook's docs preview iframe
  // (which doesn't scroll by default).
  render: () => (
    <div className="relative h-64 bg-gray-100 p-6 dark:bg-gray-800">
      <p className="text-xs text-gray-500">Scroll the iframe to bring the FAB in.</p>
      <BackToTopFab threshold={0} />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    return (
      <TallContent>
        <BackToTopFab
          onActivate={() => {
            setCount((c) => c + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <div className="fixed bottom-4 left-4 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow">
          Scroll-to-top clicks: {count}
        </div>
      </TallContent>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────
// Helpers — stub window.scrollY / window.scrollTo for deterministic tests.
const stubScrollY = (value: number) => {
  const original = Object.getOwnPropertyDescriptor(window, 'scrollY');
  Object.defineProperty(window, 'scrollY', { configurable: true, value });
  window.dispatchEvent(new Event('scroll'));
  return () => {
    if (original) Object.defineProperty(window, 'scrollY', original);
  };
};

const stubScrollTo = () => {
  const original = window.scrollTo;
  const spy = fn();
  // Cast through unknown to satisfy the broad scrollTo overload signature.
  window.scrollTo = spy as unknown as typeof window.scrollTo;
  return { spy, restore: () => (window.scrollTo = original) };
};

export const HiddenWhenAboveThreshold: Story = {
  render: () => (
    <div className="h-32 p-6">
      <BackToTopFab threshold={1000} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const restore = stubScrollY(50);
    try {
      // The FAB sets `aria-hidden="true"` when not visible, which removes it
      // from the a11y tree. Query the DOM directly to verify the attribute.
      await waitFor(() => {
        const btn = canvasElement.querySelector<HTMLButtonElement>(
          'button[aria-label="Back to top"]',
        );
        expect(btn).not.toBeNull();
        expect(btn).toHaveAttribute('aria-hidden', 'true');
        expect(btn).toHaveAttribute('tabindex', '-1');
      });
    } finally {
      restore();
    }
  },
};

export const VisibleAfterScroll: Story = {
  render: () => (
    <div className="h-32 p-6">
      <BackToTopFab threshold={100} />
    </div>
  ),
  play: async ({ canvas }) => {
    const restore = stubScrollY(500);
    try {
      await waitFor(() => {
        const btn = canvas.getByRole('button', { name: /back to top/i });
        expect(btn).not.toHaveAttribute('aria-hidden');
      });
    } finally {
      restore();
    }
  },
};

export const ClickScrollsToTop: Story = {
  render: () => (
    <div className="h-32 p-6">
      <BackToTopFab threshold={0} />
    </div>
  ),
  play: async ({ canvas }) => {
    // Force visible by faking a positive scrollY (threshold=0 + scrollY>0 → visible).
    const restoreY = stubScrollY(10);
    const { spy, restore: restoreScrollTo } = stubScrollTo();
    try {
      const btn = await waitFor(() =>
        canvas.getByRole('button', { name: /back to top/i }),
      );
      await userEvent.click(btn);
      await expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    } finally {
      restoreScrollTo();
      restoreY();
    }
  },
};

export const OnActivateOverride: Story = {
  render: (args) => (
    <div className="h-32 p-6">
      <BackToTopFab threshold={0} onActivate={args.onActivate as () => void} />
    </div>
  ),
  args: { onActivate: fn() } as never,
  play: async ({ args, canvas }) => {
    const restore = stubScrollY(10);
    try {
      const btn = await waitFor(() =>
        canvas.getByRole('button', { name: /back to top/i }),
      );
      await userEvent.click(btn);
      await expect(
        (args as { onActivate: ReturnType<typeof fn> }).onActivate,
      ).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  },
};
