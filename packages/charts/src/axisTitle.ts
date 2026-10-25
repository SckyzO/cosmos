/**
 * An axis title as ApexCharts takes it, in the color of the axis labels, or
 * `undefined` for no title. Titles are SVG text: never escaped.
 */
export const axisTitle = (text: string | undefined, color: string) =>
  text === undefined
    ? undefined
    : { text, style: { color, fontSize: '12px', fontFamily: 'inherit', fontWeight: 500 } };
