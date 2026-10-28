import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AlertBanner } from './AlertBanner';
import { Button } from './Button';
import { expectTextContrast, inEachTheme } from '../storybook-helpers';

const meta = {
  title: 'Feedback/Alert Banner',
  component: AlertBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Alert message' },
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { intent: 'success', children: 'Settings saved successfully.' },
};
export const Error: Story = {
  args: { intent: 'danger', children: 'Failed to connect to Prometheus.' },
};
export const Warning: Story = {
  args: { intent: 'warning', children: 'Simulator is running with overrides active.' },
};
export const Info: Story = {
  args: { intent: 'info', children: 'Changes will take effect on next scrape cycle.' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="success">Settings saved successfully.</AlertBanner>
      <AlertBanner intent="danger">Failed to connect to Prometheus.</AlertBanner>
      <AlertBanner intent="warning">Simulator is running with overrides active.</AlertBanner>
      <AlertBanner intent="info">Changes will take effect on next scrape cycle.</AlertBanner>
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    intent: 'warning',
    title: 'Scrape interval is short',
    children:
      'Targets are scraped every 5 seconds. A long message wraps next to the icon, which stays aligned with the title.',
  },
};

export const WithAction: Story = {
  args: {
    intent: 'danger',
    title: 'Failed to connect to Prometheus',
    children: 'The last attempt timed out after 30 seconds.',
    action: (
      <Button variant="secondary" intent="danger" size="sm">
        Retry
      </Button>
    ),
  },
};

export const Dismissible: Story = {
  args: {
    intent: 'success',
    children: 'Settings saved successfully.',
    onDismiss: fn(),
  },
};

const LONG_BODY =
  'Targets are scraped every 5 seconds. A long body wraps next to the icon, and the icon stays aligned with the title.';

/** `appearance="accent"`: the tinted background with a left edge in the intent color, no full border. */
export const Accent: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner appearance="accent" intent="success">
        Settings saved successfully.
      </AlertBanner>
      <AlertBanner appearance="accent" intent="danger">
        Failed to connect to Prometheus.
      </AlertBanner>
      <AlertBanner appearance="accent" intent="warning">
        Simulator is running with overrides active.
      </AlertBanner>
      <AlertBanner appearance="accent" intent="info">
        Changes will take effect on next scrape cycle.
      </AlertBanner>
    </div>
  ),
};

export const AccentWithTitle: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner appearance="accent" intent="success" title="Settings saved">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner appearance="accent" intent="danger" title="Failed to connect to Prometheus">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner appearance="accent" intent="warning" title="Scrape interval is short">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner appearance="accent" intent="info" title="Next scrape cycle">
        {LONG_BODY}
      </AlertBanner>
    </div>
  ),
};

export const AccentWithActionAndDismiss: Story = {
  args: {
    appearance: 'accent',
    intent: 'danger',
    title: 'Failed to connect to Prometheus',
    children: 'The last attempt timed out after 30 seconds.',
    action: (
      <Button variant="secondary" intent="danger" size="sm">
        Retry
      </Button>
    ),
    onDismiss: fn(),
  },
};

/**
 * `bodyTone="neutral"`: the body under the title in gray, the title keeps the intent color. It is
 * independent of `appearance`, so it also reads on a `tinted` banner. Without a title the body is
 * the only line and keeps the intent color.
 */
