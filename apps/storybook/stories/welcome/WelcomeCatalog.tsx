import { useId, useState } from 'react';
import { Badge, Button } from '../../../../packages/react/src';
import {
  catalogComponents,
  catalogGroups,
  figuresOf,
  type CatalogComponent,
  type CatalogGroup,
  type StoryIndex,
} from './catalog';
import { GroupPreview } from './groupPreviews';
import { Section } from './parts';
import { CARD, cx } from './styles';

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

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
);

/** The sidebar's groups as cards. `index` is `null` while loading and `'error'` without it. */
export const ComponentsSection = ({ index }: { index: StoryIndex }) => {
  const components: CatalogComponent[] | null = Array.isArray(index)
    ? catalogComponents(index)
    : null;
  const total = components && figuresOf(components).components;
  return (
    <Section
      id="components"
      eyebrow="Every component"
      title={total === null ? 'Every component' : `${total} components and patterns`}
      lead="Grouped as in the sidebar. Open a group."
    >
      {index === null && <Note>Loading the story index…</Note>}
      {index === 'error' && (
        <Note>
          The story index (<code>index.json</code>) couldn&apos;t be loaded, so the groups
          can&apos;t be listed here. The sidebar has them all.
        </Note>
      )}
      {components && <Groups groups={catalogGroups(components)} />}
    </Section>
  );
};
