import { describe, expect, it } from 'vitest';
import { hostOf, isHttpUrl } from './httpUrl';

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
