import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  endOffset,
  expectBelow,
  expectGraphicContrast,
  expectReadsLeftToRight,
  inDirection,
  inEachTheme,
  portalDocsParams,
  startOffset,
} from '../storybook-helpers';
import { Modal } from './Modal';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';
import { Combobox } from '../forms/Combobox';
import { Input } from '../forms/Input';
import { Select } from '../forms/Select';
import { Textarea } from '../forms/Textarea';
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
            <Button intent="danger" size="sm" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Wrap>
    );
  },
};

/** Open on mount, as the dialog looks once a trigger has opened it: header, body, pinned footer. */
export const Open: Story = {
  tags: ['!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Wrap>
        <SectionCard title="Closed it? Open it again">
          <Button onClick={() => setOpen(true)}>Open modal</Button>
        </SectionCard>
        <Modal open={open} onClose={() => setOpen(false)}>
          <Modal.Header
            title="Rotate the API key?"
            description="Clients using the current key stop working until they are updated."
            onClose={() => setOpen(false)}
          />
          <Modal.Body>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The new key is shown once. Copy it before you close this dialog.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Rotate key
            </Button>
          </Modal.Footer>
        </Modal>
      </Wrap>
    );
  },
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Rotate the API key?',
    });
    await expect(dialog).toBeVisible();
  },
};

const REGIONS = [
  { value: 'eu-west', label: 'Europe (West)' },
  { value: 'us-east', label: 'US (East)' },
  { value: 'ap-south', label: 'Asia Pacific (South)' },
];

/**
 * A form in a modal: the title with its close button, the fields in a body that scrolls while
 * the footer stays pinned, Cancel and the primary action together on the right (the primary
 * stays disabled until the form is valid) and the destructive action apart on the left.
 */
export const FormInModal: Story = {
  tags: ['!autodocs'],
  render: () => {
    const [open, setOpen] = useState(true);
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const valid = name.trim() !== '' && region !== '';
    const close = () => setOpen(false);
    return (
      <Wrap>
        <SectionCard title="Closed it? Open it again">
          <Button onClick={() => setOpen(true)}>Edit server</Button>
        </SectionCard>
        <Modal open={open} onClose={close} className="flex max-h-[85vh] flex-col">
          <Modal.Header
            className="shrink-0"
            title="Edit server"
            description="Changes apply to the next deploy."
            onClose={close}
          />
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              close();
            }}
          >
            <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <Input
                label="Name"
                required
                placeholder="web-01"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Select
                label="Region"
                required
                placeholder="Choose a region"
                options={REGIONS}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              />
              <Textarea label="Notes" rows={3} description="Visible to your team only." />
            </Modal.Body>
            <Modal.Footer className="shrink-0 justify-between">
              <Button type="button" variant="ghost" intent="danger" size="sm">
                Delete server
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!valid}>
                  Save changes
                </Button>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      </Wrap>
    );
  },
  play: async () => {
    const dialog = within(
      await within(document.body).findByRole('dialog', { name: 'Edit server' })
    );
    const save = dialog.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();
    await userEvent.type(dialog.getByRole('textbox', { name: /^Name/ }), 'web-01');
    // A name alone is not enough: the region is required too.
    await expect(save).toBeDisabled();
    await userEvent.selectOptions(dialog.getByRole('combobox', { name: /^Region/ }), 'eu-west');
    await expect(save).toBeEnabled();
    await userEvent.clear(dialog.getByRole('textbox', { name: /^Name/ }));
    await expect(save).toBeDisabled();
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
          <Button intent="danger" onClick={() => setOpen(true)}>
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
          <Button intent="danger" onClick={() => setOpen(true)}>
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => (
    <Modal open onClose={() => {}}>
      <Modal.Header title="Delete workspace" />
      <Modal.Body>This cannot be undone.</Modal.Body>
      <Modal.Footer>
        <Button>Cancel</Button>
        <Button intent="danger">Delete</Button>
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
    // Focus moves inside the dialog on open, from an effect: wait for it.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  },
};

// Without a `Modal.Header` title, `aria-labelledby` pointed at an id that was never rendered (#151).
// Such a dialog is named by `ariaLabel`: it has no title to point at, and an unnamed dialog is
// an accessibility violation.
export const UntitledDialogHasNoDanglingLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal open onClose={() => {}} ariaLabel="Notes">
      <Modal.Body>No heading here.</Modal.Body>
    </Modal>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Notes' });
    await expect(dialog).not.toHaveAttribute('aria-labelledby');
  },
};

