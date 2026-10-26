import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { SEQUENTIAL, TRACK } from './core/colors';
import {
  contrastRatio,
  expectNoInjectedImage,
  HOSTILE,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-recharts';
import { WorldMap } from './WorldMap';

const geography = world as unknown as Topology;

// Visitors of the last 30 days, by ISO 3166-1 alpha-2 code.
const VISITS: Record<string, number> = {
  US: 48200,
  DE: 21300,
  GB: 18900,
  FR: 16400,
  IN: 15800,
  BR: 9800,
  CA: 9100,
  JP: 8700,
  CN: 7200,
  AU: 6200,
  ES: 5900,
  IT: 5400,
  NL: 4800,
  MX: 4100,
  KR: 3900,
  PL: 3600,
  SE: 3100,
  CH: 2900,
  TR: 2700,
  BE: 2500,
  ZA: 2400,
  PT: 2200,
  AR: 2100,
  IE: 2000,
  NO: 1900,
  NG: 1800,
  AT: 1700,
  DK: 1600,
  EG: 1500,
  ID: 1400,
  AE: 1350,
  NZ: 1300,
  VN: 1250,
  CO: 1200,
  CZ: 1200,
  PH: 1150,
  CL: 1100,
  UA: 1100,
  TH: 1050,
  FI: 1000,
  IL: 1000,
  SA: 950,
  RO: 950,
  KE: 900,
  GR: 900,
  MA: 800,
  HU: 700,
};

// 48200 is 48.2k, 700 is 700.
const compact = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(value);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    data-world-card=""
    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
  >
    {children}
  </div>
);

const meta: Meta<typeof WorldMap> = {
  title: 'Charts/World Map',
  component: WorldMap,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { data: VISITS, geography, formatValue: compact, label: 'visitors' },
  decorators: [
    (Story) => (
      <Card>
        <Story />
      </Card>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * Visitors by country on a world map in the Natural Earth projection. Five
 * color steps of the accent cut by quantiles, so each holds about as many
 * countries, and one large country does not wash the others out. The legend
 * gives the lower bound of each step; a country with no value is gray. Hover,
 * or Tab and the arrow keys, for a country's value.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valued(canvasElement)).toHaveLength(Object.keys(VISITS).length));
    await expect(legendTexts(canvasElement)).toEqual([
      '700+',
      '1.1k+',
      '1.5k+',
      '2.7k+',
      '6.2k+',
      'No data',
    ]);
  },
};

/** `showLegend={false}` leaves the map alone. */
export const WithoutLegend: Story = {
  args: { showLegend: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valued(canvasElement).length).toBeGreaterThan(0));
    await expect(canvasElement.querySelector('[data-world-legend]')).toBeNull();
  },
};

/**
 * `min` and `max` clamp the values before the steps are cut: here nothing
 * under 0 and nothing over 5k. Spain (5.9k) counts as 5k and moves up to the
 * top step, which now starts at 5k; the legend starts at `min`.
 */
export const PinnedScale: Story = {
  args: { min: 0, max: 5000 },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valued(canvasElement).length).toBeGreaterThan(0));
    await expect(legendTexts(canvasElement)).toEqual([
      '0+',
      '1.1k+',
      '1.5k+',
      '2.7k+',
      '5k+',
      'No data',
    ]);
    await expect(stepOf(canvasElement, 'ES')).toBe(4);
    // Unpinned, Spain is a step below.
    await expect(stepOf(canvasElement, 'NL')).toBe(3);
  },
};

/**
 * With `onSelect`, a click on a country with a value, or Enter or Space on
 * the one the keyboard is on, calls it with the country's code.
 */
