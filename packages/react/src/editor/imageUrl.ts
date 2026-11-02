import { isHttpUrl } from '../chat/httpUrl';

/**
 * The address an image field's text stands for, or `undefined` when it can't be an image's source.
 * Only an http(s) URL qualifies, as typed minus the spaces around it: a relative path, a bare host,
 * `data:`, `blob:`, `javascript:` and every other scheme are refused. The rule is `isHttpUrl`, the
 * one `RichTextImage` applies to a `src` that is pasted or loaded.
 */
export const normalizeImageUrl = (input: string): string | undefined => {
  const value = input.trim();
  return isHttpUrl(value) ? value : undefined;
};
