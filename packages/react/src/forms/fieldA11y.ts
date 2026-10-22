import { createContext, useContext } from 'react';

/** Naming props shared by the bare controls that can sit in a FormRow. */
export type FieldA11yProps = {
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

type FormRowIds = { labelId: string; descriptionId?: string };

/** Set by FormRow so the control it wraps is named and described by the row. */
export const FormRowContext = createContext<FormRowIds | null>(null);

/**
 * Resolves a control's naming attributes: explicit props first, then the
 * enclosing FormRow's label and description. `ownLabel` skips the row label
 * for a control that already renders its own (a Toggle with `label`).
 */
export const useFieldA11y = (
  {
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  }: FieldA11yProps,
  { ownLabel = false }: { ownLabel?: boolean } = {}
) => {
  const row = useContext(FormRowContext);
  const rowLabel = ariaLabel || ownLabel ? undefined : row?.labelId;
  return {
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy ?? rowLabel,
    'aria-describedby': describedBy ?? row?.descriptionId,
  };
};