export const Selectable: Story = {
  args: { onSelect: fn() },
  render: (args) => {
    const [selected, setSelected] = useState<string>();
    return (
      <>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300" data-testid="selected">
          Selected: {selected ?? 'none'}
        </p>
        <WorldMap
          {...args}
          onSelect={(code) => {
            args.onSelect?.(code);
            setSelected(code);
          }}
        />
      </>
    );
  },
  play: async ({ canvasElement, args }) => {
    const selected = () => canvasElement.querySelector('[data-testid="selected"]')?.textContent;
    await waitFor(() => expect(countryOf(canvasElement, 'FR')).not.toBeNull());
    await userEvent.click(countryOf(canvasElement, 'FR') as Element);
    await waitFor(() => expect(selected()).toBe('Selected: FR'));
    await expect(args.onSelect).toHaveBeenLastCalledWith('FR');
    // A country with no value is not a target.
    await userEvent.unhover(countryOf(canvasElement, 'FR') as Element);
    await userEvent.click(canvasElement.querySelector('svg path:not([data-code])') as Element);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    // The click left the focus on the map: Home goes to the largest country, Enter selects it.
    await expect(mapOf(canvasElement)).toHaveFocus();
    await userEvent.keyboard('{Home}{Enter}');
    await waitFor(() => expect(selected()).toBe('Selected: US'));
    await userEvent.keyboard('{ArrowRight} ');
    await waitFor(() => expect(selected()).toBe('Selected: DE'));
    await userEvent.unhover(canvasElement.querySelector('svg path:not([data-code])') as Element);
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
  },
};

/** With no value, the bare map is drawn in the gray of a country without data: no legend, nothing to walk, no table. */
export const Empty: Story = {
  args: { data: {} },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('svg path').length).toBeGreaterThan(100)
    );
    await expect(canvasElement.querySelector('[data-world-legend]')).toBeNull();
    await expect(canvasElement.querySelector('[data-world-table]')).toBeNull();
    await expect(canvasElement.querySelector('[tabindex]')).toBeNull();
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('role', 'img');
    const fills = new Set(
      [...canvasElement.querySelectorAll('svg path')].map((path) => fillOf(path))
    );
    await expect([...fills]).toEqual([resolved(TRACK)]);
  },
};

/** In a box of 375px the map takes the width and keeps its proportions, and the legend wraps. */
export const OnNarrowScreen: Story = {
  tags: ['!autodocs'],
  render: (args) => (
    <div data-testid="box" style={{ width: 375 }}>
      <WorldMap {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(valued(canvasElement).length).toBeGreaterThan(0));
    const svg = canvasElement.querySelector('svg') as SVGSVGElement;
    const { width, height } = svg.getBoundingClientRect();
    await expect(width).toBeLessThanOrEqual(375);
    await expect(width).toBeCloseTo(375, 0);
    // The box keeps the proportions of the map: a little under 2:1.
    await expect(width / height).toBeGreaterThan(1.9);
    await expect(width / height).toBeLessThan(2.3);
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    const legend = canvasElement.querySelector('[data-world-legend]') as HTMLElement;
    await expect(legend.getBoundingClientRect().right).toBeLessThanOrEqual(
      box.getBoundingClientRect().right + 1
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

const mapOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[role="application"]') as HTMLElement;
const valued = (root: HTMLElement) => [...root.querySelectorAll<SVGPathElement>('path[data-code]')];
const countryOf = (root: HTMLElement, code: string) =>
  root.querySelector<SVGPathElement>(`path[data-code="${code}"]`);
const stepOf = (root: HTMLElement, code: string) =>
  Number(countryOf(root, code)?.getAttribute('data-step'));
const tooltipOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-world-tooltip]');
const statusOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-world-status]')?.textContent;
const legendTexts = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-world-legend] li')].map((el) => el.textContent);
const ringOf = (root: HTMLElement) => root.querySelector('[data-world-active]');
const px = (el: Element | null) => parseFloat(el ? getComputedStyle(el).fontSize : '');

// A CSS color in any syntax (color-mix, oklab…) as `#rrggbb`.
const toHex = (color: string) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const fillOf = (el: Element) => toHex(getComputedStyle(el).fill);
// A color of the chart (it holds `var()` and `color-mix()`) as the page resolves it.
const resolved = (color: string) => {
  const probe = document.createElement('div');
  probe.style.background = color;
  document.body.append(probe);
  const hex = toHex(getComputedStyle(probe).backgroundColor);
  probe.remove();
  return hex;
};

// Ten countries, 1 to 10: the quantile cuts fall on 3, 5, 7 and 9.
const TEN: Record<string, number> = {
  US: 10,
  DE: 9,
  GB: 8,
  FR: 7,
  IN: 6,
  BR: 5,
  CA: 4,
  JP: 3,
  CN: 2,
  AU: 1,
};

