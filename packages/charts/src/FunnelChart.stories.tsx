import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { FunnelChart } from './FunnelChart';
import {
  contrastRatio,
  expectEmptyMessage,
  expectNoInjectedImage,
  HOSTILE,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-recharts';

const CHECKOUT = [
  { label: 'Visits', value: 48210 },
  { label: 'Product views', value: 31540 },
  { label: 'Add to cart', value: 9870 },
  { label: 'Checkout', value: 5120 },
  { label: 'Purchase', value: 3410 },
];

const money = (value: number) => `$${value.toLocaleString('en-US')}`;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div
    data-funnel-card=""
    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
  >
    {children}
  </div>
);

const meta = {
  title: 'Charts/Funnel',
  component: FunnelChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { stages: CHECKOUT },
  decorators: [
    (Story) => (
      <Wrap>
        <Story />
      </Wrap>
    ),
  ],
} satisfies Meta<typeof FunnelChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * One centred bar per stage, as wide as its value against the first, joined to
 * the next by a translucent flow. Names on the left; on the right the value, a
 * chip with the rate from the previous stage and, beside it, the rate from the
 * first. The accent fades from stage to stage.
 */
export const CheckoutFunnel: Story = {};

/** `formatValue` formats the values; percentages always have one decimal. */
export const FormattedValues: Story = {
  args: {
    stages: [
      { label: 'Leads', value: 1_250_000 },
      { label: 'Qualified', value: 640_000 },
      { label: 'Proposals', value: 210_000 },
      { label: 'Won', value: 96_500 },
    ],
    formatValue: money,
  },
};

/** `showConversion={false}` leaves the values alone: no chip, no rate in the tooltip. */
export const ConversionOff: Story = {
  args: { showConversion: false },
};

/**
 * A stage can be larger than the one before it, after a merge of sources for
 * example: it keeps its place (the stages are not sorted), shows a rate over
 * 100%, and the widest bar takes the full width.
 */
export const StageThatGrows: Story = {
  args: {
    stages: [
      { label: 'Web visits', value: 12400 },
      { label: 'Web and app sessions', value: 18600 },
      { label: 'Signups', value: 4200 },
      { label: 'Activated', value: 2100 },
    ],
  },
};

/** `colors` gives one color per stage and replaces the fading accent; CSS variables follow the theme. */
export const CustomColors: Story = {
  args: {
    colors: [
      'var(--color-chart-2)',
      'var(--color-chart-3)',
      'var(--color-chart-4)',
      'var(--color-chart-6)',
      'var(--color-success-500)',
    ],
  },
};

/** With no stage, or only stages at 0, the chart draws `emptyMessage` (default "No data"). */
export const Empty: Story = {
  args: { stages: [] },
  play: expectEmptyMessage('No data'),
};

/** The labels are React text: markup in a stage name or a formatted value shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    stages: [
      { label: HOSTILE, value: 40 },
      { label: 'Second', value: 20 },
    ],
    formatValue: (value) => `${value} ${HOSTILE}`,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(2));
    await expectNoInjectedImage(canvasElement);
    await expect(nameOf(canvasElement, 0).textContent).toBe(HOSTILE);
    await expect(valueOf(canvasElement, 0).textContent).toBe(`40 ${HOSTILE}`);
    await expect(stagesOf(canvasElement)[1]).toHaveAttribute(
      'aria-label',
      `Second: 20 ${HOSTILE}, 50.0% of previous stage, 50.0% of ${HOSTILE}`
    );
    // The tooltip too.
    await userEvent.hover(stagesOf(canvasElement)[1]);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.textContent).toContain(`20 ${HOSTILE}`);
      expect(card?.textContent).toContain(`Of ${HOSTILE}`);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(stagesOf(canvasElement)[1]);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** In a box of 375px, each stage's name and value sit on one line above its bar, and the bars take the full width. */
