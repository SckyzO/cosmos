import type { ReactNode } from 'react';
import { useLabels } from '../labels/labelsContext';
import { AlertBanner } from '../ui/AlertBanner';
import { Link } from '../ui/Link';
import { ERROR_SUMMARY_LABELS, type ErrorSummaryLabels } from './labels';

export type ErrorSummaryItem = {
  /**
   * The `id` of the field, or of any box around it. The link focuses the field if that is the
   * field, else the first enabled control inside it (input, select, textarea or button).
   */
  field: string;
  /** What the link says: the name of the field ("Booking URL"). */
  label: string;
};

export type ErrorSummaryProps = {
  /** One entry per field in error, in the order of the page. Nothing is drawn for an empty list. */
  errors: ErrorSummaryItem[];
  /** Bold first line of the banner. Default `labels.title`, "There is a problem". */
  title?: string;
  /**
   * The sentence under the title, for another wording. It gets the number of fields and a link to
   * each, in order, and returns what to draw around them: `(count, links) => <>Corrigez {count}
   * champs : {links}.</>`. Default `labels.message`: "Fix 3 fields and try again: A, B and C need
   * attention." ("Fix 1 field and try again: A needs attention.").
   */
  message?: (count: number, links: ReactNode[]) => ReactNode;
  /** The texts it writes, over `LabelsProvider`'s `errorSummary` and the English defaults. */
  labels?: Partial<ErrorSummaryLabels>;
  className?: string;
};

const ENABLED_CONTROL =
  ':is(input:not([type=file]):not([type=hidden]), select, textarea, button):enabled';

/** Focuses the field named by `id` and brings it to the middle of the view. False if there is none. */
const focusField = (id: string): boolean => {
  const box = document.getElementById(id);
  if (!box) return false;
  const target = box.matches(ENABLED_CONTROL)
    ? box
    : box.querySelector<HTMLElement>(ENABLED_CONTROL);
  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'center' });
  return true;
};

/**
 * `ErrorSummary` — the banner a form shows when it could not be submitted: how many fields need
 * attention, and a link to each that moves the focus to it. Put it above the form, where it is
 * seen, and draw each field's own message under the field.
 *
 *     <ErrorSummary errors={[{ field: 'booking-url', label: 'Booking URL' }]} />
 *
 * It is an `AlertBanner` in `danger`, so a screen reader announces it as it appears.
 */
export const ErrorSummary = ({
  errors,
  title,
  message,
  labels: ownLabels,
  className,
}: ErrorSummaryProps) => {
  const labels = useLabels('errorSummary', ERROR_SUMMARY_LABELS, ownLabels);
  if (errors.length === 0) return null;
  // Two entries may name the same field (the two ends of a range, one box): `field` alone is not a key.
  const links = errors.map((entry, i) => (
    <Link
      key={`${entry.field}-${i}`}
      variant="underline"
      href={`#${entry.field}`}
      onClick={(e) => {
        // A field that is not on the page leaves the link to the browser.
        if (focusField(entry.field)) e.preventDefault();
      }}
    >
      {entry.label}
    </Link>
  ));
  return (
    <AlertBanner intent="danger" title={title ?? labels.title} className={className}>
      {(message ?? labels.message)(errors.length, links)}
    </AlertBanner>
  );
};