/** Each country takes the step its rank gives it; a country with no value, or not in `data`, takes the gray. */
export const FillFollowsTheStep: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: TEN, formatValue: String },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valued(canvasElement)).toHaveLength(10));
    const steps = Object.fromEntries(Object.keys(TEN).map((c) => [c, stepOf(canvasElement, c)]));
    await expect(steps).toEqual({
      US: 4,
      DE: 4,
      GB: 3,
      FR: 3,
      IN: 2,
      BR: 2,
      CA: 1,
      JP: 1,
      CN: 0,
      AU: 0,
    });
    for (const [code, step] of Object.entries(steps)) {
      await expect(fillOf(countryOf(canvasElement, code) as Element), code).toBe(
        resolved(SEQUENTIAL[step])
      );
    }
    // Every other country of the map, Chad among them, has no value.
    const others = [...canvasElement.querySelectorAll('svg path:not([data-code])')];
    await expect(others.length).toBeGreaterThan(100);
    for (const path of others) await expect(fillOf(path)).toBe(resolved(TRACK));
    await expect(legendTexts(canvasElement)).toEqual(['1+', '3+', '5+', '7+', '9+', 'No data']);
  },
};

/** A value that is not finite counts as none, and a code the map does not hold is not drawn. */
export const IgnoresWhatItCannotDraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: { FR: 5, DE: Number.NaN, SG: 9, XX: 3, US: 7 } },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(valued(canvasElement).map((p) => p.dataset.code)).toEqual(['US', 'FR'])
    );
    await expect(canvasElement.querySelectorAll('[data-world-table] tbody tr')).toHaveLength(2);
  },
};

/** The pointer on a country with a value shows its card and outlines it; off, both go. A country without value shows nothing. */
export const HoverShowsTheTooltip: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(countryOf(canvasElement, 'FR')).not.toBeNull());
    const france = countryOf(canvasElement, 'FR') as SVGPathElement;
    await userEvent.hover(france);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.textContent).toContain('France');
      expect(card?.textContent).toContain('visitors');
      expect(card?.textContent).toContain('16.4k');
    });
    await expect(ringOf(canvasElement)?.getAttribute('d')).toBe(france.getAttribute('d'));
    // The chip is the color of the country.
    const chip = tooltipOf(canvasElement)?.querySelector('span[aria-hidden]') as HTMLElement;
    await expect(toHex(getComputedStyle(chip).backgroundColor)).toBe(fillOf(france));
    await userEvent.unhover(france);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await expect(ringOf(canvasElement)).toBeNull();
    // Chad has no value: nothing to say about it.
    const chad = canvasElement.querySelector('svg path:not([data-code])') as Element;
    await userEvent.hover(chad);
    await expect(tooltipOf(canvasElement)).toBeNull();
    await userEvent.unhover(chad);
  },
};

/**
 * One tab stop. Tab lands on the largest country and shows its card; the
 * arrows walk the countries that have a value in descending order, Home and
 * End go to the largest and the smallest, and the ends stay put. The
 * country in focus is outlined and announced.
 */
export const KeyboardWalksTheCountries: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(mapOf(canvasElement)).toHaveAttribute('tabindex', '0'));
    await expect(canvasElement.querySelectorAll('[tabindex]:not([tabindex="-1"])')).toHaveLength(1);
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('role', 'img');
    const on = (name: string) =>
      waitFor(() => {
        expect(tooltipOf(canvasElement)?.textContent).toContain(name);
        expect(statusOf(canvasElement)).toContain(name);
        expect(ringOf(canvasElement)).not.toBeNull();
      });
    await userEvent.tab();
    await expect(mapOf(canvasElement)).toHaveFocus();
    await on('United States of America');
    await expect(statusOf(canvasElement)).toBe('United States of America, visitors: 48.2k');
    // The card stays inside the map.
    const card = tooltipOf(canvasElement)?.firstElementChild?.getBoundingClientRect() as DOMRect;
    const frame = mapOf(canvasElement).getBoundingClientRect();
    await expect(card.left).toBeGreaterThanOrEqual(frame.left - 1);
    await expect(card.right).toBeLessThanOrEqual(frame.right + 1);
    // Before the first, nowhere to go.
    await userEvent.keyboard('{ArrowLeft}');
    await on('United States of America');
    const walk: [key: string, name: string][] = [
      ['{ArrowRight}', 'Germany'],
      ['{ArrowDown}', 'United Kingdom'],
      ['{ArrowRight}', 'France'],
      ['{ArrowRight}', 'India'],
      ['{ArrowLeft}', 'France'],
      ['{ArrowUp}', 'United Kingdom'],
      ['{End}', 'Hungary'],
      ['{ArrowRight}', 'Hungary'],
      ['{ArrowUp}', 'Morocco'],
      ['{Home}', 'United States of America'],
    ];
    for (const [key, name] of walk) {
      await userEvent.keyboard(key);
      await on(name);
    }
    // Enter does nothing without onSelect.
    await userEvent.keyboard('{Enter}');
    await on('United States of America');
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await expect(ringOf(canvasElement)).toBeNull();
    // Tab comes back to the last country.
    await userEvent.tab({ shift: true });
    await on('United States of America');
    await userEvent.tab();
  },
};

