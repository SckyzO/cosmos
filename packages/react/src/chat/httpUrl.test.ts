import { describe, expect, it } from 'vitest';
import { hostOf, isHttpUrl, trimTrailingPunctuation } from './httpUrl';

describe('isHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('https://example.com/a?b=1#c')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
  });

  it('refuses every other scheme and anything that is not an absolute URL', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,<b>x</b>',
      'file:///etc/passwd',
      'ftp://example.com',
      '/docs/page',
      '//example.com',
      'example.com',
      '',
    ]) {
      expect(isHttpUrl(value), value).toBe(false);
    }
  });

  it('refuses a URL with whitespace or markup in it', () => {
    expect(isHttpUrl('https://example.com/a b')).toBe(false);
    expect(isHttpUrl('https://example.com/"onmouseover="x')).toBe(false);
    expect(isHttpUrl(' https://example.com')).toBe(false);
  });

  it('refuses a scheme hidden after another one', () => {
    expect(isHttpUrl('javascript:alert(1)//https://example.com')).toBe(false);
  });
});

describe('hostOf', () => {
  it('gives the host, port included', () => {
    expect(hostOf('https://docs.example.com/a/b')).toBe('docs.example.com');
    expect(hostOf('http://localhost:6006/x')).toBe('localhost:6006');
  });

  it('gives nothing for a URL that is not http(s)', () => {
    expect(hostOf('javascript:alert(1)')).toBeUndefined();
    expect(hostOf('/relative')).toBeUndefined();
    expect(hostOf('https://')).toBeUndefined();
  });
});

describe('trimTrailingPunctuation', () => {
  it('drops the punctuation that ends a sentence, and only at the end', () => {
    expect(trimTrailingPunctuation('https://a.example/b.')).toBe('https://a.example/b');
    expect(trimTrailingPunctuation('https://a.example/b?!).')).toBe('https://a.example/b');
    expect(trimTrailingPunctuation('https://a.example/(b)')).toBe('https://a.example/(b');
    expect(trimTrailingPunctuation('https://a.example/b?c=1')).toBe('https://a.example/b?c=1');
    expect(trimTrailingPunctuation('https://a.example/b')).toBe('https://a.example/b');
  });

  it('takes linear time on a long run of punctuation inside the URL', () => {
    // A run of "!" that is not at the end made the old regex backtrack quadratically: a message
    // writer could freeze every reader's tab.
    const url = `https://a.example/${'!'.repeat(30_000)}x`;
    const start = performance.now();
    expect(trimTrailingPunctuation(url)).toBe(url);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
