import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PageHeader } from '../templates/PageHeader';
import { Button } from '../ui/Button';
import { HelpOverlay } from '../ui/HelpOverlay';
import { LinkProvider, type LinkComponentProps } from '../ui/LinkProvider';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { Breadcrumb } from './Breadcrumb';
import { RecordPager } from './RecordPager';

const meta = {
  title: 'Navigation/Record Pager',
  component: RecordPager,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    position: 12,
    total: 340,
    previousHref: '#order-11',
    nextHref: '#order-13',
    backHref: '#orders',
    noun: 'order',
  },
} satisfies Meta<typeof RecordPager>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Links: the app's router handles them (`LinkProvider`), and "open in a new tab" works. */
export const Links: Story = {};

/** Callbacks, for a page that loads the next record in place. The state is the host's. */
export const Callbacks: Story = {
  args: { previousHref: undefined, nextHref: undefined, backHref: undefined },
  render: (args) => {
    const [position, setPosition] = useState(args.position);
    return (
      <RecordPager
        {...args}
        position={position}
        onPrevious={() => setPosition((p) => p - 1)}
        onNext={() => setPosition((p) => p + 1)}
      />
    );
  },
};

/** The first record: Previous is disabled. */
export const FirstRecord: Story = {
  args: { position: 1, previousHref: undefined },
};

/** The last record: Next is disabled. */
export const LastRecord: Story = {
  args: { position: 340, nextHref: undefined },
};

/** Icon buttons and the count, in the actions of a `PageHeader`; the buttons keep their names. */
export const CompactInPageHeader: Story = {
  args: { variant: 'compact', backHref: undefined },
  render: (args) => (
    <PageHeader
      title="Order #20431"
      breadcrumb={
        <Breadcrumb items={[{ label: 'Orders', href: '#orders' }, { label: 'Order #20431' }]} />
      }
      actions={<RecordPager {...args} />}
    />
  ),
};

/** Another noun, or full labels for another language. */
export const Labels: Story = {
  args: {
    noun: 'ticket',
    labels: {
      previous: 'Billet précédent',
      next: 'Billet suivant',
      back: 'Retour à la liste',
      count: (position, total) => `${position} sur ${total}`,
    },
  },
};

/**
 * Shortcuts are off unless `hotkeys` is given. The pager doesn't list them: the host does, in the
 * `HelpOverlay` it already has.
 */
export const WithShortcuts: Story = {
  parameters: portalDocsParams.lg(),
  args: { hotkeys: { previous: '[', next: ']' } },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-start gap-4">
        <RecordPager {...args} />
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Keyboard shortcuts
        </Button>
        <HelpOverlay open={open} onOpenChange={setOpen} hotkey={null}>
          <HelpOverlay.Section title="Orders">
            <HelpOverlay.Shortcut keys="[" description="Previous order" />
            <HelpOverlay.Shortcut keys="]" description="Next order" />
          </HelpOverlay.Section>
        </HelpOverlay>
      </div>
    );
  },
};

export const ShortcutsListedInTheOverlay: Story = {
  ...WithShortcuts,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Keyboard shortcuts' }));
    const dialog = await within(document.body).findByRole('dialog');
    await expect(within(dialog).getByText('[')).toBeVisible();
    await expect(within(dialog).getByText('Next order')).toBeVisible();
  },
};

// ── Narrow screens ───────────────────────────────────────────────────────────

/** At 375px the back link takes its own row if the pager does not fit beside it. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { noun: 'purchase order' },
  render: (args) => (
    <div data-testid="mobile-box">
      <RecordPager {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByTestId('mobile-box'));
    for (const name of ['Previous purchase order', 'Next purchase order']) {
      const link = canvas.getByRole('link', { name });
      await expect(link).toBeVisible();
      // A long label must not wrap and spill out of the button.
      await expect(link.scrollHeight).toBeLessThanOrEqual(link.clientHeight);
    }
  },
};

export const MobileCompact: Story = {
  tags: ['!autodocs'],
  globals: mobileViewport,
  args: { variant: 'compact' },
  render: (args) => (
    <div data-testid="mobile-box">
      <PageHeader title="Order #20431" actions={<RecordPager {...args} />} />
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByTestId('mobile-box'));
    await expect(canvas.getByRole('link', { name: 'Next order' })).toBeVisible();
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const Hidden: Pick<Story, 'tags'> = { tags: ['!dev', '!autodocs'] };

/** At the first record Previous is a disabled button, not a link; Next stays a link. */
export const DisabledAtStartInLinkMode: Story = {
  ...Hidden,
  args: { position: 1, previousHref: '#order-0' },
  play: async ({ canvas }) => {
    const previous = canvas.getByRole('button', { name: 'Previous order' });
    await expect(previous).toBeDisabled();
    await expect(canvas.queryByRole('link', { name: 'Previous order' })).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Next order' })).toHaveAttribute(
      'href',
      '#order-13'
    );
  },
};

