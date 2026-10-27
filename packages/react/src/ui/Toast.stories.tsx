import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectFocusRing, expectTextContrast, portalDocsParams } from '../storybook-helpers';
import { AlertBanner } from './AlertBanner';
import { Button } from './Button';
import { Toaster, toast } from './Toast';

const meta = {
  title: 'Feedback/Toast',
  component: Toaster,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

type ToastId = string | number;

// Toasts live in sonner's store, which outlives a story: a click test's toast stays active there
// once its Toaster unmounts, before its 4 s are up, and the next Toaster to subscribe gets it
// replayed. A story that counts its toasts dismisses them before it renders (`beforeEach`): a
// dismissal sent once its Toaster has subscribed can reach it before the replay does, and the old
// toasts then stay for their 4 s. Not in the meta: on the docs page it would close the toasts of
// `Open` when a later story renders.
const dismissLeftovers = () => {
  toast.dismiss();
};

// What a story opens, it dismisses on unmount.
const keepOpen = (show: () => ToastId[]) => {
  const ids = show();
  return () => {
    for (const id of ids) toast.dismiss(id);
  };
};

// The four status toasts, kept open (`duration: Infinity`): a title in the intent color, a neutral
// description, and an action on the info one.
const showStatusToasts = (): ToastId[] => [
  toast.success('Backup completed', {
    description: '3.2 GB transferred to S3 in 8.4 s.',
    duration: Infinity,
  }),
  toast.info('New version available', {
    description: 'Reload the page to update.',
    duration: Infinity,
    action: { label: 'Reload', onClick: () => {} },
  }),
  toast.warning('Disk space low', { description: '4% left on /var.', duration: Infinity }),
  toast.error('Could not save changes', {
    description: 'The server returned a 503.',
    duration: Infinity,
  }),
];

// Each story embeds its own <Toaster /> so multiple stories on one page can coexist.

export const BasicToast: Story = {
  render: () => (
    <>
      <Button onClick={() => toast('Settings updated.')}>Show toast</Button>
      <Toaster />
    </>
  ),
};

export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast.info('FYI: a new version is available.')}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.success('Backup completed!')}>
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.warning('Disk space low.')}>
        Warning
      </Button>
      <Button variant="secondary" onClick={() => toast.error('Could not save changes.')}>
        Error
      </Button>
      <Toaster />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast.success('Backup completed', {
            description: '3.2 GB transferred to S3 in 8.4 s.',
          })
        }
      >
        Show with description
      </Button>
      <Toaster />
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast('Email moved to Trash.', {
            action: {
              label: 'Undo',
              onClick: () => toast.success('Restored!'),
            },
          })
        }
      >
        Show with Undo
      </Button>
      <Toaster />
    </>
  ),
};

export const PromiseFlow: Story = {
  render: () => (
    <>
      <Button
        onClick={() => {
          const promise = new Promise<{ items: number }>((resolve, reject) =>
            window.setTimeout(() => {
              if (Math.random() > 0.3) resolve({ items: 42 });
              else reject(new Error('Network down'));
            }, 1500)
          );
          toast.promise(promise, {
            loading: 'Syncing nodes…',
            success: (data) => `Synced ${data.items} nodes.`,
            error: (err) => `Sync failed: ${err.message}`,
          });
        }}
      >
        Run async task
      </Button>
      <Toaster />
    </>
  ),
};

export const LongDuration: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast.warning('Sticky for 10 s.', {
            duration: 10_000,
          })
        }
      >
        10s warning
      </Button>
      <Toaster />
    </>
  ),
};

export const TopCenter: Story = {
  render: () => (
    <>
      <Button onClick={() => toast.info('Hello from the top!')}>Top center toast</Button>
      <Toaster position="top-center" />
    </>
  ),
};