export const Narrow375: Story = {
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <FunnelChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(narrowLayout(canvasElement)).toBe(true));
    const [first, ...rest] = stagesOf(canvasElement).map((_, i) => i);
    // The widest bar takes the full width of the box.
    await expect(barOf(canvasElement, first).getBoundingClientRect().width).toBeCloseTo(
      box.clientWidth,
      0
    );
    for (const i of [first, ...rest]) {
      const name = nameOf(canvasElement, i).getBoundingClientRect();
      const value = valueOf(canvasElement, i).getBoundingClientRect();
      const bar = barOf(canvasElement, i).getBoundingClientRect();
      // Name and value on one line, above the bar; the value at the end of the line.
      await expect(
        Math.abs(name.top + name.height / 2 - (value.top + value.height / 2))
      ).toBeLessThan(3);
      await expect(value.bottom).toBeLessThanOrEqual(bar.top + 1);
      await expect(name.bottom).toBeLessThanOrEqual(bar.top + 1);
      await expect(value.left).toBeGreaterThan(name.left);
      // The chip ends the line, or the value when there is none.
      await expect(
        (chipOf(canvasElement, i) ?? valueOf(canvasElement, i)).getBoundingClientRect().right
      ).toBeCloseTo(box.getBoundingClientRect().right, 0);
    }
    // The conversion keeps to the chip: the rate from the first stage is in the tooltip.
    await expect(canvasElement.querySelectorAll('[data-funnel-note]')).toHaveLength(0);
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const stagesOf = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>('[data-funnel-stage]'),
];
const part = (root: HTMLElement, selector: string, i: number) =>
  stagesOf(root)[i].querySelector(selector) as HTMLElement;
const nameOf = (root: HTMLElement, i: number) => part(root, '[data-funnel-name]', i);
const valueOf = (root: HTMLElement, i: number) => part(root, '[data-funnel-value]', i);
const barOf = (root: HTMLElement, i: number) => part(root, '[data-funnel-bar]', i);
const chipOf = (root: HTMLElement, i: number) =>
  stagesOf(root)[i].querySelector<HTMLElement>('[data-funnel-chip]');
const noteOf = (root: HTMLElement, i: number) =>
  stagesOf(root)[i].querySelector<HTMLElement>('[data-funnel-note]');
const flowsOf = (root: HTMLElement) => [...root.querySelectorAll('[data-funnel-flow]')];
const tooltipOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-funnel-tooltip]');
const narrowLayout = (root: HTMLElement) =>
  stagesOf(root).length > 0 &&
  getComputedStyle(stagesOf(root)[0]).gridTemplateColumns.split(' ').length === 2;
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');
const rect = (el: Element) => el.getBoundingClientRect();
const centre = (el: Element) => rect(el).left + rect(el).width / 2;

// A CSS color in any syntax (color-mix, relative colors) as `#rrggbb`, laid
// over `base` when it is translucent.
const flat = (color: string, base = '#000000') => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = base;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const fillOf = (el: Element) => flat(getComputedStyle(el).backgroundColor);
const cardOf = (root: HTMLElement) =>
  flat(
    getComputedStyle(root.querySelector('[data-funnel-card]') as Element).backgroundColor,
    '#ffffff'
  );

const THEMES = ['', 'sand', 'dark', 'deep-blue'];

/**
 * The shape: bars centred on one axis, each as wide as its value against the
 * first, top to bottom in the order given; the names to the left of the bars,
 * the values to the right; and one flow between each pair of bars, running
 * from the bottom edge of the one to the top edge of the next.
 */
