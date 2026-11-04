import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { Toggle } from '../forms/Toggle';
import { bothDirections, directionBox, expectTextContrast } from '../storybook-helpers';
import { expect } from 'storybook/test';
import { SectionLabel } from './SectionLabel';

const meta = {
  title: 'Atoms/Section Label',
  component: SectionLabel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Section title example' },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

const NotificationSettings = () => {
  const emailId = useId();
  const pushId = useId();
  return (
    <div className="w-full max-w-sm space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Notifications</h2>
      <section aria-labelledby={emailId} className="space-y-3">
        <SectionLabel as="h3" id={emailId}>
          Email
        </SectionLabel>
        <Toggle label="Weekly digest" defaultChecked />
        <Toggle label="Mentions and replies" defaultChecked />
        <Toggle label="Product news" />
      </section>
      <section aria-labelledby={pushId} className="space-y-3">
        <SectionLabel as="h3" id={pushId}>
          Push
        </SectionLabel>
        <Toggle label="Incidents" defaultChecked />
        <Toggle label="Deploys" />
      </section>
    </div>
  );
};

/**
 * A quiet title over a group of rows in a settings panel, a drawer or a form. It is a heading
 * here (`as="h3"`, named by the section it titles): the look is the same whatever the element.
 */
export const InASettingsPanel: Story = {
  render: () => <NotificationSettings />,
};

/** `p` by default. `as` picks the element the page needs: a heading, a `span`, a `div`. */
export const Elements: Story = {
  render: () => (
    <div className="space-y-3">
      <SectionLabel>Paragraph</SectionLabel>
      <SectionLabel as="h2">Heading 2</SectionLabel>
      <SectionLabel as="h3">Heading 3</SectionLabel>
      <SectionLabel as="h4">Heading 4</SectionLabel>
      <SectionLabel as="div">Div</SectionLabel>
      <fieldset className="m-0 border-0 p-0">
        <SectionLabel as="legend">Legend of a fieldset</SectionLabel>
      </fieldset>
      <SectionLabel as="span">Span</SectionLabel>
    </div>
  ),
};

/** 10px by default; `md` is 11px and `lg` 12px, for a label next to larger text. */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SectionLabel key={size} size={size}>
          {size} section title
        </SectionLabel>
      ))}
    </div>
  ),
};

export const ElementsAndSizesChecks: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div>
      <SectionLabel data-testid="default">Default</SectionLabel>
      <SectionLabel as="h2" data-testid="h2">
        Heading 2
      </SectionLabel>
      <SectionLabel as="h3" data-testid="h3">
        Heading 3
      </SectionLabel>
      <SectionLabel as="h4" data-testid="h4">
        Heading 4
      </SectionLabel>
      <SectionLabel as="div" data-testid="div">
        Div
      </SectionLabel>
      <SectionLabel as="span" data-testid="span">
        Span
      </SectionLabel>
      <fieldset>
        <SectionLabel as="legend" data-testid="legend">
          Legend
        </SectionLabel>
      </fieldset>
      <SectionLabel size="md" data-testid="md">
        Medium
      </SectionLabel>
      <SectionLabel size="lg" data-testid="lg" id="label-id" role="presentation">
        Large
      </SectionLabel>
    </div>
  ),
  play: async ({ canvas }) => {
    const tag = (id: string) => canvas.getByTestId(id).tagName.toLowerCase();
    await expect(tag('default')).toBe('p');
    for (const name of ['h2', 'h3', 'h4', 'div', 'span', 'legend'])
      await expect(tag(name)).toBe(name);
    const fontSize = (id: string) => parseFloat(getComputedStyle(canvas.getByTestId(id)).fontSize);
    await expect([fontSize('default'), fontSize('md'), fontSize('lg')]).toEqual([10, 11, 12]);
    // The attributes of the element go through: a heading can be named, a label can be presentational.
    await expect(canvas.getByTestId('lg')).toHaveAttribute('id', 'label-id');
    await expect(canvas.getByTestId('lg')).toHaveAttribute('role', 'presentation');
    // A heading is a heading and keeps the look.
    await expect(canvas.getByRole('heading', { level: 3, name: 'Heading 3' })).toHaveClass(
      'uppercase',
      'font-semibold'
    );
  },
};

// 10px gray-400 text sat at 2.6:1 on light and 2.35:1 on deep-blue (#151).
const contrastIn = (theme: string): Story => ({
  tags: ['!dev', '!autodocs'],
  globals: { theme },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Section title example'));
  },
});

export const ContrastInLight: Story = { ...contrastIn('light'), tags: ['!dev', '!autodocs'] };
export const ContrastInSand: Story = { ...contrastIn('sand'), tags: ['!dev', '!autodocs'] };
export const ContrastInDark: Story = { ...contrastIn('dark'), tags: ['!dev', '!autodocs'] };
export const ContrastInDeepBlue: Story = {
  ...contrastIn('deep-blue'),
  tags: ['!dev', '!autodocs'],
};

/** Letter spacing breaks the joins of Arabic script: right to left sets none. */
export const NoLetterSpacingInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <SectionLabel>Section title example</SectionLabel>),
  play: ({ canvasElement }) => {
    const spacing = (dir: 'ltr' | 'rtl') =>
      getComputedStyle(directionBox(canvasElement, dir).querySelector('p')!).letterSpacing;
    expect(spacing('ltr')).not.toBe('normal');
    expect(spacing('rtl')).toBe('normal');
  },
};
