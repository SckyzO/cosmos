import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bug, CreditCard, Info, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { inEachTheme } from '../storybook-helpers';
import { Accordion } from './Accordion';
import { Button } from './Button';

const meta = {
  title: 'Data/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // Storybook 10 requires `args` when the component has required props.
  args: { type: 'single', collapsible: true, children: null as ReactNode },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ = [
  {
    q: 'What is Cosmos?',
    a: 'Cosmos is the design system used across sckyzo projects — a Tailwind 4 theme + a React 19 component library + opinionated chart wrappers.',
  },
  {
    q: 'Is it production-ready?',
    a: 'It powers rackscope and several internal tools. The component API is still evolving, but breaking changes are documented in the changelog.',
  },
  {
    q: 'Can I use it in my project?',
    a: 'Sure — packages are published under @sckyzo/* on npm. You only need React 19 + Tailwind 4 in your app.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Open an issue on the GitHub repo with a reproduction. Minimal Storybook stories are very welcome.',
  },
];

// One icon per row of `FAQ`.
const FAQ_ICONS = [Info, ShieldCheck, CreditCard, Bug];

// ── Stories ──────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-0" collapsible>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-0', 'item-2']}>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const Seamless: Story = {
  render: () => (
    <Accordion type="single" appearance="seamless" collapsible>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const HideChevron: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger hideChevron>Collapsed by default → Click me</Accordion.Trigger>
        <Accordion.Content>No chevron indicator on this item.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger hideChevron>Another silent item</Accordion.Trigger>
        <Accordion.Content>Useful for kiosk-style menus.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const RichContent: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Pricing breakdown</Accordion.Trigger>
        <Accordion.Content>
          <ul className="list-disc space-y-1 ps-5 marker:text-gray-400">
            <li>
              <strong>Free</strong> — 0 € / month
            </li>
            <li>
              <strong>Pro</strong> — 29 € / month, 10 seats
            </li>
            <li>
              <strong>Team</strong> — 99 € / month, unlimited
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Annual billing saves 20 % on every plan.
          </p>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Cancellation policy</Accordion.Trigger>
        <Accordion.Content>
          You can cancel anytime — your subscription stays active until the end of the billing
          period, no questions asked.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('item-0');
    return (
      <div className="space-y-3">
        <Accordion type="single" collapsible value={value} onValueChange={setValue}>
          {FAQ.slice(0, 3).map((row, i) => (
            <Accordion.Item key={i} value={`item-${i}`}>
              <Accordion.Trigger>{row.q}</Accordion.Trigger>
              <Accordion.Content>{row.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
        <p className="text-xs text-[var(--color-text-muted)]">
          Currently open: <code>{value || '(none)'}</code>
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Open me</Accordion.Trigger>
        <Accordion.Content>Hello.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2" disabled>
        <Accordion.Trigger>This one is disabled</Accordion.Trigger>
        <Accordion.Content>Will never open.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['sm', 'md'] as const).map((size) => (
        <Accordion key={size} type="single" collapsible defaultValue="item-0" size={size}>
          {FAQ.slice(0, 2).map((row, i) => (
            <Accordion.Item key={i} value={`item-${i}`}>
              <Accordion.Trigger>
                {row.q} ({size})
              </Accordion.Trigger>
              <Accordion.Content>{row.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-0" collapsible>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger icon={FAQ_ICONS[i]}>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const WithIconMultiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-0', 'item-2']}>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger icon={FAQ_ICONS[i]}>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

export const AccentOpen: Story = {
  render: () => (
    <div className="space-y-6">
      {(['sm', 'md'] as const).map((size) => (
        <Accordion
          key={size}
          type="single"
          collapsible
          defaultValue="item-0"
          size={size}
          accentOpen
        >
          {FAQ.slice(0, 3).map((row, i) => (
            <Accordion.Item key={i} value={`item-${i}`}>
              <Accordion.Trigger icon={FAQ_ICONS[i]}>
                {row.q} ({size})
              </Accordion.Trigger>
              <Accordion.Content>{row.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      ))}
    </div>
  ),
};

export const AccentOpenSeamless: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-0', 'item-2']} appearance="seamless" accentOpen>
      {FAQ.map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger icon={FAQ_ICONS[i]}>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickTriggerOpens: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Click me</Accordion.Trigger>
        <Accordion.Content>Revealed content</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Click me' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByText('Revealed content')).toBeVisible());
  },
};

export const SingleClosesOthers: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>First</Accordion.Trigger>
        <Accordion.Content>Content one</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Second</Accordion.Trigger>
        <Accordion.Content>Content two</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByRole('button', { name: 'First' });
    const second = canvas.getByRole('button', { name: 'Second' });
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(second);
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    // type=single → opening Second closes First.
    await expect(first).toHaveAttribute('aria-expanded', 'false');
  },
};

export const DisabledBlocksClick: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1" disabled>
        <Accordion.Trigger>Locked</Accordion.Trigger>
        <Accordion.Content>Hidden</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Locked' });
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger).catch(() => undefined);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const DisabledLooksDisabled: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Live</Accordion.Trigger>
        <Accordion.Content>Hello.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2" disabled>
        <Accordion.Trigger>Locked</Accordion.Trigger>
        <Accordion.Content>Hidden.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const live = canvas.getByRole('button', { name: 'Live' });
    const locked = canvas.getByRole('button', { name: 'Locked' });
    await expect(getComputedStyle(locked).cursor).toBe('not-allowed');
    await expect(Number(getComputedStyle(locked).opacity)).toBeLessThan(1);
    await expect(getComputedStyle(live).opacity).toBe('1');
  },
};

export const SizeMdIsLarger: Story = {
  tags: ['!dev'],
  render: () => (
    <div>
      {(['sm', 'md'] as const).map((size) => (
        <Accordion key={size} type="single" collapsible size={size}>
          <Accordion.Item value="a">
            <Accordion.Trigger>{`Trigger ${size}`}</Accordion.Trigger>
            <Accordion.Content>Body</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const sm = canvas.getByRole('button', { name: 'Trigger sm' });
    const md = canvas.getByRole('button', { name: 'Trigger md' });
    await expect(getComputedStyle(sm).paddingTop).toBe('12px');
    await expect(parseFloat(getComputedStyle(md).paddingTop)).toBeGreaterThan(12);
    await expect(parseFloat(getComputedStyle(md).fontSize)).toBeGreaterThan(
      parseFloat(getComputedStyle(sm).fontSize)
    );
  },
};

// The trigger, its icon and its chevron, as the tests read them.
const parts = (trigger: HTMLElement) => {
  const svgs = trigger.querySelectorAll('svg');
  return { title: trigger, icon: svgs.length > 1 ? svgs[0] : null, chevron: svgs[svgs.length - 1] };
};

// The color a class list gives in the current theme, read off a probe: the story names the classes
// the design calls for (Tailwind sees them here), the theme decides what they resolve to.
const colorOf = (classes: string) => {
  const probe = document.createElement('span');
  probe.className = classes;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
};

const ACCENT = 'text-brand-600 dark:text-brand-400';

// A row is accented or plain, whole: title, icon (when there is one) and chevron.
const expectTone = (trigger: HTMLElement, tone: 'accent' | 'plain') => {
  const { title, icon, chevron } = parts(trigger);
  const accent = tone === 'accent';
  expect(getComputedStyle(title).color).toBe(
    colorOf(accent ? ACCENT : 'text-gray-900 dark:text-white')
  );
  if (icon) {
    expect(getComputedStyle(icon).color).toBe(
      colorOf(accent ? ACCENT : 'text-gray-500 dark:text-gray-400')
    );
  }
  expect(getComputedStyle(chevron).color).toBe(colorOf(accent ? ACCENT : 'text-gray-400'));
};

const expectTones = (triggers: [HTMLElement, 'accent' | 'plain'][]) =>
  inEachTheme(() => triggers.forEach(([trigger, tone]) => expectTone(trigger, tone)));

export const IconAndAccentKeepKeyboardAndAria: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="single" collapsible accentOpen>
      {FAQ.slice(0, 3).map((row, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Trigger icon={FAQ_ICONS[i]}>{row.q}</Accordion.Trigger>
          <Accordion.Content>{row.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
  play: async ({ canvas }) => {
    // The icon is decorative: the name of a trigger stays its title.
    const first = canvas.getByRole('button', { name: FAQ[0].q });
    const second = canvas.getByRole('button', { name: FAQ[1].q });
    const third = canvas.getByRole('button', { name: FAQ[2].q });

    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(second).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(third).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(second).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(first).toHaveFocus();

    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('region', { name: FAQ[0].q })).toBeVisible();

    // type=single: opening the second with Space closes the first.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard(' ');
    await expect(second).toHaveAttribute('aria-expanded', 'false');
  },
};

export const AccentOpenColorsTheOpenItemOnly: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="multiple" defaultValue={['a']} accentOpen>
      <Accordion.Item value="a">
        <Accordion.Trigger icon={Info}>Row A</Accordion.Trigger>
        <Accordion.Content>Body A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger icon={Bug}>Row B</Accordion.Trigger>
        <Accordion.Content>Body B</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="c">
        <Accordion.Trigger>Row C, no icon</Accordion.Trigger>
        <Accordion.Content>Body C</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvas }) => {
    const a = canvas.getByRole('button', { name: 'Row A' });
    const b = canvas.getByRole('button', { name: 'Row B' });
    const c = canvas.getByRole('button', { name: 'Row C, no icon' });
    // The accent and the plain colors differ, or the checks below would prove nothing.
    inEachTheme(() => expect(colorOf(ACCENT)).not.toBe(colorOf('text-gray-900 dark:text-white')));

    expectTones([
      [a, 'accent'],
      [b, 'plain'],
      [c, 'plain'],
    ]);

    // type=multiple: B and C open next to A, and every open row takes the accent.
    await userEvent.click(b);
    await userEvent.click(c);
    expectTones([
      [a, 'accent'],
      [b, 'accent'],
      [c, 'accent'],
    ]);

    // Closing A takes its accent back; the others keep theirs.
    await userEvent.click(a);
    await expect(a).toHaveAttribute('aria-expanded', 'false');
    expectTones([
      [a, 'plain'],
      [b, 'accent'],
      [c, 'accent'],
    ]);
  },
};

export const AccentOpenIsOffByDefault: Story = {
  tags: ['!dev'],
  render: () => (
    <Accordion type="multiple" defaultValue={['a']}>
      <Accordion.Item value="a">
        <Accordion.Trigger icon={Info}>Open row</Accordion.Trigger>
        <Accordion.Content>Body A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger icon={Bug}>Closed row</Accordion.Trigger>
        <Accordion.Content>Body B</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: ({ canvas }) => {
    const open = canvas.getByRole('button', { name: 'Open row' });
    const closed = canvas.getByRole('button', { name: 'Closed row' });
    expect(open).toHaveAttribute('aria-expanded', 'true');
    // Without the prop, the open row is as plain as the closed one.
    expectTones([
      [open, 'plain'],
      [closed, 'plain'],
    ]);
  },
};

// Where the text of `el` starts, whatever its padding: its left edge, or minus its right edge in
// right to left, so two values compare the same way in both directions.
const textStart = (el: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const box = range.getBoundingClientRect();
  // From the parent: a title sits in a `<bdi>`, which can pick a direction of its own.
  return getComputedStyle(el.parentElement!).direction === 'rtl' ? -box.right : box.left;
};

export const ContentAlignsUnderTheTitle: Story = {
  tags: ['!dev'],
  render: () => (
    <div className="space-y-6">
      {(['sm', 'md'] as const).map((size) => (
        <Accordion key={size} type="multiple" size={size} defaultValue={['with', 'without']}>
          <Accordion.Item value="with">
            <Accordion.Trigger icon={Bug}>{`With icon ${size}`}</Accordion.Trigger>
            <Accordion.Content>{`Body with icon ${size}`}</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="without">
            <Accordion.Trigger>{`Without icon ${size}`}</Accordion.Trigger>
            <Accordion.Content>{`Body without icon ${size}`}</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const size of ['sm', 'md']) {
      const withTitle = canvas.getByText(`With icon ${size}`);
      const withBody = await canvas.findByText(`Body with icon ${size}`);
      const withoutTitle = canvas.getByText(`Without icon ${size}`);
      const withoutBody = await canvas.findByText(`Body without icon ${size}`);

      // The text of the content starts where the title starts, icon or not.
      await expect(textStart(withBody)).toBeCloseTo(textStart(withTitle), 0);
      await expect(textStart(withoutBody)).toBeCloseTo(textStart(withoutTitle), 0);

      // The indent is the icon (16px) and its gap (8px), and only the item with an icon has it.
      const paddingStart = (el: HTMLElement) => parseFloat(getComputedStyle(el).paddingInlineStart);
      await expect(paddingStart(withBody) - paddingStart(withoutBody)).toBe(24);
    }
  },
};

export const ContentFollowsTheIcon: Story = {
  tags: ['!dev'],
  render: () => {
    const [withIcon, setWithIcon] = useState(true);
    return (
      <div className="space-y-3">
        <Button onClick={() => setWithIcon((v) => !v)}>Toggle icon</Button>
        <Accordion type="single" collapsible defaultValue="a">
          <Accordion.Item value="a">
            <Accordion.Trigger icon={withIcon ? Bug : undefined}>Row</Accordion.Trigger>
            <Accordion.Content>Body</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const body = await canvas.findByText('Body');
    const paddingStart = () => parseFloat(getComputedStyle(body).paddingInlineStart);
    await expect(paddingStart()).toBe(40);
    await expect(textStart(body)).toBeCloseTo(textStart(canvas.getByText('Row')), 0);

    // Taking the icon away takes the indent with it, and putting it back restores it.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle icon' }));
    await waitFor(() => expect(paddingStart()).toBe(16));
    await expect(textStart(body)).toBeCloseTo(textStart(canvas.getByText('Row')), 0);
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle icon' }));
    await waitFor(() => expect(paddingStart()).toBe(40));
  },
};
