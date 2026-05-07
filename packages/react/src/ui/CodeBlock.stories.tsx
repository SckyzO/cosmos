import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from './CodeBlock';
import { SectionCard } from '../templates/SectionCard';

const meta = {
  title: 'Data/CodeBlock',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-base)] p-6 text-[var(--color-text-base)]">{children}</div>
);

const SAMPLE = `# Add the Prometheus repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install the node-exporter chart
helm install node-exporter prometheus-community/prometheus-node-exporter \\
  --namespace monitoring --create-namespace`;

export const WithCopyButton: Story = {
  render: () => (
    <Wrap>
      <SectionCard title="Shell snippet">
        <CodeBlock language="bash" code={SAMPLE} />
      </SectionCard>
    </Wrap>
  ),
};
