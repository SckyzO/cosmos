import { describe, expect, it } from 'vitest';
import { percent, seriesTitle } from './formatters';

describe('seriesTitle', () => {
  it('is the series name followed by a colon and a space', () => {
    expect(seriesTitle('CPU')).toBe('CPU: ');
  });

  it('escapes the name: the tooltip title is HTML', () => {
    expect(seriesTitle('<b>CPU</b>')).toBe('&lt;b&gt;CPU&lt;/b&gt;: ');
  });
});

describe('percent', () => {
  it('appends a percent sign to the value', () => {
    expect(percent(0)).toBe('0%');
    expect(percent(42)).toBe('42%');
    expect(percent(99.5)).toBe('99.5%');
    expect(percent(-3)).toBe('-3%');
  });
});
