/**
 * The name of a language in that language, as a list of languages writes it: `languageName('fr')`
 * is "Français", `languageName('de')` "Deutsch", `languageName('pt-BR')` "Português (Brasil)",
 * `languageName('ar')` "العربية". The browser knows the names (`Intl.DisplayNames`); the languages
 * that write them in lower case ("français", "español") get their first letter in upper case, by
 * the rules of that language. Fill a `Select` or a `SegmentedControl` of languages with it, so they
 * name the languages as `LanguageMenu` does.
 *
 * `code` is a BCP 47 language tag (`en`, `fr`, `pt-BR`, `zh-Hans`). A malformed one throws the
 * browser's `RangeError`; a well-formed tag the browser has no name for comes back as it is.
 */
export const languageName = (code: string): string => {
  // `fallback: 'none'`: with no name for the code, `of` says so, and the code is not upper-cased.
  const name = new Intl.DisplayNames([code], { type: 'language', fallback: 'none' }).of(code);
  if (!name) return code;
  const [first = '', ...rest] = name;
  return first.toLocaleUpperCase(code) + rest.join('');
};
