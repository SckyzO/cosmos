import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRef, useEffect, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  bothDirections,
  directionBox,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  mobileViewport,
} from '../storybook-helpers';
import { Dropzone, type DropzoneRejection } from './Dropzone';
import { UploadQueue, type UploadQueueItem } from './UploadQueue';

const MB = 1024 * 1024;

const meta = {
  title: 'Forms/Upload Queue',
  component: UploadQueue,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  args: { items: [], onRetry: fn(), onRemove: fn() },
} satisfies Meta<typeof UploadQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS: UploadQueueItem[] = [
  { id: 'a', name: 'contract-signed.pdf', size: 2.4 * MB, status: 'uploading', progress: 46 },
  {
    id: 'b',
    name: 'site-photo-04.jpg',
    size: 5.8 * MB,
    status: 'failed',
    error: 'Upload failed: the connection was lost.',
  },
  { id: 'c', name: 'inventory.xlsx', size: 86 * 1024, status: 'done' },
  { id: 'd', name: 'notes.docx', size: 24 * 1024, status: 'done' },
  { id: 'e', name: 'site-photo-05.jpg', size: 6.2 * MB, status: 'queued' },
];

// ── Stories ──────────────────────────────────────────────────────────────────

/** Every status: uploading with its progress, failed with Retry, done, waiting. */
export const Default: Story = { args: { items: ITEMS } };

/** Without `size` the progress is a bare percentage; without `progress` the bar is indeterminate. */
export const WithoutSizeOrProgress: Story = {
  args: {
    items: [
      { id: 'a', name: 'export.csv', status: 'uploading', progress: 72 },
      { id: 'b', name: 'archive.zip', size: 120 * MB, status: 'uploading' },
      { id: 'c', name: 'notes', status: 'queued' },
    ],
  },
};

export const Failed: Story = {
  args: {
    items: [
      { id: 'a', name: 'site-photo-04.jpg', size: 5.8 * MB, status: 'failed', error: 'Too large.' },
      { id: 'b', name: 'report.pdf', status: 'failed' },
    ],
  },
};

export const AllDone: Story = {
  args: {
    items: [
      { id: 'c', name: 'inventory.xlsx', size: 86 * 1024, status: 'done' },
      { id: 'd', name: 'notes.docx', size: 24 * 1024, status: 'done' },
    ],
  },
};

/** Without `onRetry` and `onRemove` the rows are read-only. */
export const ReadOnly: Story = { args: { items: ITEMS, onRetry: undefined, onRemove: undefined } };

export const CustomLabel: Story = { args: { items: ITEMS.slice(0, 2), label: 'Attachments' } };