export const BarsAreCentredAndProportional: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    await waitFor(() => expect(narrowLayout(canvasElement)).toBe(false));
    const bars = args.stages.map((_, i) => rect(barOf(canvasElement, i)));
    const column = (barOf(canvasElement, 0).parentElement as HTMLElement).getBoundingClientRect();
    for (const [i, stage] of args.stages.entries()) {
      await expect(bars[i].width / bars[0].width, stage.label).toBeCloseTo(
        stage.value / args.stages[0].value,
        2
      );
      await expect(centre(barOf(canvasElement, i)), stage.label).toBeCloseTo(
        column.left + column.width / 2,
        0
      );
      await expect(nameOf(canvasElement, i)).toHaveTextContent(stage.label);
      await expect(rect(nameOf(canvasElement, i)).right).toBeLessThanOrEqual(column.left + 1);
      await expect(rect(valueOf(canvasElement, i)).left).toBeGreaterThanOrEqual(column.right - 1);
      if (i > 0) await expect(bars[i].top, stage.label).toBeGreaterThan(bars[i - 1].bottom);
      // Name and value are centred on the bar.
      const mid = bars[i].top + bars[i].height / 2;
      await expect(
        rect(nameOf(canvasElement, i)).top + rect(nameOf(canvasElement, i)).height / 2
      ).toBeCloseTo(mid, 0);
      await expect(
        rect(valueOf(canvasElement, i)).top + rect(valueOf(canvasElement, i)).height / 2
      ).toBeCloseTo(mid, 0);
    }
    // The bars have rounded corners.
    await expect(getComputedStyle(barOf(canvasElement, 0)).borderTopLeftRadius).toBe('6px');
    // One flow between each pair of bars, from one edge to the other.
    const flows = flowsOf(canvasElement).map(rect);
    await expect(flows).toHaveLength(4);
    for (const [i, flow] of flows.entries()) {
      await expect(flow.top, `flow ${i}`).toBeCloseTo(bars[i].bottom, 0);
      await expect(flow.bottom, `flow ${i}`).toBeCloseTo(bars[i + 1].top, 0);
      await expect(flow.width, `flow ${i}`).toBeCloseTo(column.width, 0);
    }
  },
};

/**
 * The chip is the rate from the previous stage and the muted text beside it
 * the rate from the first; the first stage shows 100% and no note. The
 * tooltip gives the value and both rates, and each stage is named with them.
 */
export const ConversionRates: Story = {
  tags: ['!dev', '!autodocs'],
  args: { formatValue: (value) => value.toLocaleString('en-US'), ariaLabel: 'Checkout funnel' },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    await expect(canvasElement.querySelector('[role="list"]')).toHaveAccessibleName(
      'Checkout funnel'
    );
    await expect(chipOf(canvasElement, 0)).toHaveTextContent('100%');
    await expect(noteOf(canvasElement, 0)).toBeNull();
    await expect(
      stagesOf(canvasElement).map((_, i) => chipOf(canvasElement, i)?.textContent)
    ).toEqual(['100%', '65.4%', '31.3%', '51.9%', '66.6%']);
    await expect(noteOf(canvasElement, 2)).toHaveTextContent('20.5% of Visits');
    await expect(valueOf(canvasElement, 2)).toHaveTextContent('9,870');
    await expect(stagesOf(canvasElement)[0]).toHaveAccessibleName('Visits: 48,210');
    await expect(stagesOf(canvasElement)[2]).toHaveAccessibleName(
      'Add to cart: 9,870, 31.3% of previous stage, 20.5% of Visits'
    );

    await expect(tooltipOf(canvasElement)).toBeNull();
    await userEvent.hover(stagesOf(canvasElement)[2]);
    await waitFor(() => {
      const card = tooltipOf(canvasElement) as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.querySelector('p')?.textContent).toBe('Add to cart');
      expect([...card.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
        'Value9,870',
        'Of previous stage31.3%',
        'Of Visits20.5%',
      ]);
    });
    await userEvent.unhover(stagesOf(canvasElement)[2]);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    // The first stage has no rate to give.
    await userEvent.hover(stagesOf(canvasElement)[0]);
    await waitFor(() =>
      expect(
        [...(tooltipOf(canvasElement)?.querySelectorAll('li') ?? [])].map((li) => li.textContent)
      ).toEqual(['Value48,210'])
    );
    await userEvent.unhover(stagesOf(canvasElement)[0]);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** Off, `showConversion` leaves the values: no chip, no note, no rate in the tooltip or the names. */
