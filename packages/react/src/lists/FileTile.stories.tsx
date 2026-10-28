import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Download, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { createRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Menu } from '../ui/Menu';
import {
  bothDirections,
  directionBox,
  endOffset,
  expectMirrored,
  expectNoHorizontalOverflow,
  expectReadsLeftToRight,
  inEachTheme,
  mobileViewport,
  portalDocsParams,
} from '../storybook-helpers';
import { FileTile, type FileKind } from './FileTile';
import { GridList } from './GridList';

// Photo by Benjamin Voros on Unsplash (Unsplash License), see `typography/Figure.stories.tsx`.
const PHOTO = new URL('../storybook-assets/snow-mountain-under-stars.jpg', import.meta.url).href;

const meta = {
  title: 'Lists/File Tile',
  component: FileTile,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { name: 'Q3 report.pdf', kind: 'pdf', meta: '2.4 MB · Edited yesterday' },
} satisfies Meta<typeof FileTile>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = 'Budget 2027 – final version for the board meeting.xlsx';

const KINDS: { kind: FileKind; name: string; meta: string }[] = [
  { kind: 'folder', name: 'Design assets', meta: '24 files · Edited today' },
  { kind: 'image', name: 'site-photo-04.jpg', meta: '5.8 MB' },
  { kind: 'video', name: 'kickoff-recording.mp4', meta: '412 MB' },
  { kind: 'audio', name: 'interview.mp3', meta: '18 MB' },
  { kind: 'pdf', name: 'Q3 report.pdf', meta: '2.4 MB' },
  { kind: 'document', name: 'notes.docx', meta: '24 KB' },
  { kind: 'spreadsheet', name: 'inventory.xlsx', meta: '86 KB' },
  { kind: 'archive', name: 'backup-2026-10.zip', meta: '1.2 GB' },
  { kind: 'code', name: 'deploy.sh', meta: '3 KB' },
  { kind: 'other', name: 'LICENSE', meta: '11 KB' },
];

const ROW_LIST =
  'max-w-xl divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]';

const MORE_BUTTON =
  'flex size-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-black/5 dark:hover:bg-white/10';

const ActionsMenu = ({ name, defaultOpen }: { name: string; defaultOpen?: boolean }) => (
  <Menu align="right" defaultOpen={defaultOpen}>
    <Menu.Trigger aria-label={`More actions for ${name}`} className={MORE_BUTTON}>
      <MoreVertical className="size-4" aria-hidden />
    </Menu.Trigger>
    <Menu.Content aria-label={`Actions for ${name}`}>
      <Menu.Item icon={Pencil}>Rename</Menu.Item>
      <Menu.Item icon={Download}>Download</Menu.Item>
      <Menu.Separator />
      <Menu.Item icon={Trash2} intent="danger">
        Delete
      </Menu.Item>
    </Menu.Content>
  </Menu>
);

// A story that passes `args` renders one tile: this puts it in the `<ul>` it belongs to.
const inList: Decorator = (Story) => (
  <ul className="max-w-xs">
    <Story />
  </ul>
);

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = { decorators: [inList] };

/** Every `kind` as a tile in a `GridList`: the tint and the icon come from the kind. */
export const Kinds: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-5xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <GridList cols={4} gapClassName="gap-4">
      {KINDS.map((k) => (
        <FileTile key={k.kind} {...k} onOpen={fn()} />
      ))}
    </GridList>
  ),
};

/** Every `kind` as a row, in a bordered list. */
export const Rows: Story = {
  render: () => (
    <ul className={ROW_LIST}>
      {KINDS.map((k) => (
        <FileTile key={k.kind} {...k} layout="row" onOpen={fn()} />
      ))}
    </ul>
  ),
};

export const Starred: Story = {
  decorators: [inList],
  args: { starred: true, onStarredChange: fn() },
};

export const StarredRow: Story = {
  args: { layout: 'row', defaultStarred: true },
  decorators: [
    (Story) => (
      <ul className={ROW_LIST}>
        <Story />
      </ul>
    ),
  ],
};

