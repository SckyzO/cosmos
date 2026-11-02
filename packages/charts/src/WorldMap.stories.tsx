import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { INTENT_COLORS, PANEL, SEQUENTIAL, SERIES, TRACK } from './core/colors';
import {
  contrastRatio,
  expectNoInjectedImage,
  HOSTILE,
  resolveColor,
  switchTheme,
  themeColor,
} from './storybook-recharts';
import { WorldMap, type WorldMapMarker, type WorldMapRoute } from './WorldMap';

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
export const Default: Story = {};

export const DefaultChecks: Story = {
  ...Default,
  tags: ['!dev', '!autodocs'],
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
};

export const WithoutLegendChecks: Story = {
  ...WithoutLegend,
  tags: ['!dev', '!autodocs'],
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
};

export const PinnedScaleChecks: Story = {
  ...PinnedScale,
  tags: ['!dev', '!autodocs'],
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
};

export const SelectableChecks: Story = {
  ...Selectable,
  tags: ['!dev', '!autodocs'],
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
};

export const EmptyChecks: Story = {
  ...Empty,
  tags: ['!dev', '!autodocs'],
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
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <WorldMap {...args} />
    </div>
  ),
};

export const OnNarrowScreenChecks: Story = {
  ...OnNarrowScreen,
  tags: ['!dev', '!autodocs'],
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
  tags: ['!dev', '!autodocs'],
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

// ── Markers and routes ───────────────────────────────────────────────────────

// Shipments through twelve ports, and the busiest lanes between them. Shanghai
// and Tokyo to Los Angeles cross the antimeridian.
const PORTS: WorldMapMarker[] = [
  { id: 'rtm', label: 'Rotterdam', coordinates: [4.48, 51.92], value: 6240 },
  { id: 'sha', label: 'Shanghai', coordinates: [121.47, 31.23], value: 5600 },
  { id: 'sin', label: 'Singapore', coordinates: [103.82, 1.35], value: 4100 },
  { id: 'lax', label: 'Los Angeles', coordinates: [-118.24, 34.05], value: 3300 },
  { id: 'nyc', label: 'New York', coordinates: [-74.0, 40.71], value: 2600 },
  { id: 'dxb', label: 'Dubai', coordinates: [55.27, 25.2], value: 2100 },
  { id: 'tyo', label: 'Tokyo', coordinates: [139.69, 35.69], value: 1700 },
  { id: 'syd', label: 'Sydney', coordinates: [151.21, -33.87], value: 900 },
  { id: 'bom', label: 'Mumbai', coordinates: [72.88, 19.08], value: 800 },
  { id: 'ssz', label: 'Santos', coordinates: [-46.33, -23.96], value: 700 },
  { id: 'los', label: 'Lagos', coordinates: [3.39, 6.52], value: 450 },
  { id: 'jnb', label: 'Johannesburg', coordinates: [28.05, -26.2], value: 300 },
];

const LANES: WorldMapRoute[] = [
  { from: 'sha', to: 'rtm', value: 1240 },
  { from: 'sin', to: 'rtm', value: 980 },
  { from: 'sha', to: 'lax', value: 860 },
  { from: 'rtm', to: 'nyc', value: 720 },
  { from: 'tyo', to: 'lax', value: 540 },
  { from: 'dxb', to: 'rtm', value: 420 },
  { from: 'sha', to: 'syd', value: 330 },
  { from: 'rtm', to: 'ssz', value: 300 },
];

// Shipments delivered, by country.
const DELIVERED: Record<string, number> = {
  US: 11800,
  CN: 9800,
  NL: 6200,
  DE: 5600,
  GB: 3900,
  JP: 3400,
  KR: 3000,
  BR: 2500,
  AU: 2200,
  AE: 2000,
  IN: 1800,
  ZA: 900,
  NG: 600,
};

const SHIPMENTS = { data: DELIVERED, label: 'shipments' };

const wideViewport = { viewport: { value: 'laptop', isRotated: false } } as const;

const mapScale = (root: HTMLElement) =>
  (root.querySelector('svg') as SVGSVGElement).getBoundingClientRect().width / 960;
const markerEls = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGCircleElement>('circle[data-marker]'),
];
const markerEl = (root: HTMLElement, id: string) =>
  root.querySelector<SVGCircleElement>(`circle[data-marker="${id}"]`) as SVGCircleElement;
