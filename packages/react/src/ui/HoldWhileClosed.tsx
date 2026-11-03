import { memo, type ReactNode } from 'react';

// Internal to the package: what a window shows while it fades out. Not exported from the barrel.

/**
 * What a window shows once closed is what it showed open. A host often empties the content in the
 * same render that closes it: a tooltip-like panel with nothing to show (`NodeGrid`, `MarkStrip`), a
 * dialog whose body reads `selected && <Details item={selected} />`. Without this the window would
 * shrink to its padding, or to nothing, while it fades out.
 *
 * It is not rendered again while `open` is false, so the last content stays as it was; it is, as
 * soon as `open` turns true.
 */
export const HoldWhileClosed = memo(
  ({ children }: { open: boolean; children: ReactNode }) => <>{children}</>,
  (_previous, next) => !next.open
);
