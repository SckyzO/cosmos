import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Check, Info, Star, X, Zap } from 'lucide-react';
import { expect } from 'storybook/test';
import { Badge } from './Badge';
import type { Intent } from './intent';
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
      <SectionCard title="Intents × sizes">
        <div className="space-y-3">
          {(['sm', 'md'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {size}
              </span>
              <Badge intent="neutral" size={size}>
                Neutral
              </Badge>
              <Badge intent="brand" size={size}>
                Brand
              </Badge>
              <Badge intent="success" size={size}>
                Success
              </Badge>
              <Badge intent="warning" size={size}>
                Warning
              </Badge>
              <Badge intent="danger" size={size}>
                Danger
              </Badge>
              <Badge intent="info" size={size}>
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
          <Badge appearance="solid" intent="neutral">
            Neutral
          </Badge>
          <Badge appearance="solid" intent="brand">
            Brand
          </Badge>
          <Badge appearance="solid" intent="success">
            Success
          </Badge>
          <Badge appearance="solid" intent="warning">
            Warning
          </Badge>
          <Badge appearance="solid" intent="danger">
            Danger
          </Badge>
          <Badge appearance="solid" intent="info">
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
          <Badge intent="success" icon={Check}>
            Verified
          </Badge>
          <Badge intent="warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge intent="danger" icon={X}>
            Failed
          </Badge>
          <Badge intent="info" icon={Info}>
            FYI
          </Badge>
          <Badge intent="brand" icon={Zap}>
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
          <Badge intent="brand" icon={Star} iconPosition="right">
            Featured
          </Badge>
          <Badge intent="success" icon={Check} iconPosition="right">
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
          <Badge appearance="solid" intent="success" icon={Check}>
            Approved
          </Badge>
          <Badge appearance="solid" intent="danger" icon={X}>
            Rejected
          </Badge>
          <Badge appearance="solid" intent="brand" icon={Zap}>
            New
          </Badge>
          <Badge appearance="solid" intent="warning" icon={AlertTriangle}>
            Beta
          </Badge>
        </div>
      </SectionCard>
    </Wrap>
  ),
};

const INTENTS: Intent[] = ['neutral', 'brand', 'success', 'warning', 'danger', 'info'];

export const AppearanceMatrix: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Appearance × intent — light vs solid">
        <div className="space-y-3">
          {(['light', 'solid'] as const).map((appearance) => (
            <div key={appearance} className="flex flex-wrap items-center gap-2">
              <span className="w-12 font-mono text-[10px] text-[var(--color-text-muted)] uppercase">
                {appearance}
              </span>
              {INTENTS.map((v) => (
                <Badge key={v} appearance={appearance} intent={v} icon={Check}>
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

// ── Interaction tests ────────────────────────────────────────────────────────

const LIGHT_CLASSES: Record<Intent, string[]> = {
  neutral: ['bg-gray-100', 'text-gray-700'],
  brand: ['bg-brand-50', 'text-brand-700'],
  success: ['bg-green-100', 'text-green-700'],
  warning: ['bg-amber-100', 'text-amber-700'],
  danger: ['bg-red-100', 'text-red-700'],
  info: ['bg-blue-100', 'text-blue-700'],
};

const SOLID_CLASSES: Record<Intent, string[]> = {
  neutral: ['bg-gray-600', 'text-white'],
  brand: ['bg-brand-500', 'text-white'],
  success: ['bg-green-500', 'text-gray-900'],
  warning: ['bg-amber-500', 'text-gray-900'],
  danger: ['bg-red-600', 'text-white'],
  info: ['bg-blue-600', 'text-white'],
};

/** Each `intent` colors the light badge as its `variant` did; none is `neutral`. */
export const IntentColorsTheBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((i) => (
          <Badge key={i} intent={i}>
            {i}
          </Badge>
        ))}
        <Badge>default</Badge>
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      // The badge is the span that holds the label's own span.
      await expect(canvas.getByText(intent).parentElement).toHaveClass(...LIGHT_CLASSES[intent]);
    }
    await expect(canvas.getByText('default').parentElement).toHaveClass(...LIGHT_CLASSES.neutral);
  },
};

/** The same for `appearance="solid"`. Like the other solid stories, it carries the contrast debt. */
export const IntentColorsTheSolidBadge: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Wrap>
      <div className="flex flex-wrap items-center gap-2">
        {INTENTS.map((i) => (
          <Badge key={i} appearance="solid" intent={i}>
            {i}
          </Badge>
        ))}
      </div>
    </Wrap>
  ),
  play: async ({ canvas }) => {
    for (const intent of INTENTS) {
      await expect(canvas.getByText(intent).parentElement).toHaveClass(...SOLID_CLASSES[intent]);
    }
  },
};
