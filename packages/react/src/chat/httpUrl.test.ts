import { describe, expect, it } from 'vitest';
import { hostOf, isHttpUrl, isSafeLinkUrl, trimTrailingPunctuation } from './httpUrl';

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

describe('isSafeLinkUrl', () => {
  it('accepts http(s), mailto and relative URLs', () => {
    for (const value of [
      'https://example.com/a?b=1#c',
      'http://example.com',
      'mailto:ops@example.com',
      'MAILTO:ops@example.com?subject=Hi',
      '/docs/page',
      './page',
      '../page?x=1',
      '#section',
      '?tab=2',
      '/',
    ]) {
      expect(isSafeLinkUrl(value), value).toBe(true);
    }
  });

  it('refuses every other scheme, however it is written', () => {
    for (const value of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<b>x</b>',
      'vbscript:x',
      'file:///etc/passwd',
      'ftp://example.com',
      'tel:+33100000000',
      'mailto:',
    ]) {
      expect(isSafeLinkUrl(value), value).toBe(false);
    }
  });

  it('refuses a protocol-relative URL, a backslash and anything with whitespace or markup', () => {
    for (const value of [
      '//example.com',
      '/\\example.com',
      '/a b',
      '/a"onmouseover="x',
      '/a<b>',
      'example.com',
      '',
    ]) {
      expect(isSafeLinkUrl(value), value).toBe(false);
    }
  });
});