export const Stacked: Story = {
  render: () => (
    <>
      <Button
        onClick={() => {
          toast.success('First');
          window.setTimeout(() => toast.info('Second'), 200);
          window.setTimeout(() => toast.warning('Third'), 400);
          window.setTimeout(() => toast.error('Fourth'), 600);
        }}
      >
        Trigger 4 toasts
      </Button>
      <Toaster />
    </>
  ),
};

export const ProgrammaticDismiss: Story = {
  render: () => {
    const [id, setId] = useState<string | number | null>(null);
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const newId = toast.loading('Long-running task…', { duration: 30_000 });
            setId(newId);
          }}
        >
          Start task
        </Button>
        <Button
          variant="secondary"
          disabled={!id}
          onClick={() => {
            if (id !== null) {
              toast.dismiss(id);
              setId(null);
            }
          }}
        >
          Dismiss it
        </Button>
        <Toaster />
      </div>
    );
  },
};

/**
 * The toasts as they look on screen, kept (`duration: Infinity`) and expanded (`expand` on the
 * Toaster) instead of stacked: a title, a description, an action, then the four status toasts
 * (success, info, warning, error), which take the `AlertBanner` palette on an opaque surface.
 */
export const Open: Story = {
  beforeEach: dismissLeftovers,
  parameters: portalDocsParams.lg(),
  render: function Render() {
    useEffect(
      () =>
        keepOpen(() => [
          toast('Settings updated', { duration: Infinity }),
          toast('Invite sent', {
            description: 'sarah@example.com will get a link that expires in 7 days.',
            duration: Infinity,
          }),
          toast('Export ready', {
            description: 'servers-2026-01.csv, 1.2 MB.',
            duration: Infinity,
            action: { label: 'Download', onClick: () => {} },
          }),
          ...showStatusToasts(),
        ]),
      []
    );
    return <Toaster expand visibleToasts={7} />;
  },
  play: async () => {
    await waitFor(() => expect(document.querySelectorAll('[data-sonner-toast]')).toHaveLength(7));
    // Each toast fades in once mounted.
    await waitFor(() => expect(within(document.body).getByText('Settings updated')).toBeVisible());
    await waitFor(() =>
      expect(within(document.body).getByText('Could not save changes')).toBeVisible()
    );
    // Unstyled, sonner gives a toast no width: they all take the toaster's, whatever they say.
    const widths = [...document.querySelectorAll('[data-sonner-toast]')].map(
      (toastEl) => toastEl.getBoundingClientRect().width
    );
    expect(Math.min(...widths)).toBeGreaterThan(300);
    expect(Math.max(...widths)).toBe(Math.min(...widths));
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickShowsToast: Story = {
  tags: ['!dev'],
  render: () => (
    <>
      <Button onClick={() => toast('Clicked')}>Trigger</Button>
      <Toaster />
    </>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    // Sonner renders into a portal at the end of <body>; query document.
    await waitFor(() => expect(document.querySelector('[data-sonner-toaster]')).not.toBeNull());
    await waitFor(() => expect(document.body.textContent || '').toMatch(/Clicked/));
  },
};

// The test browser reports `prefers-color-scheme: light`, so the toaster must
// take dark from the `.dark` class on <html>, then follow a switch to sand.
export const FollowsCosmosTheme: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  render: () => (
    <>
      <Button onClick={() => toast('Themed')}>Trigger</Button>
      <Toaster />
    </>
  ),
  play: async ({ canvas }) => {
    await expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    const toaster = () => document.querySelector('[data-sonner-toaster]');
    await waitFor(() => expect(toaster()).toHaveAttribute('data-sonner-theme', 'dark'));
    const root = document.documentElement;
    root.classList.replace('dark', 'sand');
    try {
      await waitFor(() => expect(toaster()).toHaveAttribute('data-sonner-theme', 'light'));
    } finally {
      root.classList.replace('sand', 'dark');
    }
  },
};

export const ActionFiresHandler: Story = {
  tags: ['!dev'],
  render: (args) => {
    const extra = args as unknown as { onUndo: () => void };
    return (
      <>
        <Button
          onClick={() =>
            toast('With action', {
              action: { label: 'Undo', onClick: extra.onUndo },
            })
          }
        >
          Trigger
        </Button>
        <Toaster />
      </>
    );
  },
  args: { onUndo: fn() } as never,
  play: async ({ args, canvas }) => {
    const extra = args as unknown as { onUndo: ReturnType<typeof fn> };
    await userEvent.click(canvas.getByRole('button', { name: 'Trigger' }));
    await waitFor(() => {
      const undoBtn = document.querySelector('button[data-button]');
      expect(undoBtn).not.toBeNull();
    });
    const undoBtn = document.querySelector('button[data-button]') as HTMLButtonElement;
    // A plain click: Sonner calls setPointerCapture on pointerdown, and Firefox
    // rejects the synthetic pointer id of userEvent.click ("Invalid pointer id").
    fireEvent.click(undoBtn);
    await expect(extra.onUndo).toHaveBeenCalledTimes(1);
  },
};

// ── Palette tests ────────────────────────────────────────────────────────────

const THEMES = ['light', 'sand', 'dark', 'deep-blue'] as const;
const isDarkTheme = (theme: string) => theme === 'dark' || theme === 'deep-blue';

// The toast type sonner puts in `data-type`, the Cosmos theme token of its tint, and the intent an
// `AlertBanner` takes for the same meaning (`error` is `danger`).
const STATUS = [
  { type: 'success', tint: '--color-green-500', intent: 'success' },
  { type: 'info', tint: '--color-blue-500', intent: 'info' },
  { type: 'warning', tint: '--color-amber-500', intent: 'warning' },
  { type: 'error', tint: '--color-red-500', intent: 'danger' },
] as const;

// Canvas round trip: any CSS color (oklch, color-mix, hex…) as RGBA bytes.
const rgba = (color: string) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data);
};

