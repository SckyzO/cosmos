import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag as TagIcon, Zap } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Tag } from './Tag';
import type { Intent } from './intent';
import { SectionCard } from '../templates/SectionCard';
import {
  bothDirections,
  expectFocusRing,
  expectMirrored,
  expectRefFocuses,
  expectTextContrast,
  inEachTheme,
} from '../storybook-helpers';

const meta = {
  title: 'Atoms/Tag',
  component: Tag,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Tag' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

const INTENTS: Intent[] = ['neutral', 'brand', 'info', 'success', 'warning', 'danger'];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Intents: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Intents × sizes">
        <div className="space-y-3">
          {(['sm', 'md'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              <span className="text-3xs w-6 font-mono text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              {INTENTS.map((intent) => (
                <Tag key={intent} intent={intent} size={size}>
                  {intent}
                </Tag>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        <Tag icon={TagIcon}>Category</Tag>
        <Tag intent="brand" icon={Zap}>
          Pro
        </Tag>
        <Tag intent="success" size="sm" icon={TagIcon} onRemove={() => {}}>
          Small
        </Tag>
      </div>
    </Wrap>
  ),
};

const RemovableDemo = ({ onRemove }: { onRemove?: (name: string) => void }) => {
  const [names, setNames] = useState(['Design', 'Billing', 'Mobile']);
  return (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {names.map((name) => (
          <Tag
            key={name}
            intent="brand"
            onRemove={() => {
              onRemove?.(name);
              setNames((all) => all.filter((n) => n !== name));
            }}
          >
            {name}
          </Tag>
        ))}
      </div>
    </Wrap>
  );
};

/** The X is a button named "Remove {text}"; Tab reaches it, Enter and Space press it. */
export const Removable: Story = {
  tags: ['!autodocs'],
  render: () => <RemovableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Billing' }));
    await expect(canvas.queryByText('Billing')).not.toBeInTheDocument();
    await expect(canvas.getByText('Design')).toBeInTheDocument();
    await expect(canvas.getByText('Mobile')).toBeInTheDocument();
  },
};

export const RemovableByKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <RemovableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'Remove Design' });
    await expectFocusRing(first);
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByText('Design')).not.toBeInTheDocument();
    // The next tag's button is the next tab stop; Space presses it too.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Remove Billing' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(canvas.queryByText('Billing')).not.toBeInTheDocument();
  },
};

export const RemoveButtonHitArea: Story = {
  tags: ['!dev'],
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2">
        <Tag size="sm" onRemove={() => {}}>
          Small
        </Tag>
        <Tag size="md" onRemove={() => {}}>
          Medium
        </Tag>
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Remove Small', 'Remove Medium']) {
      const button = canvas.getByRole('button', { name });
      // The X is drawn smaller than 24px; its pseudo-element is the target (WCAG 2.5.8).
      const box = getComputedStyle(button, '::before');
      expect(parseFloat(box.width)).toBeGreaterThanOrEqual(24);
      expect(parseFloat(box.height)).toBeGreaterThanOrEqual(24);
      expect(button.getBoundingClientRect().width).toBeLessThan(24);
    }
  },
};