/** The hidden table is the reading path: country and value, largest first, with the formatted values. */
export const HiddenTableListsTheCountries: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-world-table]')).not.toBeNull());
    const table = canvasElement.querySelector('[data-world-table]') as HTMLElement;
    const rows = [...table.querySelectorAll('tbody tr')].map((row) =>
      [...row.children].map((cell) => cell.textContent)
    );
    await expect(rows).toHaveLength(Object.keys(VISITS).length);
    await expect(rows.slice(0, 4)).toEqual([
      ['United States of America', '48.2k'],
      ['Germany', '21.3k'],
      ['United Kingdom', '18.9k'],
      ['France', '16.4k'],
    ]);
    await expect(rows.at(-1)).toEqual(['Hungary', '700']);
    await expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Country',
      'visitors',
    ]);
    // Visually hidden, yet in the accessibility tree.
    const { width, height } = (table.parentElement as HTMLElement).getBoundingClientRect();
    await expect(Math.max(width, height)).toBeLessThanOrEqual(1);
    await expect(table).not.toHaveAttribute('aria-hidden');
    await expect(table.querySelector('caption')?.textContent).toBe(
      'World map, visitors by country, from 700 to 48.2k'
    );
  },
};

/** `ariaLabel` names the map for screen readers, on the image and on the control. */
export const AccessibleName: Story = {
  tags: ['!dev', '!autodocs'],
  args: { ariaLabel: 'Visitors by country' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(mapOf(canvasElement)).toHaveAttribute('aria-label', 'Visitors by country')
    );
    await expect(canvasElement.querySelector('svg')).toHaveAttribute(
      'aria-label',
      'Visitors by country'
    );
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('role', 'img');
  },
};

/** `height` sets the height of the whole chart: the map takes what the legend leaves. */
export const FixedHeight: Story = {
  tags: ['!dev', '!autodocs'],
  args: { height: 300 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-world-map]') as HTMLElement;
    await waitFor(() => expect(valued(canvasElement).length).toBeGreaterThan(0));
    await expect(root.getBoundingClientRect().height).toBeCloseTo(300, 0);
    const svg = (canvasElement.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
    const legend = (
      canvasElement.querySelector('[data-world-legend]') as HTMLElement
    ).getBoundingClientRect();
    await expect(svg.bottom).toBeLessThanOrEqual(legend.top + 1);
    await expect(legend.bottom).toBeLessThanOrEqual(root.getBoundingClientRect().bottom + 1);
  },
};

