import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyAppearance,
  COSMOS_ACCENTS,
  COSMOS_FONTS,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
  isDarkTheme,
  type CosmosAppearance,
  type CosmosTheme,
} from './appearance';

// A stand-in for `<html>`: the node project has no DOM, and `applyAppearance`
// only touches `classList` and `dataset`. The browser's own mapping of
// `dataset.textSize` to the `data-text-size` attribute is covered by the
// Foundations/Appearance stories.
const fakeRoot = (classes: string[] = [], dataset: Record<string, string> = {}) => {
  const classList = new Set(classes);
  const data = { ...dataset };
  const root = {
    classList: {
      add: (...names: string[]) => names.forEach((n) => classList.add(n)),
      remove: (...names: string[]) => names.forEach((n) => classList.delete(n)),
    },
    dataset: data,
  } as unknown as HTMLElement;
  return { root, classes: classList, data };
};

const apply = (
  appearance: CosmosAppearance,
  start: { classes?: string[]; dataset?: Record<string, string> } = {}
) => {
  const el = fakeRoot(start.classes, start.dataset);
  applyAppearance(appearance, el.root);
  return el;
};

describe('isDarkTheme', () => {
  it.each([
    ['light', false],
    ['sand', false],
    ['dark', true],
    ['deep-blue', true],
  ] as [CosmosTheme, boolean][])('%s -> %s', (theme, expected) => {
    expect(isDarkTheme(theme)).toBe(expected);
  });
});

describe('applyAppearance', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('theme', () => {
    it.each(['sand', 'dark', 'deep-blue'] as const)('adds the %s class', (theme) => {
      expect([...apply({ theme, accent: 'blue' }).classes]).toEqual([theme]);
    });

    it('adds no class for light', () => {
      expect(apply({ theme: 'light', accent: 'blue' }).classes.size).toBe(0);
    });

    it('swaps the previous theme class, whichever it was', () => {
      for (const from of ['sand', 'dark', 'deep-blue']) {
        const { classes } = apply({ theme: 'dark', accent: 'blue' }, { classes: [from] });
        expect([...classes]).toEqual(['dark']);
      }
    });

    it('removes every theme class for light', () => {
      const { classes } = apply(
        { theme: 'light', accent: 'blue' },
        { classes: ['dark', 'deep-blue', 'sand'] }
      );
      expect(classes.size).toBe(0);
    });

    it('leaves the classes it does not own alone', () => {
      const { classes } = apply(
        { theme: 'sand', accent: 'blue' },
        { classes: ['dark', 'antialiased', 'cosmos-bg-transition'] }
      );
      expect([...classes].sort()).toEqual(['antialiased', 'cosmos-bg-transition', 'sand']);
    });

    it('is idempotent', () => {
      const el = fakeRoot();
      applyAppearance({ theme: 'deep-blue', accent: 'teal' }, el.root);
      applyAppearance({ theme: 'deep-blue', accent: 'teal' }, el.root);
      expect([...el.classes]).toEqual(['deep-blue']);
      expect(el.data).toEqual({ accent: 'teal' });
    });
  });

  describe('accent', () => {
    it('sets data-accent', () => {
      expect(apply({ theme: 'light', accent: 'teal' }).data).toEqual({ accent: 'teal' });
    });

    it('removes data-accent for the default blue', () => {
      const { data } = apply({ theme: 'light', accent: 'blue' }, { dataset: { accent: 'rose' } });
      expect(data).not.toHaveProperty('accent');
    });
  });

  describe('font and text size', () => {
    it('sets data-font and data-text-size', () => {
      const { data } = apply({ theme: 'light', accent: 'blue', font: 'inter', textSize: 'xl' });
      expect(data).toEqual({ font: 'inter', textSize: 'xl' });
    });

    it('removes them for the defaults, Outfit and md', () => {
      const { data } = apply(
        { theme: 'light', accent: 'blue', font: 'outfit', textSize: 'md' },
        { dataset: { font: 'inter', textSize: 'lg' } }
      );
      expect(data).not.toHaveProperty('font');
      expect(data).not.toHaveProperty('textSize');
    });

    it('keeps them as they are when left out', () => {
      const { data } = apply(
        { theme: 'light', accent: 'blue' },
        { dataset: { font: 'plex', textSize: 'sm' } }
      );
      expect(data).toEqual({ font: 'plex', textSize: 'sm' });
    });

    it('does not touch unrelated data attributes', () => {
      const { data } = apply(
        { theme: 'light', accent: 'teal', font: 'inter' },
        { dataset: { reactRoot: '1' } }
      );
      expect(data).toEqual({ reactRoot: '1', accent: 'teal', font: 'inter' });
    });
  });

  describe('root', () => {
    it('defaults to document.documentElement', () => {
      const el = fakeRoot();
      vi.stubGlobal('document', { documentElement: el.root });
      applyAppearance({ theme: 'dark', accent: 'green' });
      expect([...el.classes]).toEqual(['dark']);
      expect(el.data).toEqual({ accent: 'green' });
    });

    it('prefers the root it is given over the document', () => {
      const page = fakeRoot();
      vi.stubGlobal('document', { documentElement: page.root });
      const given = apply({ theme: 'sand', accent: 'blue' });
      expect([...given.classes]).toEqual(['sand']);
      expect(page.classes.size).toBe(0);
    });

    it('does nothing, and does not throw, without a document (SSR)', () => {
      vi.stubGlobal('document', undefined);
      expect(() => applyAppearance({ theme: 'dark', accent: 'teal' })).not.toThrow();
    });
  });
});

// `applyAppearance` writes class names and attribute values that
// @sckyzo/cosmos-theme has to key on: a drift between the two ships a picker
// option that changes nothing.
describe('contract with @sckyzo/cosmos-theme', () => {
  const read = (file: string) =>
    readFileSync(new URL(`../../../theme/css/${file}`, import.meta.url), 'utf8');
  const vars = read('css-vars.css');
  const tokens = read('tailwind-tokens.css');

  const attributeValues = (attribute: string) =>
    [...vars.matchAll(new RegExp(`\\[data-${attribute}='([^']+)'\\]`, 'g'))].map((m) => m[1]);
  const topLevelClasses = [...vars.matchAll(/^\.([a-z-]+) \{/gm)].map((m) => m[1]);

  it('has a CSS class for every theme but light', () => {
    for (const { id } of COSMOS_THEMES) {
      if (id !== 'light') expect(topLevelClasses, id).toContain(id);
    }
  });

  it('has a data-accent block for every accent but blue', () => {
    for (const { id } of COSMOS_ACCENTS) {
      if (id !== 'blue') expect(attributeValues('accent'), id).toContain(id);
    }
  });

  it('has a data-font block for every font but Outfit', () => {
    for (const { id } of COSMOS_FONTS) {
      if (id !== 'outfit') expect(attributeValues('font'), id).toContain(id);
    }
  });

  it('has a data-text-size block for every text size but md', () => {
    for (const { id } of COSMOS_TEXT_SIZES) {
      if (id !== 'md') expect(attributeValues('text-size'), id).toContain(id);
    }
  });

  it('enables the dark: variant under exactly the themes isDarkTheme reports as dark', () => {
    const variant = tokens.match(/@custom-variant dark \(&:where\(([^)]*)\)\)/)?.[1] ?? '';
    const classes = [...variant.matchAll(/\.([a-z-]+)(?= |,|$)/g)].map((m) => m[1]);
    const dark = COSMOS_THEMES.filter((t) => isDarkTheme(t.id)).map((t) => t.id);
    expect([...new Set(classes)].sort()).toEqual(dark.sort());
  });
});