const routeEl = (root: HTMLElement, index: number) =>
  root.querySelector<SVGPathElement>(`path[data-route="${index}"]`) as SVGPathElement;
// The radius of a marker, in screen pixels, and the width of a line.
const radiusPx = (root: HTMLElement, id: string) =>
  Number(markerEl(root, id).getAttribute('r')) * mapScale(root);
const widthPx = (root: HTMLElement, index: number) =>
  Number(routeEl(root, index).getAttribute('stroke-width')) * mapScale(root);
const routeGroup = (root: HTMLElement, index: number) =>
  routeEl(root, index).parentElement as Element;
const targetOf = (root: HTMLElement, id: string) =>
  markerEl(root, id).nextElementSibling as SVGCircleElement;
const sizeKeys = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-world-size-key] li')].map((el) => el.textContent);
const markerFill = (root: HTMLElement, id: string) => fillOf(markerEl(root, id));
const tableRows = (root: HTMLElement, kind: string) =>
  [...root.querySelectorAll(`[data-world-table="${kind}"] tbody tr`)].map((row) =>
    [...row.children].map((cell) => cell.textContent)
  );

/**
 * Markers over the countries: a bubble per point, its area following the
 * value, in the second series color so that it never reads as one of the five
 * steps, with an edge in the color of the card. The legend adds the sizes.
 * Hover, or Tab and the arrow keys, for a marker's value.
 */
export const Markers: Story = {
  args: { ...SHIPMENTS, markers: PORTS },
};

export const MarkersChecks: Story = {
  ...Markers,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    await waitFor(() => expect(radiusPx(canvasElement, 'rtm')).toBeGreaterThan(5.9));
    // The default color is the second series, which no step of the countries is.
    const steps = SEQUENTIAL.map((step) => resolved(step));
    for (const marker of markerEls(canvasElement)) {
      const id = marker.dataset.marker as string;
      await expect(fillOf(marker), id).toBe(resolved(SERIES[1]));
      await expect(steps, id).not.toContain(fillOf(marker));
      await expect(toHex(getComputedStyle(marker).stroke), id).toBe(resolved(PANEL));
    }
    // The area follows the value: the largest is the largest radius, and 5600 against 6240 is its square root.
    const largest = radiusPx(canvasElement, 'rtm');
    await expect(radiusPx(canvasElement, 'sha')).toBeCloseTo(largest * Math.sqrt(5600 / 6240), 1);
    await expect(radiusPx(canvasElement, 'nyc')).toBeCloseTo(largest * Math.sqrt(2600 / 6240), 1);
    // The smallest are drawn above the largest.
    await expect(markerEls(canvasElement).map((marker) => marker.dataset.marker)).toEqual(
      PORTS.map((port) => port.id)
    );
    // The legend keeps the steps of the countries and adds the key of the sizes, as large as the bubbles.
    await expect(legendTexts(canvasElement)).toContain('No data');
    const keys = sizeKeys(canvasElement);
    await expect(keys.at(-1)).toBe('6.2k');
    const bubble = canvasElement.querySelector('[data-world-size-key] li:last-child circle');
    await expect(Number(bubble?.getAttribute('r'))).toBeCloseTo(largest, 1);
    await expect(canvasElement.querySelector('[data-world-width-key]')).toBeNull();
  },
};

/**
 * Markers and routes: a route is a great circle between two markers (or two
 * positions), the shortest way on the globe, with a width that follows its
 * value. A route that crosses the antimeridian, such as Shanghai to Los
 * Angeles, leaves by the right edge of the map and comes in by the left one.
 * Hover a line for its value: the others fade.
 */
export const MarkersAndRoutes: Story = {
  args: { ...SHIPMENTS, markers: PORTS, routes: LANES },
};

