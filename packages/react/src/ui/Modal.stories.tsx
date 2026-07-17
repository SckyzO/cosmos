import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import { portalDocsParams } from '../storybook-helpers';
import { Modal } from './Modal';
import { Button } from './Button';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Overlays/Modal',
  component: Modal,
  subcomponents: {
    'Modal.Header': Modal.Header,
    'Modal.Body': Modal.Body,
    'Modal.Footer': Modal.Footer,
    'Modal.Alert': Modal.Alert,
  },
  // Modal portals into `document.body` — force iframe rendering in autodocs
  // so the dialog has its own document scope and doesn't leak into the
  // Storybook docs page (which would otherwise show the overlay above its
  // own content and clip the docs layout).
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
  args: { open: false, onClose: () => {}, children: null },
  // `ModalRoot` renders through a portal, which react-docgen can't trace back
  // to ModalProps — so the Controls table would otherwise list only the props
  // present in `args`. Declare the prop surface explicitly.
  argTypes: {
    open: { control: 'boolean', description: 'Whether the modal is visible.' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Dialog width preset. `full` goes edge-to-edge.',
    },
    className: { control: 'text' },
    onClose: {
      control: false,
      description: 'Called when the backdrop or Escape closes the modal.',
    },
    children: { control: false },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Click to open">
          <Button onClick={() => setOpen(true)}>Open modal</Button>
        </SectionCard>
        <Modal open={open} onClose={() => setOpen(false)}>
          <Modal.Header
            title="Delete this template?"
            description="This action cannot be undone. The template will be removed from all environments."
            onClose={() => setOpen(false)}
          />
          <Modal.Body>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to delete <span className="font-semibold">prod-default-template</span>.
              13 servers currently use it.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Wrap>
    );
  },
};

export const FullScreen: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Full-screen modal — useful for long forms or media viewers">
          <Button onClick={() => setOpen(true)}>Open full screen</Button>
        </SectionCard>
        <Modal open={open} onClose={() => setOpen(false)} size="full">
          <Modal.Header
            title="Edit template"
            description="prod-default-template — used by 13 servers"
            onClose={() => setOpen(false)}
          />
          <Modal.Body className="overflow-y-auto">
            {Array.from({ length: 24 }).map((_, i) => (
              <p key={i} className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Line {i + 1} — full-screen modals are great when content needs to scroll or
                you&apos;re embedding a complex editor.
              </p>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save changes</Button>
          </Modal.Footer>
        </Modal>
      </Wrap>
    );
  },
};

// ── Modal.Alert variants ─────────────────────────────────────────────────────

export const AlertInfo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Info alert">
          <Button onClick={() => setOpen(true)}>Show info alert</Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="info"
          title="Maintenance scheduled"
          message="The platform will be unavailable on Sunday from 02:00 to 04:00 UTC for upgrades."
          confirmLabel="Got it"
        />
      </Wrap>
    );
  },
};

export const AlertWarning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Warning alert">
          <Button onClick={() => setOpen(true)}>Show warning</Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="warning"
          title="Unsaved changes"
          message="You have unsaved changes. Continue without saving?"
          confirmLabel="Continue"
          cancelLabel="Stay"
        />
      </Wrap>
    );
  },
};

export const AlertDanger: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Danger alert (destructive)">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Delete account
          </Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="danger"
          title="Delete your account?"
          message="This action is permanent. All your data, dashboards and integrations will be removed and cannot be recovered."
          confirmLabel="Delete forever"
          cancelLabel="Cancel"
        />
      </Wrap>
    );
  },
};

export const AlertSuccess: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Wrap>
        <SectionCard title="Success alert">
          <Button onClick={() => setOpen(true)}>Show success</Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="success"
          title="Account created"
          message="A confirmation email has been sent to john@example.com."
          confirmLabel="Continue"
        />
      </Wrap>
    );
  },
};

export const AlertLoading: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="warning"
          title="Saving changes…"
          message="Please wait while we apply the configuration."
          confirmLabel="Save"
          cancelLabel="Cancel"
          loading
        />
      </Wrap>
    );
  },
};

// TUI Plus pattern "Simple with gray footer" — horizontal danger alert with
// icon to the left of the title and a gray footer carrying right-aligned actions.
export const AlertHorizontalDanger: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Horizontal alert with gray footer">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Deactivate account
          </Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          layout="horizontal"
          intent="danger"
          title="Deactivate account"
          message="Are you sure you want to deactivate your account? All of your data will be permanently removed. This action cannot be undone."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
        />
      </Wrap>
    );
  },
};

// TUI Plus pattern "Centered with single action" — payment-successful style
// with a single full-width primary button.
export const AlertCenteredFullWidth: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Centered alert with single full-width action">
          <Button onClick={() => setOpen(true)}>Show success</Button>
        </SectionCard>
        <Modal.Alert
          open={open}
          onClose={() => setOpen(false)}
          intent="success"
          title="Payment successful"
          message="Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore."
          confirmLabel="Go back to dashboard"
          fullWidthAction
        />
      </Wrap>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const HorizontalLayoutHasGrayFooter: Story = {
  render: () => (
    <Modal.Alert
      open
      onClose={() => {}}
      layout="horizontal"
      intent="danger"
      title="X"
      message="y"
      confirmLabel="Go"
      cancelLabel="No"
    />
  ),
  // Modal portals into `document.body` — scope queries to body, not canvas.
  play: async () => {
    const scope = within(document.body);
    const cancel = await scope.findByRole('button', { name: 'No' });
    const confirm = await scope.findByRole('button', { name: 'Go' });
    await expect(cancel).toBeVisible();
    await expect(confirm).toBeVisible();
    // Both buttons share the same parent — the gray footer in horizontal layout.
    await expect(cancel.parentElement).toBe(confirm.parentElement);
    await expect(cancel.parentElement?.className ?? '').toMatch(/bg-gray-50/);
  },
};

export const FullWidthActionMakesButtonFull: Story = {
  render: () => (
    <Modal.Alert
      open
      onClose={() => {}}
      intent="success"
      title="X"
      confirmLabel="Continue"
      fullWidthAction
    />
  ),
  // Modal portals into `document.body` — scope queries to body, not canvas.
  play: async () => {
    const btn = await within(document.body).findByRole('button', { name: 'Continue' });
    await expect(btn.className).toMatch(/w-full/);
  },
};

/**
 * a11y: the dialog is named by its header title (aria-labelledby resolves to
 * the visible heading), and opening moves focus into the dialog so keyboard
 * users start inside it, not on the page behind.
 */
export const AccessibleNameAndInitialFocus: Story = {
  render: () => (
    <Modal open onClose={() => {}}>
      <Modal.Header title="Delete workspace" />
      <Modal.Body>This cannot be undone.</Modal.Body>
      <Modal.Footer>
        <Button>Cancel</Button>
        <Button variant="danger">Delete</Button>
      </Modal.Footer>
    </Modal>
  ),
  // Modal portals into `document.body` — scope queries to body, not canvas.
  play: async () => {
    const scope = within(document.body);
    const dialog = await scope.findByRole('dialog');
    // Named by the header title, not left anonymous.
    const labelId = dialog.getAttribute('aria-labelledby');
    await expect(labelId).toBeTruthy();
    const heading = document.getElementById(labelId ?? '');
    await expect(heading?.textContent).toBe('Delete workspace');
    // Focus moved inside the dialog on open.
    await expect(dialog.contains(document.activeElement)).toBe(true);
  },
};