export const ConversionOffShowsValuesOnly: Story = {
  tags: ['!dev', '!autodocs'],
  args: { showConversion: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    await expect(
      canvasElement.querySelectorAll('[data-funnel-chip], [data-funnel-note]')
    ).toHaveLength(0);
    await expect(canvasElement).not.toHaveTextContent('%');
    await expect(stagesOf(canvasElement)[2]).toHaveAccessibleName('Add to cart: 9870');
    await userEvent.hover(stagesOf(canvasElement)[2]);
    await waitFor(() =>
      expect(
        [...(tooltipOf(canvasElement)?.querySelectorAll('li') ?? [])].map((li) => li.textContent)
      ).toEqual(['Value9870'])
    );
    await userEvent.unhover(stagesOf(canvasElement)[2]);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/**
 * A stage that grows keeps its place and shows a rate over 100%; the widest
 * bar takes the whole column, so nothing leaves the box. A stage at 0 has no
 * bar to see, and the stage after it has no rate from it.
 */
export const GrowingAndEmptyStages: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    stages: [
      { label: 'Web', value: 100 },
      { label: 'Web and app', value: 150 },
      { label: 'Trials', value: 0 },
      { label: 'Paid', value: 30 },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(4));
    await expect(
      stagesOf(canvasElement).map((_, i) => nameOf(canvasElement, i).textContent)
    ).toEqual(['Web', 'Web and app', 'Trials', 'Paid']);
    await expect(chipOf(canvasElement, 1)).toHaveTextContent('150.0%');
    await expect(noteOf(canvasElement, 1)).toHaveTextContent('150.0% of Web');
    await expect(chipOf(canvasElement, 2)).toHaveTextContent('0.0%');
    await expect(chipOf(canvasElement, 3)).toHaveTextContent('–');
    const column = rect(barOf(canvasElement, 0).parentElement as HTMLElement);
    await expect(rect(barOf(canvasElement, 1)).width).toBeCloseTo(column.width, 0);
    await expect(rect(barOf(canvasElement, 0)).width).toBeCloseTo((column.width * 2) / 3, 0);
    await expect(rect(barOf(canvasElement, 2)).width).toBe(0);
    for (let i = 0; i < 4; i++) {
      await expect(rect(barOf(canvasElement, i)).width).toBeLessThanOrEqual(column.width + 0.5);
    }
  },
};

/** `emptyMessage` replaces the default, and stages that are all at 0 are as empty as none. */
export const AllZeroShowsTheEmptyMessage: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    stages: [
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ],
    emptyMessage: 'Nothing yet',
  },
  play: expectEmptyMessage('Nothing yet'),
};

/**
 * The accent fades from the first stage to the last: the first bar is the
 * accent, each next one is lighter, and the last still stands out from the
 * card (1.5:1) in every theme. The flow behind the text of a narrow stage
 * leaves the text at 4.5:1.
 */
export const AccentFadesAndStaysVisible: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    for (const theme of THEMES) {
      const restore = switchTheme(theme);
      try {
        await waitFor(() => {
          const card = cardOf(canvasElement);
          const fills = stagesOf(canvasElement).map((_, i) => fillOf(barOf(canvasElement, i)));
          expect(resolveColor(fills[0]), theme || 'light').toBe(themeColor('--color-brand-500'));
          const ratios = fills.map((fill) => contrastRatio(fill, card));
          for (let i = 1; i < ratios.length; i++) {
            expect(ratios[i], `${theme || 'light'} bar ${i}`).toBeLessThan(ratios[i - 1]);
          }
          expect(ratios.at(-1), `${theme || 'light'} last bar`).toBeGreaterThanOrEqual(1.5);
        });
      } finally {
        restore();
      }
    }
  },
};

/**
 * Every text reads on the card and the chip in the four themes, and in a
 * narrow box also on the flow, which runs under the name and value of the
 * stage below it.
 */