/** The country names, the label and the values are React text: markup in them shows as written. */
export const HtmlInLabelsRendersAsText: Story = {
  tags: ['!autodocs'],
  args: {
    geography: {
      ...geography,
      objects: {
        ...geography.objects,
        countries: {
          ...geography.objects.countries,
          geometries: (
            geography.objects.countries as { geometries: { id?: string }[] }
          ).geometries.map((geometry) =>
            geometry.id === '250' ? { ...geometry, properties: { name: HOSTILE } } : geometry
          ),
        },
      },
    } as unknown as Topology,
    data: { FR: 40, DE: 20 },
    label: HOSTILE,
    formatValue: (value) => `${value} ${HOSTILE}`,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(countryOf(canvasElement, 'FR')).not.toBeNull());
    await expectNoInjectedImage(canvasElement);
    await userEvent.hover(countryOf(canvasElement, 'FR') as Element);
    await waitFor(() => {
      const card = tooltipOf(canvasElement)?.textContent;
      expect(card).toContain(HOSTILE);
      expect(card).toContain(`40 ${HOSTILE}`);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(countryOf(canvasElement, 'FR') as Element);
    const table = canvasElement.querySelector('[data-world-table]') as HTMLElement;
    await expect(table.querySelector('tbody th')?.textContent).toBe(HOSTILE);
    await expect(table.querySelector('tbody td')?.textContent).toBe(`40 ${HOSTILE}`);
    await expect(table.querySelector('thead th:last-child')?.textContent).toBe(HOSTILE);
    await expect(legendTexts(canvasElement)[0]).toBe(`20 ${HOSTILE}+`);
    // And the keyboard's announcement.
    await userEvent.tab();
    await waitFor(() =>
      expect(statusOf(canvasElement)).toBe(`${HOSTILE}, ${HOSTILE}: 40 ${HOSTILE}`)
    );
    await expectNoInjectedImage(canvasElement);
    await userEvent.tab();
  },
};

/**
 * The colors are CSS variables: a theme or accent switch repaints the map with
 * no redraw. The top step is the accent; the empty countries follow the border
 * color of the theme.
 */
export const RepaintsWithTheme: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const top = () => countryOf(canvasElement, 'US') as Element;
    const none = () => canvasElement.querySelector('svg path:not([data-code])') as Element;
    await waitFor(() => expect(resolveColor(fillOf(top()))).toBe(themeColor('--color-brand-500')));
    const before = {
      low: fillOf(countryOf(canvasElement, 'HU') as Element),
      none: fillOf(none()),
    };
    // Another theme than the one the story runs in: the contrast pass renders it in each.
    const restore = switchTheme(document.documentElement.classList.contains('dark') ? '' : 'dark');
    try {
      await waitFor(() => {
        expect(fillOf(countryOf(canvasElement, 'HU') as Element)).not.toBe(before.low);
        expect(fillOf(none())).not.toBe(before.none);
      });
    } finally {
      restore();
    }
    const html = document.documentElement;
    html.setAttribute('data-accent', 'teal');
    try {
      await waitFor(() => expect(fillOf(top())).toBe(resolveColor('#038378')));
    } finally {
      html.removeAttribute('data-accent');
    }
  },
};

/**
 * In the dark themes the lowest step stays a country of its own, at least
 * 1.5:1 against the card, whatever the accent; and in every theme the gray of a
 * country without data differs from it.
 */
export const LowestStepStaysVisible: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const low = () => fillOf(countryOf(canvasElement, 'HU') as Element);
    const none = () => fillOf(canvasElement.querySelector('svg path:not([data-code])') as Element);
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ['blue', 'teal', 'violet', 'amber']) {
          document.documentElement.setAttribute('data-accent', accent);
          await waitFor(() => {
            expect(low(), `${theme || 'light'} ${accent}`).not.toBe(none());
            if (theme === 'dark' || theme === 'deep-blue') {
              for (const surface of ['--color-gray-900', '--color-bg-panel']) {
                expect(
                  contrastRatio(low(), toHex(themeColor(surface))),
                  `${theme} ${accent} on ${surface}`
                ).toBeGreaterThanOrEqual(1.5);
              }
            }
          });
        }
      } finally {
        document.documentElement.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** The legend and the tooltip follow the text size setting. */
export const TextFollowsTextSize: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-text-size');
    const legendSize = () =>
      px(canvasElement.querySelector('[data-world-legend] li span:last-child'));
    const tooltipSize = () => px(tooltipOf(canvasElement)?.firstElementChild ?? null);
    await waitFor(() => expect(legendSize()).toBe(11));
    await userEvent.hover(countryOf(canvasElement, 'FR') as Element);
    await waitFor(() => expect(tooltipSize()).toBe(12));
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(legendSize()).toBeGreaterThan(11));
      await waitFor(() => expect(tooltipSize()).toBe(13.5));
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
      await userEvent.unhover(countryOf(canvasElement, 'FR') as Element);
    }
  },
};
