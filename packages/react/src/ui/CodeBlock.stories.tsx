import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './CodeBlock';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Data/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { code: 'echo hello' },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const SHELL = `# Add the Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install the node-exporter chart
helm install node-exporter prometheus-community/prometheus-node-exporter \\
  --namespace monitoring --create-namespace`;

const TS = `export type Healthcheck = {
  endpoint: string;
  intervalMs: number;
  timeoutMs?: number;
};

export const ping = async (h: Healthcheck) => {
  const res = await fetch(h.endpoint, { signal: AbortSignal.timeout(h.timeoutMs ?? 2000) });
  return res.ok;
};`;

export const WithLanguage: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Shell snippet">
        <CodeBlock language="bash" code={SHELL} />
      </SectionCard>
    </Wrap>
  ),
};

export const Plain: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="No language bar — copy floats top-right on hover">
        <CodeBlock code={SHELL} />
      </SectionCard>
    </Wrap>
  ),
};

export const TypeScript: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="TypeScript">
        <CodeBlock language="typescript" code={TS} />
      </SectionCard>
    </Wrap>
  ),
};

export const NoCopy: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Read-only snippet (showCopy=false)">
        <CodeBlock
          language="yaml"
          code={'name: ci\non:\n  push:\n    branches: [main]\n'}
          showCopy={false}
        />
      </SectionCard>
    </Wrap>
  ),
};