/** At 375px a long name truncates, the failed row keeps its Retry button, nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: {
    items: [
      {
        id: 'a',
        name: 'Budget 2027 – final version for the board meeting.xlsx',
        size: 4.8 * MB,
        status: 'uploading',
        progress: 30,
      },
      {
        id: 'b',
        name: 'Budget 2027 – final version for the board meeting (copy).xlsx',
        size: 4.8 * MB,
        status: 'failed',
        error: 'Upload failed: the connection was lost while sending the file.',
      },
    ],
  },
};

export const MobileChecks: Story = {
  ...Mobile,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByRole('region', { name: 'Uploads' }));
    // The size wraps under a long name instead of squeezing it to a few letters.
    for (const name of [
      'Budget 2027 – final version for the board meeting.xlsx',
      'Budget 2027 – final version for the board meeting (copy).xlsx',
    ]) {
      const title = canvas.getByTitle(name);
      const column = title.parentElement!.parentElement!;
      await expect(title.getBoundingClientRect().width).toBeGreaterThan(
        column.getBoundingClientRect().width * 0.9
      );
    }
    // Retry is icon only on a phone, so the error text keeps the row.
    const retry = canvas.getByRole('button', { name: /^Retry Budget/ });
    await expect(within(retry).getByText('Retry')).not.toBeVisible();
  },
};

// A fake transfer for the stories: one file at a time, 25% a step. A file whose name contains
// "fail" breaks at 50% the first time, and goes through once retried. `auto` steps on a timer
// (nothing runs until a file is added); tests set it off and step by hand.
type Fake = { items: UploadQueueItem[]; retried: string[] };

const step = ({ items, retried }: Fake): Fake => {
  const active = items.find((i) => i.status === 'uploading');
  const target = active ?? items.find((i) => i.status === 'queued');
  if (!target) return { items, retried };
  const set = (patch: Partial<UploadQueueItem>) =>
    items.map((i) => (i.id === target.id ? { ...i, ...patch } : i));
  if (!active) return { items: set({ status: 'uploading', progress: 0 }), retried };
  const progress = (target.progress ?? 0) + 25;
  if (target.name.includes('fail') && !retried.includes(target.id) && progress >= 50)
    return {
      items: set({ status: 'failed', error: 'Upload failed: the connection was lost.' }),
      retried,
    };
  return {
    items: set(progress >= 100 ? { status: 'done', progress: 100 } : { progress }),
    retried,
  };
};

const FakeUploads = ({ auto }: { auto: boolean }) => {
  const [fake, setFake] = useState<Fake>({ items: [], retried: [] });
  const [skipped, setSkipped] = useState<string>();
  const busy = fake.items.some((i) => i.status === 'queued' || i.status === 'uploading');

  useEffect(() => {
    if (!auto || !busy) return;
    const timer = setInterval(() => setFake(step), 400);
    return () => clearInterval(timer);
  }, [auto, busy]);

  const onFilesAdded = (files: File[]) => {
    setSkipped(undefined);
    setFake(({ items, retried }) => ({
      retried,
      items: [
        ...items,
        ...files.map((f, i) => ({
          id: `${f.name}-${items.length + i}`,
          name: f.name,
          size: f.size,
          status: 'queued' as const,
        })),
      ],
    }));
  };
  const onReject = (rejections: DropzoneRejection[]) =>
    setSkipped(rejections.map(({ file, reason }) => `${file.name}: ${reason}`).join(' '));

  return (
    <div className="space-y-4">
      <Dropzone
        label="Attachments"
        description="PDF, PNG or text, up to 1 MB each."
        multiple
        hideFileList
        accept=".pdf,.png,.txt"
        maxSize={MB}
        error={skipped}
        onFilesAdded={onFilesAdded}
        onReject={onReject}
      />
      <UploadQueue
        items={fake.items}
        onRetry={(id) =>
          setFake(({ items, retried }) => ({
            retried: [...retried, id],
            items: items.map((i) =>
              i.id === id ? { ...i, status: 'queued', progress: undefined, error: undefined } : i
            ),
          }))
        }
        onRemove={(id) =>
          setFake(({ items, retried }) => ({ retried, items: items.filter((i) => i.id !== id) }))
        }
      />
      {!auto && (
        <button type="button" onClick={() => setFake(step)}>
          Step the uploader
        </button>
      )}
    </div>
  );
};

/**
 * A `Dropzone` (with `hideFileList`, `onFilesAdded` and `onReject`) feeding an `UploadQueue` through
 * a fake uploader. Nothing runs until a file is dropped: a file with "fail" in its name breaks
 * halfway and goes through when retried.
 */
export const WithDropzone: Story = {
  render: () => <FakeUploads auto />,
};

// ── Interaction tests ────────────────────────────────────────────────────────

const Hidden: Pick<Story, 'tags'> = { tags: ['!dev', '!autodocs'] };