export const NeutralBody: Story = {
  render: () => (
    <div className="space-y-2">
      <AlertBanner appearance="accent" bodyTone="neutral" intent="success" title="Settings saved">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner
        appearance="accent"
        bodyTone="neutral"
        intent="danger"
        title="Failed to connect to Prometheus"
        action={
          <Button variant="secondary" intent="danger" size="sm">
            Retry
          </Button>
        }
        onDismiss={fn()}
      >
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner appearance="accent" bodyTone="neutral" intent="warning" title="Short interval">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner bodyTone="neutral" intent="info" title="Tinted, neutral body">
        {LONG_BODY}
      </AlertBanner>
      <AlertBanner appearance="accent" bodyTone="neutral" intent="info">
        No title: the body keeps the intent color.
      </AlertBanner>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

/** Each `intent` keeps its colors, `danger` being the red the old `error` was; `info` is the default. */
export const IntentColorsTheBanner: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="success">success</AlertBanner>
      <AlertBanner intent="danger">danger</AlertBanner>
      <AlertBanner intent="warning">warning</AlertBanner>
      <AlertBanner intent="info">info</AlertBanner>
      <AlertBanner>default</AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = (label: string) => canvas.getByText(label).closest('[role="alert"]')!;
    await expect(banner('success')).toHaveClass('border-green-200', 'bg-green-50');
    await expect(banner('danger')).toHaveClass('border-red-200', 'bg-red-50');
    await expect(banner('warning')).toHaveClass('border-amber-200', 'bg-amber-50');
    await expect(banner('info')).toHaveClass('border-blue-200', 'bg-blue-50');
    await expect(banner('default').className).toBe(banner('info').className);
    await expect(canvas.getByText('danger')).toHaveClass('text-red-700');
    await expect(banner('danger').querySelector('svg')).toHaveClass('text-red-500');
  },
};

/** The close button has an accessible name and reports the click; the host removes the banner. */
export const DismissCallsOnDismiss: Story = {
  tags: ['!dev', '!autodocs'],
  args: { intent: 'info', title: 'Heads up', children: 'Closable.', onDismiss: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss alert' }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

/** Without `onDismiss` there is no close button; the action sits beside the text. */
export const NoDismissWithoutCallback: Story = {
  tags: ['!dev', '!autodocs'],
  args: { children: 'Plain', action: <a href="#more">More</a> },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getByRole('link', { name: 'More' })).toBeVisible();
  },
};

/** With a title the icon aligns to the top; without one the row stays centered, as before. */
export const IconAlignsWithTitle: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner title="Titled">with title</AlertBanner>
      <AlertBanner>no title</AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = (label: string) => canvas.getByText(label).closest('[role="alert"]')!;
    await expect(banner('with title')).toHaveClass('items-start');
    await expect(banner('no title')).toHaveClass('items-center');
    await expect(banner('no title')).toHaveClass('rounded-lg');
  },
};

