import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Check, Info, Star, X, Zap } from 'lucide-react';
import { Badge, type BadgeVariant } from './Badge';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

export const AllVariants: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Variants × sizes">
        <div className="space-y-3">
          {(['sm', 'md'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Badge variant="neutral" size={size}>
                Neutral
              </Badge>
              <Badge variant="brand" size={size}>
                Brand
              </Badge>
              <Badge variant="success" size={size}>
                Success
              </Badge>
              <Badge variant="warning" size={size}>
                Warning
              </Badge>
              <Badge variant="danger" size={size}>
                Danger
              </Badge>
              <Badge variant="info" size={size}>
                Info
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const Solid: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Solid appearance — filled bg + white text">
        <div className="flex flex-wrap items-center gap-2">
          <Badge appearance="solid" variant="neutral">
            Neutral
          </Badge>
          <Badge appearance="solid" variant="brand">
            Brand
          </Badge>
          <Badge appearance="solid" variant="success">
            Success
          </Badge>
          <Badge appearance="solid" variant="warning">
            Warning
          </Badge>
          <Badge appearance="solid" variant="danger">
            Danger
          </Badge>
          <Badge appearance="solid" variant="info">
            Info
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIconLeft: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With left icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" icon={Check}>
            Verified
          </Badge>
          <Badge variant="warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge variant="danger" icon={X}>
            Failed
          </Badge>
          <Badge variant="info" icon={Info}>
            FYI
          </Badge>
          <Badge variant="brand" icon={Zap}>
            Pro
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const WithIconRight: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="With right icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand" icon={Star} iconPosition="right">
            Featured
          </Badge>
          <Badge variant="success" icon={Check} iconPosition="right">
            Done
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

export const SolidWithIcon: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Solid + icon">
        <div className="flex flex-wrap items-center gap-2">
          <Badge appearance="solid" variant="success" icon={Check}>
            Approved
          </Badge>
          <Badge appearance="solid" variant="danger" icon={X}>
            Rejected
          </Badge>
          <Badge appearance="solid" variant="brand" icon={Zap}>
            New
          </Badge>
          <Badge appearance="solid" variant="warning" icon={AlertTriangle}>
            Beta
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

const VARIANTS: BadgeVariant[] = ['neutral', 'brand', 'success', 'warning', 'danger', 'info'];

export const AppearanceMatrix: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Appearance × variant — light vs solid">
        <div className="space-y-3">
          {(['light', 'solid'] as const).map((appearance) => (
            <div key={appearance} className="flex flex-wrap items-center gap-2">
              <span className="w-12 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {appearance}
              </span>
              {VARIANTS.map((v) => (
                <Badge key={v} appearance={appearance} variant={v} icon={Check}>
                  {v}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </Wrap>
  ),
};
