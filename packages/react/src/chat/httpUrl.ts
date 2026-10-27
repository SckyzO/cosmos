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
