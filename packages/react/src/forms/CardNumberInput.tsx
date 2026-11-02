import { CreditCard } from 'lucide-react';
import { useEffect, useRef, type ChangeEvent } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { Badge } from '../ui/Badge';
import { CardField, fieldEditOf, showEdit, type CardFieldProps } from './cardField';
import {
  cardBrand,
  cardBrandName,
  editCardNumber,
  formatCardNumber,
  type CardBrand,
} from './cardFormat';

export type CardNumberInputProps = CardFieldProps & {
  /** The card number as digits only (`4111111111111111`), when controlled. `''` is none. */
  value?: string;
  /** Initial number, when uncontrolled. Empty when omitted. */
  defaultValue?: string;
  /**
   * Called with the digits only, however the number is grouped on screen. It is not checked: the
   * length for the brand and the Luhn checksum are `cardNumberLengths` and `luhnValid`, the page
   * calls them when it chooses to.
   */
  onChange?: (digits: string) => void;
  /**
   * Called with the brand the leading digits point to (`'visa'`, `'amex'`…) and with `null` when
   * they no longer do. Fires once on mount when the initial number has a brand.
   */
  onBrandChange?: (brand: CardBrand | null) => void;
};

/**
 * CardNumberInput — the number of a payment card. Digits are grouped as they are typed (4-4-4-4,
 * an Amex 4-6-5) with the caret kept where it was, a pasted number with spaces or dashes is
 * accepted, and the brand the leading digits point to shows as text in a pill at the end of the
 * field. No `name` is set, so a plain form post never carries the number: pass one if you mean it.
 * Cosmos handles no real card data: a real checkout uses its payment provider's hosted fields.
 */
export const CardNumberInput = ({
  value: valueProp,
  defaultValue = '',
  onChange,
  onBrandChange,
  size = 'md',
  placeholder = '1234 1234 1234 1234',
  ...rest
}: CardNumberInputProps) => {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'CardNumberInput.value',
  });
  const text = formatCardNumber(value);
  const brand = cardBrand(value);

  // What `onBrandChange` last heard, so a rerender with a new callback does not repeat it.
  const reported = useRef<CardBrand | null>(null);
  useEffect(() => {
    if (brand === reported.current) return;
    reported.current = brand;
    onBrandChange?.(brand);
  }, [brand, onBrandChange]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const edited = editCardNumber(fieldEditOf(e, text));
    showEdit(e.target, edited);
    if (edited.digits !== value) setValue(edited.digits);
  };

  return (
    <CardField
      {...rest}
      size={size}
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      inputMode="numeric"
      autoComplete="cc-number"
      icon={CreditCard}
      endSlot={brand && <Badge size={size === 'sm' ? 'sm' : 'md'}>{cardBrandName(brand)}</Badge>}
    />
  );
};
