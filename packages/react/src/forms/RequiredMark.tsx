/**
 * Asterisk after a field's label. The control carries the requirement for
 * assistive technology (`required` or `aria-required`), so the mark is hidden
 * from it. `srText` is for a control that can't (a button): it names the
 * requirement in the label instead.
 */
export const RequiredMark = ({ srText }: { srText?: string }) => (
  <>
    <span aria-hidden className="ms-0.5 text-red-700 dark:text-red-400">
      *
    </span>
    {srText && <span className="sr-only">{srText}</span>}
  </>
);