// A theme token as the current theme resolves it (a missing one would read as black).
const tokenRgba = (token: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!value) throw new Error(`${token} is not defined`);
  return rgba(value);
};

// `fg` laid over the opaque `bg`, as the browser blends an alpha layer.
const over = (fg: number[], bg: number[]) =>
  [0, 1, 2].map((i) => Math.round((fg[i] * fg[3] + bg[i] * (255 - fg[3])) / 255));

const near = (a: number[], b: number[], tolerance = 3) =>
  a.slice(0, 3).every((channel, i) => Math.abs(channel - b[i]) <= tolerance);

const toastOfType = (type: string) => {
  const found = document.querySelector<HTMLElement>(`[data-sonner-toast][data-type="${type}"]`);
  if (!found) throw new Error(`No ${type} toast`);
  return found;
};

// A toast with no type (`toast('…')`) has no `data-type`: found by what it says.
const toastWithText = (text: string) => {
  const found = within(document.body).getByText(text).closest<HTMLElement>('[data-sonner-toast]');
  if (!found) throw new Error(`No toast says "${text}"`);
  return found;
};

const toastPart = (toastEl: Element, selector: string) => {
  const found = toastEl.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`No ${selector} in the toast`);
  return found;
};

/**
 * Runs `check` under each Cosmos theme: switches the class on <html>, waits for the Toaster to
 * take the matching `data-sonner-theme` (it follows the class after a render, and sonner's dark
 * rules key on that attribute), then calls it. Transitions are off meanwhile. A failure names its
 * theme.
 */
const eachTheme = async (check: (theme: (typeof THEMES)[number]) => void) => {
  const root = document.documentElement;
  const saved = root.className;
  const noTransitions = document.createElement('style');
  noTransitions.textContent = '*, *::before, *::after { transition: none !important; }';
  document.head.append(noTransitions);
  try {
    for (const theme of THEMES) {
      root.classList.remove('sand', 'dark', 'deep-blue');
      if (theme !== 'light') root.classList.add(theme);
      await waitFor(() =>
        expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute(
          'data-sonner-theme',
          isDarkTheme(theme) ? 'dark' : 'light'
        )
      );
      try {
        check(theme);
      } catch (error) {
        throw new Error(`[${theme}] ${(error as Error).message}`, { cause: error });
      }
    }
  } finally {
    root.className = saved;
    noTransitions.remove();
  }
};

