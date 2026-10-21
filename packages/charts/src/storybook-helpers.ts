import { expect } from 'storybook/test';

// Series names, categories and labels are data, not markup. ApexCharts writes
// legends and tooltips with innerHTML, so the wrappers escape what goes there.
// Each wrapper's HtmlInLabelsRendersAsText story feeds it this string.
export const HOSTILE = '<img src=x onerror="window.__cosmosChartInjected=1">';

export const expectNoInjectedImage = async (root: HTMLElement) => {
  await expect(root.querySelector('img')).toBeNull();
  await expect(
    (window as { __cosmosChartInjected?: number }).__cosmosChartInjected
  ).toBeUndefined();
};

export const legendTexts = (root: HTMLElement) =>
  [...root.querySelectorAll('.apexcharts-legend-text')].map((el) => el.textContent);

// ApexCharts picks the hovered point from the pointer coordinates.
export const hover = (el: Element, xRatio = 0.5) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: left + width * xRatio,
      clientY: top + height / 2,
    })
  );
};