export const AlertIsAnAlertDialog: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Modal.Alert open onClose={() => {}} intent="danger" title="Delete it?" />,
  play: async () => {
    await expect(
      await within(document.body).findByRole('alertdialog', { name: 'Delete it?' })
    ).toBeInTheDocument();
  },
};

// The close icon (gray-400) was under 3:1 against the dialog (#151).
export const CloseButtonContrastInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal open onClose={() => {}}>
      <Modal.Header title="Delete workspace" onClose={() => {}} />
      <Modal.Body>This cannot be undone.</Modal.Body>
    </Modal>
  ),
  play: async () => {
    const close = await within(document.body).findByRole('button', { name: 'Close modal' });
    inEachTheme(() => expectGraphicContrast(close, 'color'));
  },
};

/** Escape closes the modal; once closed, Escape no longer reaches it. */
export const EscapeClosesOnce: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClose: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const close = () => {
      args.onClose();
      setOpen(false);
    };
    return (
      <Modal open={open} onClose={close}>
        <Modal.Body>Press Escape.</Modal.Body>
      </Modal>
    );
  },
  play: async ({ args }) => {
    const body = within(document.body);
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

const ACTIONS = [
  { value: 'rename', label: 'Rename' },
  { value: 'archive', label: 'Archive' },
];
const OWNERS = [
  { value: 'leslie', label: 'Leslie Alexander' },
  { value: 'michael', label: 'Michael Foster' },
];

/**
 * Escape closes the innermost overlay only: a menu or a listbox open in the modal closes,
 * and the modal stays until the next Escape.
 */
export const EscapeClosesTheInnermostOverlay: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClose: fn() },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const close = () => {
      args.onClose();
      setOpen(false);
    };
    return (
      <Modal open={open} onClose={close}>
        <Modal.Header title="Project settings" />
        <Modal.Body className="space-y-4">
          <Dropdown label="Actions" options={ACTIONS} />
          <Combobox label="Owner" options={OWNERS} />
        </Modal.Body>
      </Modal>
    );
  },
  play: async ({ args }) => {
    const body = within(document.body);
    const dialog = within(await body.findByRole('dialog', { name: 'Project settings' }));

    await userEvent.click(dialog.getByRole('button', { name: 'Actions' }));
    await body.findByRole('menu');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await expect(dialog.getByRole('button', { name: 'Actions' })).toHaveFocus();

    await userEvent.click(dialog.getByRole('combobox', { name: 'Owner' }));
    await body.findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull());

    await expect(body.getByRole('dialog', { name: 'Project settings' })).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/**
 * A listbox, a menu and a tooltip opened in the modal render inside it, so `aria-modal`
 * doesn't hide them from assistive technology, and are drawn at their trigger. A click
 * elsewhere in the modal closes a panel and leaves the modal open.
 */
