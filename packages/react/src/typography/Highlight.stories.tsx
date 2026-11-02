import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { SearchInput } from '../forms/SearchInput';
import { COSMOS_ACCENTS } from '../settings/appearance';
import { expectTextContrastOnTint, inEachTheme } from '../storybook-helpers';
import { Highlight } from './Highlight';

const meta = {
  title: 'Typography/Highlight',
  component: Highlight,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { text: 'Disk alert cleared on rack B4', query: 'alert' },
  decorators: [
    (Story) => (
      <p className="max-w-prose text-sm text-[var(--color-text-secondary)]">
        <Story />
      </p>
    ),
  ],
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

const marks = (box: Element) => [...box.querySelectorAll('mark')].map((mark) => mark.textContent);

export const Default: Story = {};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(marks(canvasElement)).toEqual(['alert']);
    await expect(canvasElement.querySelector('p')).toHaveTextContent(
      'Disk alert cleared on rack B4'
    );
  },
};

/** Each word of the query is marked on its own, whatever its case. */
export const SeveralWords: Story = {
  args: {
    text: 'Disk alert cleared on rack B4, and the DISK usage is back to normal',
    query: 'disk b4',
  },
};

export const SeveralWordsChecks: Story = {
  ...SeveralWords,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(marks(canvasElement)).toEqual(['Disk', 'B4', 'DISK']);
  },
};

export const EmptyQueryMarksNothing: Story = {
  args: { query: '' },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('mark')).toBeNull();
    await expect(canvasElement.querySelector('p')).toHaveTextContent(
      'Disk alert cleared on rack B4'
    );
  },
};

/** The query is text: `(a+` and `.*` are searched for as they are. */
export const QueryIsNotAPattern: Story = {
  args: { text: 'Matches (a+ b) but not aab, and keeps .* as is', query: '(a+ .*' },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(marks(canvasElement)).toEqual(['(a+', '.*']);
  },
};

/** Markup in the text shows as written: it is never parsed, matched or not. */
export const HtmlInTextRendersAsText: Story = {
  args: {
    text: '<img src=x onerror="document.title=\'pwned\'"> alert <b>bold</b>',
    query: 'img bold',
  },
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('img')).toBeNull();
    await expect(canvasElement.querySelector('b')).toBeNull();
    await expect(marks(canvasElement)).toEqual(['img', 'bold']);
    await expect(canvasElement.querySelector('p')!.textContent).toBe(
      '<img src=x onerror="document.title=\'pwned\'"> alert <b>bold</b>'
    );
    await expect(document.title).not.toBe('pwned');
  },
};

const RESULTS = [
  {
    id: 'disk',
    title: 'Disk alert on rack B4',
    body: 'The disk usage alert cleared after the nightly cleanup job ran.',
  },
  {
    id: 'backup',
    title: 'Backup finished',
    body: 'The nightly backup of the disk array finished in 42 minutes.',
  },
  {
    id: 'cert',
    title: 'Certificate expires in 12 days',
    body: 'Renew the certificate of the status page before the alert fires.',
  },
  {
    id: 'deploy',
    title: 'Deploy of api-gateway succeeded',
    body: 'Version 2.8.1 is live in every region, with no alert raised.',
  },
];

const Results = ({ initialQuery }: { initialQuery: string }) => {
  const [query, setQuery] = useState(initialQuery);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = RESULTS.filter((result) =>
    words.every((word) => `${result.title} ${result.body}`.toLowerCase().includes(word))
  );
  return (
    <div className="w-full max-w-xl space-y-3">
      <SearchInput aria-label="Search results" value={query} onChange={setQuery} />
      <ul className="divide-y divide-[var(--color-border)]" aria-label="Results">
        {shown.map((result) => (
          <li key={result.id} className="py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              <Highlight text={result.title} query={query} />
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              <Highlight text={result.body} query={query} />
            </p>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">No result for this search.</p>
      )}
    </div>
  );
};

/** A search box filtering a list: the words typed are marked in each title and snippet. */
export const SearchResults: Story = {
  render: () => <Results initialQuery="disk alert" />,
  decorators: [],
};

export const SearchResultsChecks: Story = {
  ...SearchResults,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement }) => {
    const results = within(canvas.getByRole('list', { name: 'Results' }));
    // "disk alert": both words in the first two results' text, only the first has both.
    await expect(results.getAllByRole('listitem')).toHaveLength(1);
    await expect(marks(canvasElement)).toEqual(['Disk', 'alert', 'disk', 'alert']);

    const search = canvas.getByRole('textbox', { name: 'Search results' });
    await userEvent.clear(search);
    await userEvent.type(search, 'NIGHTLY');
    await expect(results.getAllByRole('listitem')).toHaveLength(2);
    await expect(marks(canvasElement)).toEqual(['nightly', 'nightly']);

    await userEvent.clear(search);
    await expect(canvasElement.querySelector('mark')).toBeNull();
    await expect(results.getAllByRole('listitem')).toHaveLength(RESULTS.length);

    await userEvent.type(search, 'zzz');
    await expect(canvas.getByText('No result for this search.')).toBeVisible();
  },
};

/** The marked word keeps 4.5:1 over its tint, in every theme and on every accent. */
export const MarkContrastInEveryThemeAndAccent: Story = {
  ...SearchResults,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const saved = root.getAttribute('data-accent');
    try {
      for (const { id } of COSMOS_ACCENTS) {
        root.setAttribute('data-accent', id);
        inEachTheme(() => {
          try {
            for (const mark of canvasElement.querySelectorAll('mark')) {
              expectTextContrastOnTint(mark);
            }
          } catch (error) {
            throw new Error(`[${id}] ${(error as Error).message}`, { cause: error });
          }
        });
      }
    } finally {
      if (saved === null) root.removeAttribute('data-accent');
      else root.setAttribute('data-accent', saved);
    }
  },
};
