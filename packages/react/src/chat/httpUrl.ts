// http(s) URLs only: other schemes (javascript:, data:) stay plain text.
export const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