/** The "Shared" badge sits over the preview in a tile, in the meta line in a row. */
export const Shared: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <ul>
        <FileTile name="Design assets" kind="folder" meta="24 files" shared />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile name="Design assets" kind="folder" meta="24 files" layout="row" shared />
      </ul>
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <ul>
        <FileTile name="Q3 report.pdf" kind="pdf" meta="2.4 MB" selected onOpen={fn()} />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile name="Q3 report.pdf" kind="pdf" meta="2.4 MB" layout="row" onOpen={fn()} />
        <FileTile
          name="mountain-night.jpg"
          kind="image"
          meta="3.1 MB"
          layout="row"
          selected
          onOpen={fn()}
        />
        <FileTile name="notes.docx" kind="document" meta="24 KB" layout="row" onOpen={fn()} />
      </ul>
    </div>
  ),
};

/** A `thumbnail` fills the preview in a tile, the icon box in a row. */
export const WithThumbnail: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <ul>
        <FileTile
          name="mountain-night.jpg"
          kind="image"
          thumbnail={PHOTO}
          meta="3.1 MB · Shared by Ana"
          shared
          selected
          onOpen={fn()}
        />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile
          name="mountain-night.jpg"
          kind="image"
          thumbnail={PHOTO}
          meta="3.1 MB"
          layout="row"
          onOpen={fn()}
        />
      </ul>
    </div>
  ),
};

/** `actions` takes any node: here a `Menu` whose trigger is named after the file. */
export const WithActions: Story = {
  parameters: portalDocsParams.md(),
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <ul>
        <FileTile
          name="Q3 report.pdf"
          kind="pdf"
          meta="2.4 MB · Edited yesterday"
          defaultStarred
          onOpen={fn()}
          actions={<ActionsMenu name="Q3 report.pdf" />}
        />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile
          name="Q3 report.pdf"
          kind="pdf"
          meta="2.4 MB · Edited yesterday"
          layout="row"
          defaultStarred
          onOpen={fn()}
          actions={<ActionsMenu name="Q3 report.pdf" />}
        />
      </ul>
    </div>
  ),
};

/** A long name truncates on one line; the full name is the `title`. */
export const LongName: Story = {
  decorators: [inList],
  args: {
    name: 'Budget 2027 – final version for the board meeting.xlsx',
    kind: 'spreadsheet',
    meta: '86 KB · Edited 3 days ago',
    onOpen: fn(),
    defaultStarred: false,
    actions: <ActionsMenu name="Budget 2027" />,
  },
};

/** A link name goes through the app's router (`LinkProvider`). */
export const AsLink: Story = {
  decorators: [inList],
  args: { href: '#q3-report', onOpen: undefined },
};

/** At 375px the name truncates in both layouts and nothing widens the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  render: () => (
    <div className="flex flex-col gap-4" data-testid="mobile-box">
      <ul>
        <FileTile
          name="Budget 2027 – final version for the board meeting.xlsx"
          kind="spreadsheet"
          meta="86 KB · Edited 3 days ago"
          shared
          defaultStarred
          onOpen={fn()}
          actions={<ActionsMenu name="Budget 2027" />}
        />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile
          name="Budget 2027 – final version for the board meeting.xlsx"
          kind="spreadsheet"
          meta="86 KB · Edited 3 days ago"
          layout="row"
          shared
          defaultStarred
          onOpen={fn()}
          actions={<ActionsMenu name="Budget 2027" />}
        />
      </ul>
    </div>
  ),
  play: async ({ canvas }) => {
    expectNoHorizontalOverflow(canvas.getByTestId('mobile-box'));
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const Hidden: Pick<Story, 'tags'> = { tags: ['!dev', '!autodocs'] };
const HiddenTile: Pick<Story, 'tags' | 'decorators'> = { ...Hidden, decorators: [inList] };

/** The star toggles, reports the state it moves to, and keeps its name ("Star {name}"). */
export const StarToggles: Story = {
  ...HiddenTile,
  args: { defaultStarred: false, onStarredChange: fn() },
  play: async ({ canvas, args }) => {
    const star = canvas.getByRole('button', { name: 'Star Q3 report.pdf' });
    await expect(star).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(star);
    await expect(args.onStarredChange).toHaveBeenLastCalledWith(true);
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(star);
    await expect(args.onStarredChange).toHaveBeenLastCalledWith(false);
    await expect(star).toHaveAttribute('aria-pressed', 'false');
  },
};

