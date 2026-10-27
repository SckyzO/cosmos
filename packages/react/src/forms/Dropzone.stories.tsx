import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageIcon } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';
import { Dropzone, type DropzoneRejection } from './Dropzone';
import { expectReadsLeftToRight, expectRefFocuses, expectTextContrast } from '../storybook-helpers';

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

/** With `onReject` the valid files of a drop are kept and the others are reported one by one: the host decides how to show them. */
export const ReportsRejectedFiles: Story = {
  render: () => {
    const [rejected, setRejected] = useState<DropzoneRejection[]>([]);
    return (
      <div className="max-w-md space-y-3">
        <Dropzone
          label="Photos"
          description="Images only, up to 1 MB each."
          multiple
          accept="image/*"
          maxSize={1024 * 1024}
          onReject={setRejected}
        />
        {rejected.length > 0 && (
          <ul className="text-xs text-red-700 dark:text-red-400">
            {rejected.map(({ file, reason }) => (
              <li key={file.name}>
                {file.name}: {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const SelectingViaInputAddsFile: Story = {
  tags: ['!dev'],
  args: { label: 'Doc', multiple: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Doc', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText('note.txt')).toBeInTheDocument();
  },
};

export const RemovingClearsFile: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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

// ── onFilesAdded / onReject ──────────────────────────────────────────────────

const png = (name: string, size = 1) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });
const txt = (name: string) => new File(['x'], name, { type: 'text/plain' });

const dropIn = (canvas: { getByLabelText: (l: string, o: object) => HTMLElement }, label: string) =>
  canvas.getByLabelText(label, { selector: 'input' }) as HTMLInputElement;

/** `onFilesAdded` gets only the files just accepted, while `onChange` keeps carrying the whole list. */
export const FilesAddedGetsOnlyTheNewFiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Docs', multiple: true, onFilesAdded: fn(), onChange: fn() },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Docs');
    const [a, b, c] = [txt('a.txt'), txt('b.txt'), txt('c.txt')];
    fireEvent.change(input, { target: { files: [a, b] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenCalledWith([a, b]));
    fireEvent.change(input, { target: { files: [c] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenLastCalledWith([c]));
    await expect(args.onFilesAdded).toHaveBeenCalledTimes(2);
    await expect(args.onChange).toHaveBeenLastCalledWith([a, b, c]);
  },
};

/** Without `multiple`, the file that replaces the previous one is the one reported. */
export const FilesAddedInSingleMode: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Single', onFilesAdded: fn() },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Single');
    const [a, b] = [txt('a.txt'), txt('b.txt')];
    fireEvent.change(input, { target: { files: [a] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenLastCalledWith([a]));
    fireEvent.change(input, { target: { files: [b] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenLastCalledWith([b]));
  },
};

/** It fires with a controlled `value` too, with the new files only. */
export const FilesAddedWhenControlled: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Controlled docs', multiple: true, onFilesAdded: fn() },
  render: (args) => {
    const [files, setFiles] = useState<File[]>([]);
    return <Dropzone {...args} value={files} onChange={setFiles} />;
  },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Controlled docs');
    const [a, b] = [txt('a.txt'), txt('b.txt')];
    fireEvent.change(input, { target: { files: [a] } });
    fireEvent.change(input, { target: { files: [b] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenCalledTimes(2));
    await expect(args.onFilesAdded).toHaveBeenNthCalledWith(1, [a]);
    await expect(args.onFilesAdded).toHaveBeenNthCalledWith(2, [b]);
  },
};

/** With `onReject`, one bad file no longer rejects the drop: the rest is accepted and the bad one is reported. */
export const RejectKeepsTheValidFiles: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Photos',
    multiple: true,
    accept: 'image/*',
    onReject: fn(),
    onFilesAdded: fn(),
    onChange: fn(),
  },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Photos');
    const [good1, bad, good2] = [png('a.png'), txt('notes.txt'), png('b.png')];
    fireEvent.change(input, { target: { files: [good1, bad, good2] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenCalledWith([good1, good2]));
    await expect(args.onChange).toHaveBeenLastCalledWith([good1, good2]);
    await expect(args.onReject).toHaveBeenCalledTimes(1);
    const [rejections] = (args.onReject as ReturnType<typeof fn>).mock.calls[0] as [
      DropzoneRejection[],
    ];
    await expect(rejections).toHaveLength(1);
    await expect(rejections[0].file).toBe(bad);
    await expect(rejections[0].reason).toMatch(/type not allowed/i);
    await expect(canvas.getByText('a.png')).toBeInTheDocument();
    await expect(canvas.queryByText('notes.txt')).toBeNull();
    // The host reports: the zone draws no error line of its own.
    await expect(canvas.queryByText(/not allowed/i)).toBeNull();
  },
};

/** Size and count limits reject file by file too: `maxFiles` keeps what fits and reports the rest. */
export const RejectBySizeAndCount: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    label: 'Limited',
    multiple: true,
    maxSize: 10,
    maxFiles: 2,
    onReject: fn(),
    onFilesAdded: fn(),
  },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Limited');
    const [ok1, big, ok2, ok3] = [
      png('1.png', 5),
      png('big.png', 50),
      png('2.png', 5),
      png('3.png', 5),
    ];
    fireEvent.change(input, { target: { files: [ok1, big, ok2, ok3] } });
    await waitFor(() => expect(args.onFilesAdded).toHaveBeenCalledWith([ok1, ok2]));
    const [rejections] = (args.onReject as ReturnType<typeof fn>).mock.calls[0] as [
      DropzoneRejection[],
    ];
    await expect(rejections.map((r) => r.file)).toEqual([big, ok3]);
    await expect(rejections[0].reason).toMatch(/exceeds/i);
    await expect(rejections[1].reason).toMatch(/too many files \(max 2\)/i);
  },
};

/** Without `onReject`, one bad file still rejects the whole drop: nothing is accepted nor reported added. */
export const WithoutRejectTheWholeDropFails: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Strict', multiple: true, accept: 'image/*', onFilesAdded: fn(), onChange: fn() },
  play: async ({ canvas, args }) => {
    const input = dropIn(canvas, 'Strict');
    fireEvent.change(input, { target: { files: [png('a.png'), txt('notes.txt')] } });
    await expect(canvas.getByText(/"notes\.txt" type not allowed/i)).toBeInTheDocument();
    await expect(canvas.queryByText('a.png')).toBeNull();
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(args.onFilesAdded).not.toHaveBeenCalled();
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** A chosen file's name is an island: a Latin name keeps its dots and brackets in a right-to-left page. */
export const FileNamesAreIsolatedInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { label: 'Doc', multiple: true },
  render: (args) => (
    <div dir="rtl">
      <Dropzone {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Doc', { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'report (final).pdf')] } });
    const name = (await canvas.findByText('report (final).pdf')).closest('bdi')!;
    await expect(getComputedStyle(name).direction).toBe('ltr');
    await expect(getComputedStyle(name).unicodeBidi).toBe('isolate');
    expectReadsLeftToRight(canvas.getByText('1 B'));
  },
};
