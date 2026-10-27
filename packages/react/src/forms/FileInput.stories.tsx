import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useState } from 'react';
import { expect, fireEvent, fn, spyOn, userEvent } from 'storybook/test';
import {
  bothDirections,
  expectFocusBorder,
  expectMirrored,
  expectTextContrast,
} from '../storybook-helpers';
import { FileInput } from './FileInput';

const meta = {
  title: 'Forms/File Input',
  component: FileInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Attachment' },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { label: 'Attachments', multiple: true },
};

export const ImagesOnly: Story = {
  args: {
    label: 'Profile picture',
    accept: 'image/*',
    description: 'JPG, PNG or GIF — max 5 MB.',
  },
};

export const WithoutSize: Story = {
  args: { label: 'Document', showSize: false },
};

export const CustomLabels: Story = {
  args: {
    label: 'Resume',
    buttonLabel: 'Upload PDF',
    placeholder: 'Drop your resume here…',
    accept: '.pdf',
  },
};

export const WithError: Story = {
  args: {
    label: 'Logo',
    error: 'File must be smaller than 2 MB.',
  },
};

export const Disabled: Story = {
  args: { label: 'Locked', disabled: true },
};

/**
 * The field, dimmed when disabled, is `aria-disabled`: "No file chosen"
 * belongs to an inactive control, which axe then exempts from contrast.
 */
export const AriaDisabledFollowsDisabled: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-4">
      <FileInput label="Enabled" />
      <FileInput label="Disabled" disabled />
    </div>
  ),
  play: async ({ canvas }) => {
    const field = (label: string) => canvas.getByLabelText(label).closest('.h-ctrl-36');
    await expect(field('Enabled')).not.toHaveAttribute('aria-disabled');
    await expect(field('Disabled')).toHaveClass('opacity-50');
    await expect(field('Disabled')).toHaveAttribute('aria-disabled', 'true');
  },
};

export const Controlled: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    return (
      <div className="space-y-2">
        <FileInput label="Pick files" multiple onChange={(files) => setCount(files.length)} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Selected: <code>{count}</code> file(s)
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SelectingFileShowsName: Story = {
  tags: ['!dev'],
  args: { label: 'Doc', onChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByLabelText('Doc') as HTMLInputElement;
    const file = new File(['hello world'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(canvas.getByText(/note\.txt/)).toBeInTheDocument();
  },
};

export const MultipleShowsCount: Story = {
  tags: ['!dev'],
  args: { label: 'Docs', multiple: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Docs') as HTMLInputElement;
    const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
    const f2 = new File(['bb'], 'b.txt', { type: 'text/plain' });
    const f3 = new File(['ccc'], 'c.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [f1, f2, f3] } });
    await expect(canvas.getByText(/3 files/)).toBeInTheDocument();
  },
};

// In the dark themes `dark:border-*` used to win over `focus:border-*` (#151).
export const FocusShowsAccentBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button') as HTMLElement;
    await expectFocusBorder(button, { border: button.parentElement as HTMLElement });
  },
};

export const ErrorFocusShowsRedBorderInDark: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'dark' },
  args: { error: 'File too large' },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button') as HTMLElement;
    await expectFocusBorder(button, {
      border: button.parentElement as HTMLElement,
      token: '--color-red-500',
    });
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('File must be smaller than 2 MB.'));
  },
};

const fileInputRef = createRef<HTMLInputElement>();

/** The ref gets the file input, and the button still opens it. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Doc' },
  render: (args) => <FileInput {...args} ref={fileInputRef} />,
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Doc') as HTMLInputElement;
    await expect(fileInputRef.current).toBe(input);
    // A real click opens the file chooser: count it instead.
    const click = spyOn(input, 'click').mockImplementation(() => {});
    try {
      await userEvent.click(canvas.getByRole('button'));
      await expect(click).toHaveBeenCalledTimes(1);
    } finally {
      click.mockRestore();
    }
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The button is at the start; the file name is an island of its own script. */
export const ButtonAtTheStartInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => bothDirections(() => <FileInput label="Attachment" />),
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('button'));
    for (const island of canvasElement.querySelectorAll('bdi')) {
      expect(getComputedStyle(island).unicodeBidi).toBe('isolate');
    }
  },
};