export const MarkersAndRoutesChecks: Story = {
  ...MarkersAndRoutes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('path[data-route]')).toHaveLength(8));
    await waitFor(() => expect(widthPx(canvasElement, 0)).toBeGreaterThan(3));
    // The widest line is 3.6px, and the width follows the value up from 1.2px.
    await expect(widthPx(canvasElement, 0)).toBeCloseTo(3.6, 1);
    await expect(widthPx(canvasElement, 6)).toBeCloseTo(1.2 + 2.4 * (330 / 1240), 1);
    // Shanghai to Rotterdam stays on the map; Shanghai to Los Angeles is cut at the antimeridian.
    const pieces = (index: number) =>
      (routeEl(canvasElement, index).getAttribute('d') ?? '').split('M').length - 1;
    await expect(pieces(0)).toBe(1);
    await expect(pieces(2)).toBe(2);
    // Under the markers, in the second series color.
    const all = [...canvasElement.querySelectorAll('path[data-route], circle[data-marker]')];
    const lastRoute = all.map((el) => el.tagName).lastIndexOf('path');
    const firstMarker = all.map((el) => el.tagName).indexOf('circle');
    await expect(lastRoute).toBeLessThan(firstMarker);
    await expect(toHex(getComputedStyle(routeEl(canvasElement, 0)).stroke)).toBe(
      resolved(SERIES[1])
    );
    // The legend adds the key of the widths.
    await expect(canvasElement.querySelector('[data-world-width-key]')?.textContent).toBe(
      '300 to 1.2k'
    );
  },
};

/** The pointer on a marker shows its card and rings it; the pointer on a route shows its card and fades the other routes. */
export const HoverReadsMarkersAndRoutes: Story = {
  ...MarkersAndRoutes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    const rotterdam = markerEl(canvasElement, 'rtm');
    await userEvent.hover(rotterdam);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.textContent).toContain('Rotterdam');
      expect(card?.textContent).toContain('shipments');
      expect(card?.textContent).toContain('6.2k');
    });
    // The ring is around the bubble, in the text color; the chip is the color of the marker.
    const ring = ringOf(canvasElement) as Element;
    await expect(ring.tagName).toBe('circle');
    await expect(Number(ring.getAttribute('r'))).toBeGreaterThan(
      Number(rotterdam.getAttribute('r'))
    );
    await expect(ring.getAttribute('cx')).toBe(rotterdam.getAttribute('cx'));
    const chip = tooltipOf(canvasElement)?.querySelector('span[aria-hidden]') as HTMLElement;
    await expect(toHex(getComputedStyle(chip).backgroundColor)).toBe(
      markerFill(canvasElement, 'rtm')
    );
    await userEvent.unhover(rotterdam);
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await expect(ringOf(canvasElement)).toBeNull();
    // A route: the title names both ends, the others fade, and its own line is wider.
    const line = routeEl(canvasElement, 2);
    const before = widthPx(canvasElement, 2);
    await userEvent.hover(routeGroup(canvasElement, 2).lastElementChild as Element);
    await waitFor(() => {
      const card = tooltipOf(canvasElement);
      expect(card?.textContent).toContain('Shanghai → Los Angeles');
      expect(card?.textContent).toContain('860');
    });
    await waitFor(() => expect(widthPx(canvasElement, 2)).toBeCloseTo(before * 1.5, 1));
    await expect(routeGroup(canvasElement, 2)).toHaveAttribute('opacity', '1');
    await expect(routeGroup(canvasElement, 0)).toHaveAttribute('opacity', '0.25');
    await expect(toHex(getComputedStyle(chipOf(canvasElement)).backgroundColor)).toBe(
      toHex(getComputedStyle(line).stroke)
    );
    await userEvent.unhover(routeGroup(canvasElement, 2).lastElementChild as Element);
    await waitFor(() => expect(routeGroup(canvasElement, 0)).toHaveAttribute('opacity', '1'));
    await expect(tooltipOf(canvasElement)).toBeNull();
  },
};

const chipOf = (root: HTMLElement) =>
  tooltipOf(root)?.querySelector('span[aria-hidden]') as HTMLElement;

/** `onMarkerSelect` gets the marker on a click, or on Enter or Space on the marker the keyboard is on; a country and a route are not markers. */
export const SelectableMarkers: Story = {
  args: { ...SHIPMENTS, markers: PORTS, routes: LANES, onMarkerSelect: fn() },
  render: (args) => {
    const [selected, setSelected] = useState<string>();
    return (
      <>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300" data-testid="selected">
          Selected: {selected ?? 'none'}
        </p>
        <WorldMap
          {...args}
          onMarkerSelect={(marker) => {
            args.onMarkerSelect?.(marker);
            setSelected(marker.label);
          }}
        />
      </>
    );
  },
};

