import { useState, type ChangeEvent } from 'react';

type NumberDraftOptions = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
};

/**
 * Props for the text field of a number control. The field keeps what the user
 * types, so they can clear it, type a sign first or pass outside the range on
 * the way to a valid value; only a number within `min`…`max` reaches
 * `onChange`. Leaving the field clamps an out-of-range number, and puts the
 * value back when the field holds no number.
 */
export const useNumberDraft = ({ value, onChange, min, max }: NumberDraftOptions) => {
  const [draft, setDraft] = useState(String(value));

  // A new value from outside (the buttons, the app) replaces the draft, unless
  // the draft already reads as that value ("1." while typing "1.5").
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (parseFloat(draft) !== value) setDraft(String(value));
  }

  return {
    value: draft,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
      const n = parseFloat(e.target.value);
      if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
    },
    onBlur: () => {
      const n = parseFloat(draft);
      if (!Number.isFinite(n)) {
        setDraft(String(value));
        return;
      }
      const clamped = Math.min(max, Math.max(min, n));
      setDraft(String(clamped));
      if (clamped !== value) onChange(clamped);
    },
  };
};
