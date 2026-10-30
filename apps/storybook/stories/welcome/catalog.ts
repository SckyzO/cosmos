// The Welcome page's view of Storybook's own index: the components, the sidebar groups, the
// figures and the search. Pure, so the page can't drift from the stories it counts.

export type IndexEntry = {
  id: string;
  title: string;
  /** The story's name. A docs entry is named "Docs". */
  name?: string;
  type: 'story' | 'docs';
  /** `dev` is what puts a story in the sidebar: a test-only story (`!dev`) has no such tag. */
  tags?: string[];
};

/** `null` while loading, `'error'` when `index.json` couldn't be read. */
export type StoryIndex = IndexEntry[] | null | 'error';

export type CatalogStory = { name: string; href: string };

/** One sidebar entry: `Forms/Date Picker` is the component `Date Picker` of the group `Forms`. */
export type CatalogComponent = {
  group: string;
  /** The title without its group (`Auth / Sign In Form`). */
  name: string;
  /** The docs page, or the first story when there is none. */
  href: string;
  stories: CatalogStory[];
};

export type CatalogGroup = { name: string; href: string; components: CatalogComponent[] };

/** The recipes have a section of their own: they are screens, not components. */
export const SCREENS_GROUP = 'Examples';

const storyHref = (id: string) => `./?path=/story/${id}`;
const docsHref = (id: string) => `./?path=/docs/${id}`;

// index.json lists the entries already in sidebar order (storySort), so the components and the
// groups keep it.
export const catalogComponents = (entries: IndexEntry[]): CatalogComponent[] => {
  const byTitle = new Map<
    string,
    { docs?: string; first?: string; inSidebar: boolean; stories: CatalogStory[] }
  >();
  for (const e of entries) {
    if (e.title === 'Welcome') continue;
    const item = byTitle.get(e.title) ?? { inSidebar: false, stories: [] };
    // A test-only entry is hidden from the sidebar: it isn't one of the component's stories, and a
    // title made only of them isn't a component.
    const inSidebar = !e.tags || e.tags.includes('dev');
    item.inSidebar ||= inSidebar;
    if (e.type === 'docs') item.docs ??= e.id;
    else {
      item.first ??= e.id;
      if (inSidebar) item.stories.push({ name: e.name ?? e.id, href: storyHref(e.id) });
    }
    byTitle.set(e.title, item);
  }
  const components: CatalogComponent[] = [];
  for (const [title, item] of byTitle) {
    if (!item.inSidebar) continue;
    const [group = title, ...rest] = title.split('/');
    components.push({
      group,
      name: rest.join(' / ') || group,
      href: item.docs ? docsHref(item.docs) : storyHref(item.first ?? ''),
      stories: item.stories,
    });
  }
  return components;
};

/** The sidebar groups, in order, apart from the recipes. */
export const catalogGroups = (components: CatalogComponent[]): CatalogGroup[] => {
  const groups = new Map<string, CatalogGroup>();
  for (const c of components) {
    if (c.group === SCREENS_GROUP) continue;
    const group = groups.get(c.group) ?? { name: c.group, href: c.href, components: [] };
    group.components.push(c);
    groups.set(c.group, group);
  }
  return [...groups.values()];
};

export type Figures = { components: number; charts: number };

/** What the hero counts: components and patterns (not the recipes), and the chart wrappers. */
export const figuresOf = (components: CatalogComponent[]): Figures => ({
  components: components.filter((c) => c.group !== SCREENS_GROUP).length,
  charts: components.filter((c) => c.group === 'Charts').length,
});

// "Date Picker", "date-picker" and "datepicker" are one name.
const squash = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * The components whose name holds the query, the ones that begin with it first, each rank in
 * sidebar order. A blank query matches nothing: the page shows the groups then.
 */
export const searchComponents = (
  components: CatalogComponent[],
  query: string
): CatalogComponent[] => {
  const needle = squash(query);
  if (!needle) return [];
  const starts: CatalogComponent[] = [];
  const holds: CatalogComponent[] = [];
  for (const c of components) {
    const name = squash(c.name);
    if (name.startsWith(needle)) starts.push(c);
    else if (name.includes(needle)) holds.push(c);
  }
  return [...starts, ...holds];
};

/** `name` cut around the first case-insensitive occurrence of `query`; no `match` when absent. */
export const splitMatch = (name: string, query: string) => {
  const at = query.trim() ? name.toLowerCase().indexOf(query.trim().toLowerCase()) : -1;
  if (at < 0) return { before: name, match: '', after: '' };
  const end = at + query.trim().length;
  return { before: name.slice(0, at), match: name.slice(at, end), after: name.slice(end) };
};

/** The story a recipe's card opens: its `Content` story, else its first one. */
export const recipeHref = (components: CatalogComponent[], name: string): string | undefined => {
  const recipe = components.find((c) => c.group === SCREENS_GROUP && c.name === name);
  return (
    recipe?.stories.find((s) => s.href.endsWith('--content'))?.href ?? recipe?.stories[0]?.href
  );
};
