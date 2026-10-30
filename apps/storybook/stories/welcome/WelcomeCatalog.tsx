import { Search } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, Button, EmptyState, SearchInput } from '../../../../packages/react/src';
import {
  catalogComponents,
  catalogGroups,
  figuresOf,
  searchComponents,
  splitMatch,
  type CatalogComponent,
  type CatalogGroup,
  type StoryIndex,
} from './catalog';
import { GroupPreview } from './groupPreviews';
import { Section } from './parts';
import { REPO } from './WelcomeSections';
import { CARD, CTA_VARIANT, cx } from './styles';

// Groups shown at first on a phone; the others wait behind a button.
const GROUPS_FIRST = 6;
// Component names a group card lists.
const SAMPLE = 4;

const sampleOf = (group: CatalogGroup) => {
  const names = group.components.slice(0, SAMPLE).map((c) => c.name);
  return names.join(', ') + (group.components.length > SAMPLE ? '…' : '');
};

const GroupCard = ({ group }: { group: CatalogGroup }) => (
  <a
    href={group.href}
    className={cx(
      CARD,
      'focus-visible:focus-indicator group flex h-full flex-col gap-3 p-3.5 transition-colors hover:border-[var(--color-brand-500)] hover:no-underline'
    )}
  >
    {/* A link holds no interactive element: the preview is for the eye only. */}
    <div
      inert
      aria-hidden
      className="flex h-20 items-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 text-[var(--color-text-secondary)]"
    >
      <GroupPreview group={group.name} />
    </div>
    <span className="flex items-center justify-between gap-2">
      <span className="text-brand-600 dark:text-brand-400 text-base font-semibold group-hover:underline">
        {group.name}
      </span>
      <Badge size="sm">{group.components.length}</Badge>
    </span>
    <span className="text-sm leading-snug text-[var(--color-text-secondary)]">
      {sampleOf(group)}
    </span>
  </a>
);

const Groups = ({ groups }: { groups: CatalogGroup[] }) => {
  const [all, setAll] = useState(false);
  const listId = useId();
  const others = groups.length - GROUPS_FIRST;
  return (
    <>
      <ul id={listId} className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, i) => (
          <li
            key={group.name}
            className={cx('min-w-0', i >= GROUPS_FIRST && !all && 'max-sm:hidden')}
          >
            <GroupCard group={group} />
          </li>
        ))}
      </ul>
      {others > 0 && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 sm:hidden"
          aria-expanded={all}
          aria-controls={listId}
          onClick={() => setAll(!all)}
        >
          {all ? 'Show fewer groups' : `Show the ${others} other groups`}
        </Button>
      )}
    </>
  );
};

const STORIES_LISTED = 3;

const storiesOf = (c: CatalogComponent) => {
  const names = c.stories.slice(0, STORIES_LISTED).map((st) => st.name);
  const count = `${c.stories.length} ${c.stories.length === 1 ? 'story' : 'stories'}`;
  return names.length === 0
    ? count
    : `${count} · ${names.join(', ')}${c.stories.length > STORIES_LISTED ? '…' : ''}`;
};

const Result = ({ component, query }: { component: CatalogComponent; query: string }) => {
  const { before, match, after } = splitMatch(component.name, query);
  return (
    <a
      href={component.href}
      data-result
      className="focus-visible:focus-indicator grid items-baseline gap-x-4 gap-y-0.5 px-4 py-2.5 hover:bg-gray-50 hover:no-underline sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,2fr)] dark:hover:bg-white/5"
    >
      <span className="text-brand-600 dark:text-brand-400 truncate text-sm font-semibold">
        {before}
        {match && <mark className="bg-brand-500/20 rounded-sm text-inherit">{match}</mark>}
        {after}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)]">{component.group}</span>
      <span className="truncate text-xs text-[var(--color-text-secondary)]">
        {storiesOf(component)}
      </span>
    </a>
  );
};

const Results = ({
  matches,
  query,
  onClear,
}: {
  matches: CatalogComponent[];
  query: string;
  onClear: () => void;
}) => {
  const shown = query.trim();
  if (matches.length === 0)
    return (
      <>
        <p role="status" className="sr-only">
          No components match “{shown}”
        </p>
        <div className={CARD}>
          <EmptyState
            icon={Search}
            title={`No component named “${shown}”`}
            description="Check the spelling, or browse the groups. A component Cosmos lacks can be asked for in an issue."
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={onClear}>
                  Clear the search
                </Button>
                <a
                  href={`${REPO}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className={CTA_VARIANT.secondary}
                >
                  Ask for a component
                </a>
              </span>
            }
          />
        </div>
      </>
    );
  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <p role="status" className="text-sm font-medium text-[var(--color-text-primary)]">
          {matches.length} {matches.length === 1 ? 'component matches' : 'components match'} “
          {shown}”
        </p>
        <span className="text-xs text-[var(--color-text-secondary)] max-sm:hidden">
          ↓ ↑ to move, Enter to open
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {matches.map((c) => (
          <li key={`${c.group}/${c.name}`}>
            <Result component={c} query={query} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
);

/**
 * The sidebar's groups as cards, and a search over the components' names. `index` is `null` while
 * loading and `'error'` without it.
 */
export const ComponentsSection = ({ index }: { index: StoryIndex }) => {
  const [query, setQuery] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const components: CatalogComponent[] | null = Array.isArray(index)
    ? catalogComponents(index)
    : null;
  const total = components && figuresOf(components).components;
  const searching = components !== null && query.trim() !== '';

  // The arrow keys hand the focus from the field to the matches and along them: each match is a
  // link, so Enter on one opens it as a click does. Enter in the field opens the first match.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!searching) return;
    const links = [
      ...(results.current?.querySelectorAll<HTMLAnchorElement>('[data-result]') ?? []),
    ];
    const at = links.indexOf(e.target as HTMLAnchorElement);
    const inField = e.target === field.current;
    if (e.key === 'ArrowDown' && (inField || at >= 0)) {
      e.preventDefault();
      links[at + 1]?.focus();
    } else if (e.key === 'ArrowUp' && at >= 0) {
      e.preventDefault();
      (links[at - 1] ?? field.current)?.focus();
    } else if (e.key === 'Enter' && inField) {
      e.preventDefault();
      links[0]?.click();
    }
  };

  return (
    <Section
      id="components"
      eyebrow="Every component"
      title={total === null ? 'Every component' : `${total} components and patterns`}
      lead="Grouped as in the sidebar. Search by name, or open a group."
      action={
        components && (
          <div className="w-full sm:w-80" onKeyDown={onKeyDown}>
            <label
              id={labelId}
              htmlFor="welcome-search"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Find a component
            </label>
            <SearchInput
              id="welcome-search"
              ref={field}
              aria-labelledby={labelId}
              placeholder="Date picker, toast, heatmap…"
              value={query}
              onChange={setQuery}
            />
          </div>
        )
      }
    >
      {index === null && <Note>Loading the story index…</Note>}
      {index === 'error' && (
        <Note>
          The story index (<code>index.json</code>) couldn&apos;t be loaded, so the groups
          can&apos;t be listed here. The sidebar has them all.
        </Note>
      )}
      {components &&
        (searching ? (
          <div ref={results} onKeyDown={onKeyDown}>
            <Results
              matches={searchComponents(components, query)}
              query={query}
              onClear={() => {
                setQuery('');
                field.current?.focus();
              }}
            />
          </div>
        ) : (
          <Groups groups={catalogGroups(components)} />
        ))}
    </Section>
  );
};
