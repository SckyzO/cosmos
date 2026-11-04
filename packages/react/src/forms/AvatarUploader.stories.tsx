import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { AvatarUploader } from './AvatarUploader';
import { expectTextContrast, inEachTheme } from '../storybook-helpers';

// "Lorelei" by Lisa Wischofsky, CC0 1.0, via DiceBear (https://www.dicebear.com/styles/lorelei/).
// `new URL(…, import.meta.url)` lets Vite emit it as an asset, base path included.
const SAMPLE_AVATAR = new URL('../storybook-assets/avatar-woman.svg', import.meta.url).href;

const meta = {
  title: 'Forms/Avatar Uploader',
  component: AvatarUploader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    name: 'Sophia Laurent',
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
  tags: ['!dev'],
  args: { src: SAMPLE_AVATAR, onRemove: fn() },
  play: async ({ args, canvas }) => {
    const removeBtn = canvas.getByRole('button', { name: /remove/i });
    await userEvent.click(removeBtn);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const InvalidFileShowsError: Story = {
  tags: ['!dev'],
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
  tags: ['!dev'],
  args: { src: SAMPLE_AVATAR, loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: /uploading/i })).toBeInTheDocument();
  },
};

// A color as the browser resolves it, read off a probe so the comparison does not depend on how
// the browser writes it (`rgb()`, `color(srgb …)`).
const colorOf = (value: string) => {
  const probe = document.createElement('div');
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

// The spinner is white on the dark overlay in every theme: a white arc over a 30% white track. It
// is read in all four themes, so a color that wins by its place in the generated CSS (as the
// spinner's own arc did in the dark themes) shows up as the wrong color.
export const SpinnerIsWhiteOnOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { src: SAMPLE_AVATAR, loading: true },
  play: async ({ canvas }) => {
    const overlay = canvas.getByRole('status', { name: /uploading/i });
    const spinner = within(overlay).getByRole('status', { name: 'Loading' });
    inEachTheme(() => {
      const style = getComputedStyle(spinner);
      expect(style.borderTopColor, 'arc').toBe(colorOf('var(--color-white)'));
      for (const track of [
        style.borderRightColor,
        style.borderBottomColor,
        style.borderLeftColor,
      ]) {
        expect(track, 'track').toBe(
          colorOf('color-mix(in oklab, var(--color-white) 30%, transparent)')
        );
      }
    });
  },
};

export const DisabledBlocksUpload: Story = {
  tags: ['!dev'],
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

// red-500 error text fell under 4.5:1 (#151).
export const ErrorTextContrastInLight: Story = {
  ...WithError,
  tags: ['!dev', '!autodocs'],
  globals: { theme: 'light' },
  play: async ({ canvas }) => {
    expectTextContrast(canvas.getByText('Upload failed — please retry.'));
  },
};