export const SelectableMarkersChecks: Story = {
  ...SelectableMarkers,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, args }) => {
    const selected = () => canvasElement.querySelector('[data-testid="selected"]')?.textContent;
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    await userEvent.click(markerEl(canvasElement, 'rtm'));
    await waitFor(() => expect(selected()).toBe('Selected: Rotterdam'));
    await expect(args.onMarkerSelect).toHaveBeenLastCalledWith(PORTS[0]);
    // The 24px target selects too, and neither a route nor a country is a marker.
    await userEvent.click(targetOf(canvasElement, 'sha'));
    await waitFor(() => expect(selected()).toBe('Selected: Shanghai'));
    await userEvent.click(routeGroup(canvasElement, 3).lastElementChild as Element);
    await userEvent.click(countryOf(canvasElement, 'US') as Element);
    await expect(args.onMarkerSelect).toHaveBeenCalledTimes(2);
    // The keyboard: the markers come after the countries, Enter and Space select.
    await userEvent.keyboard('{Home}{PageDown}');
    await waitFor(() => expect(statusOf(canvasElement)).toBe('Rotterdam, shipments: 6.2k'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(selected()).toBe('Selected: Rotterdam'));
    await userEvent.keyboard('{ArrowRight} ');
    await waitFor(() => expect(selected()).toBe('Selected: Shanghai'));
    await expect(args.onMarkerSelect).toHaveBeenCalledTimes(4);
    // On a route, Enter does nothing.
    await userEvent.keyboard('{PageDown}{Enter}');
    await waitFor(() => expect(statusOf(canvasElement)).toContain('shipments: 1.2k'));
    await expect(args.onMarkerSelect).toHaveBeenCalledTimes(4);
    await userEvent.unhover(countryOf(canvasElement, 'US') as Element);
    await userEvent.tab();
  },
};

/** Without `onMarkerSelect` the markers only show: no pointer cursor, and Enter does nothing. */
export const MarkersWithoutSelectionDoNothingOnClick: Story = {
  ...Markers,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    await expect(
      getComputedStyle(markerEl(canvasElement, 'rtm').parentElement as Element).cursor
    ).not.toBe('pointer');
  },
};

/**
 * One tab stop for the whole map: the countries that have a value, then the
 * markers, then the routes, each largest first. The arrows walk the list,
 * Home and End go to its ends and Page Up and Page Down to the first stop of
 * the previous and the next group. A marker with no value comes last in its group.
 */
export const KeyboardWalksTheWholeMap: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: { US: 10, FR: 5 },
    label: 'shipments',
    formatValue: String,
    markers: [
      { id: 'a', label: 'Alpha', coordinates: [2, 48], value: 30 },
      { id: 'b', label: 'Bravo', coordinates: [-74, 40], value: 20 },
      { id: 'c', label: 'Charlie', coordinates: [139, 35] },
    ],
    routes: [
      { from: 'a', to: 'b', value: 4 },
      { from: 'b', to: 'c', value: 9 },
      { from: 'c', to: [151, -33] },
    ],
    onMarkerSelect: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(mapOf(canvasElement)).toHaveAttribute('tabindex', '0'));
    await expect(canvasElement.querySelectorAll('[tabindex]:not([tabindex="-1"])')).toHaveLength(1);
    const on = (announced: string) =>
      waitFor(() => {
        expect(statusOf(canvasElement)).toBe(announced);
        expect(tooltipOf(canvasElement)).not.toBeNull();
      });
    await userEvent.tab();
    await on('United States of America, shipments: 10');
    // A country is outlined, a marker ringed, and a route stands out by fading the others.
    await expect(ringOf(canvasElement)?.tagName).toBe('path');
    const walk: [key: string, announced: string][] = [
      ['{ArrowRight}', 'France, shipments: 5'],
      ['{ArrowRight}', 'Alpha, shipments: 30'],
      ['{ArrowDown}', 'Bravo, shipments: 20'],
      ['{ArrowRight}', 'Charlie'],
      ['{ArrowRight}', 'Bravo to Charlie, shipments: 9'],
      ['{ArrowRight}', 'Alpha to Bravo, shipments: 4'],
      ['{ArrowRight}', 'Charlie to 33.0°S, 151.0°E'],
      ['{ArrowRight}', 'Charlie to 33.0°S, 151.0°E'],
      ['{ArrowLeft}', 'Alpha to Bravo, shipments: 4'],
      ['{Home}', 'United States of America, shipments: 10'],
      ['{End}', 'Charlie to 33.0°S, 151.0°E'],
      ['{PageUp}', 'Alpha, shipments: 30'],
      ['{PageUp}', 'United States of America, shipments: 10'],
      ['{PageUp}', 'United States of America, shipments: 10'],
      ['{PageDown}', 'Alpha, shipments: 30'],
      ['{PageDown}', 'Bravo to Charlie, shipments: 9'],
      ['{PageDown}', 'Bravo to Charlie, shipments: 9'],
    ];
    for (const [key, announced] of walk) {
      await userEvent.keyboard(key);
      await on(announced);
    }
    // On the first route: no ring, its line is the one in full color.
    await expect(ringOf(canvasElement)).toBeNull();
    await expect(routeGroup(canvasElement, 1)).toHaveAttribute('opacity', '1');
    await expect(routeGroup(canvasElement, 0)).toHaveAttribute('opacity', '0.25');
    // The card of a valueless marker names it and nothing else.
    await userEvent.keyboard('{ArrowLeft}');
    await on('Charlie');
    await expect(ringOf(canvasElement)?.tagName).toBe('circle');
    await expect(tooltipOf(canvasElement)?.textContent).toBe('Charlie');
    await expect(tooltipOf(canvasElement)?.querySelector('ul')).toBeNull();
    // Enter and Space select a marker, and do nothing on a route.
    await userEvent.keyboard('{Enter}');
    await expect(args.onMarkerSelect).toHaveBeenLastCalledWith(args.markers?.[2]);
    await userEvent.keyboard('{ArrowRight}{Enter} ');
    await expect(args.onMarkerSelect).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    await waitFor(() => expect(tooltipOf(canvasElement)).toBeNull());
    await expect(ringOf(canvasElement)).toBeNull();
  },
};

