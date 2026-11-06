import { describe, expect, it } from 'vitest';
import { languageName } from './languageName';

describe('languageName', () => {
  it('names each language in that language', () => {
    expect(languageName('en')).toBe('English');
    expect(languageName('de')).toBe('Deutsch');
    expect(languageName('ja')).toBe('日本語');
    expect(languageName('ar')).toBe('العربية');
  });

  it('puts the first letter of a name written in lower case in upper case', () => {
    expect(languageName('fr')).toBe('Français');
    expect(languageName('es')).toBe('Español');
    expect(languageName('uk')).toBe('Українська');
    expect(languageName('pt-BR')).toBe('Português (Brasil)');
  });

  it('gives back a well-formed code it has no name for', () => {
    expect(languageName('qaa')).toBe('qaa');
  });

  it('throws on a malformed code', () => {
    expect(() => languageName('english language')).toThrow(RangeError);
  });
});
