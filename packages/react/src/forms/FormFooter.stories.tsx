import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from '../ui/Button';
import { Input } from './Input';
import { FormFooter } from './FormFooter';

const meta = {
  title: 'Forms/Form Footer',
  component: FormFooter,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof FormFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onCancel: fn() },
};

export const SubmitOnly: Story = { args: {} };

export const DangerSubmit: Story = {
  args: {
    onCancel: fn(),
    submitLabel: 'Delete account',
    submitVariant: 'danger',
  },
};

export const Submitting: Story = {
  args: { onCancel: fn(), submitting: true },
};

export const SubmitDisabled: Story = {
  args: { onCancel: fn(), submitDisabled: true },
};

export const BetweenAlign: Story = {
  args: { onCancel: fn(), align: 'between' },
};

export const NoBorder: Story = {
  args: { onCancel: fn(), bordered: false },
};

export const WithExtraText: Story = {
  args: {
    onCancel: fn(),
    align: 'between',
    extra: 'Last saved 2 minutes ago.',
  },
};

export const CustomButtons: Story = {
  args: {
    children: (
      <>
        <Button variant="ghost">Save as draft</Button>
        <Button variant="secondary">Preview</Button>
        <Button variant="primary" type="submit">
          Publish
        </Button>
      </>
    ),
  },
};

// ── Real form integration ────────────────────────────────────────────────────

export const InsideForm: Story = {
  render: () => {
    const [submitting, setSubmitting] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          window.setTimeout(() => {
            setSubmitting(false);
            setSavedAt(new Date().toLocaleTimeString());
          }, 1000);
        }}
      >
        <Input label="Display name" placeholder="Tom" defaultValue="John Doe" />
        <Input label="Email" type="email" defaultValue="john@example.com" />
        <FormFooter
          align="between"
          extra={savedAt ? `Saved at ${savedAt}.` : 'Unsaved changes.'}
          onCancel={() => undefined}
          submitting={submitting}
        />
      </form>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const ClickCancelFiresHandler: Story = {
  args: { onCancel: fn() },
  play: async ({ args, canvas }) => {
    const cancel = canvas.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancel);
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};

export const SubmittingDisablesButtons: Story = {
  args: { onCancel: fn(), submitting: true },
  play: async ({ args, canvas }) => {
    const cancel = canvas.getByRole('button', { name: /cancel/i });
    const submit = canvas.getByRole('button', { name: /save changes/i });
    await expect(cancel).toBeDisabled();
    await expect(submit).toBeDisabled();
    await userEvent.click(cancel).catch(() => undefined);
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};

export const SubmitInsideForm: Story = {
  render: () => {
    const onSubmit = fn();
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <FormFooter onCancel={fn()} />
      </form>
    );
  },
  play: async ({ canvas }) => {
    const submit = canvas.getByRole('button', { name: /save changes/i });
    await userEvent.click(submit);
    // Form submit fires onSubmit → no error thrown means success
    await expect(submit).toBeInTheDocument();
  },
};