/** The hidden tables follow the one of the countries: markers and routes, largest first, with the formatted values. */
export const HiddenTablesListMarkersAndRoutes: Story = {
  ...MarkersAndRoutes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-world-table="routes"]')).not.toBeNull()
    );
    const tables = [...canvasElement.querySelectorAll('[data-world-table]')];
    await expect(tables.map((table) => table.querySelector('caption')?.textContent)).toEqual([
      'World map, shipments by country, from 600 to 11.8k, 12 markers, 8 routes',
      'Markers',
      'Routes',
    ]);
    const markers = tableRows(canvasElement, 'markers');
    await expect(markers).toHaveLength(12);
    await expect(markers.slice(0, 3)).toEqual([
      ['Rotterdam', '6.2k'],
      ['Shanghai', '5.6k'],
      ['Singapore', '4.1k'],
    ]);
    const routes = tableRows(canvasElement, 'routes');
    await expect(routes.slice(0, 3)).toEqual([
      ['Shanghai to Rotterdam', '1.2k'],
      ['Singapore to Rotterdam', '980'],
      ['Shanghai to Los Angeles', '860'],
    ]);
    await expect(
      [...canvasElement.querySelectorAll('[data-world-table="markers"] thead th')].map(
        (cell) => cell.textContent
      )
    ).toEqual(['Marker', 'shipments']);
    await expect(
      [...canvasElement.querySelectorAll('[data-world-table="routes"] thead th')].map(
        (cell) => cell.textContent
      )
    ).toEqual(['Route', 'shipments']);
    await expect(tableRows(canvasElement, '')).toHaveLength(Object.keys(DELIVERED).length);
  },
};

/**
 * A neutral map, with no value for the countries: the markers and the routes
 * carry the data, and the legend has their keys alone. `intent` colors a
 * marker with the status colors of the theme, whatever its size.
 */
export const MarkersByIntent: Story = {
  args: {
    data: {},
    label: 'shipments',
    markers: [
      { id: 'rtm', label: 'Rotterdam', coordinates: [4.48, 51.92], value: 6240, intent: 'success' },
      {
        id: 'sha',
        label: 'Shanghai',
        coordinates: [121.47, 31.23],
        value: 5600,
        intent: 'success',
      },
      { id: 'dxb', label: 'Dubai', coordinates: [55.27, 25.2], value: 2100, intent: 'warning' },
      {
        id: 'lax',
        label: 'Los Angeles',
        coordinates: [-118.24, 34.05],
        value: 3300,
        intent: 'danger',
      },
      {
        id: 'jnb',
        label: 'Johannesburg',
        coordinates: [28.05, -26.2],
        value: 300,
        intent: 'neutral',
      },
      { id: 'syd', label: 'Sydney', coordinates: [151.21, -33.87], value: 900 },
    ],
    routes: [{ from: 'sha', to: 'lax', value: 860 }],
  },
};

