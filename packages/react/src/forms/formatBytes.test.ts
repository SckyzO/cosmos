import { describe, expect, it } from 'vitest';
import { formatBytes } from './formatBytes';

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

describe('formatBytes', () => {
  it('shows whole bytes below 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('switches to KB at 1024 bytes, with one decimal', () => {
    expect(formatBytes(KB)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(200 * KB)).toBe('200.0 KB');
  });

  it('switches to MB at 1024 KB, with one decimal', () => {
    expect(formatBytes(MB)).toBe('1.0 MB');
    expect(formatBytes(2.5 * MB)).toBe('2.5 MB');
    expect(formatBytes(10 * MB)).toBe('10.0 MB');
  });

  it('switches to GB at 1024 MB, with two decimals', () => {
    expect(formatBytes(GB)).toBe('1.00 GB');
    expect(formatBytes(1.25 * GB)).toBe('1.25 GB');
    expect(formatBytes(3 * 1024 * GB)).toBe('3072.00 GB');
  });

  it('moves up a unit when rounding reaches 1024', () => {
    // 1023.95 KB would print as 1024.0 KB.
    expect(formatBytes(MB - 1)).toBe('1.0 MB');
    expect(formatBytes(Math.ceil(1023.95 * KB))).toBe('1.0 MB');
    expect(formatBytes(Math.floor(1023.94 * KB))).toBe('1023.9 KB');
    expect(formatBytes(GB - 1)).toBe('1.00 GB');
  });
});
