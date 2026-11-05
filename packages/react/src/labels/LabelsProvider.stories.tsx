import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { Breadcrumb } from '../navigation/Breadcrumb';
import { englishLabels } from './englishLabels';
import { LabelsProvider, type LabelsInput } from './LabelsProvider';

const meta = {
  title: 'Foundations/LabelsProvider',
  component: LabelsProvider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { labels: {}, children: null },
} satisfies Meta<typeof LabelsProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

const FRENCH: LabelsInput = {
  breadcrumb: {
    landmark: "Fil d'Ariane",
    home: 'Accueil',
    showHidden: (count) => `Afficher ${count} ${count === 1 ? 'autre page' : 'autres pages'}`,
    hiddenMenu: 'Pages masquées',
  },
  emptyState: { title: 'Aucune donnée' },
  errorState: { title: 'Une erreur est survenue.', retry: 'Réessayer' },
  loadingState: { title: 'Chargement…' },
};

const TRAIL = [
  { label: 'Centres', href: '#' },
  { label: 'Paris', href: '#' },
  { label: 'Salle A', href: '#' },
  { label: 'Baie 01-A' },
];

/** The components under one provider, with only the app's own text left in English. */
const Components = () => (
  <div className="flex flex-col gap-6">
    <Breadcrumb items={TRAIL} maxItems={3} homeIcon />
    <div className="grid gap-4 sm:grid-cols-3">
      <EmptyState compact />
      <ErrorState compact onRetry={fn()} />
      <LoadingState compact />
    </div>
  </div>
);

/** One dictionary at the root translates what the components write themselves. */
export const French: Story = {
  args: { labels: FRENCH },
  render: (args) => (
    <LabelsProvider {...args}>
      <Components />
    </LabelsProvider>
  ),
};

export const ProviderTranslatesTheComponents: Story = {
  ...French,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: "Fil d'Ariane" });
    await expect(within(nav).getByRole('img', { name: 'Accueil' })).toBeInTheDocument();
    await expect(
      within(nav).getByRole('button', { name: 'Afficher 1 autre page' })
    ).toBeInTheDocument();
    await expect(canvas.getByText('Aucune donnée')).toBeVisible();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Une erreur est survenue.');
    await expect(canvas.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('Chargement…');
  },
};

/** A component's own `labels` win over the provider, and the text the app passes in over both. */
export const OwnLabelsWinOverTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: FRENCH },
  render: (args) => (
    <LabelsProvider {...args}>
      <Breadcrumb items={TRAIL} labels={{ landmark: 'Chemin' }} />
      <ErrorState title="Panne du stockage" onRetry={fn()} labels={{ retry: 'Relancer' }} />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Chemin' })).toBeInTheDocument();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Panne du stockage');
    await expect(canvas.getByRole('button', { name: 'Relancer' })).toBeVisible();
  },
};

/** A nested provider replaces the keys it gives and keeps the outer one's others. */
export const NestedProviderOverridesKeyByKey: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: FRENCH },
  render: (args) => (
    <LabelsProvider {...args}>
      <LabelsProvider labels={{ errorState: { retry: 'Relancer' } }}>
        <ErrorState onRetry={fn()} />
      </LabelsProvider>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Relancer' })).toBeVisible();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Une erreur est survenue.');
  },
};

/** A key set to `undefined` keeps the default, as a key left out does. */
export const UndefinedKeepsTheDefault: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: { errorState: { retry: undefined } } },
  render: (args) => (
    <LabelsProvider {...args}>
      <ErrorState onRetry={fn()} labels={{ title: undefined }} />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Something went wrong.');
  },
};

/** `englishLabels` is what every component writes with no provider: a translation starts from it. */
export const EnglishLabelsAreTheDefaults: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: englishLabels },
  render: (args) => (
    <LabelsProvider {...args}>
      <Components />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(within(nav).getByRole('img', { name: 'Home' })).toBeInTheDocument();
    await expect(within(nav).getByRole('button', { name: 'Show 1 more page' })).toBeInTheDocument();
    await expect(canvas.getByText('No data')).toBeVisible();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Something went wrong.');
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading…');
  },
};
