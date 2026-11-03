// How a card that can be clicked is raised. Internal to the package: not re-exported.

const TIMING = 'duration-(--cosmos-motion-base) ease-(--cosmos-ease-out)';

/**
 * A card that is itself the control (a button or a link) rises 2px with a soft shadow under the
 * pointer, and 2px on keyboard focus (`:focus-visible`), over `--cosmos-motion-base`. On focus the
 * shadow slot belongs to the focus indicator, whose ring and halo are drawn with it, so focus
 * lifts the card and leaves the shadow to the ring.
 *
 * The card moves out from under the pointer, so a strip under it keeps the place it had (a
 * pseudo-element, only while the pointer is over the card): a pointer resting on the lower edge
 * neither leaves nor makes the card flicker. The strip is 4px: the 2px of the lift and the card's
 * border, which `top-full` (the padding edge) does not count. It needs a `relative` card that does
 * not clip its overflow. The card names its own `transition-*`, which has to include `translate`
 * and `box-shadow`: `transition-all` where it already had it, so what its users add through
 * `className` keeps animating.
 */
export const CARD_LIFT = [
  TIMING,
  'hover:-translate-y-0.5 hover:shadow-md',
  'hover:after:absolute hover:after:inset-x-0 hover:after:top-full hover:after:h-1',
  'focus-visible:-translate-y-0.5',
].join(' ');

/**
 * The same for a card that clips its overflow (`Card`, which rounds a `Card.Image`) and holds its
 * control: it rises on `:focus-visible` inside it. A clipping card cannot keep the strip of
 * `CARD_LIFT`, which its clip would cut.
 */
export const CARD_LIFT_WITHIN = [
  TIMING,
  'hover:-translate-y-0.5 hover:shadow-md',
  'has-focus-visible:-translate-y-0.5',
].join(' ');
