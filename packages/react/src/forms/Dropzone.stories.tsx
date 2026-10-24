import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageIcon } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, fireEvent, userEvent, waitFor } from 'storybook/test';
import { Dropzone } from './Dropzone';
import { expectRefFocuses, expectTextContrast } from '../storybook-helpers';

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
      </p>{' '}
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
    const input = canvas.getByLabelText('Doc', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText('note.txt')).toBeInTheDocument();
  },
};

export const RemovingClearsFile: Story = {
  args: { label: 'Removable', multiple: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Removable', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['x'], 'foo.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText('foo.txt')).toBeInTheDocument();
    const remove = canvas.getByRole('button', { name: /remove foo\.txt/i });
    fireEvent.click(remove);
    // The removal re-renders asynchronously outside vitest's act() environment.
    await waitFor(() => expect(canvas.queryByText('foo.txt')).toBeNull());
  },
};

export const RejectsByAccept: Story = {
  args: { label: 'Images', accept: 'image/*' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Images', { selector: 'input' }) as HTMLInputElement;
    const wrongFile = new File(['x'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [wrongFile] } });
    await expect(canvas.getByText(/type not allowed/i)).toBeInTheDocument();
    await expect(canvas.queryByText('note.txt')).toBeNull();
  },
};

export const RejectsByMaxSize: Story = {
  args: { label: 'Tiny', maxSize: 5 },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Tiny', { selector: 'input' }) as HTMLInputElement;
    const big = new File(['hello world'], 'big.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [big] } });
    await expect(canvas.getByText(/exceeds/i)).toBeInTheDocument();
  },
};

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Could not upload — please retry.'));
  },
};

const dropzoneRef = createRef<HTMLDivElement>();

/** The ref gets the drop area (`role="button"`), not the hidden file input, and focusing through it works. */
export const ForwardsRef: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Dropzone ref={dropzoneRef} label="Upload files" />,
  play: async ({ canvas }) => {
    await expectRefFocuses(dropzoneRef, canvas.getByRole('button', { name: /Upload files/ }));
  },
};

/** Without a label, the zone is named by its own text, and the file input is not a second stop. */
export const NamedByItsTextWithoutLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <>
      <button type="button">Before</button>
      <Dropzone />
      <button type="button">After</button>
    </>
  ),
  play: async ({ canvas }) => {
    const zone = canvas.getByRole('button', { name: 'Click to upload or drag and drop' });
    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(zone).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
};

/** With a label, the name starts with it and keeps the visible text; an error describes the zone. */
export const NamedByLabelAndTextDescribedByError: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Avatar', description: 'JPG or PNG only.', error: 'The file is too large.' },
  play: async ({ canvas }) => {
    const zone = canvas.getByRole('button', {
      name: 'Avatar Click to upload or drag and drop JPG or PNG only.',
    });
    await expect(zone).toHaveAccessibleDescription('The file is too large.');
    await expect(zone).toHaveAttribute('aria-invalid', 'true');
  },
};