export const DisabledAtEndInLinkMode: Story = {
  ...Hidden,
  args: { position: 340, nextHref: '#order-341' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Next order' })).toBeDisabled();
    await expect(canvas.queryByRole('link', { name: 'Next order' })).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Previous order' })).toHaveAttribute(
      'href',
      '#order-11'
    );
  },
};

/** In callback mode both ends are disabled, and a click on a disabled button calls nothing. */
export const DisabledAtEndsInCallbackMode: Story = {
  ...Hidden,
  args: {
    previousHref: undefined,
    nextHref: undefined,
    onPrevious: fn(),
    onNext: fn(),
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div data-testid="first">
        <RecordPager {...args} position={1} aria-label="First" />
      </div>
      <div data-testid="last">
        <RecordPager {...args} position={340} aria-label="Last" />
      </div>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const first = within(canvas.getByTestId('first'));
    const last = within(canvas.getByTestId('last'));
    await expect(first.getByRole('button', { name: 'Previous order' })).toBeDisabled();
    await expect(first.getByRole('button', { name: 'Next order' })).toBeEnabled();
    await expect(last.getByRole('button', { name: 'Next order' })).toBeDisabled();
    await expect(last.getByRole('button', { name: 'Previous order' })).toBeEnabled();
    await userEvent.click(first.getByRole('button', { name: 'Previous order' }));
    await userEvent.click(last.getByRole('button', { name: 'Next order' }));
    await expect(args.onPrevious).not.toHaveBeenCalled();
    await expect(args.onNext).not.toHaveBeenCalled();
    await userEvent.click(first.getByRole('button', { name: 'Next order' }));
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    await userEvent.click(last.getByRole('button', { name: 'Previous order' }));
    await expect(args.onPrevious).toHaveBeenCalledTimes(1);
  },
};

/** A side without a destination or a callback is disabled too, whatever the position. */
export const DisabledWithoutDestination: Story = {
  ...Hidden,
  args: { previousHref: undefined, nextHref: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Previous order' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Next order' })).toBeDisabled();
  },
};

/** The shortcuts move through the pager's own controls: callbacks here, links below. */
export const ShortcutsCallBack: Story = {
  ...Hidden,
  args: {
    previousHref: undefined,
    nextHref: undefined,
    onPrevious: fn(),
    onNext: fn(),
    hotkeys: { previous: '[', next: ']' },
  },
  play: async ({ args }) => {
    await userEvent.keyboard('[[');
    await expect(args.onPrevious).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(']');
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    // A modified key is another shortcut.
    await userEvent.keyboard('{Control>}]{/Control}');
    await expect(args.onNext).toHaveBeenCalledTimes(1);
  },
};

/** Without `hotkeys` no key is taken. */
export const NoShortcutsByDefault: Story = {
  ...Hidden,
  args: { previousHref: undefined, nextHref: undefined, onPrevious: fn(), onNext: fn() },
  play: async ({ args }) => {
    await userEvent.keyboard('[[]');
    await expect(args.onPrevious).not.toHaveBeenCalled();
    await expect(args.onNext).not.toHaveBeenCalled();
  },
};

/** A key typed in a field is text: the pager does nothing. */
export const ShortcutsIgnoredInField: Story = {
  ...Hidden,
  args: {
    previousHref: undefined,
    nextHref: undefined,
    onPrevious: fn(),
    onNext: fn(),
    hotkeys: { previous: '[', next: ']' },
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <RecordPager {...args} />
      <input aria-label="Note" className="rounded border border-gray-300 px-3 py-2 text-sm" />
      <textarea aria-label="Comment" className="rounded border border-gray-300 px-3 py-2 text-sm" />
    </div>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText('Note'), '[[]');
    await userEvent.type(canvas.getByLabelText('Comment'), '[[]');
    await expect(canvas.getByLabelText('Note')).toHaveValue('[]');
    await expect(args.onPrevious).not.toHaveBeenCalled();
    await expect(args.onNext).not.toHaveBeenCalled();
    // Out of the field, the shortcut works again.
    await userEvent.click(document.body);
    await userEvent.keyboard(']');
    await expect(args.onNext).toHaveBeenCalledTimes(1);
  },
};

