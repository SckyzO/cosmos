import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { expect, fireEvent } from 'storybook/test';
import { Dropzone } from './Dropzone';

const meta = {
  title: 'Forms/Dropzone',
  component: Dropzone,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Upload files',
    description: 'PNG, JPG or PDF — up to 10 MB.',
    multiple: true,
  },
};

export const SingleFile: Story = {
  args: {
    label: 'Profile picture',
    description: 'JPG or PNG only.',
    accept: 'image/*',
  },
};

export const WithMaxSize: Story = {
  args: {
    label: 'Logo',
    description: 'Max 100 KB to keep the bundle small.',
    accept: 'image/*',
    maxSize: 100 * 1024,
  },
};

export const WithMaxFiles: Story = {
  args: {
    label: 'Attachments',
    description: 'Up to 3 files, any type.',
    multiple: true,
    maxFiles: 3,
  },
};

export const WithError: Story = {
  args: {
    label: 'Avatar',
    error: 'Could not upload — please retry.',
    accept: 'image/*',
  },
};

export const Disabled: Story = {
  args: { label: 'Locked uploader', disabled: true, multiple: true },
};

export const HideFileList: Story = {
  args: {
    label: 'Quiet uploader',
    description: 'List of selected files is hidden.',
    multiple: true,
    hideFileList: true,
  },
};

export const CustomContent: Story = {
  args: { label: 'Drop image' },
  render: (args) => (
    <Dropzone {...args}>
      <ImageIcon className="h-8 w-8 text-violet-400" aria-hidden />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Drop your masterpiece here
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG up to 5 MB</p>
    </Dropzone>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);
    return (
      <div className="space-y-3">
        <Dropzone label="Pick files" multiple value={files} onChange={setFiles} />
        <p className="text-xs text-[var(--color-text-muted)]">
          Total: <code>{files.length}</code> file(s) ·{' '}
          <code>{files.reduce((s, f) => s + f.size, 0)}</code> bytes
        </p>
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SelectingViaInputAddsFile: Story = {
  args: { label: 'Doc', multiple: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Doc') as HTMLInputElement;
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText('note.txt')).toBeInTheDocument();
  },
};

export const RemovingClearsFile: Story = {
  args: { label: 'Removable', multiple: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Removable') as HTMLInputElement;
    const file = new File(['x'], 'foo.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText('foo.txt')).toBeInTheDocument();
    const remove = canvas.getByRole('button', { name: /remove foo\.txt/i });
    fireEvent.click(remove);
    await expect(canvas.queryByText('foo.txt')).toBeNull();
  },
};

export const RejectsByAccept: Story = {
  args: { label: 'Images', accept: 'image/*' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Images') as HTMLInputElement;
    const wrongFile = new File(['x'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [wrongFile] } });
    await expect(canvas.getByText(/type not allowed/i)).toBeInTheDocument();
    await expect(canvas.queryByText('note.txt')).toBeNull();
  },
};

export const RejectsByMaxSize: Story = {
  args: { label: 'Tiny', maxSize: 5 },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Tiny') as HTMLInputElement;
    const big = new File(['hello world'], 'big.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [big] } });
    await expect(canvas.getByText(/exceeds/i)).toBeInTheDocument();
  },
};
