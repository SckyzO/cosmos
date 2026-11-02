import { Fragment } from 'react';
import { AlertBanner } from '../ui/AlertBanner';
import { Link } from '../ui/Link';

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
  /** Bold first line of the banner. Default "There is a problem". */
  title?: string;
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
  title = 'There is a problem',
  className,
}: ErrorSummaryProps) => {
  if (errors.length === 0) return null;
  return (
    <AlertBanner intent="danger" title={title} className={className}>
      Fix {errors.length} {errors.length === 1 ? 'field' : 'fields'} and try again:{' '}
      {errors.map((entry, i) => (
        <Fragment key={entry.field}>
          {i > 0 && (i === errors.length - 1 ? ' and ' : ', ')}
          <Link
            variant="underline"
            href={`#${entry.field}`}
            onClick={(e) => {
              // A field that is not on the page leaves the link to the browser.
              if (focusField(entry.field)) e.preventDefault();
            }}
          >
            {entry.label}
          </Link>
        </Fragment>
      ))}{' '}
      {errors.length === 1 ? 'needs' : 'need'} attention.
    </AlertBanner>
  );
};
