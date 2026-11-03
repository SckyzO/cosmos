import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from './ui/Button';
import { nextFrame } from './storybook-motion';

// Helpers for the stories that check content arriving in place of a skeleton
// (`feedback/useAfterSkeleton.ts`). Those stories opt out of the story tests' 0 s reset with
// `parameters: { settleMotion: false }`.

type Scope = ReturnType<typeof within>;

/**
 * A `loading` flag a button flips: "Load" while it is on, "Reload" while it is off. `children` gets
 * the flag, to pass to the component on show.
 */
export const LoadToggle = ({
  startLoading = true,
  children,
}: {
  startLoading?: boolean;
  children: (loading: boolean) => ReactNode;
}) => {
  const [loading, setLoading] = useState(startLoading);
  return (
    <div className="flex flex-col items-start gap-4">
      <Button size="sm" variant="secondary" onClick={() => setLoading(!loading)}>
        {loading ? 'Load' : 'Reload'}
      </Button>
      {children(loading)}
    </div>
  );
};

/** The fades that bring content in after a skeleton, running in `root` or below it. */
export const fadeIns = (root: Element) =>
  root
    .getAnimations({ subtree: true })
    .filter(
      (animation): animation is CSSAnimation =>
        'animationName' in animation && animation.animationName === 'cosmos-fade-in'
    );

/**
 * Content that arrives after a skeleton fades in, and is at rest after; one that has been there
 * from the first render does not fade. Run it on a `LoadToggle` that starts loading: nothing fades
 * under the skeleton, "Load" makes the content fade in, the fade is over soon after and leaves
 * nothing running, and a reload plays it once more. `root` is read each time: the component may
 * draw its root again.
 */
export const expectFadesInAfterSkeleton = async (canvas: Scope, root: () => Element) => {
  await expect(fadeIns(root())).toHaveLength(0);
  for (let round = 0; round < 2; round += 1) {
    await userEvent.click(canvas.getByRole('button', { name: 'Load' }));
    await expect(fadeIns(root()).length).toBeGreaterThan(0);
    await waitFor(() => expect(fadeIns(root())).toHaveLength(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Reload' }));
    await expect(fadeIns(root())).toHaveLength(0);
  }
};

/**
 * Content drawn from the first render does not fade, a frame later no more; the first skeleton it
 * is swapped for after that makes the next content fade. Run it on a `LoadToggle` that does not
 * start loading.
 */
export const expectNoFadeFromFirstRender = async (canvas: Scope, root: () => Element) => {
  await expect(fadeIns(root())).toHaveLength(0);
  await nextFrame();
  await expect(fadeIns(root())).toHaveLength(0);
  await userEvent.click(canvas.getByRole('button', { name: 'Reload' }));
  await userEvent.click(canvas.getByRole('button', { name: 'Load' }));
  await expect(fadeIns(root()).length).toBeGreaterThan(0);
};
