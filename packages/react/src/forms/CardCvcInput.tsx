import { useContext, useEffect, type ChangeEvent } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { CardBrandContext } from './cardBrandContext';
import { CardField, fieldEditOf, showEdit, type CardFieldProps } from './cardField';
import { cardCvcLength, editCvc, type CardBrand } from './cardFormat';

export type CardCvcInputProps = CardFieldProps & {
  /** The security code as digits, when controlled. `''` is none. */
  value?: string;
  /** Initial code, when uncontrolled. Empty when omitted. */
  defaultValue?: string;
  /**
   * Called with the digits. It is not checked: the code is complete at `cardCvcLength(brand)`
   * digits, the page compares them when it chooses to.
   */
  onChange?: (value: string) => void;
  /**
   * The brand the code belongs to: 4 digits for `'amex'`, 3 for any other brand and for `null`.
   * Inside a CardFields group it follows the group's number, and a `brand` set here wins.
   */
  brand?: CardBrand | null;
};

/**
 * CardCvcInput — the security code of a payment card (CVC, CVV, CID): digits only, 3 of them, or 4
 * for an Amex. A code longer than its brand allows is cut when the brand turns up, and `onChange`
 * is called with the shorter one. No `name` is set, so a plain form post never carries the code:
 * pass one if you mean it.
 */
export const CardCvcInput = ({
  value: valueProp,
  defaultValue = '',
  onChange,
  brand: brandProp,
  placeholder,
  ...rest
}: CardCvcInputProps) => {
  const inGroup = useContext(CardBrandContext);
  const brand = brandProp !== undefined ? brandProp : (inGroup ?? null);
  const length = cardCvcLength(brand);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'CardCvcInput.value',
  });

  // The brand can arrive after the code: an Amex code of 4 digits, then a Visa number.
  useEffect(() => {
    if (value.length > length) setValue(value.slice(0, length));
  }, [value, length, setValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const edited = editCvc(fieldEditOf(e, value), length);
    showEdit(e.target, edited);
    if (edited.digits !== value) setValue(edited.digits);
  };

  return (
    <CardField
      {...rest}
      placeholder={placeholder ?? (length === 4 ? '1234' : '123')}
      value={value}
      onChange={handleChange}
      inputMode="numeric"
      autoComplete="cc-csc"
    />
  );
};