export const MarkersByIntentChecks: Story = {
  ...MarkersByIntent,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(6));
    const colors: Record<string, string> = {
      rtm: INTENT_COLORS.success,
      sha: INTENT_COLORS.success,
      dxb: INTENT_COLORS.warning,
      lax: INTENT_COLORS.danger,
      jnb: INTENT_COLORS.neutral,
      syd: SERIES[1],
    };
    for (const [id, color] of Object.entries(colors)) {
      await expect(markerFill(canvasElement, id), id).toBe(resolved(color));
    }
    // The size still follows the value.
    await waitFor(() => expect(radiusPx(canvasElement, 'rtm')).toBeGreaterThan(5.9));
    await expect(radiusPx(canvasElement, 'dxb')).toBeLessThan(radiusPx(canvasElement, 'rtm'));
    // No country has a value: no steps, no table of countries, the keys alone.
    await expect(legendTexts(canvasElement)).toEqual([]);
    await expect(canvasElement.querySelector('[data-world-legend]')).toBeNull();
    await expect(canvasElement.querySelector('[data-world-table=""]')).toBeNull();
    await expect(canvasElement.querySelector('[data-world-size-key]')).not.toBeNull();
    await expect(mapOf(canvasElement)).toHaveAttribute(
      'aria-label',
      'World map, 6 markers, 1 route'
    );
    // The chip of the card is the color of the marker.
    await userEvent.hover(markerEl(canvasElement, 'lax'));
    await waitFor(() => expect(tooltipOf(canvasElement)).not.toBeNull());
    await expect(toHex(getComputedStyle(chipOf(canvasElement)).backgroundColor)).toBe(
      resolved(INTENT_COLORS.danger)
    );
    await userEvent.unhover(markerEl(canvasElement, 'lax'));
  },
};

/** A marker with no value is a dot of the smallest size, and its card gives the name alone. */
export const MarkersWithoutValue: Story = {
  args: {
    data: {},
    markers: PORTS.map(({ id, label, coordinates }) => ({ id, label, coordinates })).slice(0, 4),
  },
};

export const MarkersWithoutValueChecks: Story = {
  ...MarkersWithoutValue,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(4));
    for (const id of ['rtm', 'sha', 'sin', 'lax']) {
      await waitFor(() => expect(radiusPx(canvasElement, id), id).toBeCloseTo(3, 1));
    }
    await userEvent.hover(markerEl(canvasElement, 'rtm'));
    await waitFor(() => expect(tooltipOf(canvasElement)?.textContent).toBe('Rotterdam'));
    await userEvent.unhover(markerEl(canvasElement, 'rtm'));
    // No size key without a value, and a table of names alone.
    await expect(canvasElement.querySelector('[data-world-size-key]')).toBeNull();
    await expect(canvasElement.querySelector('[data-world-keys]')).toBeNull();
    await expect(tableRows(canvasElement, 'markers')).toEqual([
      ['Los Angeles'],
      ['Rotterdam'],
      ['Shanghai'],
      ['Singapore'],
    ]);
  },
};

/**
 * In a box of 375px the bubbles keep their size in screen pixels (6.25px for
 * the largest, a sixtieth of the width of the map), not in the units of the
 * drawing, where they would be a third of that; the lines too. The legend
 * wraps.
 */
export const MarkersOnNarrowScreen: Story = {
  tags: ['!autodocs'],
  args: { ...SHIPMENTS, markers: PORTS, routes: LANES },
  render: (args) => (
    <div data-testid="box" style={{ width: 375, maxWidth: '100%' }}>
      <WorldMap {...args} />
    </div>
  ),
};

