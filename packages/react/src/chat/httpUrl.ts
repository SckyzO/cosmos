// http(s) URLs only: other schemes (javascript:, data:) stay plain text.
export const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

// The same rule as a whole string: what `MessageText` would turn into a link.
const WHOLE_URL = new RegExp(`^${URL_PATTERN.source}$`);

/** Whether `value` is an http(s) URL, the only kind that becomes a link in a chat. */
export const isHttpUrl = (value: string) => WHOLE_URL.test(value);

/** The host of an http(s) URL (`docs.example.com`), or `undefined` for anything else. */
export const hostOf = (value: string) => {
  if (!isHttpUrl(value)) return undefined;
  try {
    return new URL(value).host;
  } catch {
    return undefined;
  }
};

// Punctuation that ends a sentence rather than the URL. Trimmed with a loop: a regex such as
// /[.,;:!?)\]]+$/ backtracks quadratically on a long run of them that isn't at the end.
const TRAILING = new Set(['.', ',', ';', ':', '!', '?', ')', ']']);

/** `url` without the punctuation that ends the sentence around it ("see https://a.b/c." → no dot). */
export const trimTrailingPunctuation = (url: string) => {
  let end = url.length;
  while (end > 0 && TRAILING.has(url[end - 1])) end -= 1;
  return url.slice(0, end);
};

// mailto: and the relative forms a link may point at: a path ("/a", "./a", "../a"), a fragment or a
// query. "//host" is protocol-relative, so it is another site, and a backslash is read as a slash by
// browsers ("/\host"): both stay out.
const MAILTO = /^mailto:[^\s<>"'\\]+$/i;
const RELATIVE = /^(?:\/(?!\/)|\.\.?\/|#|\?)[^\s<>"'\\]*$/;

/**
 * Whether `value` may be the target of a link a user writes: an http(s) URL, a `mailto:` address
 * or a relative URL. The rule of `RichTextEditor`, which extends the chat's (`isHttpUrl`) with the
 * two kinds a form field needs. `javascript:`, `data:` and every other scheme are refused.
 */
export const isSafeLinkUrl = (value: string) =>
  isHttpUrl(value) || MAILTO.test(value) || RELATIVE.test(value);