export const TextIsReadableInEveryTheme: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => (
    <>
      <div data-testid="wide" style={{ width: 800 }}>
        <FunnelChart {...args} />
      </div>
      <div data-testid="narrow" style={{ width: 375, maxWidth: '100%' }}>
        <FunnelChart {...args} />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const layout = (name: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${name}"]`) as HTMLElement;
    await waitFor(() => {
      expect(narrowLayout(layout('narrow'))).toBe(true);
      expect(narrowLayout(layout('wide'))).toBe(false);
    });
    for (const theme of THEMES) {
      const restore = switchTheme(theme);
      try {
        await waitFor(() => {
          const card = cardOf(canvasElement);
          const label = theme || 'light';
          for (const [name, root] of [
            ['wide', layout('wide')],
            ['narrow', layout('narrow')],
          ] as const) {
            const polygon = root.querySelector('[data-funnel-flow] polygon') as Element;
            // The flow is the accent at its own opacity over the card.
            const overFlow = flat(
              `color-mix(in srgb, ${flat(getComputedStyle(polygon).fill)} ${Number(polygon.getAttribute('fill-opacity')) * 100}%, ${card})`
            );
            const colorOf = (el: Element) => flat(getComputedStyle(el).color);
            const texts: [string, Element][] = [
              ['name', nameOf(root, 1)],
              ['value', valueOf(root, 1)],
              ...(name === 'wide'
                ? [['note', noteOf(root, 2) as Element] as [string, Element]]
                : []),
            ];
            for (const [what, el] of texts) {
              expect(
                contrastRatio(colorOf(el), card),
                `${label} ${name} ${what}`
              ).toBeGreaterThanOrEqual(4.5);
            }
            if (name === 'narrow') {
              for (const [what, el] of texts) {
                expect(
                  contrastRatio(colorOf(el), overFlow),
                  `${label} ${name} ${what} on the flow`
                ).toBeGreaterThanOrEqual(4.5);
              }
            }
            const chip = chipOf(root, 1) as HTMLElement;
            expect(
              contrastRatio(colorOf(chip), flat(getComputedStyle(chip).backgroundColor, card)),
              `${label} ${name} chip`
            ).toBeGreaterThanOrEqual(4.5);
          }
        });
      } finally {
        restore();
      }
    }
  },
};

/** `colors` gives each stage its color, cycling when there are fewer, in place of the fade. */
export const ColorsOverrideTheFade: Story = {
  tags: ['!dev', '!autodocs'],
  args: { colors: ['#ff0000', '#00ff00'] },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(stagesOf(canvasElement).map((_, i) => fillOf(barOf(canvasElement, i)))).toEqual([
        '#ff0000',
        '#00ff00',
        '#ff0000',
        '#00ff00',
        '#ff0000',
      ])
    );
  },
};

/** A theme or accent switch repaints the bars with no redraw. */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const first = () => barOf(canvasElement, 0);
    const last = () => barOf(canvasElement, 4);
    await waitFor(() =>
      expect(resolveColor(fillOf(first()))).toBe(themeColor('--color-brand-500'))
    );
    const before = fillOf(last());
    const restore = switchTheme(document.documentElement.classList.contains('dark') ? '' : 'dark');
    try {
      await waitFor(() => expect(fillOf(last())).not.toBe(before));
    } finally {
      restore();
    }
    const html = document.documentElement;
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => expect(fillOf(first())).toBe(resolveColor('#038378')));
    } finally {
      html.removeAttribute('data-accent');
    }
  },
};

