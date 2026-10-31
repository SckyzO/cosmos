// What `make audit-captures` captures, as a pure function of the story list,
// what the checks flagged and the settings. audit.spec.ts runs it.

export const CHECK_WIDTHS = [375, 768, 1280, 1440] as const;

export type AuditStory = { id: string; title: string };
export type AuditCapture = { id: string; width: number; theme: string };
export type AuditSettings = {
  /** Id substrings captured at 375 and 768px. */
  mobile: string;
  /** Id substrings captured at 1440px. */
  desktop: string;
  /** The themes put side by side, in the order of their tiles. */
  themes: string[];
};

export const matchesAny = (id: string, filter: string) =>
  filter
    .split(',')
    .map((part) => part.trim())
    .some((part) => part !== '' && id.includes(part));

/** The Storybook group of a title: `Forms/Select` is `Forms`. */
export const groupOf = (title: string) => title.split('/')[0];

/**
 * Every story at 1280px in light; the shell-level groups at 375 and 768px and
 * the wide ones at 1440px; each story the checks flagged at the width it was
 * flagged; and the first story of each component in the other themes at 1280px.
 * In Storybook's order, one entry per (story, width, theme).
 */
export const planCaptures = (
  stories: AuditStory[],
  flagged: ReadonlyMap<string, readonly number[]>,
  settings: AuditSettings
): AuditCapture[] => {
  const plan: AuditCapture[] = [];
  const done = new Set<string>();
  const add = (id: string, width: number, theme: string) => {
    const key = `${width}/${theme}/${id}`;
    if (!done.has(key)) {
      done.add(key);
      plan.push({ id, width, theme });
    }
  };
  const firstOfComponent = new Set<string>();
  const components = new Set<string>();
  for (const { id, title } of stories) {
    if (!components.has(title)) {
      components.add(title);
      firstOfComponent.add(id);
    }
  }
  for (const { id } of stories) {
    add(id, 1280, 'light');
    if (matchesAny(id, settings.mobile)) {
      add(id, 375, 'light');
      add(id, 768, 'light');
    }
    if (matchesAny(id, settings.desktop)) add(id, 1440, 'light');
    for (const width of flagged.get(id) ?? []) add(id, width, 'light');
    if (firstOfComponent.has(id)) {
      for (const theme of settings.themes) add(id, 1280, theme);
    }
  }
  return plan;
};
