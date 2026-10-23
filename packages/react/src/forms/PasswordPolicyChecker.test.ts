import { describe, expect, it } from 'vitest';
import { defaultPasswordRules } from './PasswordPolicyChecker';

const passing = (pwd: string) =>
  defaultPasswordRules(pwd)
    .filter((r) => r.ok)
    .map((r) => r.label);

describe('defaultPasswordRules', () => {
  it('lists the five rules in a fixed order', () => {
    expect(defaultPasswordRules('').map((r) => r.label)).toEqual([
      'At least 12 characters',
      'One uppercase letter',
      'One lowercase letter',
      'One number',
      'One symbol',
    ]);
  });

  it('passes none of them for an empty password', () => {
    expect(passing('')).toEqual([]);
  });

  it('passes all of them for a strong password', () => {
    expect(passing('Correct-Horse-9')).toHaveLength(5);
  });

  it('checks the length at exactly 12 characters', () => {
    expect(passing('a'.repeat(11))).not.toContain('At least 12 characters');
    expect(passing('a'.repeat(12))).toContain('At least 12 characters');
  });

  it('checks each character class on its own', () => {
    expect(passing('A')).toEqual(['One uppercase letter']);
    expect(passing('a')).toEqual(['One lowercase letter']);
    expect(passing('1')).toEqual(['One number']);
    expect(passing('!')).toEqual(['One symbol']);
  });
});
