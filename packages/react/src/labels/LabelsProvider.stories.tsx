import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { DatePicker } from '../forms/DatePicker';
import { Amount } from '../data/Amount';
import { BarList } from '../data/BarList';
import { DateTime } from '../data/DateTime';
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

const DAY = '2026-01-15T12:00:00Z';

/** What the components write with a `locale`: a weekday, an amount, the digits of a bar list. */
const Formatted = ({ locale }: { locale?: string }) => (
  <div className="flex flex-col gap-2">
    <DateTime value={DAY} format="weekday" timeZone="UTC" locale={locale} />
    <Amount value={1234.5} currency="EUR" locale={locale} />
    <BarList items={[{ id: 'pages', label: 'Pages', value: 12480 }]} locale={locale} />
  </div>
);

/** `locale` is the default of every component that writes a date, a number or an amount. */
export const FrenchLocale: Story = {
  args: { labels: FRENCH, locale: 'fr-FR' },
  render: (args) => (
    <LabelsProvider {...args}>
      <Formatted />
    </LabelsProvider>
  ),
};

export const ProviderLocaleReachesTheComponents: Story = {
  ...FrenchLocale,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('jeudi')).toBeVisible();
    await expect(canvas.getByText(/^1\s234,50\s€$/)).toBeVisible();
    await expect(canvas.getByText(/^12\s480$/)).toBeVisible();
  },
};

/** A component's own `locale` wins over the provider's. */
export const OwnLocaleWinsOverTheProvider: Story = {
  tags: ['!dev', '!autodocs'],
  args: { locale: 'fr-FR' },
  render: (args) => (
    <LabelsProvider {...args}>
      <Formatted locale="de-DE" />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Donnerstag')).toBeVisible();
    await expect(canvas.getByText(/^1\.234,50\s€$/)).toBeVisible();
    await expect(canvas.getByText('12.480')).toBeVisible();
  },
};

/** A nested provider keeps the outer locale unless it gives one. */
export const NestedProviderKeepsTheOuterLocale: Story = {
  tags: ['!dev', '!autodocs'],
  args: { locale: 'fr-FR' },
  render: (args) => (
    <LabelsProvider {...args}>
      <div data-testid="inherits">
        <LabelsProvider labels={{ errorState: { retry: 'Relancer' } }}>
          <Formatted />
        </LabelsProvider>
      </div>
      <div data-testid="overrides">
        <LabelsProvider locale="de-DE">
          <Formatted />
        </LabelsProvider>
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const inherits = within(canvas.getByTestId('inherits'));
    const overrides = within(canvas.getByTestId('overrides'));
    await expect(await inherits.findByText('jeudi')).toBeVisible();
    await expect(inherits.getByText(/^12\s480$/)).toBeVisible();
    await expect(await overrides.findByText('Donnerstag')).toBeVisible();
    await expect(overrides.getByText('12.480')).toBeVisible();
  },
};

/** With no locale anywhere the figures stay as they were: `en-US` where it was fixed. */
export const NoLocaleKeepsTheEnglishDigits: Story = {
  tags: ['!dev', '!autodocs'],
  args: { labels: FRENCH },
  render: (args) => (
    <LabelsProvider {...args}>
      <BarList items={[{ id: 'pages', label: 'Pages', value: 12480 }]} />
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12,480')).toBeVisible();
  },
};

const DUE = new Date(2026, 0, 15);

/**
 * The Language menu of the toolbar (`&globals=language:fr`) wraps the story in the French
 * providers: these components have none of their own, and write French names and a French date.
 */
export const LanguageMenuTranslatesTheStory: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { language: 'fr' },
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={TRAIL} maxItems={3} homeIcon />
      <ErrorState onRetry={fn()} />
      <DatePicker label="Échéance" value={DUE} onChange={fn()} />
    </div>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Fil d’Ariane' });
    await expect(within(nav).getByRole('img', { name: 'Accueil' })).toBeInTheDocument();
    await expect(
      within(nav).getByRole('button', { name: 'Afficher 1 autre page' })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Une erreur est survenue.');
    await expect(canvas.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(canvas.getByText('15 janv. 2026')).toBeVisible();
  },
};
