import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Pencil, Plus, Settings } from 'lucide-react';
import { PageBreadcrumb } from './PageBreadcrumb';
import { PageHeader } from './PageHeader';
import { SectionCard } from './SectionCard';
import { PageCard } from './PageCard';
import { ContentNarrow } from './ContentNarrow';
import { ColBox } from './ColBox';

const meta = {
  title: 'Templates/Overview',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">
    {children}
  </div>
);

const PrimaryBtn = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: typeof Plus;
}) => (
  <button
    type="button"
    className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────

export const FullPageExample: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          breadcrumb={
            <PageBreadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Account', href: '/account' },
                { label: 'Settings' },
              ]}
            />
          }
          actions={
            <>
              <PrimaryBtn icon={Settings}>Configure</PrimaryBtn>
              <PrimaryBtn icon={Plus}>New</PrimaryBtn>
            </>
          }
        />

        <SectionCard
          title="Profile"
          desc="Update your personal information."
          icon={Pencil}
          iconColor="text-brand-500"
          iconBg="bg-brand-500/10"
        >
          <p className="text-sm text-[var(--color-text-secondary)]">
            Inline form fields would go here.
          </p>
        </SectionCard>

        <SectionCard title="Preferences" desc="Theme, locale, accessibility settings.">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Replace with toggles, selects, radio groups…
          </p>
        </SectionCard>
      </div>
    </Wrap>
  ),
};

export const PageCardCentered: Story = {
  render: () => (
    <Wrap>
      <PageCard>
        <ContentNarrow maxWidth={500}>
          <div className="text-center">
            <Box className="text-brand-500 mx-auto h-12 w-12" />
            <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
              Welcome to Cosmos
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              PageCard wraps your entire content in a single rounded card. ContentNarrow constrains
              the width to 500px and centers it. Perfect for onboarding, login, or focused forms.
            </p>
            <PrimaryBtn>Get started</PrimaryBtn>
          </div>
        </ContentNarrow>
      </PageCard>
    </Wrap>
  ),
};

export const ColumnLayouts: Story = {
  render: () => (
    <Wrap>
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
            2 columns — 50 / 50
          </p>
          <div className="grid grid-cols-2 gap-4">
            <ColBox label="50%" />
            <ColBox label="50%" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
            3 columns — 20 / 60 / 20
          </p>
          <div className="grid grid-cols-[1fr_3fr_1fr] gap-4">
            <ColBox label="20%" />
            <ColBox label="60%" />
            <ColBox label="20%" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
            4 columns equal
          </p>
          <div className="grid grid-cols-4 gap-4">
            <ColBox label="25%" />
            <ColBox label="25%" />
            <ColBox label="25%" />
            <ColBox label="25%" />
          </div>
        </div>
      </div>
    </Wrap>
  ),
};