export const RemoveLabel: Story = {
  tags: ['!dev'],
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2">
        <Tag onRemove={() => {}}>
          <b>Bold</b> text
        </Tag>
        <Tag onRemove={() => {}} removeLabel="Clear status filter">
          Status · Open
        </Tag>
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The name is read from the text of `children`, or set by `removeLabel`.
    await expect(canvas.getByRole('button', { name: 'Remove Bold text' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Clear status filter' })).toBeInTheDocument();
  },
};

export const Link: Story = {
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        <Tag href="#tag-link" intent="info">
          Documentation
        </Tag>
        <Tag href="#tag-link" intent="info" onRemove={() => {}}>
          Removable link
        </Tag>
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Documentation' });
    await expect(link).toHaveAttribute('href', '#tag-link');
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    await expectFocusRing(link);
  },
};

export const Clickable: Story = {
  args: { children: 'Filter', intent: 'brand', onClick: fn() },
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Filter' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Disabled: Story = {
  tags: ['!autodocs'],
  args: { onRemove: fn(), onClick: fn() },
  render: (args) => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        <Tag disabled intent="brand" onRemove={args.onRemove} onClick={args.onClick}>
          Locked
        </Tag>
        <Tag disabled href="#tag-link">
          Disabled link
        </Tag>
        <Tag disabled>Plain</Tag>
      </div>
    </Wrap>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole('button', { name: 'Remove Locked' });
    await expect(remove).toBeDisabled();
    await userEvent.click(remove);
    await userEvent.click(canvas.getByText('Locked'));
    await expect(args.onRemove).not.toHaveBeenCalled();
    await expect(args.onClick).not.toHaveBeenCalled();
    // A disabled link is no link: nothing to tab to.
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[aria-disabled="true"]')).toHaveLength(3);
  },
};

// Shared with the play function: the story renders once, the refs outlive it.
const refs = {
  link: createRef<HTMLElement>(),
  button: createRef<HTMLElement>(),
  remove: createRef<HTMLElement>(),
  plain: createRef<HTMLElement>(),
};

/** `ref` points at the element that takes focus: the link, the button, else the X. */
export const RefFocuses: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex items-center gap-2">
        <Tag ref={refs.link} href="#tag-ref">
          Link
        </Tag>
        <Tag ref={refs.button} onClick={() => {}}>
          Button
        </Tag>
        <Tag ref={refs.remove} onRemove={() => {}}>
          Removable
        </Tag>
        <Tag ref={refs.plain}>Plain</Tag>
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectRefFocuses(refs.link, canvas.getByRole('link', { name: 'Link' }));
    await expectRefFocuses(refs.button, canvas.getByRole('button', { name: 'Button' }));
    await expectRefFocuses(refs.remove, canvas.getByRole('button', { name: 'Remove Removable' }));
    // Nothing to focus: the ref is the root element.
    await expect(refs.plain.current?.textContent).toBe('Plain');
  },
};

export const ContrastInEveryTheme: Story = {
  tags: ['!dev'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((intent) => (
          <Tag key={intent} intent={intent} onRemove={() => {}}>
            {intent}
          </Tag>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    inEachTheme(() => {
      for (const intent of INTENTS) expectTextContrast(canvas.getByText(intent));
    });
  },
};

export const TruncatesLongText: Story = {
  tags: ['!dev'],
  render: () => (
    <Wrap>
      <div className="w-48">
        <Tag intent="brand" onRemove={() => {}}>
          A very long label that cannot fit in the box
        </Tag>
      </div>
    </Wrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole('button', { name: /^Remove A very long/ });
    const box = canvasElement.querySelector<HTMLElement>('.w-48')!.getBoundingClientRect();
    // The X stays inside the tag while the text is cut.
    expect(remove.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    expect(remove.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.left);
  },
};

/** The icon leads the label and the remove button ends the tag: on the right and left in right to left. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <Tag intent="brand" icon={Zap} onRemove={() => {}}>
        Design
      </Tag>
    )),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('svg'));
    expectMirrored(canvasElement, (box) => box.querySelector('button'));
  },
};

/** A name in the other script is an island: its own direction, whatever the tag's. */
export const LabelIsIsolated: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex gap-3">
      <div dir="rtl">
        <Tag>Design</Tag>
      </div>
      <div dir="ltr">
        <Tag>تصميم</Tag>
      </div>
    </div>
  ),
  play: ({ canvasElement }) => {
    const [latin, arabic] = [...canvasElement.querySelectorAll('bdi')];
    expect(getComputedStyle(latin!).direction).toBe('ltr');
    expect(getComputedStyle(arabic!).direction).toBe('rtl');
  },
};
