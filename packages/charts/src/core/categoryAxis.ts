import { AXIS } from './axes';

const MAX_CHARS = 14;

/** A category name cut short with an ellipsis; the tooltip keeps the full name. */
export const trimLabel = (value: string | number) => {
  const text = String(value);
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS - 1)}…` : text;
};

/**
 * The props of a horizontal category `XAxis` that keeps its labels readable:
 * names that would not fit side by side are tilted and cut short, and every one
 * is kept (Recharts would otherwise skip the ones that overlap).
 */
export const categoryAxis = (categories: readonly (string | number)[], title?: string) => {
  const longest = Math.max(0, ...categories.map((c) => String(c).length));
  const tilted = categories.length > 6 && longest > 8;
  const base = title ? 52 : 30;
  return {
    tickFormatter: trimLabel,
    ...(tilted
      ? {
          interval: 0,
          angle: -40,
          tick: { ...AXIS.tick, textAnchor: 'end' },
          height: base + Math.round(Math.min(longest, MAX_CHARS) * 4.2),
        }
      : {}),
  } as const;
};
