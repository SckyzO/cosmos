import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { expectTextContrastOnTint, inEachTheme } from '../storybook-helpers';
import { LOG_LEVEL_KEYS } from './types';
import { LogLevelBadge } from './LogLevelBadge';
import { LabelsProvider } from '../labels/LabelsProvider';

const meta = {
  title: 'Monitoring/Log Level Badge',
  component: LogLevelBadge,
  tags: ['autodocs'],
  args: { level: 'error' },
} satisfies Meta<typeof LogLevelBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every level on the surface tone: the word says it, the colour only backs it. */
export const SurfaceLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {[...LOG_LEVEL_KEYS, 'warning'].map((level) => (
        <LogLevelBadge key={level} level={level} />
      ))}
    </div>
  ),
};

/** Every level on the terminal tone, the dark panel of a `LogViewer`, in every theme. */
export const TerminalLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 rounded-xl bg-slate-950 p-4">
      {LOG_LEVEL_KEYS.map((level) => (
        <LogLevelBadge key={level} level={level} tone="terminal" />
      ))}
    </div>
  ),
};

/** The test of the levels, hidden: each is a word, in any case, and a level it does not know reads UNKNOWN. */
export const LevelsAreLabelledByText: Story = {
  ...SurfaceLevels,
  tags: ['!dev', '!autodocs'],
  play: ({ canvas }) => {
    for (const word of ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
      expect(canvas.getByText(word)).toBeVisible();
    // `unknown` and the unrecognised `warning` both read UNKNOWN.
    expect(canvas.getAllByText('UNKNOWN')).toHaveLength(2);
  },
};

/**
 * The test of the surface tone, hidden: a `Badge` pill like `StatusBadge`, of one width for every
 * level but the longest word, with `data-level` and a readable word in every theme.
 */
export const SurfaceIsABadgePill: Story = {
  ...SurfaceLevels,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    const wrappers = [...canvasElement.querySelectorAll<HTMLElement>('[data-level]')];
    expect(wrappers.map((wrapper) => wrapper.dataset.level)).toEqual([
      ...LOG_LEVEL_KEYS,
      'unknown',
    ]);
    const widths = new Set<number>();
    for (const wrapper of wrappers) {
      const badge = wrapper.firstElementChild!;
      const { height, width } = badge.getBoundingClientRect();
      // Badge `sm`: a pill, 19px high; `min-w-14` gives the short words one width.
      expect(parseFloat(getComputedStyle(badge).borderTopLeftRadius)).toBeGreaterThanOrEqual(
        height
      );
      expect(Math.round(height)).toBe(19);
      expect(width).toBeGreaterThanOrEqual(56);
      expect(getComputedStyle(badge).fontFamily).not.toMatch(/mono/i);
      if (wrapper.dataset.level !== 'unknown') widths.add(Math.round(width));
    }
    expect(widths.size).toBe(1);
    inEachTheme(() => {
      for (const wrapper of wrappers) expectTextContrastOnTint(wrapper.querySelector('bdi')!);
    });
  },
};

/** The test of the terminal tone, hidden: it keeps its monospace face and its small corners. */
export const TerminalKeepsItsLook: Story = {
  ...TerminalLevels,
  tags: ['!dev', '!autodocs'],
  play: ({ canvasElement }) => {
    for (const badge of canvasElement.querySelectorAll<HTMLElement>('[data-level]')) {
      const style = getComputedStyle(badge);
      expect(style.fontFamily).toMatch(/mono/i);
      expect(parseFloat(style.borderTopLeftRadius)).toBeLessThan(8);
      expect(Math.round(badge.getBoundingClientRect().height)).toBe(18);
    }
  },
};

/** The provider writes the text of the levels, and the badge's own `labels` win over it. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <LabelsProvider labels={{ logViewer: { error: 'ERREUR', warn: 'ALERTE' } }}>
      <div className="flex gap-3">
        <LogLevelBadge level="error" />
        <LogLevelBadge level="warn" tone="terminal" />
        <LogLevelBadge level="error" labels={{ error: 'KO' }} />
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ERREUR')).toBeVisible();
    await expect(canvas.getByText('ALERTE')).toBeVisible();
    await expect(canvas.getByText('KO')).toBeVisible();
  },
};