export const PanelsRenderInsideTheModal: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onClose: fn() },
  render: (args) => (
    <Modal open onClose={args.onClose}>
      <Modal.Header title="Project settings" />
      <Modal.Body className="space-y-4">
        <Combobox label="Owner" options={OWNERS} />
        <p>The owner gets every alert.</p>
        <div className="flex gap-3">
          <Dropdown label="Actions" options={ACTIONS} />
          <Tooltip content="Visible to the whole team">
            <Button variant="secondary" size="sm">
              Visibility
            </Button>
          </Tooltip>
        </div>
      </Modal.Body>
    </Modal>
  ),
  play: async ({ args }) => {
    const body = within(document.body);
    const dialogElement = await body.findByRole('dialog', { name: 'Project settings' });
    const dialog = within(dialogElement);

    const input = dialog.getByRole('combobox', { name: 'Owner' });
    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await expect(dialogElement).toContainElement(listbox);
    // The listbox opens under the field: the input and its toggle button.
    expectBelow(listbox, input.parentElement!, { offset: 4, align: 'start' });
    await userEvent.click(dialog.getByText('The owner gets every alert.'));
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull());

    const trigger = dialog.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    const menu = await body.findByRole('menu');
    await expect(dialogElement).toContainElement(menu);
    expectBelow(menu, trigger, { offset: 4, align: 'start' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());

    const visibility = dialog.getByRole('button', { name: 'Visibility' });
    await userEvent.hover(visibility);
    const tip = body.getByRole('tooltip');
    await waitFor(() => expect(tip).toBeVisible());
    await expect(dialogElement).toContainElement(tip);
    // 10px above the wrapper around its trigger, centered on it.
    const a = visibility.parentElement!.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    await expect(t.bottom).toBeCloseTo(a.top - 10, 0);
    await expect((t.left + t.right) / 2).toBeCloseTo((a.left + a.right) / 2, 0);

    await expect(dialogElement).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/**
 * Shift+Tab from the first control of a popover open in the modal goes back to its trigger,
 * and only there: the modal's focus trap leaves alone a Tab the popover already handled.
 */
export const ShiftTabOutOfAPanelGoesBackToItsTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal open onClose={() => {}}>
      <Modal.Header title="Sharing" />
      <Modal.Body>
        <Popover>
          <Popover.Trigger className="rounded-lg border px-3 py-2 text-sm">Share</Popover.Trigger>
          <Popover.Content aria-label="Share options">
            <button type="button">Copy link</button>
            <button type="button">Send by email</button>
          </Popover.Content>
        </Popover>
      </Modal.Body>
    </Modal>
  ),
  play: async () => {
    const body = within(document.body);
    // The trigger is the modal's first control, so the trap would wrap Shift+Tab from it.
    const trigger = await body.findByRole('button', { name: 'Share' });
    await userEvent.click(trigger);
    const panel = within(await body.findByRole('dialog', { name: 'Share options' }));
    await waitFor(() => expect(panel.getByRole('button', { name: 'Copy link' })).toHaveFocus());

    const focused: EventTarget[] = [];
    const record = (e: FocusEvent) => focused.push(e.target!);
    document.addEventListener('focusin', record);
    try {
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(body.queryByRole('dialog', { name: 'Share options' })).toBeNull());
      await expect(trigger).toHaveFocus();
      await expect(focused).toEqual([trigger]);
    } finally {
      document.removeEventListener('focusin', record);
    }
  },
};

// A trigger, a button after it and a modal with three controls, so the tests
// can tell the dialog from the page and see where focus goes back to.
const OpenFromButton = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Wrap>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Button variant="secondary">After</Button>
      <Modal open={open} onClose={close}>
        <Modal.Header title="Delete workspace" onClose={close} />
        <Modal.Body>This cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button intent="danger" onClick={close}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Wrap>
  );
};

/** Tab and Shift+Tab cycle through the modal's controls and never reach the page behind it. */
export const TabStaysInsideTheModal: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <OpenFromButton />,
  play: async ({ canvas }) => {
    const body = within(document.body);
    canvas.getByRole('button', { name: 'Open modal' }).focus();
    await userEvent.keyboard('{Enter}');
    const dialog = within(await body.findByRole('dialog', { name: 'Delete workspace' }));

    await waitFor(() => expect(dialog.getByRole('button', { name: 'Close modal' })).toHaveFocus());
    for (const name of ['Cancel', 'Delete', 'Close modal']) {
      await userEvent.tab();
      await expect(dialog.getByRole('button', { name })).toHaveFocus();
    }
    // Backwards from the first control, it wraps to the last.
    await userEvent.tab({ shift: true });
    await expect(dialog.getByRole('button', { name: 'Delete' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'After' })).not.toHaveFocus();
  },
};

/** However the modal closes, focus goes back to the button that opened it. */
export const FocusReturnsToTheTrigger: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <OpenFromButton />,
  play: async ({ canvas }) => {
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: 'Open modal' });
    const closers = [
      () => userEvent.keyboard('{Escape}'),
      () => userEvent.click(body.getByRole('button', { name: 'Close modal' })),
      () => userEvent.click(body.getByRole('button', { name: 'Cancel' })),
      // The backdrop is the dialog's first child.
      () => userEvent.click(body.getByRole('dialog').firstElementChild as HTMLElement),
    ];
    for (const close of closers) {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await body.findByRole('dialog');
      await close();
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};

