import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, within } from 'storybook/test';
import type { CosmosAppearance } from '../../../packages/react/src';
import { catalogComponents, type IndexEntry, type StoryIndex } from './welcome/catalog';
import { Appearance } from './welcome/WelcomeAppearance';
import { ComponentsSection } from './welcome/WelcomeCatalog';
import { Hero } from './welcome/WelcomeHero';
import { Examples, Footer, GetStarted, Quality, WhatsNew } from './welcome/WelcomeSections';
import { TopBar } from './welcome/WelcomeTopBar';

// ---------------------------------------------------------------------------
// Welcome page rendered as a regular story (not MDX) so that the preview
// decorators (`withCosmosSurface` + `withThemeClass`) actually apply
// and the toolbar theme toggle drives both backgrounds AND every Cosmos
// component rendered inside (KpiCard, Button, DataTable, …).
//
// MDX unattached docs do NOT pass through preview decorators in Storybook 10,
// which is why this used to be Welcome.mdx and broke the dark/light toggle.
//
// The page is split in small components under ./welcome/. Every count, name and version on it
// comes from Storybook's index or the packages' package.json, so it can't drift.
// ---------------------------------------------------------------------------

// The preview iframe and index.json sit side by side, in dev and in the
// static build (GitHub Pages serves it under /cosmos/).
const useStoryIndex = (): StoryIndex => {
  const [entries, setEntries] = useState<StoryIndex>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('./index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
        return res.json() as Promise<{ entries: Record<string, IndexEntry> }>;
      })
      .then((index) => !cancelled && setEntries(Object.values(index.entries)))
      .catch(() => !cancelled && setEntries('error'));
    return () => {
      cancelled = true;
    };
  }, []);
  return entries;
};

const WelcomePage = ({
  appearance = { theme: 'dark', accent: 'blue' },
}: {
  appearance?: CosmosAppearance;
}) => {
  const index = useStoryIndex();
  const components = Array.isArray(index) ? catalogComponents(index) : null;
  return (
    <div className="min-w-0">
      <TopBar />
      <main>
        <Hero components={components} />
        <Appearance initial={appearance} />
        <Examples components={components} />
        <ComponentsSection index={index} />
        <GetStarted components={components} />
        <WhatsNew />
        <Quality />
      </main>
      <Footer />
    </div>
  );
};

const meta = {
  title: 'Welcome',
  component: WelcomePage,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: true } },
  },
  tags: ['!autodocs'],
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Welcome',
  render: (_args, { globals }) => (
    <WelcomePage
      appearance={{
        theme: globals.theme || 'dark',
        accent: globals.accent || 'blue',
        font: globals.font || 'outfit',
        textSize: globals.textSize || 'md',
        density: globals.density || 'default',
      }}
    />
  ),
};

// A fixed index, so the test doesn't depend on the stories that exist.
const FIXTURE: IndexEntry[] = [
  { id: 'welcome--default', title: 'Welcome', type: 'story' },
  { id: 'examples-dashboard--docs', title: 'Examples/Dashboard', type: 'docs' },
  { id: 'examples-dashboard--content', title: 'Examples/Dashboard', type: 'story' },
  { id: 'atoms-button--docs', title: 'Atoms/Button', type: 'docs' },
  { id: 'atoms-button--variants', title: 'Atoms/Button', type: 'story' },
  { id: 'atoms-button--states', title: 'Atoms/Button', type: 'story' },
  { id: 'atoms-badge--default', title: 'Atoms/Badge', type: 'story' },
];

/** The catalog groups the index in sidebar order and links each group. Test only. */
export const CatalogFromIndex: Story = {
  tags: ['!dev'],
  render: () => <ComponentsSection index={FIXTURE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The recipes have a section of their own: one group, two components.
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(
      '2 components and patterns'
    );
    await expect(canvas.queryByRole('link', { name: /^Examples/ })).toBeNull();
    // A group links its first component's docs page, or its first story when it has none.
    const atoms = canvas.getByRole('link', { name: /^Atoms/ });
    await expect(atoms).toHaveAttribute('href', './?path=/docs/atoms-button--docs');
    await expect(atoms).toHaveTextContent('Button, Badge');
    await expect(within(atoms).getByText('2')).toBeVisible();
  },
};

/** Without the index, the catalog says so instead of showing nothing. Test only. */
export const CatalogWithoutIndex: Story = {
  tags: ['!dev'],
  render: () => <ComponentsSection index="error" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/couldn.t be loaded/)).toBeVisible();
  },
};
