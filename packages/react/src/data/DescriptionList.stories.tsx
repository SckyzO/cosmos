import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Paperclip } from 'lucide-react';
import { DescriptionList } from './DescriptionList';

const meta = {
  title: 'Data/Description List',
  component: DescriptionList,
  subcomponents: { 'DescriptionList.Item': DescriptionList.Item },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const SHARED_ITEMS = (
  <>
    <DescriptionList.Item label="Full name">Margot Foster</DescriptionList.Item>
    <DescriptionList.Item label="Application for">Backend Developer</DescriptionList.Item>
    <DescriptionList.Item label="Email address">margotfoster@example.com</DescriptionList.Item>
    <DescriptionList.Item label="Salary expectation">$120,000</DescriptionList.Item>
    <DescriptionList.Item label="About">
      Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim incididunt cillum culpa consequat.
      Excepteur qui ipsum aliquip consequat sint. Sit id mollit nulla mollit nostrud in ea officia
      proident. Irure nostrud pariatur mollit ad adipisicing reprehenderit deserunt qui eu.
    </DescriptionList.Item>
    <DescriptionList.Item label="Attachments">
      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-white/10 dark:border-white/10">
        {[
          { name: 'resume_back_end_developer.pdf', size: '2.4mb' },
          { name: 'coverletter_back_end_developer.pdf', size: '4.5mb' },
        ].map((f) => (
          <li key={f.name} className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
            <div className="flex w-0 flex-1 items-center">
              <Paperclip className="size-5 shrink-0 text-gray-400" aria-hidden />
              <div className="ml-4 flex min-w-0 flex-1 gap-2">
                <span className="truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-gray-400">{f.size}</span>
              </div>
            </div>
            <div className="ml-4 shrink-0">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Download
              </a>
            </div>
          </li>
        ))}
      </ul>
    </DescriptionList.Item>
  </>
);

// TUI Plus pattern "Left-aligned" — title + description + dl below, with
// dividers between items.
export const LeftAligned: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <DescriptionList
        title="Applicant Information"
        description="Personal details and application."
      >
        {SHARED_ITEMS}
      </DescriptionList>
    </div>
  ),
};

// TUI Plus pattern "Left-aligned in card" — wrapped in a card surface with
// border + rounded + shadow.
export const LeftAlignedInCard: Story = {
  render: () => (
    <div className="bg-gray-50 p-8 dark:bg-gray-950">
      <DescriptionList
        inCard
        title="Applicant Information"
        description="Personal details and application."
      >
        {SHARED_ITEMS}
      </DescriptionList>
    </div>
  ),
};

// TUI Plus pattern "Left-aligned striped" — alternating gray background.
export const Striped: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <DescriptionList
        striped
        title="Applicant Information"
        description="Personal details and application."
      >
        {SHARED_ITEMS}
      </DescriptionList>
    </div>
  ),
};

// Bare list — no header, just items.
export const Bare: Story = {
  render: () => (
    <div className="bg-white p-8 dark:bg-gray-900">
      <DescriptionList>
        <DescriptionList.Item label="Status">Active</DescriptionList.Item>
        <DescriptionList.Item label="Created">2026-05-12</DescriptionList.Item>
        <DescriptionList.Item label="Owner">Tom Cook</DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

// ── Interaction tests ────────────────────────────────────────────────────────

export const RootIsDlWithDivideY: Story = {
  render: () => (
    <DescriptionList data-testid="dl">
      <DescriptionList.Item label="A">x</DescriptionList.Item>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const dl = canvasElement.querySelector('dl[data-testid="dl"]');
    await expect(dl).not.toBeNull();
    await expect(dl?.className ?? '').toMatch(/divide-y/);
  },
};

export const ItemRendersDtAndDd: Story = {
  render: () => (
    <DescriptionList>
      <DescriptionList.Item label="Label" data-testid="li">
        Value
      </DescriptionList.Item>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('[data-testid="li"]');
    await expect(item?.querySelector('dt')?.textContent).toBe('Label');
    await expect(item?.querySelector('dd')?.textContent).toBe('Value');
  },
};

export const InCardWrapsInBorderedSurface: Story = {
  render: () => (
    <DescriptionList inCard>
      <DescriptionList.Item label="x">y</DescriptionList.Item>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector('.ring-1.ring-gray-200');
    await expect(wrapper).not.toBeNull();
  },
};

export const StripedAddsAlternatingBg: Story = {
  render: () => (
    <DescriptionList striped data-testid="dl">
      <DescriptionList.Item label="a">1</DescriptionList.Item>
      <DescriptionList.Item label="b">2</DescriptionList.Item>
    </DescriptionList>
  ),
  play: async ({ canvasElement }) => {
    const dl = canvasElement.querySelector('dl[data-testid="dl"]');
    await expect(dl?.className ?? '').toMatch(/nth-child\(even\)/);
  },
};
