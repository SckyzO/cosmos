import { clsx } from 'clsx';
import { useId, type Ref } from 'react';
import { useControllableState } from '../hooks/useControllableState';
import { useLabels } from '../labels/labelsContext';
import { CardBrandContext } from './cardBrandContext';
import { CardCvcInput } from './CardCvcInput';
import { CardExpiryInput } from './CardExpiryInput';
import { cardBrand, type CardBrand } from './cardFormat';
import { CardNumberInput } from './CardNumberInput';
import type { FieldSize } from './fieldRecipe';
import { CARD_FIELDS_LABELS, type CardFieldsLabels } from './labels';

/** What a card group holds: the number as digits, the expiry as `MMYY`, the code as digits. */
export type CardValue = { number: string; expiry: string; cvc: string };

type CardFieldKey = keyof CardValue;

const EMPTY_CARD: CardValue = { number: '', expiry: '', cvc: '' };

export type CardFieldsProps = {
  /** The group's name, drawn as its `<legend>` and read by a screen reader before each field. */
  legend: string;
  /** The three values, when controlled. */
  value?: CardValue;
  /** Initial values, when uncontrolled. All empty when omitted. */
  defaultValue?: CardValue;
  /** Called with the three values whenever one of them changes. */
  onChange?: (value: CardValue) => void;
  /** Error message under each field. The page decides when and with which words. */
  errors?: Partial<Record<CardFieldKey, string>>;
  /**
   * An error for the whole card ("Your card was declined."), under the three fields and read as
   * the group's description. It is announced when it appears.
   */
  error?: string;
  /**
   * The texts it writes (the labels of the three fields), over `LabelsProvider`'s `cardFields` and
   * the English defaults: `Card number`, `Expiry date` and `Security code`.
   */
  labels?: Partial<CardFieldsLabels>;
  /** Height and text size of the three fields, aligned on Button's. Default `md`. */
  size?: FieldSize;
  /** Marks the three fields required. */
  required?: boolean;
  /** Disables the group and its three fields. */
  disabled?: boolean;
  /** Called when the brand the number points to changes, as `CardNumberInput`'s. */
  onBrandChange?: (brand: CardBrand | null) => void;
  /** Refs to the three `<input>`s, where focus belongs on the field a validation error names. */
  inputRefs?: Partial<Record<CardFieldKey, Ref<HTMLInputElement>>>;
  /** Merged on the `<fieldset>`. */
  className?: string;
};

/**
 * CardFields — the three card fields as one group: a `<fieldset>` with a shared legend and error,
 * the number on its own line and the expiry and the code in two equal columns (still two at 375px),
 * and the brand handed from the number to the code through context, so an Amex asks four digits
 * with nothing to wire. The fields keep their own `error`; the group adds the card's. Each field is
 * also exported and works alone.
 */
export const CardFields = ({
  legend,
  value: valueProp,
  defaultValue = EMPTY_CARD,
  onChange,
  errors,
  error,
  labels: ownLabels,
  size,
  required,
  disabled,
  onBrandChange,
  inputRefs,
  className,
}: CardFieldsProps) => {
  const labels = useLabels('cardFields', CARD_FIELDS_LABELS, ownLabels);
  const errorId = useId();
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
    name: 'CardFields.value',
  });
  const set = (key: CardFieldKey) => (next: string) =>
    setValue((current) => ({ ...current, [key]: next }));
  const shared = { size, required, disabled };

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      className={clsx('min-w-0', className)}
    >
      <legend className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{legend}</legend>
      <CardBrandContext value={cardBrand(value.number)}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <CardNumberInput
            {...shared}
            className="col-span-2"
            label={labels.number}
            error={errors?.number}
            value={value.number}
            onChange={set('number')}
            onBrandChange={onBrandChange}
            ref={inputRefs?.number}
          />
          <CardExpiryInput
            {...shared}
            label={labels.expiry}
            error={errors?.expiry}
            value={value.expiry}
            onChange={set('expiry')}
            ref={inputRefs?.expiry}
          />
          <CardCvcInput
            {...shared}
            label={labels.cvc}
            error={errors?.cvc}
            value={value.cvc}
            onChange={set('cvc')}
            ref={inputRefs?.cvc}
          />
        </div>
      </CardBrandContext>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
};