/** The expected color of a theme token, read the way the banner's own classes resolve it. */
const tokenColor = (token: string) => {
  const probe = document.createElement('i');
  probe.style.color = `var(--color-${token})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
};

const isDark = () => document.documentElement.matches('.dark, .deep-blue');

/** Without the new props nothing moves: a full 1px border, no edge, the body in the intent color. */
export const DefaultLooksAsBefore: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="danger" title="Plain title">
        plain body
      </AlertBanner>
      <AlertBanner intent="danger" title="Explicit title" appearance="tinted" bodyTone="intent">
        explicit body
      </AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = (label: string) =>
      canvas.getByText(label).closest<HTMLElement>('[role="alert"]')!;
    const [plain, explicit] = [banner('plain body'), banner('explicit body')];
    for (const el of [plain, explicit]) {
      const style = getComputedStyle(el);
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        await expect(style[`border${side}Width`]).toBe('1px');
      }
      await expect(el).toHaveClass('border', 'border-red-200', 'bg-red-50');
      await expect(el).not.toHaveClass('border-s-4');
    }
    // `tinted` and `intent` are the defaults: spelling them out changes nothing.
    await expect(plain.className).toBe(explicit.className);
    await expect(getComputedStyle(canvas.getByText('plain body')).color).toBe(
      getComputedStyle(canvas.getByText('Plain title')).color
    );
  },
};

/** `accent` has a 4px edge at the start of the line and no border elsewhere, on the same tinted background. */
export const AccentDrawsStartEdgeOnly: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="success">success tinted</AlertBanner>
      <AlertBanner intent="success" appearance="accent">
        success accent
      </AlertBanner>
      <AlertBanner intent="danger" appearance="accent">
        danger accent
      </AlertBanner>
      <AlertBanner intent="warning" appearance="accent">
        warning accent
      </AlertBanner>
      <AlertBanner intent="info" appearance="accent">
        info accent
      </AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const banner = (label: string) =>
      canvas.getByText(label).closest<HTMLElement>('[role="alert"]')!;
    const hues = { success: 'green', danger: 'red', warning: 'amber', info: 'blue' } as const;
    for (const [intent, hue] of Object.entries(hues)) {
      const el = banner(`${intent} accent`);
      const style = getComputedStyle(el);
      await expect(style.borderInlineStartWidth).toBe('4px');
      for (const side of ['Top', 'InlineEnd', 'Bottom'] as const) {
        await expect(style[`border${side}Width`]).toBe('0px');
      }
      await expect(el).toHaveClass('border-s-4', `border-s-${hue}-600`, `bg-${hue}-50`);
      await expect(el).not.toHaveClass('border');
      // The edge is -600 in the light themes and -500 in the dark ones; the surface stays tinted.
      inEachTheme(() => {
        expect(getComputedStyle(el).borderInlineStartColor).toBe(
          tokenColor(`${hue}-${isDark() ? 500 : 600}`)
        );
      });
    }
    await expect(getComputedStyle(banner('success accent')).backgroundColor).toBe(
      getComputedStyle(banner('success tinted')).backgroundColor
    );
  },
};

/** `accent` changes the look only: still one `role="alert"`, the dismiss button and the action work. */
export const AccentKeepsAlertRoleAndDismiss: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    appearance: 'accent',
    intent: 'danger',
    title: 'Failed',
    children: 'Closable.',
    action: <a href="#retry">Retry</a>,
    onDismiss: fn(),
  },
  play: async ({ args, canvas }) => {
    await expect(canvas.getAllByRole('alert')).toHaveLength(1);
    await expect(within(canvas.getByRole('alert')).getByText('Failed')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Retry' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss alert' }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

/**
 * `bodyTone="neutral"` grays the body under a title and leaves the title in the intent color; with
 * no title it does nothing. Readable in the four themes.
 */
export const NeutralBodyKeepsTitleColor: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-2">
      <AlertBanner intent="danger" title="Titled intent">
        intent body
      </AlertBanner>
      <AlertBanner intent="danger" title="Titled neutral" bodyTone="neutral">
        neutral body
      </AlertBanner>
      <AlertBanner intent="warning" title="Titled warning" bodyTone="neutral" appearance="accent">
        warning neutral body
      </AlertBanner>
      <AlertBanner intent="danger">untitled intent</AlertBanner>
      <AlertBanner intent="danger" bodyTone="neutral">
        untitled neutral
      </AlertBanner>
    </div>
  ),
  play: async ({ canvas }) => {
    const color = (label: string) => getComputedStyle(canvas.getByText(label)).color;
    // The title is the intent color in both; only the body under it changes.
    await expect(color('Titled neutral')).toBe(color('Titled intent'));
    await expect(color('intent body')).toBe(color('Titled intent'));
    await expect(color('neutral body')).not.toBe(color('Titled neutral'));
    await expect(canvas.getByText('neutral body')).toHaveClass('text-gray-700');
    // Gray whatever the intent.
    await expect(color('warning neutral body')).toBe(color('neutral body'));
    // No title: the body is the only line, in the intent color.
    await expect(color('untitled neutral')).toBe(color('untitled intent'));
    await expect(canvas.getByText('untitled neutral')).toHaveClass('text-red-700');
    inEachTheme(() => {
      expectTextContrast(canvas.getByText('neutral body'));
      expectTextContrast(canvas.getByText('warning neutral body'));
      expectTextContrast(canvas.getByText('Titled neutral'));
      expectTextContrast(canvas.getByText('Titled warning'));
    });
  },
};