/** The text follows the text size setting, the tooltip too. */
export const TextFollowsTheTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const sizes = () => ({
      name: px(nameOf(canvasElement, 1)),
      value: px(valueOf(canvasElement, 1)),
      chip: px(chipOf(canvasElement, 1)),
      note: px(noteOf(canvasElement, 2)),
    });
    await waitFor(() => expect(sizes()).toEqual({ name: 12, value: 14, chip: 12, note: 12 }));
    const previous = html.getAttribute('data-text-size');
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() =>
        expect(sizes()).toEqual({ name: 13.5, value: 15.75, chip: 13.5, note: 13.5 })
      );
      await userEvent.hover(stagesOf(canvasElement)[1]);
      await waitFor(() =>
        expect(px(tooltipOf(canvasElement)?.firstElementChild ?? null)).toBe(13.5)
      );
      await userEvent.unhover(stagesOf(canvasElement)[1]);
      await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
      // No label is cut at the largest size.
      html.setAttribute('data-text-size', 'xl');
      await waitFor(() => expect(px(nameOf(canvasElement, 1))).toBeGreaterThan(13.5));
      await waitFor(() =>
        expect(
          [...canvasElement.querySelectorAll<HTMLElement>('[data-funnel-name]')]
            .filter((el) => el.scrollWidth > el.clientWidth)
            .map((el) => el.textContent)
        ).toEqual([])
      );
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};

/** A funnel wider than its box is cut to it, so a narrow screen never scrolls sideways. */
export const NoHorizontalOverflow: Story = {
  tags: ['!dev', '!autodocs'],
  args: { width: 900, formatValue: money },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <FunnelChart {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(narrowLayout(canvasElement)).toBe(true));
    await waitFor(() => {
      expect(box.scrollWidth, 'the box scrolls sideways').toBeLessThanOrEqual(box.clientWidth);
      expect(rect(box.firstElementChild as Element).width).toBeLessThanOrEqual(375);
    });
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** `height` fixes the height of the chart: the stages share it, and the flow stretches to fill the room. */
export const HeightIsShared: Story = {
  tags: ['!dev', '!autodocs'],
  args: { height: 420 },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    const list = canvasElement.querySelector('[role="list"]') as HTMLElement;
    await expect(rect(list).height).toBeCloseTo(420, 0);
    const bars = stagesOf(canvasElement).map((_, i) => rect(barOf(canvasElement, i)));
    await expect(bars.at(-1)?.bottom).toBeCloseTo(rect(list).bottom, 0);
    // Bars keep their height; the flow takes the room.
    await expect(new Set(bars.map((bar) => Math.round(bar.height))).size).toBe(1);
    const flows = flowsOf(canvasElement).map(rect);
    for (const [i, flow] of flows.entries()) {
      await expect(flow.top).toBeCloseTo(bars[i].bottom, 0);
      await expect(flow.bottom).toBeCloseTo(bars[i + 1].top, 0);
    }
  },
};

/**
 * One tab stop. The arrows (down and right go on, up and left go back), Home
 * and End walk the stages and show the tooltip of the one they land on; Tab
 * leaves, and comes back to the stage left.
 */
export const NamedAndKeyboardReachable: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Checkout funnel' },
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(stagesOf(canvasElement)).toHaveLength(5));
    const stops = () => stagesOf(canvasElement).filter((stage) => stage.tabIndex === 0);
    await expect(stops()).toHaveLength(1);
    await userEvent.tab();
    await expect(stagesOf(canvasElement)[0]).toHaveFocus();
    await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toContain('Visits'));
    const press = async (keys: string, index: number) => {
      await userEvent.keyboard(keys);
      await expect(stagesOf(canvasElement)[index], keys).toHaveFocus();
      await expect(stops()).toEqual([stagesOf(canvasElement)[index]]);
      await waitFor(() =>
        expect(tooltipOf(canvasElement)?.querySelector('p')?.textContent).toBe(
          args.stages[index].label
        )
      );
    };
    await press('{ArrowDown}', 1);
    await press('{ArrowRight}', 2);
    await press('{ArrowUp}', 1);
    await press('{ArrowLeft}', 0);
    // The edges stop the arrows.
    await press('{ArrowLeft}', 0);
    await press('{End}', 4);
    await press('{ArrowDown}', 4);
    await press('{Home}', 0);

    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await userEvent.tab({ shift: true });
    await expect(stagesOf(canvasElement)[0]).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};
