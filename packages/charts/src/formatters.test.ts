import { describe, expect, it } from 'vitest';
import { seriesTitle } from './formatters';

describe('seriesTitle', () => {
  it('is the series name followed by a colon and a space', () => {
    expect(seriesTitle('CPU')).toBe('CPU: ');
  });

  it('escapes the name: the tooltip title is HTML', () => {
    expect(seriesTitle('<b>CPU</b>')).toBe('&lt;b&gt;CPU&lt;/b&gt;: ');
  });
});
