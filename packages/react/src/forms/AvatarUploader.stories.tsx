import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent } from 'storybook/test';
import { AvatarUploader } from './AvatarUploader';

const SAMPLE_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
       <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%236366f1"/><stop offset="1" stop-color="%23a855f7"/></linearGradient></defs>
       <rect width="128" height="128" fill="url(%23g)"/>
       <text x="50%" y="58%" font-family="sans-serif" font-size="56" fill="white" text-anchor="middle">JD</text>
     </svg>`,
  );

const meta = {
  title: 'Forms/Avatar Uploader',
  component: AvatarUploader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    name: 'John Doe',
    onUpload: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof AvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { src: null },
};

export const WithImage: Story = {
  args: { src: SAMPLE_AVATAR },
};

export const Large: Story = {
  args: { src: SAMPLE_AVATAR, size: 'lg' },
};

export const Loading: Story = {
  args: { src: SAMPLE_AVATAR, loading: true },
};

export const WithError: Story = {
  args: { src: null, error: 'Upload failed — please retry.' },
};

export const Disabled: Story = {
  args: { src: SAMPLE_AVATAR, disabled: true },
};

export const NoRemove: Story = {
  args: { src: SAMPLE_AVATAR, onRemove: undefined },
};

export const Controlled: Story = {
  render: (args) => {
    const [src, setSrc] = useState<string | null>(null);
    return (
      <AvatarUploader
        {...args}
        src={src}
        onUpload={async (file) => {
          const reader = new FileReader();
          reader.onload = () => setSrc(reader.result as string);
          reader.readAsDataURL(file);
        }}
        onRemove={() => setSrc(null)}
      />
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RemoveCallsHandler: Story = {
  args: { src: SAMPLE_AVATAR, onRemove: fn() },
  play: async ({ args, canvas }) => {
    const removeBtn = canvas.getByRole('button', { name: /remove/i });
    await userEvent.click(removeBtn);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const InvalidFileShowsError: Story = {
  args: { src: null, onUpload: fn() },
  play: async ({ args, canvas }) => {
    const fileInput = canvas.getByLabelText('Upload avatar') as HTMLInputElement;
    const fakeText = new File(['not an image'], 'note.txt', { type: 'text/plain' });
    // Input is `display:none` (Tailwind `hidden`) so userEvent.upload's
    // visibility check refuses it — fire the change event directly instead.
    fireEvent.change(fileInput, { target: { files: [fakeText] } });
    await expect(await canvas.findByText(/please select an image file/i)).toBeInTheDocument();
    await expect(args.onUpload).not.toHaveBeenCalled();
  },
};

export const LoadingShowsSpinner: Story = {
  args: { src: SAMPLE_AVATAR, loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: /uploading/i })).toBeInTheDocument();
  },
};

export const DisabledBlocksUpload: Story = {
  args: { src: SAMPLE_AVATAR, disabled: true, onUpload: fn(), onRemove: fn() },
  play: async ({ args, canvas }) => {
    const uploadBtn = canvas.getByRole('button', { name: /change photo/i });
    const removeBtn = canvas.getByRole('button', { name: /remove/i });
    await expect(uploadBtn).toBeDisabled();
    await expect(removeBtn).toBeDisabled();
    await userEvent.click(removeBtn);
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};
