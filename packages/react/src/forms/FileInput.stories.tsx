import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn } from 'storybook/test';
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
