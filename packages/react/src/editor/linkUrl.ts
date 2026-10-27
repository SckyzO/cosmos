import { isSafeLinkUrl } from '../chat/httpUrl';

// "docs.example.com/page?x=1": a host with a dot and a letters-only ending, then an optional path.
const BARE_HOST = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i;
const EMAIL = /^[^\s@<>"'\\:/]+@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i;

/**
 * The URL a link field's text stands for, or `undefined` when it can't be a link. Text that
 * already is an allowed URL (http(s), mailto, relative) stays as typed; a bare host
 * ("example.com") gets `https://` and an address ("ops@example.com") `mailto:`. Anything else,
 * `javascript:` and `data:` first, is refused: the rule is `isSafeLinkUrl`, the one every link of
 * the editor goes through.
 */
export const normalizeLinkUrl = (input: string): string | undefined => {
  const value = input.trim();
  if (isSafeLinkUrl(value)) return value;
  if (EMAIL.test(value)) return `mailto:${value}`;
  if (BARE_HOST.test(value)) return `https://${value}`;
  return undefined;
};
