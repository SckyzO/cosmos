import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape';

describe('escapeHtml', () => {
  it('escapes the five characters that can open markup or leave an attribute', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('neutralizes a script tag and an attribute breakout', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
    expect(escapeHtml(`" onmouseover='alert(1)`)).toBe('&quot; onmouseover=&#39;alert(1)');
  });

  it('escapes the ampersand first, so an escape sequence is not left half-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves plain text, unicode and an empty string alone', () => {
    expect(escapeHtml('Série n°1 – 50 %')).toBe('Série n°1 – 50 %');
    expect(escapeHtml('')).toBe('');
  });

  it('turns any non-string value into text first', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
    expect(escapeHtml(undefined)).toBe('undefined');
    expect(escapeHtml({ toString: () => '<b>' })).toBe('&lt;b&gt;');
  });
});
