const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for the parts of a chart ApexCharts writes with innerHTML:
 * legend entries, tooltip titles, series names and values. Series names,
 * categories and labels are data and must never be parsed as markup. Axis
 * labels are SVG text and must stay unescaped.
 */
export const escapeHtml = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
