/**
 * An axis title as ApexCharts takes it, in the color and the size given, or
 * `undefined` for no title. Titles are SVG text: never escaped. The charts get
 * it from `useChartTheme().axisTitle`, which follows the theme and the text size.
 */
export const axisTitle = (text: string | undefined, color: string, fontSize: string) =>
  text === undefined
    ? undefined
    : { text, style: { color, fontSize, fontFamily: 'inherit', fontWeight: 500 } };