const waitForToasts = (count: number) =>
  waitFor(() => expect(document.querySelectorAll('[data-sonner-toast]')).toHaveLength(count));

export const StatusToastsAreOpaque: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(() => keepOpen(showStatusToasts), []);
    return <Toaster expand visibleToasts={4} />;
  },
  play: async () => {
    await waitForToasts(4);
    await eachTheme((theme) => {
      for (const { type, tint } of STATUS) {
        const background = rgba(getComputedStyle(toastOfType(type)).backgroundColor);
        expect(background[3], `${type}: the background lets the page through`).toBe(255);
        // In the dark themes, the `-500/10` tint on the panel, in one layer. The tolerance covers
        // the success tint, which is outside sRGB: mixed as it is, it lands a few levels off the
        // same color clamped first.
        if (isDarkTheme(theme)) {
          const expected = over(
            [...tokenRgba(tint).slice(0, 3), 25.5],
            tokenRgba('--color-bg-panel')
          );
          expect(near(background, expected, 8), `${type}: ${background} is not ${expected}`).toBe(
            true
          );
        }
      }
    });
  },
};

export const StatusToastsMatchAlertBanner: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(() => keepOpen(showStatusToasts), []);
    return (
      <div className="flex max-w-md flex-col gap-2">
        {STATUS.map(({ type, intent }) => (
          <AlertBanner key={type} intent={intent} title={`${type} banner`}>
            Same intent as the {type} toast.
          </AlertBanner>
        ))}
        <Toaster expand visibleToasts={4} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    await waitForToasts(4);
    const banners = canvas.getAllByRole('alert');
    expect(banners).toHaveLength(STATUS.length);
    await eachTheme(() => {
      STATUS.forEach(({ type }, i) => {
        const banner = banners[i];
        const toastEl = toastOfType(type);
        const bannerTitle = toastPart(banner, 'p');
        expect(getComputedStyle(toastPart(toastEl, '[data-title]')).color, `${type} text`).toBe(
          getComputedStyle(bannerTitle).color
        );
        expect(getComputedStyle(toastEl).borderTopColor, `${type} border`).toBe(
          getComputedStyle(banner).borderTopColor
        );
        // The banner's translucent tint, on the panel the toast mixes it with.
        const expected = over(
          rgba(getComputedStyle(banner).backgroundColor),
          tokenRgba('--color-bg-panel')
        );
        const background = rgba(getComputedStyle(toastEl).backgroundColor);
        expect(near(background, expected, 8), `${type}: ${background} is not ${expected}`).toBe(
          true
        );
      });
    });
  },
};

export const StatusToastsAreReadable: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(() => keepOpen(showStatusToasts), []);
    return <Toaster expand visibleToasts={4} />;
  },
  play: async () => {
    await waitForToasts(4);
    // The contrast pass renders light, sand and deep-blue; `dark` is not part of it.
    await eachTheme(() => {
      for (const { type } of STATUS) {
        const toastEl = toastOfType(type);
        expectTextContrast(toastPart(toastEl, '[data-title]'));
        expectTextContrast(toastPart(toastEl, '[data-description]'));
      }
      expectTextContrast(toastPart(toastOfType('info'), 'button[data-action]'));
    });
  },
};

