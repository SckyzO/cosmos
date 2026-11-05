import { useMemo } from 'react';
import { useLocale } from '../labels/labelsContext';

/**
 * A number format for the digits a component writes when the host gives no formatter: the
 * component's own `locale`, else `LabelsProvider`'s, else `en-US`, so the figures of an app that
 * sets none read the same on every machine. `options` is a constant, or the format is rebuilt.
 *
 * Internal to the package, not exported.
 */
export const useNumberFormat = (locale: string | undefined, options?: Intl.NumberFormatOptions) => {
  const resolved = useLocale(locale) ?? 'en-US';
  return useMemo(() => new Intl.NumberFormat(resolved, options), [resolved, options]);
};