/** The queue, the dropzone and a fake uploader end to end: queued, uploading, failed, retried, done, dismissed. */
export const FakeUploaderEndToEnd: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  render: () => <FakeUploads auto={false} />,
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Attachments', { selector: 'input' }) as HTMLInputElement;
    const ok = new File(['x'], 'report.pdf', { type: 'application/pdf' });
    const flaky = new File(['x'], 'fail-me.txt', { type: 'text/plain' });
    const badType = new File(['x'], 'run.exe', { type: 'application/x-msdownload' });
    fireEvent.change(input, { target: { files: [ok, flaky, badType] } });

    // The valid files are queued, the other one is reported on the zone.
    const queue = await canvas.findByRole('region', { name: 'Uploads' });
    const q = within(queue);
    await expect(q.getAllByText('Waiting')).toHaveLength(2);
    await expect(canvas.getByText(/run\.exe: type not allowed/i)).toBeInTheDocument();
    await expect(queue).toHaveTextContent('0 of 2 done');

    const stepper = canvas.getByRole('button', { name: 'Step the uploader' });
    const step = async (times: number) => {
      for (let i = 0; i < times; i++) await userEvent.click(stepper);
    };

    await step(2); // report.pdf starts, then 25%
    await waitFor(() =>
      expect(q.getByRole('progressbar', { name: 'Upload progress of report.pdf' })).toHaveAttribute(
        'aria-valuenow',
        '25'
      )
    );
    await step(3); // 50, 75, 100
    await waitFor(() => expect(queue).toHaveTextContent('1 of 2 done'));

    await step(3); // fail-me.txt starts, 25%, breaks at 50%
    await expect(await q.findByText('Upload failed: the connection was lost.')).toBeVisible();
    await expect(
      within(queue.querySelector('[data-status="failed"]') as HTMLElement).getByText('Retry')
    ).toBeVisible();

    await userEvent.click(q.getByRole('button', { name: 'Retry fail-me.txt' }));
    await expect(q.getByText('Waiting')).toBeVisible();
    await step(6); // start, 25, 50, 75, 100
    await waitFor(() => expect(queue).toHaveTextContent('2 of 2 done'));

    await userEvent.click(q.getByRole('button', { name: 'Dismiss report.pdf' }));
    await waitFor(() => expect(q.queryByText('report.pdf')).toBeNull());
    await userEvent.click(q.getByRole('button', { name: 'Dismiss fail-me.txt' }));
    // The last row gone, the card goes with it.
    await waitFor(() => expect(canvas.queryByRole('region', { name: 'Uploads' })).toBeNull());
  },
};

/** Each status reads as text first: Waiting, a percentage with the sizes, the error, Done. */
export const StatusIsText: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  args: { items: ITEMS },
  play: async ({ canvas }) => {
    const row = (name: string) => canvas.getByText(name).closest('li') as HTMLElement;
    await expect(row('site-photo-05.jpg')).toHaveTextContent('Waiting');
    await expect(row('contract-signed.pdf')).toHaveTextContent('1.1 MB of 2.4 MB · 46%');
    await expect(row('site-photo-04.jpg')).toHaveTextContent(
      'Upload failed: the connection was lost.'
    );
    await expect(row('inventory.xlsx')).toHaveTextContent('Done');
    await expect(canvas.getByText('2 of 5 done')).toBeVisible();
    const bar = within(row('contract-signed.pdf')).getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '46');
    await expect(bar).toHaveAccessibleName('Upload progress of contract-signed.pdf');
  },
};

/** Retry and the row buttons hand the item's id back; the button is named for what it does to that status. */
export const RetryAndRemoveFireWithTheId: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  args: { items: ITEMS, onRetry: fn(), onRemove: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Retry site-photo-04.jpg' }));
    await expect(args.onRetry).toHaveBeenCalledWith('b');

    const expected: [string, string][] = [
      ['Cancel contract-signed.pdf', 'a'],
      ['Remove site-photo-04.jpg', 'b'],
      ['Dismiss inventory.xlsx', 'c'],
      ['Cancel site-photo-05.jpg', 'e'],
    ];
    for (const [name, id] of expected) {
      await userEvent.click(canvas.getByRole('button', { name }));
      await expect(args.onRemove).toHaveBeenLastCalledWith(id);
    }
    await expect(args.onRemove).toHaveBeenCalledTimes(expected.length);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** Without the callbacks there is neither Retry nor a row button. */
export const NoButtonsWithoutCallbacks: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  args: { items: ITEMS, onRetry: undefined, onRemove: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
  },
};