export const MarkersOnNarrowScreenChecks: Story = {
  ...MarkersOnNarrowScreen,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-testid="box"]') as HTMLElement;
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    // A sixtieth of 375px, not of the 960 units of the drawing (which would be a third of it).
    await waitFor(() => expect(radiusPx(canvasElement, 'rtm')).toBeCloseTo(375 / 60, 1));
    await expect(radiusPx(canvasElement, 'jnb')).toBeCloseTo(3, 1);
    await expect(widthPx(canvasElement, 0)).toBeCloseTo(3.6, 1);
    // Every marker has a target of 24px at least, the bubbles that are smaller included.
    for (const marker of markerEls(canvasElement)) {
      const id = marker.dataset.marker as string;
      const target = targetOf(canvasElement, id).getBoundingClientRect();
      await expect(target.width, id).toBeGreaterThanOrEqual(23.9);
      await expect(target.height, id).toBeGreaterThanOrEqual(23.9);
    }
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    const keys = canvasElement.querySelector('[data-world-keys]') as HTMLElement;
    await expect(keys.getBoundingClientRect().right).toBeLessThanOrEqual(
      box.getBoundingClientRect().right + 1
    );
  },
};

/** On a 1366px screen the bubble of the largest value is 16px, the most: the map gets wide, the bubbles do not. */
export const MarkersOnWideScreen: Story = {
  tags: ['!autodocs'],
  args: { ...SHIPMENTS, markers: PORTS, routes: LANES },
  globals: wideViewport,
};

export const MarkersOnWideScreenChecks: Story = {
  ...MarkersOnWideScreen,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    await waitFor(() => expect(mapScale(canvasElement) * 960).toBeGreaterThan(900));
    await waitFor(() => expect(radiusPx(canvasElement, 'rtm')).toBeCloseTo(16, 1));
    await expect(radiusPx(canvasElement, 'sha')).toBeCloseTo(16 * Math.sqrt(5600 / 6240), 1);
    await expect(widthPx(canvasElement, 0)).toBeCloseTo(3.6, 1);
  },
};

/** What the map was before markers and routes: no new element, and the legend is the list of steps itself. */
export const WithoutMarkersRendersAsBefore: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(valued(canvasElement).length).toBeGreaterThan(0));
    await expect(canvasElement.querySelector('circle')).toBeNull();
    await expect(canvasElement.querySelector('[data-route]')).toBeNull();
    await expect(canvasElement.querySelector('[data-world-keys]')).toBeNull();
    await expect(canvasElement.querySelectorAll('[data-world-table]')).toHaveLength(1);
    const root = canvasElement.querySelector('[data-world-map]') as HTMLElement;
    await expect(canvasElement.querySelector('[data-world-legend]')?.parentElement).toBe(root);
    // Every country, and nothing else, is in the SVG.
    await expect(canvasElement.querySelectorAll('svg > *').length).toBe(
      canvasElement.querySelectorAll('svg > path').length
    );
    await expect(mapOf(canvasElement)).toHaveAttribute(
      'aria-label',
      'World map, visitors by country, from 700 to 48.2k'
    );
  },
};

/** A marker that is not on the globe, a second marker with the same `id`, and a route that has nothing to draw, are left out. */
export const LeavesOutWhatItCannotDraw: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: {},
    markers: [
      { id: 'a', label: 'Alpha', coordinates: [2, 48], value: 5 },
      { id: 'a', label: 'Again', coordinates: [10, 10], value: 9 },
      { id: 'nan', label: 'Not a number', coordinates: [Number.NaN, 10] },
      { id: 'pole', label: 'Past the pole', coordinates: [0, 95] },
      { id: 'b', label: 'Bravo', coordinates: [-74, 40], value: Number.NaN },
    ],
    routes: [
      { from: 'a', to: 'b', value: 3 },
      { from: 'a', to: 'zzz' },
      { from: 'a', to: [2, 48] },
      { from: 'nan', to: 'b' },
      { from: [0, 120], to: 'b' },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(markerEls(canvasElement).map((marker) => marker.dataset.marker)).toEqual(['a', 'b'])
    );
    await expect(canvasElement.querySelectorAll('path[data-route]')).toHaveLength(1);
    await expect(tableRows(canvasElement, 'markers')).toEqual([
      ['Alpha', '5'],
      ['Bravo', ''],
    ]);
    await expect(tableRows(canvasElement, 'routes')).toEqual([['Alpha to Bravo', '3']]);
    await expect(mapOf(canvasElement)).toHaveAttribute(
      'aria-label',
      'World map, 2 markers, 1 route'
    );
  },
};

