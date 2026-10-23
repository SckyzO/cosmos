import { describe, expect, it } from 'vitest';
import { tooltipHtml, type TooltipContent } from './tooltip';

const GROUP =
  '<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex">';

describe('tooltipHtml', () => {
  it('renders nothing for an empty content', () => {
    expect(tooltipHtml({ rows: [] })).toBe('');
  });

  it('renders the title in the ApexCharts title style', () => {
    expect(tooltipHtml({ title: 'Mon', rows: [] })).toBe(
      '<div class="apexcharts-tooltip-title">Mon</div>'
    );
  });

  it('renders the series as a colored dot and its name', () => {
    expect(tooltipHtml({ series: { name: 'CPU', color: '#465fff' }, rows: [] })).toBe(
      `${GROUP}<span class="apexcharts-tooltip-marker" style="background-color:#465fff;border-radius:50%"></span>` +
        '<span class="apexcharts-tooltip-text-y-label">CPU</span></div>'
    );
  });

  it('renders one line per row, label then value, in order', () => {
    expect(
      tooltipHtml({
        rows: [
          ['Min', '1'],
          ['Max', '9'],
        ],
      })
    ).toBe(
      `${GROUP}<span class="apexcharts-tooltip-text-y-label">Min:</span>` +
        '<span class="apexcharts-tooltip-text-y-value">1</span></div>' +
        `${GROUP}<span class="apexcharts-tooltip-text-y-label">Max:</span>` +
        '<span class="apexcharts-tooltip-text-y-value">9</span></div>'
    );
  });

  it('puts the title first, then the series, then the rows', () => {
    const html = tooltipHtml({
      title: 'Mon',
      series: { name: 'CPU', color: '#465fff' },
      rows: [['Max', '9']],
    });
    expect(html.startsWith('<div class="apexcharts-tooltip-title">Mon</div>')).toBe(true);
    expect(html.indexOf('tooltip-title')).toBeLessThan(html.indexOf('tooltip-marker'));
    expect(html.indexOf('tooltip-marker')).toBeLessThan(html.indexOf('tooltip-text-y-value'));
  });

  describe('escaping (ApexCharts writes the markup with innerHTML)', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const escaped = '&lt;img src=x onerror=alert(1)&gt;';

    const cases: [string, TooltipContent][] = [
      ['the title', { title: payload, rows: [] }],
      ['the series name', { series: { name: payload, color: '#fff' }, rows: [] }],
      ['a row label', { rows: [[payload, '1']] }],
      ['a row value', { rows: [['Max', payload]] }],
    ];

    it.each(cases)('escapes %s', (_where, content) => {
      const html = tooltipHtml(content);
      expect(html).toContain(escaped);
      expect(html).not.toContain('<img');
    });

    it('escapes the series color, so it cannot leave the style attribute', () => {
      const html = tooltipHtml({
        series: { name: 'CPU', color: 'red" onmouseover="alert(1)' },
        rows: [],
      });
      expect(html).toContain('background-color:red&quot; onmouseover=&quot;alert(1);');
      expect(html).not.toContain('" onmouseover=');
    });
  });
});
