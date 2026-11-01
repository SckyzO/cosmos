import { describe, expect, it } from 'vitest';
import { normalizeImageUrl } from './imageUrl';

describe('normalizeImageUrl', () => {
  it('keeps an http(s) URL as typed, minus the spaces around it', () => {
    expect(normalizeImageUrl('  https://example.com/a.png?w=2  ')).toBe(
      'https://example.com/a.png?w=2'
    );
    expect(normalizeImageUrl('http://cdn.example.com/b.jpg')).toBe('http://cdn.example.com/b.jpg');
  });

  it('refuses everything that is not an http(s) URL', () => {
    for (const value of [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      'data:image/png;base64,AAAA',
      'data:image/svg+xml,<svg onload=alert(1)>',
      'blob:https://example.com/1234',
      'file:///etc/passwd',
      'ftp://example.com/a.png',
      'mailto:ops@example.com',
      '/uploads/a.png',
      './a.png',
      '//example.com/a.png',
      'example.com/a.png',
    ]) {
      expect(normalizeImageUrl(value), value).toBeUndefined();
    }
  });

  it('refuses text that is not a URL', () => {
    for (const value of ['', '   ', 'a picture', 'https://', 'https://a b.com/c.png']) {
      expect(normalizeImageUrl(value), value).toBeUndefined();
    }
  });
});