/** The marker labels, the route labels and the values are React text: markup in them shows as written. */
export const HtmlInMarkerLabelsRendersAsText: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    data: {},
    label: HOSTILE,
    formatValue: (value) => `${value} ${HOSTILE}`,
    markers: [
      { id: 'a', label: HOSTILE, coordinates: [2, 48], value: 40 },
      { id: 'b', label: 'Bravo', coordinates: [-74, 40], value: 20 },
    ],
    routes: [
      { from: 'a', to: 'b', value: 7 },
      { from: 'b', to: 'a', value: 5, label: HOSTILE },
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(2));
    await expectNoInjectedImage(canvasElement);
    await userEvent.hover(markerEl(canvasElement, 'a'));
    await waitFor(() => {
      const card = tooltipOf(canvasElement)?.textContent;
      expect(card).toContain(HOSTILE);
      expect(card).toContain(`40 ${HOSTILE}`);
    });
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(markerEl(canvasElement, 'a'));
    await userEvent.hover(routeGroup(canvasElement, 0).lastElementChild as Element);
    await waitFor(() =>
      expect(tooltipOf(canvasElement)?.textContent).toContain(`${HOSTILE} → Bravo`)
    );
    await expectNoInjectedImage(canvasElement);
    await userEvent.unhover(routeGroup(canvasElement, 0).lastElementChild as Element);
    // The announcements and the tables.
    await userEvent.tab();
    await waitFor(() =>
      expect(statusOf(canvasElement)).toBe(`${HOSTILE}, ${HOSTILE}: 40 ${HOSTILE}`)
    );
    await expectNoInjectedImage(canvasElement);
    await expect(tableRows(canvasElement, 'markers')[0]).toEqual([HOSTILE, `40 ${HOSTILE}`]);
    await expect(tableRows(canvasElement, 'routes').map((row) => row[0])).toEqual([
      `${HOSTILE} to Bravo`,
      HOSTILE,
    ]);
    await expectNoInjectedImage(canvasElement);
    await userEvent.tab();
  },
};

/**
 * The markers and the routes are CSS variables: a theme or accent switch
 * repaints them with no redraw. They are the second series color, which the
 * accent skips, so no step of the countries has it, and they stay 1.5:1 or
 * more apart from the card in every theme.
 */
export const MarkersRepaintWithThemeAndAccent: Story = {
  ...MarkersAndRoutes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(markerEls(canvasElement)).toHaveLength(PORTS.length));
    const html = document.documentElement;
    const panel = () => toHex(themeColor('--color-bg-panel'));
    for (const theme of ['', 'sand', 'dark', 'deep-blue']) {
      const restore = switchTheme(theme);
      try {
        for (const accent of ['blue', 'teal', 'violet', 'amber']) {
          html.setAttribute('data-accent', accent);
          await waitFor(() =>
            expect(markerFill(canvasElement, 'rtm'), `${theme || 'light'} ${accent}`).toBe(
              toHex(themeColor('--color-chart-2'))
            )
          );
          const where = `${theme || 'light'} ${accent}`;
          const marker = markerFill(canvasElement, 'rtm');
          await expect(
            SEQUENTIAL.map((step) => resolved(step)),
            where
          ).not.toContain(marker);
          await expect(contrastRatio(marker, panel()), where).toBeGreaterThanOrEqual(1.5);
          await expect(toHex(getComputedStyle(routeEl(canvasElement, 0)).stroke), where).toBe(
            marker
          );
          await expect(toHex(getComputedStyle(markerEl(canvasElement, 'rtm')).stroke), where).toBe(
            panel()
          );
        }
      } finally {
        html.removeAttribute('data-accent');
        restore();
      }
    }
  },
};

/** The size key and the width key follow the text size setting. */
export const MarkerKeysFollowTextSize: Story = {
  ...MarkersAndRoutes,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-text-size');
    const keySize = () => px(canvasElement.querySelector('[data-world-width-key] span'));
    await waitFor(() => expect(keySize()).toBe(11));
    try {
      html.setAttribute('data-text-size', 'lg');
      await waitFor(() => expect(keySize()).toBeGreaterThan(11));
    } finally {
      if (previous === null) html.removeAttribute('data-text-size');
      else html.setAttribute('data-text-size', previous);
    }
  },
};
