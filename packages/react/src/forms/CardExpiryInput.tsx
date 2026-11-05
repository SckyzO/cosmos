import type { ChangeEvent } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { useLabels } from '../labels/labelsContext';
import { CardField, fieldEditOf, showEdit, type CardFieldProps } from './cardField';
import { editExpiry, formatExpiry } from './cardFormat';
import { CARD_EXPIRY_INPUT_LABELS, type CardExpiryInputLabels } from './labels';

export type CardExpiryInputProps = CardFieldProps & {
  /** The expiry as `MMYY` (`'1228'` for December 2028), when controlled. `''` is none. */
  value?: string;
  /** Initial expiry, when uncontrolled. Empty when omitted. */
  defaultValue?: string;
  /**
   * Called with `MMYY`, a partial one while it is typed. It is not checked: a month that exists
   * and is not over is `expiryValid`, the page calls it when it chooses to.
   */
  onChange?: (value: string) => void;
  /** The texts it writes, over `LabelsProvider`'s `cardExpiryInput` and the English defaults. */
  labels?: Partial<CardExpiryInputLabels>;
};

/**
 * CardExpiryInput — the expiry date of a payment card, shown as `MM / YY` while the value is
 * `MMYY`. A first digit from 2 to 9 becomes the month 02 to 09, Backspace takes the separator and
 * the digit before it together, and a pasted `12/2028` or `12 / 28` is accepted. No `name` is set,
 * so a plain form post never carries the date: pass one if you mean it.
 */
export const CardExpiryInput = ({
  value: valueProp,
  defaultValue = '',
  onChange,
  placeholder,
  labels: ownLabels,
  ...rest
}: CardExpiryInputProps) => {
  const labels = useLabels('cardExpiryInput', CARD_EXPIRY_INPUT_LABELS, ownLabels);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'CardExpiryInput.value',
  });
  const text = formatExpiry(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const edited = editExpiry(fieldEditOf(e, text));
    showEdit(e.target, edited);
    if (edited.digits !== value) setValue(edited.digits);
  };

  return (
    <CardField
      {...rest}
      placeholder={placeholder ?? labels.placeholder}
      value={text}
      onChange={handleChange}
      inputMode="numeric"
      autoComplete="cc-exp"
    />
  );
};