/** A danger alert confirms with the red button, `variant="primary" intent="danger"`. */
export const AlertDangerConfirmIsRed: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal.Alert
      open
      onClose={() => {}}
      intent="danger"
      title="Delete it?"
      confirmLabel="Delete"
      cancelLabel="Keep"
    />
  ),
  play: async () => {
    const scope = within(document.body);
    const confirm = await scope.findByRole('button', { name: 'Delete' });
    await expect(confirm).toHaveClass('bg-red-600', 'text-white');
    await expect(confirm).not.toHaveClass('bg-brand-500');
    // The cancel button is the plain secondary one.
    await expect(await scope.findByRole('button', { name: 'Keep' })).toHaveClass('bg-white');
  },
};

/** The other intents keep the accent on the confirm button, in both layouts. */
export const AlertOtherIntentsConfirmWithTheAccent: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal.Alert
      open
      onClose={() => {}}
      layout="horizontal"
      intent="warning"
      title="Careful"
      confirmLabel="Continue"
    />
  ),
  play: async () => {
    const confirm = await within(document.body).findByRole('button', { name: 'Continue' });
    await expect(confirm).toHaveClass('bg-brand-500', 'text-white');
    await expect(confirm).not.toHaveClass('bg-red-600');
  },
};

/** The title starts the header and its close button ends it; the footer buttons end the dialog. */
export const HeaderAndFooterFollowTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal open onClose={() => {}} ariaLabel="Delete">
      <Modal.Header
        title="Delete (3 of 5)."
        description="Cannot be undone (1-5)."
        onClose={() => {}}
      />
      <Modal.Body>Body</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
        <Button intent="danger" size="sm">
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog');
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, () => {
        const close = within(dialog).getByRole('button', { name: 'Close modal' });
        const title = within(dialog).getByText('Delete (3 of 5).').closest('h2')!;
        expect(endOffset(close, dialog)).toBeLessThan(startOffset(close, dialog));
        expect(startOffset(title, dialog)).toBeLessThan(startOffset(close, dialog));
        expectReadsLeftToRight(title);
        expectReadsLeftToRight(within(dialog).getByText('Cannot be undone (1-5).').closest('p')!);
        // The footer pushes its buttons to the end of the line, the primary one last.
        const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
        const confirm = within(dialog).getByRole('button', { name: 'Delete' });
        expect(endOffset(confirm, dialog)).toBeLessThan(startOffset(confirm, dialog));
        expect(startOffset(cancel, dialog)).toBeLessThan(startOffset(confirm, dialog));
      });
    }
  },
};

/** The horizontal alert starts with its icon and text, left aligned to the start, and ends with its buttons. */
export const HorizontalAlertFollowsTheDirection: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Modal.Alert
      open
      onClose={() => {}}
      layout="horizontal"
      intent="danger"
      title="Deactivate (3 of 5)."
      message="Cannot be undone."
      confirmLabel="Go"
      cancelLabel="No"
    />
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog');
    for (const dir of ['ltr', 'rtl'] as const) {
      await inDirection(dir, () => {
        const title = within(dialog).getByText('Deactivate (3 of 5).').closest('h2')!;
        const icon = dialog.querySelector('svg')!;
        expect(startOffset(icon, dialog)).toBeLessThan(startOffset(title, dialog));
        expect(getComputedStyle(title.parentElement!).textAlign).toBe('start');
        // The gap between the icon chip and the text is on the chip's end side.
        const chip = icon.parentElement!;
        expect(
          startOffset(title, dialog) -
            (startOffset(chip, dialog) + chip.getBoundingClientRect().width)
        ).toBeCloseTo(16, 0);
        expectReadsLeftToRight(title);
        const go = within(dialog).getByRole('button', { name: 'Go' });
        expect(endOffset(go, dialog)).toBeLessThan(startOffset(go, dialog));
      });
    }
  },
};