/** A controlled star shows what the host passes back, not what was clicked. */
export const ControlledStarFollowsTheHost: Story = {
  ...Hidden,
  render: () => {
    const [starred, setStarred] = useState(false);
    return (
      <div>
        <ul className="max-w-xs">
          <FileTile
            name="Q3 report.pdf"
            kind="pdf"
            starred={starred}
            onStarredChange={setStarred}
          />
        </ul>
        <p data-testid="host">{String(starred)}</p>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const star = canvas.getByRole('button', { name: 'Star Q3 report.pdf' });
    await userEvent.click(star);
    await waitFor(() => expect(canvas.getByTestId('host')).toHaveTextContent('true'));
    await expect(star).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Without any starred prop there is no star button. */
export const NoStarByDefault: Story = {
  ...HiddenTile,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /^Star / })).toBeNull();
  },
};

/** The name is the single button; the star and the actions are its siblings, not inside it. */
export const NameIsTheOnlyButton: Story = {
  ...HiddenTile,
  parameters: portalDocsParams.md(),
  args: {
    onOpen: fn(),
    defaultStarred: false,
    actions: <ActionsMenu name="Q3 report.pdf" />,
  },
  play: async ({ canvas, args }) => {
    const name = canvas.getByRole('button', { name: 'Q3 report.pdf' });
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(canvas.getAllByRole('button')).toHaveLength(3);
    await expect(name.querySelector('button, a')).toBeNull();
    await expect(name).toHaveAttribute('title', 'Q3 report.pdf');
    await userEvent.click(canvas.getByRole('button', { name: 'Star Q3 report.pdf' }));
    await expect(args.onOpen).not.toHaveBeenCalled();
    await userEvent.click(name);
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

/** With an `href` the name is the only link, and the star is not inside it. */
export const NameIsTheOnlyLink: Story = {
  ...HiddenTile,
  args: { href: '#q3-report', defaultStarred: false },
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(1);
    await expect(links[0]).toHaveAccessibleName('Q3 report.pdf');
    await expect(links[0]).toHaveAttribute('href', '#q3-report');
    await expect(links[0].querySelector('button')).toBeNull();
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
  },
};

/** Without `onOpen` or `href` the name is plain text, not a control. */
export const NameIsTextWithoutHandler: Story = {
  ...HiddenTile,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.queryByRole('link')).toBeNull();
    await expect(canvas.getByText('Q3 report.pdf').closest('[title]')).toHaveAttribute(
      'title',
      'Q3 report.pdf'
    );
  },
};

/** The name truncates on one line, in both layouts, and the full name stays in its `title`. */
export const LongNameTruncates: Story = {
  ...Hidden,
  render: () => (
    <div className="w-64">
      <ul>
        <FileTile name={LONG} kind="spreadsheet" onOpen={fn()} defaultStarred={false} />
      </ul>
      <ul className={ROW_LIST}>
        <FileTile name={LONG} kind="spreadsheet" layout="row" onOpen={fn()} defaultStarred />
      </ul>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of canvas.getAllByRole('button', { name: LONG })) {
      const style = getComputedStyle(name);
      await expect(style.textOverflow).toBe('ellipsis');
      await expect(style.whiteSpace).toBe('nowrap');
      await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
      await expect(name.getBoundingClientRect().height).toBeLessThan(24);
      await expect(name).toHaveAttribute('title', LONG);
    }
  },
};

/** A thumbnail that fails to load falls back to the kind icon. */
export const BrokenThumbnailFallsBackToTheIcon: Story = {
  ...HiddenTile,
  args: { thumbnail: 'data:image/png;base64,broken', kind: 'image', name: 'broken.png' },
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector('li') as HTMLElement;
    await waitFor(() => expect(li.querySelector('img')).toBeNull());
    await expect(li.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  },
};

/** A thumbnail that loads replaces the icon, with an empty `alt` (the name is already there). */
export const ThumbnailHasEmptyAlt: Story = {
  ...HiddenTile,
  args: { thumbnail: PHOTO, kind: 'image', name: 'mountain-night.jpg' },
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('li img') as HTMLImageElement;
    await expect(img).toHaveAttribute('alt', '');
    await expect(img.className).toContain('object-cover');
  },
};