export const NeutralToastsShareTheCard: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(
      () =>
        keepOpen(() => [
          toast('Plain toast', { duration: Infinity }),
          toast.loading('Loading toast', { duration: Infinity }),
        ]),
      []
    );
    return <Toaster expand />;
  },
  play: async () => {
    await waitForToasts(2);
    await eachTheme((theme) => {
      const dark = isDarkTheme(theme);
      const card = {
        backgroundColor: tokenRgba(dark ? '--color-gray-900' : '--color-white'),
        borderTopColor: tokenRgba(dark ? '--color-gray-700' : '--color-gray-200'),
        color: tokenRgba(dark ? '--color-white' : '--color-gray-900'),
      };
      const colors = ['backgroundColor', 'borderTopColor', 'color'] as const;
      for (const [name, toastEl] of [
        ['default', toastWithText('Plain toast')],
        ['loading', toastOfType('loading')],
      ] as const) {
        for (const property of colors) {
          const actual = rgba(getComputedStyle(toastEl)[property]);
          expect(near(actual, card[property], 1), `${name} ${property}`).toBe(true);
          expect(actual[3], `${name} ${property} is translucent`).toBe(255);
        }
      }
    });
  },
};

// Sonner hides the content of the toasts behind the front one in its own styled mode: unstyled,
// the card does it.
export const StackedToastsHideBehindContent: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(
      () =>
        keepOpen(() => [
          toast.success('First', { duration: Infinity }),
          toast.info('Second', { duration: Infinity }),
          toast.warning('Third', { duration: Infinity }),
        ]),
      []
    );
    return <Toaster />;
  },
  play: async () => {
    await waitForToasts(3);
    const toasts = [...document.querySelectorAll<HTMLElement>('[data-sonner-toast]')];
    for (const toastEl of toasts) expect(toastEl).toHaveAttribute('data-expanded', 'false');
    await waitFor(() => {
      for (const toastEl of toasts) {
        const front = toastEl.getAttribute('data-front') === 'true';
        for (const part of toastEl.children) {
          expect(getComputedStyle(part).opacity, `${toastEl.textContent}: ${part.tagName}`).toBe(
            front ? '1' : '0'
          );
        }
      }
    });
  },
};

// Sonner's dark theme sets the description and the close button to its own grays, with rules that
// are not scoped to its styled mode: the toast takes the Cosmos neutrals in spite of them.
export const DarkThemeKeepsCosmosNeutrals: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(
      () =>
        keepOpen(() => [
          toast.success('Backup completed', {
            description: '3.2 GB transferred to S3 in 8.4 s.',
            duration: Infinity,
          }),
        ]),
      []
    );
    return <Toaster expand />;
  },
  play: async () => {
    await waitForToasts(1);
    await eachTheme((theme) => {
      const dark = isDarkTheme(theme);
      const toastEl = toastOfType('success');
      const description = rgba(getComputedStyle(toastPart(toastEl, '[data-description]')).color);
      expect(near(description, tokenRgba(dark ? '--color-gray-400' : '--color-gray-600'), 1)).toBe(
        true
      );
      const closeButton = getComputedStyle(toastPart(toastEl, '[data-close-button]'));
      const colors = {
        backgroundColor: dark ? '--color-gray-900' : '--color-white',
        borderTopColor: dark ? '--color-gray-700' : '--color-gray-200',
        color: dark ? '--color-gray-400' : '--color-gray-500',
      };
      for (const [property, token] of Object.entries(colors)) {
        const actual = rgba(closeButton[property as keyof typeof colors]);
        expect(near(actual, tokenRgba(token), 1), `close button ${property}`).toBe(true);
      }
    });
  },
};

export const ButtonsShowFocusRing: Story = {
  beforeEach: dismissLeftovers,
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    useEffect(
      () =>
        keepOpen(() => [
          toast('Email moved to Trash.', {
            duration: Infinity,
            action: { label: 'Undo', onClick: () => {} },
            cancel: { label: 'Keep', onClick: () => {} },
          }),
        ]),
      []
    );
    return <Toaster expand />;
  },
  play: async () => {
    await waitForToasts(1);
    const toastEl = toastWithText('Email moved to Trash.');
    await expectFocusRing(toastPart(toastEl, 'button[data-action]'));
    await expectFocusRing(toastPart(toastEl, 'button[data-cancel]'));
    await expectFocusRing(toastPart(toastEl, 'button[data-close-button]'));
  },
};
