import { clsx } from 'clsx';
import { Check } from 'lucide-react';

/**
 * The one "selected" treatment of the settings pickers (AccentPicker,
 * OptionPicker, PalettePicker): a brand border plus the check badge below.
 * Each card keeps its own unselected border, so the pair is picked with
 * `active ? PICKER_SELECTED_BORDER : <unselected>`, never layered.
 */
export const PICKER_SELECTED_BORDER = 'border-brand-500';

/** The brand check badge. The card positions it (`absolute top-1.5 inset-e-1.5`, or in a row). */
export const SelectedMark = ({ className }: { className?: string }) => (
  <span
    className={clsx(
      'bg-brand-500 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
      className
    )}
  >
    <Check className="h-2.5 w-2.5 text-white" aria-hidden />
  </span>
);