const Announcing = () => {
  const [status, setStatus] = useState<UploadQueueItem['status']>('uploading');
  return (
    <div>
      <UploadQueue
        items={[
          {
            id: 'r',
            name: 'report.pdf',
            status,
            progress: 40,
            error: status === 'failed' ? 'Upload failed.' : undefined,
          },
        ]}
      />
      <button type="button" onClick={() => setStatus('failed')}>
        Fail it
      </button>
      <button type="button" onClick={() => setStatus('done')}>
        Finish it
      </button>
    </div>
  );
};

/** A row that fails or finishes is announced by name in a polite live region; a row that starts so is not. */
export const AnnouncesFailureAndCompletion: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  render: () => <Announcing />,
  play: async ({ canvas }) => {
    const live = canvas.getByRole('status');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveTextContent('');
    await userEvent.click(canvas.getByRole('button', { name: 'Fail it' }));
    await waitFor(() => expect(live).toHaveTextContent('report.pdf: upload failed'));
    await userEvent.click(canvas.getByRole('button', { name: 'Finish it' }));
    await waitFor(() => expect(live).toHaveTextContent('report.pdf: upload complete'));
  },
};

/** An empty queue draws nothing. */
export const EmptyDrawsNothing: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region')).toBeNull();
  },
};

const queueRef = createRef<HTMLElement>();

/** The ref gets the card, a `<section>` named by its title. */
export const ForwardsRef: Story = {
  ...Hidden,
  tags: ['!dev', '!autodocs'],
  render: () => <UploadQueue ref={queueRef} items={ITEMS} label="Transfers" />,
  play: async ({ canvas }) => {
    await expect(queueRef.current).toBe(canvas.getByRole('region', { name: 'Transfers' }));
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The file tile is at the start, the remove button at the end, and a file name is an island. */
export const RowsMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { items: [{ id: 'a', name: 'report (final) 2026.pdf', size: 2 * MB, status: 'done' }] },
  render: (args) => {
    // Both queues are on the page: each landmark needs a name of its own.
    let count = 0;
    return bothDirections(() => <UploadQueue {...args} label={`Uploads ${++count}`} />);
  },
  play: ({ canvasElement }) => {
    expectMirrored(canvasElement, (box) => box.querySelector('li')!.firstElementChild);
    expectMirrored(canvasElement, (box) => box.querySelector('li')!.lastElementChild);
    const names = canvasElement.querySelectorAll('li [title] > bdi');
    expect(names).toHaveLength(2);
    for (const name of names) {
      expect(name).toHaveTextContent('report (final) 2026.pdf');
      expect(getComputedStyle(name).direction).toBe('ltr');
    }
  },
};

/** The count and the sizes the queue writes keep their order in a right-to-left page. */
export const CountAndSizesReadLeftToRight: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    items: [
      { id: 'a', name: 'a.pdf', size: 2 * MB, status: 'done' },
      { id: 'b', name: 'b.pdf', size: 4 * MB, status: 'uploading', progress: 50 },
    ],
  },
  render: (args) => {
    let count = 0;
    return bothDirections(() => <UploadQueue {...args} label={`Uploads ${++count}`} />);
  },
  play: ({ canvasElement }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const box = within(directionBox(canvasElement, dir));
      expectReadsLeftToRight(box.getByText('1 of 2 done'));
      expectReadsLeftToRight(box.getByText('2.0 MB'));
      expectReadsLeftToRight(box.getByText('2.0 MB of 4.0 MB · 50%'));
    }
  },
};
