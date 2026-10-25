import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PageContainer, type PageContainerWidth } from './PageContainer';

const meta = {
  title: 'Layout/Page Container',
  component: PageContainer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Panel = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 text-sm text-[var(--color-text-secondary)]">
    {label}
  </div>
);

export const Default: Story = {
  args: { children: <Panel label="Default width, 960px" /> },
};

export const Narrow: Story = {
  args: { width: 'narrow', children: <Panel label="Narrow width, 768px" /> },
};

export const Full: Story = {
  args: { width: 'full', children: <Panel label="Full width: the whole content area" /> },
};

/** Each width caps the column at its own size; `full` has no cap. */
export const WidthsCapTheColumn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="w-[1400px]">
      {(['narrow', 'default', 'full'] as PageContainerWidth[]).map((w) => (
        <PageContainer key={w} width={w}>
          <div data-testid={w}>{w}</div>
        </PageContainer>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const column = (w: string) => canvas.getByTestId(w).parentElement as HTMLElement;
    await expect(column('narrow').getBoundingClientRect().width).toBe(768);
    await expect(column('default').getBoundingClientRect().width).toBe(960);
    await expect(column('full').getBoundingClientRect().width).toBe(1400);
  },
};
