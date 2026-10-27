import { describe, expect, it } from 'vitest';
import { normalizeLinkUrl } from './linkUrl';

describe('normalizeLinkUrl', () => {
  it('keeps an allowed URL as typed, minus the spaces around it', () => {
    expect(normalizeLinkUrl('  https://example.com/a?b=1  ')).toBe('https://example.com/a?b=1');
    expect(normalizeLinkUrl('mailto:ops@example.com')).toBe('mailto:ops@example.com');
    expect(normalizeLinkUrl('/docs/page#top')).toBe('/docs/page#top');
  });

  it('gives a bare host https:// and an address mailto:', () => {
    expect(normalizeLinkUrl('example.com')).toBe('https://example.com');
    expect(normalizeLinkUrl('docs.example.com/a/b?c=1')).toBe('https://docs.example.com/a/b?c=1');
    expect(normalizeLinkUrl('ops@example.com')).toBe('mailto:ops@example.com');
  });

  it('refuses a script, a data URL and any other scheme', () => {
    for (const value of [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(document.domain)',
      'javascript:a@b.co',
      'data:text/html,<b>x</b>',
      'vbscript:x',
      'file:///etc/passwd',
      'ftp://example.com',
      'tel:+33100000000',
    ]) {
      expect(normalizeLinkUrl(value), value).toBeUndefined();
    }
  });

  it('refuses text that is not a URL', () => {
    for (const value of ['', '   ', 'hello', 'a b.com', 'https://', '//example.com', 'x@y']) {
      expect(normalizeLinkUrl(value), value).toBeUndefined();
    }
  });
});