/** `selected` sets `aria-current` on the name and draws the accent border, in every theme. */
export const SelectedMarksTheName: Story = {
  ...HiddenTile,
  args: { selected: true, onOpen: fn() },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('button', { name: 'Q3 report.pdf' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    const li = canvasElement.querySelector('li') as HTMLElement;
    inEachTheme(() => {
      const probe = document.createElement('span');
      probe.className = 'border-brand-500 border';
      li.append(probe);
      const accent = getComputedStyle(probe).borderTopColor;
      probe.remove();
      expect(getComputedStyle(li).borderTopColor).toBe(accent);
    });
  },
};

/** The kind tint is not the neutral one for a PDF, a spreadsheet, a folder: in every theme. */
export const KindsAreTintedApart: Story = {
  ...Hidden,
  render: () => (
    <GridList cols={4}>
      {(['pdf', 'spreadsheet', 'folder', 'other'] as const).map((kind) => (
        <FileTile key={kind} name={`a ${kind}`} kind={kind} />
      ))}
    </GridList>
  ),
  play: async ({ canvasElement }) => {
    const tintOf = (name: string): string => {
      const li = within(canvasElement).getByText(name).closest('li') as HTMLElement;
      return getComputedStyle(li.firstElementChild as HTMLElement).backgroundColor;
    };
    inEachTheme(() => {
      const tints = new Set(['a pdf', 'a spreadsheet', 'a folder', 'a other'].map(tintOf));
      expect(tints.size, 'each kind has its own tint').toBeGreaterThanOrEqual(3);
    });
  },
};

const tileRef = createRef<HTMLLIElement>();

/** The ref gets the `<li>`. */
export const ForwardsRef: Story = {
  ...Hidden,
  render: () => (
    <ul>
      <FileTile ref={tileRef} name="Q3 report.pdf" kind="pdf" onOpen={fn()} />
    </ul>
  ),
  play: async ({ canvas }) => {
    await expect(tileRef.current?.tagName).toBe('LI');
    await expect(tileRef.current).toContainElement(
      canvas.getByRole('button', { name: 'Q3 report.pdf' })
    );
  },
};

// ── Right to left ───────────────────────────────────────────────────────────

/** The icon, the name and the Shared badge are at the start; the star and the actions at the end. */
export const TileAndRowMirrorInRightToLeft: Story = {
  tags: ['!dev', '!autodocs'],
  render: () =>
    bothDirections(() => (
      <ul className="max-w-sm space-y-3">
        <FileTile
          name="Q3 report.pdf"
          kind="pdf"
          meta="2.4 MB · Edited yesterday"
          shared
          defaultStarred
        />
        <FileTile
          name="Q3 report.pdf"
          kind="pdf"
          meta="2.4 MB · Edited yesterday"
          shared
          layout="row"
          defaultStarred
          actions={<ActionsMenu name="Q3 report.pdf" />}
        />
      </ul>
    )),
  play: ({ canvasElement }) => {
    const item = (box: HTMLElement, layout: string) =>
      box.querySelector<HTMLElement>(`[data-layout="${layout}"]`)!;
    for (const layout of ['tile', 'row']) {
      expectMirrored(canvasElement, (box) => within(item(box, layout)).getByText('Q3 report.pdf'));
      const meta = (box: HTMLElement) =>
        within(item(box, layout)).getByText('2.4 MB · Edited yesterday');
      expectMirrored(canvasElement, meta);
      // The size leads the line in both directions.
      for (const box of canvasElement.querySelectorAll<HTMLElement>('[data-direction]'))
        expectReadsLeftToRight(meta(box));
      const ltr = directionBox(canvasElement, 'ltr');
      const rtl = directionBox(canvasElement, 'rtl');
      const star = (box: HTMLElement) =>
        within(item(box, layout)).getByRole('button', { name: 'Star Q3 report.pdf' });
      expect(endOffset(star(rtl), item(rtl, layout))).toBeCloseTo(
        endOffset(star(ltr), item(ltr, layout)),
        0
      );
    }
    // The badge over the preview of a tile is at the start corner.
    expectMirrored(canvasElement, (box) => within(item(box, 'tile')).getByText('Shared'));
    expectMirrored(canvasElement, (box) =>
      item(box, 'row').querySelector('span.rounded-\\[10px\\]')
    );
  },
};
