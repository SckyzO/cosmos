// How a row's details (LogViewer) and a step's body (JobLog) arrive. Internal: not re-exported.
//
// Both sit in a windowed list: the room they take is a number of slots that the window counts, set
// the moment they open, so they cannot fold with a height that moves. They fade in and are
// revealed from the top by a clip, which changes nothing the window measures. They leave at once,
// as the slots do.

/**
 * The classes of the details or the body for the moment they arrive, from the first frame
 * (`starting:`) in `--cosmos-motion-base`. Dropped once the transition has ended: at rest they
 * are not clipped, and a list that draws them again as it scrolls plays nothing.
 */
export const GROW_IN =
  'transition-[opacity,clip-path] duration-(--cosmos-motion-base) ease-(--cosmos-ease-out) [clip-path:inset(0)] starting:opacity-0 starting:[clip-path:inset(0_0_100%_0)]';