/** At the ends the shortcut for the missing side does nothing, and the key stays free. */
export const ShortcutsStopAtTheEnds: Story = {
  ...Hidden,
  args: {
    position: 1,
    previousHref: undefined,
    nextHref: undefined,
    onPrevious: fn(),
    onNext: fn(),
    hotkeys: { previous: '[', next: ']' },
  },
  play: async ({ args }) => {
    const event = new KeyboardEvent('keydown', { key: '[', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    await expect(event.defaultPrevented).toBe(false);
    await expect(args.onPrevious).not.toHaveBeenCalled();
  },
};

/** Once the pager is gone its listener is too. */
export const ShortcutsAreRemovedOnUnmount: Story = {
  ...Hidden,
  args: {
    previousHref: undefined,
    nextHref: undefined,
    onPrevious: fn(),
    onNext: fn(),
    hotkeys: { previous: '[', next: ']' },
  },
  render: (args) => {
    const [shown, setShown] = useState(true);
    return (
      <div>
        {shown && <RecordPager {...args} />}
        <Button onClick={() => setShown(false)}>Remove</Button>
      </div>
    );
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await userEvent.keyboard(']');
    await expect(args.onNext).not.toHaveBeenCalled();
  },
};

/** `noun` builds the labels, `labels` replaces any of them, and the compact buttons keep the name. */
export const LabelsCanBeOverridden: Story = {
  ...Hidden,
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div data-testid="noun">
        <RecordPager {...args} noun="invoice" backHref="#invoices" />
      </div>
      <div data-testid="labels">
        <RecordPager
          {...args}
          aria-label="Billets"
          labels={{
            previous: 'Billet précédent',
            next: 'Billet suivant',
            back: 'Retour à la liste',
            count: (position, total) => `${position} sur ${total}`,
          }}
        />
      </div>
      <div data-testid="compact">
        <RecordPager {...args} variant="compact" noun="invoice" aria-label="Compact" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const noun = within(canvas.getByTestId('noun'));
    await expect(noun.getByRole('link', { name: 'Previous invoice' })).toBeVisible();
    await expect(noun.getByRole('link', { name: 'Next invoice' })).toBeVisible();
    await expect(canvas.getByRole('navigation', { name: 'Invoice navigation' })).toBeVisible();
    await expect(noun.getByText('12', { exact: true })).toBeVisible();

    const labels = within(canvas.getByTestId('labels'));
    await expect(labels.getByRole('link', { name: 'Billet précédent' })).toBeVisible();
    await expect(labels.getByRole('link', { name: 'Billet suivant' })).toBeVisible();
    await expect(labels.getByRole('link', { name: 'Retour à la liste' })).toBeVisible();
    await expect(labels.getByText('12 sur 340')).toBeVisible();

    // Compact: icon only, so the name is the aria-label and no word is drawn.
    const compact = within(canvas.getByTestId('compact'));
    const previous = compact.getByRole('link', { name: 'Previous invoice' });
    await expect(previous.textContent).toBe('');
    await expect(compact.getByRole('link', { name: 'Next invoice' })).toBeVisible();
  },
};

const RouterLink = ({ href, ...props }: LinkComponentProps) => (
  <a {...props} href={href} data-router-link="router" />
);

/** Every link of the pager goes through the app's router: Previous, Next and Back to list. */
export const LinksUseTheLinkProvider: Story = {
  ...Hidden,
  decorators: [
    (Story) => (
      <LinkProvider component={RouterLink}>
        <Story />
      </LinkProvider>
    ),
  ],
  play: async ({ canvas }) => {
    for (const name of ['Previous order', 'Next order', 'Back to list']) {
      await expect(canvas.getByRole('link', { name })).toHaveAttribute(
        'data-router-link',
        'router'
      );
    }
  },
};

/** Without a provider they are plain links. */
export const LinksArePlainWithoutProvider: Story = {
  ...Hidden,
  play: async ({ canvas }) => {
    for (const name of ['Previous order', 'Next order', 'Back to list']) {
      await expect(canvas.getByRole('link', { name })).not.toHaveAttribute('data-router-link');
    }
  },
};

/** A shortcut on a link clicks it, so the router gets it, and nothing else navigates. */
export const ShortcutsFollowTheRouter: Story = {
  ...Hidden,
  args: { hotkeys: { previous: '[', next: ']' } },
  decorators: [
    (Story) => {
      const [visited, setVisited] = useState<string[]>([]);
      const Link = ({ href, onClick, ...props }: LinkComponentProps) => (
        <a
          {...props}
          href={href}
          onClick={(event) => {
            onClick?.(event);
            event.preventDefault();
            setVisited((list) => [...list, href]);
          }}
        />
      );
      return (
        <LinkProvider component={Link}>
          <Story />
          <p data-testid="visited">{visited.join(',')}</p>
        </LinkProvider>
      );
    },
  ],
  play: async ({ canvas }) => {
    await userEvent.keyboard(']');
    await waitFor(() => expect(canvas.getByTestId('visited')).toHaveTextContent('#order-13'));
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** Back and Previous sit at the start, the arrows turn around, and the position reads left to right. */
export const MirrorsInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => {
    // Both copies are on the page: each landmark needs a name of its own.
    let count = 0;
    return bothDirections(() => <RecordPager {...args} aria-label={`Orders ${++count}`} />);
  },
  play: ({ canvasElement }) => {
    for (const name of [/Back to list/, /Previous order/, /Next order/]) {
      expectMirrored(canvasElement, (box) => within(box).getByRole('link', { name }));
    }
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = directionBox(canvasElement, dir);
      for (const name of [/Back to list/, /Previous order/, /Next order/]) {
        const svg = within(box).getByRole('link', { name }).querySelector('svg')!;
        expect(getComputedStyle(svg).scale, `${dir}: ${name}`).toBe(
          dir === 'rtl' ? '-1 1' : 'none'
        );
      }
      expectReadsLeftToRight(box.querySelector('bdi')!);
    }
  },
};
