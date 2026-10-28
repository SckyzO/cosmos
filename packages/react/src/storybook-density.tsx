import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';

// The tests of what follows `data-density`: the same content once per density, then the height of
// one control or one row in each. Internal to the package, not exported.

const DENSITIES = ['compact', 'default', 'comfortable'] as const;
type Density = (typeof DENSITIES)[number];

/**
 * The same content in a section per density. Each section carries its own `data-density`. A
 * component that draws a landmark takes the density as a function, to name each copy differently.
 */
export const InEachDensity = ({
  children,
}: {
  children: ReactNode | ((density: Density) => ReactNode);
}) => (
  <div className="space-y-4">
    {DENSITIES.map((density) => (
      <section key={density} data-density={density} aria-label={`${density} density`}>
        {typeof children === 'function' ? children(density) : children}
      </section>
    ))}
  </div>
);

type Scope = ReturnType<typeof within>;

/**
 * Looks up one element in each section of `InEachDensity` and checks its height: shorter in
 * `compact` than at the default density, taller in `comfortable`. A `control` also keeps 24px in
 * `compact` (WCAG 2.5.8).
 */
export const expectDensitySteps = async (
  canvas: Scope,
  find: (scope: Scope, region: HTMLElement) => Element | Promise<Element>,
  { control = false }: { control?: boolean } = {}
) => {
  const heights: number[] = [];
  for (const density of DENSITIES) {
    const region = canvas.getByRole('region', { name: `${density} density` });
    const found = await find(within(region), region);
    heights.push(found.getBoundingClientRect().height);
  }
  const [compact, normal, comfortable] = heights as [number, number, number];
  await expect(compact, `compact ${compact}px < default ${normal}px`).toBeLessThan(normal);
  await expect(comfortable, `comfortable ${comfortable}px > default ${normal}px`).toBeGreaterThan(
    normal
  );
  if (control) await expect(compact, `compact ${compact}px`).toBeGreaterThanOrEqual(24);
};
